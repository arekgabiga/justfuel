# Plan implementacji widoku Szczegóły samochodu

## 1. Przegląd

Widok szczegółów samochodu (`/cars/{carId}`) to główny widok aplikacji umożliwiający zarządzanie konkretnym samochodem. Pozwala użytkownikowi przeglądać historię tankowań, analizować wykresy zużycia paliwa oraz edytować lub usuwać samochód. Widok składa się z nawigacji kartowej umożliwiającej przełączanie się między sekcją tankowań a wykresami.

### Kluczowe funkcjonalności:

- Wyświetlanie podstawowych informacji o samochodzie (nazwa, preferencje wprowadzania przebiegu)
- Nawigacja kartowa z dwiema sekcjami: Tankowania i Wykresy
- Przeglądanie historii tankowań z infinite scroll
- Wizualizacja danych na trzech typach wykresów
- Edycja nazwy samochodu i preferencji wprowadzania przebiegu
- Usuwanie samochodu z wymaganym potwierdzeniem nazwą

## 2. Routing widoku

- **Ścieżka:** `/cars/{carId}` (gdzie `{carId}` to UUID samochodu)
- **Plik strony:** `src/pages/cars/[carId].astro`
- **Renderowanie:** SSR (Server-Side Rendering) z `export const prerender = false`
- **Strona Astro:** Renderuje podstawową strukturę strony i przekazuje parametry do komponentu React

## 3. Struktura komponentów

```
CarDetailsView (Główny komponent React)
├── Breadcrumbs (Nawigacja okruszkowa)
├── CarHeader (Nagłówek z nazwą i akcjami)
│   ├── CarNameWithActions
│   │   ├── CarNameDisplay
│   │   ├── EditCarButton
│   │   └── DeleteCarButton
│   └── MileagePreferenceDisplay
├── TabNavigation (Przełączanie między sekcjami)
│   ├── Tab (Tankowania)
│   └── Tab (Wykresy)
├── FillupsTab (Sekcja tankowań - domyślna)
│   └── FillupsListView
│       └── [FillupCard] × N
└── ChartsTab (Sekcja wykresów)
    ├── ChartTabs (Przełączanie typów wykresów)
    │   ├── Tab (Spalanie)
    │   ├── Tab (Cena za litr)
    │   └── Tab (Dystans)
    ├── ConsumptionChart
    ├── PriceChart
    └── DistanceChart
```

## 4. Szczegóły komponentów

### CarDetailsView

**Opis:** Główny komponent widoku zarządzający stanem, integracją z API oraz renderowaniem wszystkich podkomponentów.

**Główne elementy:**

- Kontener główny (`<main>`)
- Obszar nawigacji (Breadcrumbs)
- Obszar nagłówka (CarHeader)
- Obszar kart (TabNavigation)
- Obszar treści (FillupsTab lub ChartsTab w zależności od aktywnej karty)

**Obsługiwane zdarzenia:**

- `onMount` - pobiera dane samochodu przy montowaniu komponentu
- `onTabChange` - przełączanie między kartami Tankowania/Wykresy
- `onEditCar` - uruchamia formularz edycji samochodu
- `onDeleteCar` - uruchamia dialog potwierdzenia usunięcia
- `onCarUpdate` - odświeża dane samochodu po edycji

**Warunki walidacji:**

- Brak danych samochodu → wyświetl stan błędu (404)
- Brak autoryzacji → przekierowanie do logowania
- Błąd sieciowy → wyświetl komunikat błędu z możliwością ponowienia

**Typy:**

- `CarDetailsDTO` - dane samochodu z statystykami
- `ErrorResponseDTO` - błędy API
- Stan komponentu zarządzany przez custom hook

**Props:**

- `carId: string` - ID samochodu z parametrów URL

### Breadcrumbs

**Opis:** Komponent nawigacji okruszkowej pokazujący ścieżkę do bieżącego widoku.

**Główne elementy:**

- Link do "Samochody" (`<Link>`)
- Separator (`<span>` lub ikona)
- Aktywny element "Szczegóły samochodu"

**Obsługiwane zdarzenia:**

