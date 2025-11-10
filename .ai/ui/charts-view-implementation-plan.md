# Plan implementacji widoku Wykresy

## 1. Przegląd

Widok wykresów (`/cars/{carId}` z aktywną zakładką "Wykresy") to sekcja w widoku szczegółów samochodu umożliwiająca wizualizację danych o tankowaniach w czasie. Widok pozwala użytkownikowi przeglądać trzy typy wykresów: spalanie (L/100km), cena za litr oraz dystans między tankowaniami. Wykresy są interaktywne, responsywne i wyświetlają dodatkowe metadane statystyczne. Widok jest zintegrowany z istniejącym widokiem szczegółów samochodu jako jedna z zakładek.

### Kluczowe funkcjonalności:

- Wyświetlanie trzech typów wykresów: spalanie (linia), cena za litr (linia), dystans (słupki)
- Przełączanie między typami wykresów za pomocą przycisków
- Interaktywne wykresy z tooltipami pokazującymi szczegóły każdego punktu danych
- Wyświetlanie statystyk: średnia, minimum, maximum, liczba punktów
- Responsywność na wszystkich urządzeniach
- Komunikaty informacyjne dla niewystarczającej ilości danych
- Obsługa błędów połączenia i walidacji danych

## 2. Routing widoku

**Ścieżka:** `/cars/{carId}` z aktywną zakładką "Wykresy"

**Plik strony:** `src/pages/cars/[carId].astro` (istniejący)

**Komponent:** Widok jest zaimplementowany jako komponent `ChartsTab` renderowany warunkowo w `CarDetailsView` gdy `activeMainTab === "charts"`.

**Renderowanie:** SSR (Server-Side Rendering) z `export const prerender = false`

**Integracja:** Widok jest zintegrowany z istniejącym widokiem szczegółów samochodu poprzez nawigację kartową (`TabNavigation`)

## 3. Struktura komponentów

```
CarDetailsView (istniejący)
└── ChartsTab (do rozszerzenia)
    ├── ChartTabs (istniejący - nawigacja między typami wykresów)
    ├── ChartContainer (nowy)
    │   ├── ChartHeader (nowy)
    │   │   ├── ChartTitle
    │   │   └── ChartStatistics (średnia, min, max, count)
    │   ├── ChartVisualization (nowy)
    │   │   ├── LineChart (dla consumption i price_per_liter)
    │   │   └── BarChart (dla distance)
    │   │   └── ChartTooltip (nowy - interaktywny tooltip)
    │   └── ChartLegend (nowy - opcjonalnie)
    ├── EmptyChartState (nowy)
    │   └── EmptyStateMessage
    ├── LoadingState (istniejący)
    └── ErrorState (istniejący)
```

Komponenty z Shadcn/ui używane w widoku:

- `Button` - przyciski przełączania typów wykresów (istniejący w `ChartTabs`)
- Komponenty wykresów - biblioteka zewnętrzna (do dodania: recharts lub Chart.js)

## 4. Szczegóły komponentów

### ChartsTab (główny komponent - do rozszerzenia)

**Opis komponentu:** Główny komponent sekcji wykresów, który koordynuje renderowanie wszystkich elementów widoku. Zarządza stanem ładowania, błędów oraz wyświetla odpowiednie komponenty w zależności od dostępności danych. Komponent otrzymuje dane z hooka `useCarDetails` przez props.

**Główne elementy:**

- `ChartTabs` - nawigacja między typami wykresów (spalanie, cena, dystans)
- `ChartContainer` - kontener z wizualizacją wykresu (gdy dane są dostępne)
- `EmptyChartState` - komunikat gdy brak wystarczającej ilości danych
- `LoadingState` - wskaźnik ładowania podczas pobierania danych
- `ErrorState` - komunikat błędu z możliwością ponowienia

**Obsługiwane zdarzenia:**

- `onChartTypeChange` - zmiana typu aktywnego wykresu (wywołuje `switchChartTab` w hooku)
- `onRetry` - ponowienie pobrania danych po błędzie (wywołuje `fetchChartData` w hooku)

**Obsługiwana walidacja:**

1. **Brak danych do wykresu:**
   - Warunek: `chartData === null` lub `chartData.data.length === 0`
   - Wyświetlenie: Komunikat "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."
   - Komponent: `EmptyChartState`

2. **Stan ładowania:**
   - Warunek: `loading === true`
   - Wyświetlenie: Wskaźnik ładowania
   - Komponent: `LoadingState`