- `onNavigateToCars` - nawigacja do listy samochodów

**Typy:**

- `{ carName: string }` - nazwa samochodu do wyświetlenia

**Props:**

- `carName: string` - nazwa samochodu

### CarHeader

**Opis:** Nagłówek zawierający nazwę samochodu, akcje (edycja, usuwanie) oraz wyświetlacz preferencji wprowadzania przebiegu.

**Główne elementy:**

- Wyświetlacz nazwy samochodu (`<h1>`)
- Grupa przycisków akcji (edycja i usuwanie)
- Wyświetlacz preferencji wprowadzania przebiegu (ikona + tekst)

**Obsługiwane zdarzenia:**

- `onEdit` - uruchamia formularz edycji
- `onDelete` - uruchamia dialog potwierdzenia usunięcia

**Warunki walidacji:**

- Nazwa samochodu nie może być pusta
- Przyciski akcji są nieaktywne podczas ładowania danych

**Typy:**

- `CarDetailsDTO` - dane do wyświetlenia
- Funkcje obsługi zdarzeń

**Props:**

- `car: CarDetailsDTO` - dane samochodu
- `onEdit: () => void` - handler edycji
- `onDelete: () => void` - handler usunięcia

### TabNavigation

**Opis:** Komponent nawigacji kartowej umożliwiający przełączanie między sekcjami Tankowania i Wykresy.

**Główne elementy:**

- Kontener kart (`<nav>` lub `<div>`)
- Karta "Tankowania" (domyślna)
- Karta "Wykresy"

**Obsługiwane zdarzenia:**

- `onTabSelect` - zmiana aktywnej karty

**Warunki walidacji:**

- Tylko jedna karta aktywna w danym momencie
- Domyślna karta to "Tankowania"

**Typy:**

- `'fillups' | 'charts'` - typy aktywnych kart

**Props:**

- `activeTab: 'fillups' | 'charts'` - aktualna aktywna karta
- `onTabChange: (tab: 'fillups' | 'charts') => void` - handler zmiany karty

### FillupsTab

**Opis:** Sekcja wyświetlająca listę tankowań dla danego samochodu z możliwością infinite scroll.

**Główne elementy:**

- Lista tankowań (`<ul>` lub siatka)
- Karty tankowań (FillupCard) renderowane dynamicznie
- Obserwator scrollu dla infinite scroll
- Spinner ładowania dodatkowych danych

**Obsługiwane zdarzenia:**

- `onScroll` - wykrywanie osiągnięcia końca listy
- `onFillupClick` - kliknięcie w kartę tankowania (przenosi do edycji)
- `onLoadMore` - ładowanie kolejnych elementów

**Warunki walidacji:**

- Brak tankowań → komunikat "Brak tankowań"
- Ładowanie → wyświetl spinner
- Błąd → wyświetl komunikat błędu z przyciskiem ponowienia

**Typy:**

- `PaginatedFillupsResponseDTO` - odpowiedź z API
- `FillupDTO[]` - lista tankowań
- Stan ładowania (loading, error, hasMore)

**Props:**

- `fillups: FillupDTO[]` - lista tankowań
- `pagination: PaginationDTO` - metadane paginacji
- `onLoadMore: () => void` - handler ładowania kolejnych
- `onFillupClick: (fillupId: string) => void` - handler kliknięcia

### FillupCard

**Opis:** Karta pojedynczego tankowania wyświetlająca kluczowe informacje: datę, spalanie, dystans, cenę za litr.

**Główne elementy:**

- Data tankowania
- Spalanie (L/100km) z kolorowaniem dynamicznym
- Dystans przejechany
- Cena za litr
- Licznik (odometer)

**Obsługiwane zdarzenia:**

- `onClick` - kliknięcie w kartę (edycja tankowania)

**Warunki walidacji:**

- Spalanie jest kolorowane dynamicznie (zielony/żółty/czerwony) w zależności od odchylenia od średniej
- Intensywność koloru zależy od procentowego odchylenia
- Brak danych do obliczenia spalania → wyświetl "N/A"

**Typy:**

- `FillupDTO` - dane tankowania
- `number` - średnie spalanie dla kolorowania