3. **Błąd pobierania danych:**
   - Warunek: `error !== null`
   - Wyświetlenie: Komunikat błędu z przyciskiem ponowienia
   - Komponent: `ErrorState`

**Typy:**

- `ChartDataDTO` - dane wykresu otrzymane z API
- `ChartType` - typ wykresu: "consumption" | "price_per_liter" | "distance"
- `Error` - błąd pobierania danych

**Props:**

```typescript
interface ChartsTabProps {
  chartData: ChartDataDTO | null;
  activeChartType: ChartType;
  loading: boolean;
  error: Error | null;
  onChartTypeChange: (type: ChartType) => void;
}
```

### ChartTabs (istniejący - bez zmian)

**Opis komponentu:** Komponent nawigacji między trzema typami wykresów. Używa przycisków z ikonami do przełączania między wykresami spalania, ceny za litr i dystansu.

**Główne elementy:**

- Trzy przyciski: "Spalanie", "Cena za litr", "Dystans"
- Ikony z lucide-react: `TrendingDown`, `DollarSign`, `Route`
- Aktywny przycisk wyróżniony wariantem "default"

**Obsługiwane zdarzenia:**

- `onClick` na każdym przycisku - zmiana typu aktywnego wykresu

**Typy:**

- `ChartType` - typ wykresu

**Props:**

- `activeChartType: ChartType` - aktualnie aktywny typ wykresu
- `onChartTypeChange: (type: ChartType) => void` - handler zmiany typu

### ChartContainer (nowy komponent)

**Opis komponentu:** Kontener z wizualizacją wykresu zawierający nagłówek ze statystykami oraz właściwy wykres. Komponent renderuje różne typy wykresów w zależności od `chartData.type` (linia dla spalania i ceny, słupki dla dystansu).

**Główne elementy:**

- `ChartHeader` - nagłówek z tytułem i statystykami
- `ChartVisualization` - właściwy wykres (linia lub słupki)
- Responsywny kontener z tłem i cieniem

**Obsługiwane zdarzenia:**

- Hover na punktach danych - wyświetlenie tooltipa z szczegółami
- Kliknięcie na punkt danych - opcjonalnie, może wyświetlić szczegóły tankowania

**Obsługiwana walidacja:**

- Sprawdzenie czy `chartData.data.length >= 2` (minimum do narysowania wykresu)
- Obsługa pustych wartości w danych (punkty z `null` są pomijane)

**Typy:**

- `ChartDataDTO` - dane wykresu
- `ChartType` - typ wykresu

**Props:**

```typescript
interface ChartContainerProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
}
```

### ChartHeader (nowy komponent)

**Opis komponentu:** Nagłówek wykresu zawierający tytuł oraz metadane statystyczne (średnia, minimum, maximum, liczba punktów).

**Główne elementy:**

- Tytuł wykresu z jednostką (np. "Spalanie (L/100km)")
- Sekcja statystyk z wartościami: średnia, min, max, count
- Responsywny layout (grid lub flex)

**Obsługiwane zdarzenia:**

- Brak interakcji (tylko wyświetlanie)

**Typy:**

- `ChartDataDTO` - dane zawierające `average` i `metadata`

**Props:**

```typescript
interface ChartHeaderProps {
  chartType: ChartType;
  average: number;
  metadata: ChartMetadataDTO;
}
```

### ChartVisualization (nowy komponent)

**Opis komponentu:** Komponent renderujący właściwy wykres używając biblioteki wykresów (recharts lub Chart.js). Renderuje wykres liniowy dla spalania i ceny za litr, oraz wykres słupkowy dla dystansu.

**Główne elementy:**

- Wykres liniowy (LineChart) dla `consumption` i `price_per_liter`
- Wykres słupkowy (BarChart) dla `distance`
- Oś X - daty (formatowane jako dd.mm.yyyy)
- Oś Y - wartości z jednostkami (L/100km, zł, km)
- Tooltip przy najechaniu na punkt danych
- Responsywny kontener z wysokością minimalną 300px

**Obsługiwane zdarzenia:**

- `onMouseEnter` - najechanie na punkt danych - wyświetlenie tooltipa
- `onMouseLeave` - opuszczenie punktu danych - ukrycie tooltipa
- `onClick` - opcjonalnie, kliknięcie na punkt danych (może nawigować do edycji tankowania)

**Obsługiwana walidacja:**

- Formatowanie dat zgodnie z lokalizacją polską
- Formatowanie liczb z odpowiednią liczbą miejsc po przecinku
- Obsługa wartości null/undefined w danych

**Typy:**

- `ChartDataDTO` - dane wykresu
- `ChartDataPointDTO[]` - punkty danych

**Props:**

```typescript
interface ChartVisualizationProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
}
```

### EmptyChartState (nowy komponent)

**Opis komponentu:** Komponent wyświetlający komunikat gdy brak wystarczającej ilości danych do narysowania wykresu.

**Główne elementy:**

- Ikona informacyjna (opcjonalnie)
- Komunikat tekstowy: "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."
- Możliwy dodatkowy tekst zachęcający do dodania tankowań

**Obsługiwane zdarzenia:**

- Brak interakcji (tylko wyświetlanie)

**Typy:**

- Brak propsów (komponent bezstanowy)

**Props:**

- Brak (komponent bezstanowy)

### LoadingState (istniejący - wykorzystywany)

**Opis komponentu:** Komponent wyświetlający wskaźnik ładowania podczas pobierania danych z API.

**Główne elementy:**

- Ikona spinnera (Loader2 z lucide-react)
- Animacja obrotu
- Tekst "Ładowanie..." (opcjonalnie)

**Props:**

- Brak (komponent bezstanowy lub z własnym stanem)

### ErrorState (istniejący - wykorzystywany)

**Opis komponentu:** Komponent wyświetlający komunikat błędu z możliwością ponowienia pobrania danych.

**Główne elementy:**

- Komunikat błędu
- Przycisk "Spróbuj ponownie"

**Obsługiwane zdarzenia:**

- `onRetry` - ponowienie pobrania danych

**Props:**

```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}
```

## 5. Typy

### Typy istniejące (z `src/types.ts`):

**ChartType:**

```typescript
export type ChartType = "consumption" | "price_per_liter" | "distance";
```

**Opis:** Enum określający typ wykresu - spalanie, cena za litr lub dystans.

**ChartDataPointDTO:**

```typescript
export interface ChartDataPointDTO {
  date: string; // ISO 8601 timestamp
  value: number;
  odometer: number;
}
```

**Opis:** Pojedynczy punkt danych na wykresie zawierający datę tankowania, wartość (spalanie, cena lub dystans) oraz stan licznika.

**Pola:**

- `date: string` - data tankowania w formacie ISO 8601
- `value: number` - wartość w zależności od typu wykresu (spalanie w L/100km, cena w zł, dystans w km)
- `odometer: number` - stan licznika w momencie tankowania

**ChartMetadataDTO:**

```typescript
export interface ChartMetadataDTO {
  count: number;
  min: number;
  max: number;
}
```

**Opis:** Metadane dotyczące danych wykresu - liczba punktów, wartości minimalna i maksymalna.

**Pola:**

- `count: number` - liczba punktów danych w wykresie
- `min: number` - minimalna wartość w danych
- `max: number` - maksymalna wartość w danych

**ChartDataDTO:**

```typescript
export interface ChartDataDTO {
  type: ChartType;
  data: ChartDataPointDTO[];
  average: number;
  metadata: ChartMetadataDTO;
}
```

**Opis:** Kompletne dane wykresu zwracane przez API zawierające typ wykresu, punkty danych, średnią wartość oraz metadane.

**Pola:**

- `type: ChartType` - typ wykresu ("consumption", "price_per_liter", "distance")
- `data: ChartDataPointDTO[]` - tablica punktów danych uporządkowanych chronologicznie
- `average: number` - średnia wartość wszystkich punktów danych
- `metadata: ChartMetadataDTO` - metadane statystyczne

**ErrorResponseDTO:**