**Props:**

- `fillup: FillupDTO` - dane tankowania
- `averageConsumption: number` - średnie spalanie dla kolorowania
- `onClick: () => void` - handler kliknięcia

### ChartsTab

**Opis:** Sekcja z trzema typami wykresów przedstawiającymi trendy w zużyciu paliwa.

**Główne elementy:**

- Nawigacja kartowa wykresów
- Wykres spalania (linia)
- Wykres ceny za litr (linia)
- Wykres dystansu (słupki)
- Statystyki dla każdego wykresu (średnia, min, max)

**Obsługiwane zdarzenia:**

- `onChartTypeChange` - zmiana typu aktywnego wykresu
- `onDateRangeChange` - zmiana zakresu dat (opcjonalnie)

**Warunki walidacji:**

- Brak danych do wykresu → komunikat "Za mało danych"
- Wymagane minimum 2 punkty danych dla wykresu
- Obsługa pustych wartości w danych

**Typy:**

- `ChartDataDTO` - dane wykresu
- `ChartType` - typ wykresu
- `ChartMetadataDTO` - metadane wykresu

**Props:**

- `chartData: ChartDataDTO | null` - dane wykresu
- `activeChartType: ChartType` - aktywny typ wykresu
- `onChartTypeChange: (type: ChartType) => void` - handler zmiany typu

### EditCarDialog (Modal)

**Opis:** Dialog edycji samochodu umożliwiający zmianę nazwy i preferencji wprowadzania przebiegu.

**Główne elementy:**

- Formularz z polami: nazwa, preferencja przebiegu
- Przycisk "Anuluj"
- Przycisk "Zapisz"

**Obsługiwane zdarzenia:**

- `onSubmit` - zapisanie zmian
- `onCancel` - anulowanie edycji

**Warunki walidacji:**

- Nazwa: wymagana, min 1 znak, max 100 znaków
- Nazwa musi być unikalna wśród samochodów użytkownika
- Walidacja po stronie API - sprawdzenie unikalności nazwy

**Typy:**

- `UpdateCarCommand` - dane do aktualizacji
- Formularz state z polami `name` i `mileage_input_preference`

**Props:**

- `car: CarDetailsDTO` - dane edytowanego samochodu
- `onUpdate: (data: UpdateCarCommand) => Promise<void>` - handler aktualizacji
- `onCancel: () => void` - handler anulowania
- `isOpen: boolean` - stan otwarcia dialogu

### DeleteCarDialog (Modal)

**Opis:** Dialog potwierdzenia usunięcia samochodu wymagający wpisania nazwy samochodu.

**Główne elementy:**

- Tytuł ostrzeżenia
- Tekst informacyjny
- Pole input do wpisania nazwy samochodu
- Przycisk "Anuluj"
- Przycisk "Usuń" (tylko aktywny po wpisaniu poprawnej nazwy)

**Obsługiwane zdarzenia:**

- `onConfirm` - potwierdzenie usunięcia
- `onCancel` - anulowanie usunięcia
- `onInputChange` - zmiana wartości pola potwierdzenia

**Warunki walidacji:**

- Nazwa w polu potwierdzenia musi dokładnie odpowiadać nazwie samochodu
- Pole potwierdzenia nie może być puste
- Walidacja po stronie API

**Typy:**

- `DeleteCarCommand` - dane potwierdzenia usunięcia
- Formularz state z polem `confirmation_name`

**Props:**

- `car: CarDetailsDTO` - dane usuwanego samochodu
- `onDelete: (data: DeleteCarCommand) => Promise<void>` - handler usunięcia
- `onCancel: () => void` - handler anulowania
- `isOpen: boolean` - stan otwarcia dialogu

## 5. Typy

### CarDetailsDTO

```typescript
interface CarDetailsDTO {
  id: string; // UUID samochodu
  name: string; // Nazwa samochodu (min 1, max 100)
  initial_odometer: number | null; // Początkowy stan licznika
  mileage_input_preference: "odometer" | "distance"; // Preferencja wprowadzania przebiegu
  created_at: string; // ISO 8601 timestamp utworzenia
  statistics: {
    total_fuel_cost: number; // Łączny koszt paliwa
    total_fuel_amount: number; // Łączna ilość paliwa (L)
    total_distance: number; // Łączny dystans (km)
    average_consumption: number; // Średnie spalanie (L/100km)
    average_price_per_liter: number; // Średnia cena za litr
    fillup_count: number; // Liczba tankowań
  };
}
```

### FillupDTO

```typescript
interface FillupDTO {
  id: string; // UUID tankowania
  car_id: string; // UUID samochodu
  date: string; // ISO 8601 timestamp
  fuel_amount: number; // Ilość paliwa (L)
  total_price: number; // Łączna cena (PLN)
  odometer: number; // Stan licznika
  distance_traveled: number; // Dystans od poprzedniego tankowania (km)
  fuel_consumption: number | null; // Spalanie (L/100km)
  price_per_liter: number | null; // Cena za litr
}
```

### PaginatedFillupsResponseDTO

```typescript
interface PaginatedFillupsResponseDTO {
  fillups: FillupDTO[]; // Lista tankowań
  pagination: {
    next_cursor: string | null; // Kursor do następnej strony
    has_more: boolean; // Czy są więcej danych
    total_count: number; // Całkowita liczba tankowań
  };
}
```

### ChartDataDTO

```typescript
interface ChartDataDTO {
  type: "consumption" | "price_per_liter" | "distance"; // Typ wykresu
  data: ChartDataPointDTO[]; // Punkty danych
  average: number; // Średnia wartość
  metadata: {
    count: number; // Liczba punktów
    min: number; // Wartość minimalna
    max: number; // Wartość maksymalna
  };
}
```

### ChartDataPointDTO

```typescript
interface ChartDataPointDTO {
  date: string; // ISO 8601 timestamp
  value: number; // Wartość dla danego typu wykresu
  odometer: number; // Stan licznika
}
```

### UpdateCarCommand

```typescript
interface UpdateCarCommand {
  name?: string; // Opcjonalna nowa nazwa
  mileage_input_preference?: "odometer" | "distance"; // Opcjonalna nowa preferencja
}
```

### DeleteCarCommand

```typescript
interface DeleteCarCommand {
  confirmation_name: string; // Potwierdzenie nazwą samochodu
}
```

### ErrorResponseDTO

```typescript
interface ErrorResponseDTO {
  error: {
    code: string; // Kod błędu (UNAUTHORIZED, NOT_FOUND, BAD_REQUEST, CONFLICT, INTERNAL_ERROR)
    message: string; // Komunikat błędu
    details?: Record<string, string>; // Opcjonalne szczegóły
  };
}
```

## 6. Zarządzanie stanem

Widok wymaga custom hook `useCarDetails` zarządzającego:

- Stanem danych samochodu (`CarDetailsDTO | null`)
- Stanem ładowania danych (`loading: boolean`)
- Stanem błędów (`Error | null`)
- Stanem aktywnych kart (nawigacja główna i wykresów)
- Stanem modalnych dialogów (edycja, usuwanie)
- Stanem paginacji fillups (cursor, hasMore)
- Stanem danych wykresów

### useCarDetails Hook

**Cel:** Zarządzanie stanem i operacjami dla widoku szczegółów samochodu.

**Struktura stanu:**

```typescript
interface CarDetailsState {
  car: CarDetailsDTO | null;
  loading: boolean;
  error: Error | null;
  activeMainTab: "fillups" | "charts";
  activeChartTab: ChartType;
  editDialogOpen: boolean;
  deleteDialogOpen: boolean;
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  chartData: ChartDataDTO | null;
  chartLoading: boolean;
  chartError: Error | null;
}
```

**Obsługiwane operacje:**

- `fetchCarDetails(carId)` - pobranie danych samochodu
- `updateCar(data)` - aktualizacja samochodu
- `deleteCar(confirmation)` - usunięcie samochodu
- `fetchFillups(cursor?)` - pobranie tankowań z paginacją
- `fetchChartData(type)` - pobranie danych wykresu
- `switchMainTab(tab)` - zmiana głównej karty
- `switchChartTab(tab)` - zmiana karty wykresu
- `openEditDialog()` - otwarcie dialogu edycji
- `closeEditDialog()` - zamknięcie dialogu edycji
- `openDeleteDialog()` - otwarcie dialogu usunięcia
- `closeDeleteDialog()` - zamknięcie dialogu usunięcia