```typescript
export interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

**Opis:** Standardowy format odpowiedzi błędów z API.

### Typy nowe dla komponentów:

**ChartContainerProps:**

```typescript
interface ChartContainerProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
}
```

**ChartHeaderProps:**

```typescript
interface ChartHeaderProps {
  chartType: ChartType;
  average: number;
  metadata: ChartMetadataDTO;
}
```

**ChartVisualizationProps:**

```typescript
interface ChartVisualizationProps {
  chartData: ChartDataDTO;
  chartType: ChartType;
}
```

**ChartTooltipData (dla biblioteki wykresów):**

```typescript
interface ChartTooltipData {
  date: string;
  value: number;
  odometer: number;
  label: string; // "Spalanie", "Cena za litr", "Dystans"
  unit: string; // "L/100km", "zł", "km"
}
```

**Opis:** Dane wyświetlane w tooltipie przy najechaniu na punkt wykresu.

## 6. Zarządzanie stanem

Stan w widoku wykresów jest zarządzany przez istniejący hook `useCarDetails`, który jest używany w komponencie `CarDetailsView`. Hook zarządza:

1. **Stan danych wykresu (`chartData`)**: Przechowuje dane wykresu otrzymane z API (`ChartDataDTO | null`)
2. **Stan ładowania (`chartLoading`)**: Wskazuje czy trwa pobieranie danych z API
3. **Stan błędu (`chartError`)**: Przechowuje błędy związane z pobieraniem danych
4. **Aktywny typ wykresu (`activeChartTab`)**: Przechowuje aktualnie wyświetlany typ wykresu (`ChartType`)

**Funkcje hooka odpowiedzialne za wykresy:**

1. **`fetchChartData(type: ChartType)`** - pobiera dane wykresu z API dla określonego typu
   - Ustawia `chartLoading = true`
   - Wykonuje GET request do `/api/cars/{carId}/charts?type={type}&limit=50`
   - Po sukcesie ustawia `chartData` i `chartLoading = false`
   - Po błędzie ustawia `chartError` i `chartLoading = false`

2. **`switchChartTab(type: ChartType)`** - przełącza aktywny typ wykresu
   - Ustawia `activeChartTab = type`
   - Czyści `chartData` (ustawia na `null`)
   - Wywołuje `fetchChartData(type)` aby pobrać nowe dane

**Automatyczne ładowanie danych:**

W komponencie `CarDetailsView` istnieje `useEffect`, który automatycznie ładuje dane wykresu gdy:

- Zakładka "Wykresy" jest aktywna (`activeMainTab === "charts"`)
- `chartData === null` (brak danych)
- `!chartLoading` (nie trwa już ładowanie)

**Integracja z komponentem ChartsTab:**

Komponent `ChartsTab` otrzymuje stan z hooka przez props i nie zarządza własnym stanem. Wszystkie akcje (zmiana typu wykresu, ponowienie po błędzie) są przekazywane do hooka przez callbacks.

**Dodatkowe zmienne stanu lokalnego (w komponencie ChartVisualization):**

- `hoveredPoint: ChartDataPointDTO | null` - punkt nad którym użytkownik najeżdża myszką (dla tooltipa)
- Opcjonalnie: `selectedPoint: ChartDataPointDTO | null` - wybrany punkt danych (jeśli implementujemy kliknięcie)

## 7. Integracja API

Widok wykresów komunikuje się z API poprzez endpoint `GET /api/cars/{carId}/charts`. Integracja jest realizowana wewnątrz hooka `useCarDetails` w funkcji `fetchChartData`.

### Typ żądania (Request)

**Endpoint:** `GET /api/cars/{carId}/charts`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Query Parameters:**

```
type: "consumption" | "price_per_liter" | "distance" (required)
limit: number (optional, default: 50, max: 1000)
start_date: string (optional, ISO 8601)
end_date: string (optional, ISO 8601)
```

**Obsługa:**

- Hook pobiera token autoryzacji z localStorage lub cookies
- Przygotowuje query parameters z typem wykresu i limitem (domyślnie 50)
- Wysyła GET request bez body
- Obsługuje różne kody błędów (400, 401, 404, 500)

### Typ odpowiedzi (Response)

**Success (200 OK):**

```json
{
  "type": "consumption",
  "data": [
    {
      "date": "2025-10-17T12:00:00Z",
      "value": 9.1,
      "odometer": 55000
    }
  ],
  "average": 8.5,
  "metadata": {
    "count": 25,
    "min": 7.2,
    "max": 10.5
  }
}
```

**Obsługa:**

- Hook parsuje odpowiedź jako `ChartDataDTO`
- Aktualizuje stan: `chartData`, `chartLoading = false`, `chartError = null`
- Komponent `ChartsTab` renderuje wykres z otrzymanymi danymi

**Error Responses:**

- **400 Bad Request**: Nieprawidłowy typ wykresu lub format daty
- **401 Unauthorized**: Nieprawidłowy lub wygasły token (hook nie przekierowuje, wyświetla błąd)
- **404 Not Found**: Samochód nie znaleziony lub nie należy do użytkownika
- **500 Internal Server Error**: Błąd serwera

**Obsługa błędów:**

- Po błędzie 401: Hook ustawia `chartError` z odpowiednim komunikatem
- Po błędzie 404: Hook ustawia `chartError` z komunikatem "Samochód nie został znaleziony"
- Po błędzie 400/500: Hook parsuje `ErrorResponseDTO` i wyświetla komunikat z `error.message`
- Po błędzie sieciowym: Hook wykrywa "Failed to fetch" i wyświetla komunikat o braku połączenia

**Timeout i abort:**

- Obecnie hook nie implementuje timeoutu dla żądań wykresów
- Opcjonalnie można dodać AbortController z timeoutem (10 sekund) dla spójności z innymi endpointami

## 8. Interakcje użytkownika

### Przełączanie między typami wykresów

**Akcja:** Użytkownik klika jeden z przycisków w `ChartTabs` (Spalanie, Cena za litr, Dystans)

**Obsługa:**

1. Przycisk wywołuje `onChartTypeChange(type)`
2. Komponent `CarDetailsView` wywołuje `switchChartTab(type)` z hooka
3. Hook ustawia `activeChartTab = type` i `chartData = null`
4. Hook wywołuje `fetchChartData(type)` aby pobrać nowe dane
5. Stan ładowania jest wyświetlany (`LoadingState`)
6. Po otrzymaniu danych, wykres jest renderowany z nowymi danymi
7. Jeśli wystąpi błąd, wyświetlany jest `ErrorState`

### Najechanie myszką na punkt wykresu (Hover)

**Akcja:** Użytkownik najeżdża myszką na punkt danych na wykresie

**Obsługa:**

1. Biblioteka wykresów wykrywa zdarzenie `onMouseEnter`
2. Komponent `ChartVisualization` aktualizuje stan `hoveredPoint`
3. Tooltip jest wyświetlany w pobliżu punktu z informacjami:
   - Data tankowania (sformatowana: dd.mm.yyyy)
   - Wartość (z jednostką: L/100km, zł, km)
   - Stan licznika (opcjonalnie)
4. Po opuszczeniu punktu (`onMouseLeave`), tooltip jest ukrywany

### Kliknięcie na punkt wykresu (opcjonalne)

**Akcja:** Użytkownik klika na punkt danych na wykresie

**Obsługa (opcjonalna funkcjonalność):**

1. Biblioteka wykresów wykrywa zdarzenie `onClick`
2. Komponent `ChartVisualization` otrzymuje dane punktu
3. Opcjonalnie: nawigacja do szczegółów tankowania (`/cars/{carId}/fillups/{fillupId}/edit`)
4. Alternatywnie: wyświetlenie modal z szczegółami tankowania

### Ponowienie po błędzie

**Akcja:** Użytkownik klika przycisk "Spróbuj ponownie" w `ErrorState`

**Obsługa:**

1. Komponent wywołuje `onRetry` callback
2. W `CarDetailsView` wywoływane jest `fetchChartData(activeChartTab)`
3. Stan ładowania jest wyświetlany
4. Po otrzymaniu danych, wykres jest renderowany
5. Jeśli nadal wystąpi błąd, `ErrorState` jest wyświetlany ponownie

### Responsywność na urządzeniach mobilnych

**Akcja:** Użytkownik zmienia rozmiar okna lub przegląda na urządzeniu mobilnym

**Obsługa:**

1. Wykres automatycznie dostosowuje szerokość do kontenera (100% szerokości)
2. Biblioteka wykresów automatycznie przeskalowuje wykres
3. Tooltip dostosowuje pozycję, aby nie wychodził poza ekran
4. Statystyki w `ChartHeader` układają się w kolumnę na małych ekranach
5. Przyciski `ChartTabs` mogą się zwijać lub układać w kolumnę na bardzo małych ekranach

## 9. Warunki i walidacja

### Warunki decydujące o stanie UI:

**Stan "Ładowanie danych":**

- `chartLoading === true`
- Wyświetlany jest `LoadingState` z spinnerem
- Wykres nie jest renderowany

**Stan "Błąd pobierania danych":**

- `chartError !== null`
- Wyświetlany jest `ErrorState` z komunikatem błędu i przyciskiem "Spróbuj ponownie"
- Wykres nie jest renderowany

**Stan "Brak danych":**

- `chartData === null` lub `chartData.data.length === 0`
- Wyświetlany jest `EmptyChartState` z komunikatem "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."
- Wykres nie jest renderowany

**Stan "Dane dostępne":**

- `chartData !== null` i `chartData.data.length >= 1`
- Wyświetlany jest `ChartContainer` z właściwym wykresem
- Jeśli `chartData.data.length < 2`, wykres może być renderowany, ale może wyświetlać tylko jeden punkt (linia może być niewidoczna)

**Stan "Aktywny typ wykresu":**

- `activeChartTab` określa, który przycisk w `ChartTabs` jest aktywny (wariant "default")
- Pozostałe przyciski mają wariant "outline"

### Walidacja po stronie frontendu:

**Walidacja typu wykresu:**

- Wartość `activeChartTab` musi być jednym z: "consumption", "price_per_liter", "distance"
- Walidacja jest zapewniana przez typ TypeScript (`ChartType`)
- Jeśli otrzymany typ z API nie pasuje, komponent powinien obsłużyć to jako błąd

**Walidacja danych wykresu:**

1. **Sprawdzenie czy `chartData.data` jest tablicą:**
   - Jeśli nie, wyświetlany jest `ErrorState`

2. **Sprawdzenie czy punkty danych mają wymagane pola:**
   - Każdy punkt musi mieć: `date` (string), `value` (number), `odometer` (number)
   - Punkty z brakującymi polami są pomijane przy renderowaniu

3. **Sprawdzenie minimum punktów danych:**
   - Dla wykresu liniowego: wymagane minimum 2 punkty
   - Dla wykresu słupkowego: wymagane minimum 1 punkt (ale zalecane 2+)
   - Jeśli `chartData.data.length < 2`, wyświetlany jest `EmptyChartState`

4. **Formatowanie dat:**
   - Daty z API są w formacie ISO 8601
   - Przed wyświetleniem są formatowane do formatu polskiego (dd.mm.yyyy)
   - Sprawdzenie czy data jest prawidłowa (nie Invalid Date)

5. **Formatowanie wartości:**
   - Wartości numeryczne są formatowane z odpowiednią liczbą miejsc po przecinku:
     - Spalanie: 2 miejsca (np. 8.50 L/100km)
     - Cena: 2 miejsca (np. 5.00 zł)
     - Dystans: 0 miejsc (np. 500 km)

### Walidacja po stronie API:

**Format UUID dla carId:**

- `carId` musi być poprawnym UUID
- Błąd 400 jeśli format jest nieprawidłowy

**Typ wykresu:**

- Parametr `type` musi być jednym z: "consumption", "price_per_liter", "distance"
- Błąd 400 jeśli typ jest nieprawidłowy

**Limit:**

- Parametr `limit` musi być liczbą całkowitą między 1 a 1000
- Domyślnie 50 jeśli nie podano

**Zakres dat:**

- `start_date` i `end_date` muszą być prawidłowymi datami ISO 8601
- `start_date` musi być przed lub równa `end_date`
- Błąd 400 jeśli format dat jest nieprawidłowy

**Autoryzacja:**

- Token Bearer musi być obecny w nagłówku Authorization
- Token musi być prawidłowy i nie wygasły
- Błąd 401 jeśli brak tokenu lub token jest nieprawidłowy

**Własność samochodu:**

- Samochód musi należeć do uwierzytelnionego użytkownika
- Błąd 404 jeśli samochód nie istnieje lub nie należy do użytkownika

### Reguły biznesowe:

**Sortowanie danych:**

- Punkty danych są sortowane chronologicznie (najnowsze pierwsze) przez API
- Komponent renderuje wykres od lewej (najstarsze) do prawej (najnowsze)

**Filtrowanie pustych wartości:**

- Punkty z `value === null` lub `value === undefined` są pomijane
- API już filtruje te wartości, ale komponent powinien być odporny na nie

**Obliczanie statystyk:**

- Statystyki (średnia, min, max, count) są obliczane przez API
- Komponent wyświetla gotowe wartości bez dodatkowych obliczeń

## 10. Obsługa błędów

### Błąd 400 Bad Request

**Przyczyna:** Nieprawidłowy typ wykresu, format daty lub limit poza zakresem

**Obsługa:**

1. API zwraca błąd 400 z `ErrorResponseDTO`
2. Hook parsuje błąd i ustawia `chartError` z komunikatem z `error.message`
3. Wyświetlany jest `ErrorState` z komunikatem: "Nieprawidłowe parametry żądania. Sprawdź wprowadzone dane."
4. Użytkownik może spróbować ponownie lub przełączyć typ wykresu

**Komunikat:**

- Wyświetlany w `ErrorState`: komunikat z `error.message` z API

### Błąd 401 Unauthorized

**Przyczyna:** Brak tokenu uwierzytelnienia lub nieprawidłowy token

**Obsługa:**

1. API zwraca błąd 401
2. Hook ustawia `chartError` z komunikatem: "Wymagana autoryzacja. Zaloguj się ponownie."
3. Wyświetlany jest `ErrorState` z komunikatem błędu
4. Użytkownik może spróbować ponownie (jeśli token został odświeżony) lub zostać przekierowany do logowania

**Komunikat:**

- Wyświetlany w `ErrorState`: "Wymagana autoryzacja. Zaloguj się ponownie."

### Błąd 404 Not Found

**Przyczyna:** Samochód nie istnieje lub nie należy do użytkownika

**Obsługa:**

1. API zwraca błąd 404
2. Hook ustawia `chartError` z komunikatem: "Samochód nie został znaleziony."
3. Wyświetlany jest `ErrorState` z komunikatem błędu
4. Użytkownik może spróbować ponownie lub wrócić do listy samochodów

**Komunikat:**

- Wyświetlany w `ErrorState`: "Samochód nie został znaleziony."

### Błąd 500 Internal Server Error

**Przyczyna:** Błąd po stronie serwera

**Obsługa:**

1. API zwraca błąd 500, 502, 503 lub 504
2. Hook parsuje błąd i ustawia `chartError` z komunikatem z `error.message`
3. Wyświetlany jest `ErrorState` z komunikatem: "Wystąpił błąd serwera. Spróbuj ponownie później."
4. Użytkownik może spróbować ponownie po pewnym czasie

**Komunikat:**

- Wyświetlany w `ErrorState`: "Wystąpił błąd serwera. Spróbuj ponownie później."

### Timeout połączenia

**Przyczyna:** Przekroczony limit czasu połączenia (jeśli zaimplementowany)

**Obsługa:**

1. AbortController przerywa żądanie po timeout (np. 10 sekund)
2. Hook wykrywa błąd "AbortError" i ustawia `chartError` z komunikatem: "Przekroczono limit czasu połączenia. Spróbuj ponownie."
3. Wyświetlany jest `ErrorState` z komunikatem błędu
4. Użytkownik może spróbować ponownie

**Komunikat:**

- Wyświetlany w `ErrorState`: "Przekroczono limit czasu połączenia. Spróbuj ponownie."

### Brak połączenia sieciowego

**Przyczyna:** Brak połączenia z internetem lub problem z siecią

**Obsługa:**

1. Fetch rzuca błąd "Failed to fetch" lub "NetworkError"
2. Hook wykrywa błąd i ustawia `chartError` z komunikatem: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
3. Wyświetlany jest `ErrorState` z komunikatem błędu
4. Użytkownik może spróbować ponownie po przywróceniu połączenia

**Komunikat:**

- Wyświetlany w `ErrorState`: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."

### Nieprawidłowy format danych z API

**Przyczyna:** API zwróciło dane w nieoczekiwanym formacie

**Obsługa:**

1. Hook próbuje sparsować odpowiedź jako `ChartDataDTO`
2. Jeśli parsowanie się nie powiedzie (np. brak wymaganych pól), wyświetlany jest `ErrorState` z komunikatem: "Otrzymano nieprawidłowe dane z serwera."
3. Błąd jest logowany w konsoli do debugowania
4. Użytkownik może spróbować ponownie

**Komunikat:**

- Wyświetlany w `ErrorState`: "Otrzymano nieprawidłowe dane z serwera."

### Brak wystarczającej ilości danych

**Przyczyna:** Samochód ma mniej niż 2 tankowania

**Obsługa:**

1. API zwraca `chartData` z `data.length === 0` lub `data.length < 2`
2. Komponent `ChartsTab` sprawdza warunek `!chartData || chartData.data.length === 0`
3. Wyświetlany jest `EmptyChartState` z komunikatem: "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."
4. Użytkownik jest zachęcany do dodania więcej tankowań

**Komunikat:**

- Wyświetlany w `EmptyChartState`: "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."

## 11. Kroki implementacji

1. **Instalacja biblioteki wykresów**
   - Wybór biblioteki: recharts (rekomendowane dla React) lub Chart.js z react-chartjs-2
   - Instalacja: `npm install recharts` (lub odpowiednia biblioteka)
   - Sprawdzenie kompatybilności z React 19
   - Sprawdzenie kompatybilności z SSR (Astro może wymagać renderowania po stronie klienta)

2. **Utworzenie komponentu ChartHeader**
   - Plik: `src/components/cars/ChartHeader.tsx`
   - Implementacja nagłówka z tytułem wykresu
   - Implementacja sekcji statystyk (średnia, min, max, count)
   - Formatowanie wartości z odpowiednią liczbą miejsc po przecinku
   - Responsywny layout (grid na desktop, kolumna na mobile)
   - Dodanie ciemnego motywu (dark mode)
   - Testy renderowania dla różnych typów wykresów

3. **Utworzenie komponentu ChartVisualization**
   - Plik: `src/components/cars/ChartVisualization.tsx`
   - Integracja z biblioteką wykresów (recharts lub Chart.js)
   - Implementacja wykresu liniowego dla `consumption` i `price_per_liter`
   - Implementacja wykresu słupkowego dla `distance`
   - Konfiguracja osi X (daty) i osi Y (wartości z jednostkami)
   - Implementacja tooltipa z formatowaniem dat i wartości
   - Responsywność wykresu (100% szerokości kontenera)
   - Obsługa hover na punktach danych
   - Formatowanie dat zgodnie z lokalizacją polską (dd.mm.yyyy)
   - Formatowanie wartości z odpowiednimi jednostkami
   - Dodanie ciemnego motywu dla wykresu
   - Testy renderowania dla różnych typów wykresów

4. **Utworzenie komponentu ChartContainer**
   - Plik: `src/components/cars/ChartContainer.tsx`
   - Integracja `ChartHeader` i `ChartVisualization`
   - Kontener z tłem, cieniem i paddingiem
   - Responsywny layout
   - Testy renderowania z danymi testowymi

5. **Utworzenie komponentu EmptyChartState**
   - Plik: `src/components/cars/EmptyChartState.tsx`
   - Implementacja komunikatu o braku danych
   - Opcjonalna ikona informacyjna
   - Stylizacja zgodna z design systemem
   - Testy renderowania

6. **Rozszerzenie komponentu ChartsTab**
   - Plik: `src/components/cars/ChartsTab.tsx` (istniejący)
   - Zastąpienie placeholder'a właściwymi komponentami
   - Warunkowe renderowanie: `ChartContainer` gdy dane dostępne, `EmptyChartState` gdy brak danych
   - Integracja z `ChartTabs` (istniejący)
   - Integracja z `LoadingState` i `ErrorState` (istniejące)
   - Poprawienie obsługi błędów (przekazanie `onRetry` do `ErrorState`)
   - Testy renderowania dla wszystkich stanów (ładowanie, błąd, brak danych, dane dostępne)

7. **Dostosowanie hooka useCarDetails (opcjonalnie)**
   - Plik: `src/lib/hooks/useCarDetails.ts` (istniejący)
   - Sprawdzenie czy istniejąca implementacja `fetchChartData` jest wystarczająca
   - Opcjonalnie: dodanie timeoutu (AbortController) dla spójności z innymi endpointami
   - Opcjonalnie: dodanie cache'owania danych wykresu (jeśli potrzebne)
   - Testy funkcji `fetchChartData` dla różnych scenariuszy

8. **Implementacja dostępności (A11y)**
   - Dodanie ARIA atrybutów do wykresów:
     - `aria-label` dla kontenerów wykresów
     - `aria-describedby` dla statystyk
     - `role="img"` dla wykresów
   - Alternatywny tekst dla wykresów (opis dla czytników ekranu)
   - Obsługa klawiatury dla tooltipów (opcjonalnie)
   - Zapewnienie odpowiedniego kontrastu kolorów
   - Testy z czytnikami ekranu

9. **Testowanie integracji**
   - Test przełączania między typami wykresów
   - Test renderowania wykresów dla każdego typu
   - Test wyświetlania statystyk
   - Test tooltipów przy najechaniu myszką
   - Test responsywności na różnych rozdzielczościach
   - Test obsługi błędów (400, 401, 404, 500)
   - Test obsługi braku danych
   - Test obsługi timeoutu (jeśli zaimplementowany)
   - Test obsługi braku połączenia sieciowego

10. **Dostosowanie stylów i responsywności**
    - Zapewnienie spójności stylów z resztą aplikacji
    - Responsywność na urządzeniach mobilnych (< 640px)
    - Responsywność na tabletach (640px - 1024px)
    - Responsywność na desktop (> 1024px)
    - Dodanie ciemnego motywu (dark mode)
    - Optymalizacja wydajności renderowania wykresów

11. **Optymalizacja wydajności**
    - Sprawdzenie czy wykresy są renderowane tylko po stronie klienta (SSR może powodować problemy)
    - Użycie `useMemo` dla formatowania danych wykresu
    - Użycie `useCallback` dla handlerów zdarzeń
    - Lazy loading biblioteki wykresów (jeśli możliwe)
    - Optymalizacja re-renderów komponentów

12. **Dokumentacja i code review**
    - Dodanie komentarzy JSDoc do komponentów
    - Sprawdzenie zgodności z PRD (US-012)
    - Sprawdzenie zgodności z istniejącymi konwencjami projektu
    - Sprawdzenie zgodności z wytycznymi dostępności (ARIA)
    - Finalizacja implementacji