**Walidacja:**

- Sprawdzanie autoryzacji przed każdym wywołaniem API
- Obsługa timeoutów i błędów sieciowych
- Idempotencja operacji (zabezpieczenie przed podwójnymi wywołaniami)

## 7. Integracja API

### GET /api/cars/{carId}

**Typ żądania:** `GET`  
**Typ odpowiedzi:** `CarDetailsDTO`  
**Typ błędu:** `ErrorResponseDTO`

**Użycie:**

- Pobieranie danych samochodu przy montowaniu komponentu
- Odświeżanie danych po edycji
- Handler: `fetchCarDetails(carId: string): Promise<CarDetailsDTO>`

**Awarie:**

- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → komunikat "Samochód nie został znaleziony"
- 500 Internal Error → komunikat z możliwością ponowienia

### PATCH /api/cars/{carId}

**Typ żądania:** `PATCH`  
**Typ żądania:** `UpdateCarCommand`  
**Typ odpowiedzi:** `CarDetailsDTO`  
**Typ błędu:** `ErrorResponseDTO`

**Użycie:**

- Aktualizacja nazwy lub preferencji wprowadzania przebiegu
- Handler: `updateCar(data: UpdateCarCommand): Promise<CarDetailsDTO>`

**Awarie:**

- 400 Bad Request → walidacja błędów formularza
- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → komunikat "Samochód nie został znaleziony"
- 409 Conflict → nazwa już istnieje
- 500 Internal Error → komunikat z możliwością ponowienia

### DELETE /api/cars/{carId}

**Typ żądania:** `DELETE`  
**Typ żądania:** `DeleteCarCommand`  
**Typ odpowiedzi:** `DeleteResponseDTO`  
**Typ błędu:** `ErrorResponseDTO`

**Użycie:**

- Usunięcie samochodu po potwierdzeniu
- Handler: `deleteCar(confirmation: DeleteCarCommand): Promise<void>`

**Awarie:**

- 400 Bad Request → nazwa potwierdzenia nie pasuje
- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → komunikat "Samochód nie został znaleziony"
- 500 Internal Error → komunikat z możliwością ponowienia

### GET /api/cars/{carId}/fillups

**Typ żądania:** `GET`  
**Query params:** `{ limit?: number; cursor?: string; sort?: 'date' | 'odometer'; order?: 'asc' | 'desc' }`  
**Typ odpowiedzi:** `PaginatedFillupsResponseDTO`  
**Typ błędu:** `ErrorResponseDTO`

**Użycie:**

- Pobieranie listy tankowań z paginacją (infinite scroll)
- Handler: `fetchFillups(cursor?: string): Promise<PaginatedFillupsResponseDTO>`

**Awarie:**

- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → samochód nie istnieje
- 500 Internal Error → komunikat z możliwością ponowienia

### GET /api/cars/{carId}/charts

**Typ żądania:** `GET`  
**Query params:** `{ type: ChartType; start_date?: string; end_date?: string; limit?: number }`  
**Typ odpowiedzi:** `ChartDataDTO`  
**Typ błędu:** `ErrorResponseDTO`

**Użycie:**

- Pobieranie danych wykresu dla danego typu
- Handler: `fetchChartData(type: ChartType): Promise<ChartDataDTO>`

**Awarie:**

- 400 Bad Request → nieprawidłowe parametry
- 401 Unauthorized → przekierowanie do logowania
- 404 Not Found → samochód nie istnieje
- 500 Internal Error → komunikat z możliwością ponowienia

## 8. Interakcje użytkownika

### Nawigacja

- **Kliknięcie w breadcrumb "Samochody"** → nawigacja do `/cars`
- **Przełączanie między kartami Tankowania/Wykresy** → zmiana aktywniej sekcji
- **Przełączanie między kartami wykresów** → zmiana wyświetlanego wykresu

### Zarządzanie samochodem

- **Kliknięcie w przycisk edycji** → otwarcie dialogu edycji
- **Kliknięcie w przycisk usuwania** → otwarcie dialogu potwierdzenia
- **Wypełnienie formularza edycji i zapis** → aktualizacja danych, odświeżenie widoku
- **Wpisanie nazwy i potwierdzenie usunięcia** → usunięcie samochodu, przekierowanie do `/cars`

### Przeglądanie tankowań

- **Scroll w dół listy tankowań** → automatyczne ładowanie kolejnych elementów
- **Kliknięcie w kartę tankowania** → nawigacja do `/cars/{carId}/fillups/{fillupId}` (edycja)

### Przeglądanie wykresów

- **Przełączanie typów wykresów** → ładowanie danych dla wybranego typu
- **Hover nad punktami danych** → wyświetlanie tooltip z wartościami

## 9. Warunki i walidacja

### Walidacja danych samochodu

- **Nazwa samochodu:** wymagana, min 1 znak, max 100 znaków, walidacja po stronie API
- **Preferencja wprowadzania przebiegu:** wartość enum ('odometer' lub 'distance')
- **Czas utworzenia:** poprawny format ISO 8601

### Walidacja potwierdzenia usunięcia

- **Nazwa potwierdzenia:** wymaga dokładnego dopasowania do nazwy samochodu
- **Walidacja po stronie API:** sprawdzenie poprawności przed usunięciem

### Walidacja danych wykresów

- **Minimum danych:** wymagane minimum 2 punkty danych do wyświetlenia wykresu
- **Wartości liczbowe:** wszystkie wartości muszą być nieujemne
- **Format daty:** wszystkie daty w formacie ISO 8601

### Obsługa błędów autoryzacji

- **Brak tokena:** przekierowanie do strony logowania
- **Nieprawidłowy token:** przekierowanie do strony logowania
- **Wygasły token:** odświeżenie tokena lub przekierowanie do logowania

### Obsługa błędów sieciowych

- **Timeout:** komunikat "Przekroczono limit czasu" z możliwością ponowienia
- **Nieznany błąd:** komunikat ogólny z możliwością ponowienia
- **Błąd 404:** komunikat "Samochód nie został znaleziony"
- **Błąd 409 (conflict):** komunikat "Nazwa samochodu już istnieje"

## 10. Obsługa błędów

### Błędy ładowania danych samochodu

- **404 Not Found:**
  - Wyświetl komunikat: "Samochód nie został znaleziony"
  - Przycisk powrotu do listy samochodów
  - Logowanie błędu do konsoli (tylko development)
- **401 Unauthorized:**
  - Automatyczne przekierowanie do logowania
  - Czyszczenie tokena autoryzacji z localStorage
- **500 Internal Server Error:**
  - Wyświetl komunikat: "Wystąpił błąd serwera"
  - Przycisk "Ponów" z ponowną próbą pobrania danych
  - Dodanie request ID do logów

### Błędy operacji edycji/usunięcia

- **409 Conflict (nazwa już istnieje):**
  - Wyświetl komunikat: "Nazwa samochodu już istnieje"
  - Podświetl pole nazwy w formularzu
  - Umożliwij korektę i ponowne zapisanie
- **400 Bad Request (nieprawidłowa nazwa potwierdzenia):**
  - Wyświetl komunikat: "Nazwa potwierdzenia nie pasuje"
  - Podświetl pole potwierdzenia
  - Umożliwij korektę i ponowne potwierdzenie

### Błędy ładowania tankowań

- **Pusta lista:**
  - Wyświetl komunikat: "Brak tankowań. Dodaj pierwsze tankowanie."
  - Przycisk "Dodaj tankowanie"
- **Błąd sieciowy:**
  - Wyświetl komunikat: "Nie udało się pobrać tankowań"
  - Przycisk "Ponów" z ponowną próbą

### Błędy ładowania wykresów

- **Za mało danych:**
  - Wyświetl komunikat: "Za mało danych do wyświetlenia wykresu. Wymagane minimum 2 tankowania."
- **Puste dane:**
  - Wyświetl komunikat: "Brak danych do wyświetlenia"

### Inne scenariusze błędów

- **Niespójność danych:** Jeśli statystyki nie pasują do liczby tankowań, wyświetl ostrzeżenie w konsoli (tylko development)
- **Timeout żądania:** Jeśli żądanie trwa dłużej niż 10 sekund, przerwij je i wyświetl komunikat o timeout

## 11. Kroki implementacji

### Etap 1: Podstawowa struktura i integracja API

1. Utworzyć plik `src/lib/hooks/useCarDetails.ts` z custom hookiem
2. Zaimplementować funkcję `fetchCarDetails` pobierającą dane samochodu
3. Obsłużyć walidację parametru `carId` (UUID)
4. Obsłużyć błędy 401 (przekierowanie), 404 (komunikat), 500 (retry)

### Etap 2: Komponent główny i nawigacja

1. Utworzyć `src/components/cars/CarDetailsView.tsx` (główny komponent)
2. Zaimplementować komponent `Breadcrumbs` z nawigacją do `/cars`
3. Zaimplementować komponent `CarHeader` z nazwą i akcjami
4. Zaimplementować komponent `TabNavigation` z kartami Tankowania/Wykresy
5. Połączyć komponenty z hookiem `useCarDetails`

### Etap 3: Sekcja tankowań

1. Zaimplementować komponent `FillupsListView` z infinite scroll
2. Zaimplementować komponent `FillupCard` z wyświetlaniem danych
3. Dodać logikę kolorowania spalania w `FillupCard`
4. Zaimplementować scroll detection dla infinite scroll
5. Obsłużyć paginację z cursorem

### Etap 4: Sekcja wykresów

1. Zaimplementować komponent `ChartsTab` z nawigacją typów wykresów
2. Zaimplementować komponenty wykresów: `ConsumptionChart`, `PriceChart`, `DistanceChart`
3. Dodać ładowanie danych wykresów przez hook
4. Obsłużyć stan "za mało danych" dla wykresów

### Etap 5: Dialog edycji samochodu

1. Utworzyć komponent `EditCarDialog` (modal)
2. Zaimplementować formularz z polami nazwa i preferencja przebiegu
3. Dodać walidację: nazwa (min 1, max 100), wymagana
4. Połączyć z API `PATCH /api/cars/{carId}`
5. Obsłużyć błąd 409 (konflikt nazwy)
6. Odświeżyć dane po pomyślnym zapisaniu

### Etap 6: Dialog usuwania samochodu

1. Utworzyć komponent `DeleteCarDialog` (modal)
2. Zaimplementować pole potwierdzenia z nazwą samochodu
3. Dodać walidację: nazwa musi dokładnie odpowiadać nazwie samochodu
4. Przycisk "Usuń" aktywny tylko po wpisaniu poprawnej nazwy
5. Połączyć z API `DELETE /api/cars/{carId}`
6. Po pomyślnym usunięciu przekierować do `/cars`

### Etap 7: Integracja z Astro

1. Zaktualizować plik `src/pages/cars/[carId].astro`
2. Przekazać parametr `carId` do komponentu React
3. Dodać podstawowe meta tagi (title, description)
4. Dodać linki do komponentów React w Astro

### Etap 8: Stylowanie i UX

1. Zastosować Tailwind CSS zgodnie z designem aplikacji
2. Dodać animacje przejść między kartami
3. Dodać loading states dla asynchronicznych operacji
4. Dodać hover states dla interaktywnych elementów
5. Zastosować dark mode zgodnie z motywem aplikacji

### Etap 9: Testy i optymalizacja

1. Przetestować nawigację między kartami
2. Przetestować infinite scroll w sekcji tankowań
3. Przetestować edycję i usuwanie samochodu
4. Przetestować wszystkie scenariusze błędów
5. Zoptymalizować wydajność (lazy loading, memoization)

### Etap 10: Dokumentacja i finalizacja

1. Dodać komentarze do kodu
2. Zaktualizować README.md z informacjami o widoku
3. Dodać przykłady użycia w dokumentacji
4. Przejrzeć kod pod kątem czystości i zgodności z konwencjami
