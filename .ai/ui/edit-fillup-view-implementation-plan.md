# Plan implementacji widoku Edycji Tankowania

## 1. Przegląd

Widok edycji tankowania umożliwia użytkownikowi modyfikację istniejącego wpisu o tankowaniu. Formularz jest pre-wypełniony danymi z aktualnie edytowanego tankowania. Po zapisaniu zmian, system automatycznie przelicza wszystkie powiązane statystyki dla tego tankowania oraz dla wszystkich kolejnych wpisów. Widok został zaprojektowany tak, aby być zgodny z istniejącym interfejsem formularza dodawania nowego tankowania (NewFillupView), zapewniając spójne doświadczenie użytkownika.

Kluczowe funkcjonalności:

- Modyfikacja wszystkich pól tankowania (data, ilość paliwa, całkowita cena, przebieg)
- Wybór trybu wprowadzania przebiegu (stan licznika lub przejechany dystans)
- Walidacja danych w czasie rzeczywistym
- Obsługa ostrzeżeń walidacyjnych z API
- Możliwość usunięcia tankowania
- Automatyczne przekierowanie po zapisaniu zmian
- Informacje o liczbie zaktualizowanych wpisów

## 2. Routing widoku

**Ścieżka:** `/cars/{carId}/fillups/{fillupId}/edit`

**Plik Astro:** `src/pages/cars/[carId]/fillups/[fillupId]/edit.astro`

Widok powinien być skonstruowany jako stronę Astro, która:

1. Pobiera parametry `carId` i `fillupId` z URL
2. Waliduje poprawność parametrów (UUID)
3. Pobiera dane tankowania z API (GET endpoint)
4. Renderuje komponent React `EditFillupView` z pre-wypełnionymi danymi
5. Obsługuje przekierowania w przypadku błędów (404, 401)

## 3. Struktura komponentów

```
EditFillupView (React Component)
├── BreadcrumbNavigation (nawigacja okruszkowa)
├── Header (tytuł i opis widoku)
├── FormContainer (formularz edycji)
│   ├── DateInput (pole daty)
│   ├── FuelAmountInput (pole ilości paliwa)
│   ├── TotalPriceInput (pole całkowitej ceny)
│   ├── InputModeSelector (selektor trybu wprowadzania)
│   ├── OdometerInput (warunkowo widoczne pole stanu licznika)
│   ├── DistanceInput (warunkowo widoczne pole dystansu)
│   ├── ValidationWarnings (komunikat ostrzeżeń walidacyjnych)
│   ├── ErrorMessage (komunikat błędów)
│   └── FormActions (przyciski akcji)
│       ├── SubmitButton
│       ├── CancelButton
│       └── DeleteButton (opcjonalnie, może być w osobnym dialogu)
```

Komponenty z Shadcn/ui używane w widoku:

- `Button` - przyciski akcji
- `Input` - pola wprowadzania danych
- `Label` - etykiety dla pól formularza
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - selektor trybu wprowadzania

## 4. Szczegóły komponentów

### EditFillupView (główny komponent React)

**Opis:** Główny komponent widoku edycji tankowania. Wykorzystuje custom hook `useEditFillupForm` do zarządzania stanem formularza, walidacji i komunikacji z API.

**Główne elementy:**

- Struktura nawigacji okruszkowej (breadcrumbs) z linkami do Strona główna → Samochody → Samochód → Tankowania → Edycja
- Sekcja nagłówka z tytułem "Edytuj Tankowanie" i opisem
- Formularz HTML z atrybutami ARIA dla dostępności
- Grupa pól formularza z walidacją w czasie rzeczywistym
- Sekcja ostrzeżeń walidacyjnych (jeśli wystąpią)
- Sekcja błędów formularza
- Grupa przycisków akcji

**Obsługiwane zdarzenia:**

- `onSubmit` - zapisanie zmian w tankowaniu
- `onChange` - zmiana wartości pól formularza
- `onBlur` - walidacja pola po opuszczeniu
- Anulacja i powrót do historii tankowań
- Usunięcie tankowania (może wymagać osobnego przycisku/dialogu)

**Walidacja:**

- Data: wymagana, format ISO 8601, nie może być z przyszłości, maksymalnie 10 lat wstecz
- Ilość paliwa: wymagana, liczba dodatnia, zakres 0 < amount <= 2000
- Całkowita cena: wymagana, liczba dodatnia, zakres 0 < price <= 100000
- Stan licznika (gdy wybrany tryb): wymagany gdy tryb "odometer", liczba całkowita nieujemna
- Dystans (gdy wybrany tryb): wymagany gdy tryb "distance", liczba całkowita dodatnia
- Tryb wprowadzania: wymagany (odometer lub distance)

**Typy:**

- Props: `carId: string`, `fillupId: string`
- DTO wejściowe: `FillupDTO` (dane do pre-wypełnienia)
- DTO wyjściowe: `UpdatedFillupDTO` (odpowiedź z API)
- Request DTO: `UpdateFillupCommand` (częściowa aktualizacja)

**Props:**

```typescript
interface EditFillupViewProps {
  carId: string;
  fillupId: string;
}
```

### Pole Daty (DateInput)

**Opis:** Pole wprowadzania daty tankowania z obsługą walidacji.

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Input typu date z walidacją ARIA
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onChange` - aktualizacja wartości daty
- `onBlur` - walidacja przy opuszczeniu pola
- Automatyczne ustawienie fokusa przy załadowaniu widoku

**Walidacja:**

- Pole jest wymagane
- Format: YYYY-MM-DD
- Data nie może być z przyszłości
- Data nie może być starsza niż 10 lat

### Pole Ilości Paliwa (FuelAmountInput)

**Opis:** Pole wprowadzania ilości zatankowanego paliwa w litrach.

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Input typu number z ograniczeniami min="0" step="0.01"
- Placeholder z przykładową wartością
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onChange` - aktualizacja wartości ilości paliwa
- `onBlur` - walidacja przy opuszczeniu pola

**Walidacja:**

- Pole jest wymagane
- Musi być liczbą dodatnią
- Maksymalna wartość: 2000 litrów

### Pole Całkowitej Ceny (TotalPriceInput)

**Opis:** Pole wprowadzania całkowitej ceny tankowania w PLN.

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Input typu number z ograniczeniami min="0" step="0.01"
- Placeholder z przykładową wartością
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onChange` - aktualizacja wartości całkowitej ceny
- `onBlur` - walidacja przy opuszczeniu pola

**Walidacja:**

- Pole jest wymagane
- Musi być liczbą dodatnią
- Maksymalna wartość: 100000 PLN

### Selektory Trybu Wprowadzania (InputModeSelector)

**Opis:** Selektor wyboru trybu wprowadzania przebiegu (stan licznika lub przejechany dystans).

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Select z dwoma opcjami: "Stan licznika" i "Przejechany dystans"
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onValueChange` - zmiana trybu wprowadzania
- Automatyczne czyszczenie wartości nieaktywnego pola

**Walidacja:**

- Pole jest wymagane
- Wartość musi być "odometer" lub "distance"

### Pole Stanu Licznika (OdometerInput)

**Opis:** Pole wprowadzania aktualnego stanu licznika w kilometrach. Widoczne tylko gdy tryb wprowadzania = "odometer".

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Input typu number z ograniczeniami min="0" step="1"
- Placeholder z przykładową wartością
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onChange` - aktualizacja wartości stanu licznika
- `onBlur` - walidacja przy opuszczeniu pola

**Walidacja:**

- Pole jest wymagane gdy tryb "odometer" jest aktywny
- Musi być liczbą całkowitą nieujemną

### Pole Dystansu (DistanceInput)

**Opis:** Pole wprowadzania przejechanego dystansu od ostatniego tankowania w kilometrach. Widoczne tylko gdy tryb wprowadzania = "distance".

**Główne elementy:**

- Label z oznaczeniem wymaganego pola
- Input typu number z ograniczeniami min="0" step="1"
- Placeholder z przykładową wartością
- Komunikat błędu (warunkowo wyświetlany)
- Ukryty tekst pomocniczy dla czytników ekranu

**Obsługiwane zdarzenia:**

- `onChange` - aktualizacja wartości dystansu
- `onBlur` - walidacja przy opuszczeniu pola

**Walidacja:**

- Pole jest wymagane gdy tryb "distance" jest aktywny
- Musi być liczbą całkowitą dodatnią

### Komunikat Ostrzeżeń Walidacyjnych (ValidationWarnings)

**Opis:** Wyświetlanie ostrzeżeń walidacyjnych zwróconych przez API po aktualizacji tankowania.

**Główne elementy:**

- Kontener z żółtym tłem (bg-yellow-50 dark:bg-yellow-900/20)
- Ikona ostrzeżenia (AlertTriangle z lucide-react)
- Lista ostrzeżeń z nazwą pola i komunikatem
- Licznik odwrotny do automatycznego przekierowania
- Przycisk do natychmiastowego przejścia dalej

**Obsługiwane zdarzenia:**

- Automatyczne przekierowanie po upływie czasu (domyślnie 5 sekund)
- Ręczne przejście dalej przyciskiem

**Typy:**

- `warnings: ValidationWarningDTO[]` - lista ostrzeżeń z API
- `redirectIn: number | null` - liczba sekund do przekierowania

### Komunikat Błędów Formularza (ErrorMessage)

**Opis:** Wyświetlanie błędów formularza na poziomie pojedynczych pól oraz ogólnych błędów submit.

**Główne elementy:**

- Kontener z czerwonym tłem (bg-destructive/10)
- Tekst błędu z odpowiednią rolą ARIA

**Obsługiwane zdarzenia:**

- Brak interaktywnych zdarzeń, komponenty wyłącznie do wyświetlania

### Grupa Przycisków Akcji (FormActions)

**Opis:** Grupa przycisków do wykonywania akcji na formularzu.

**Główne elementy:**

- Przycisk "Zapisz" (submit) z obsługą stanu ładowania
- Przycisk "Anuluj" (cancel) do powrotu
- Miejsce na dodatkowy przycisk "Usuń" (opcjonalnie)

**Obsługiwane zdarzenia:**

- `onSubmit` - zapisanie zmian
- `onClick` (Anuluj) - powrót do historii tankowań
- `onClick` (Usuń) - usunięcie tankowania (jeśli zaimplementowane)

**Walidacja:**

- Przycisk "Zapisz" jest nieaktywny gdy:
  - Formularz jest w stanie submit
  - Są błędy walidacji i pola zostały dotknięte

## 5. Typy

### Typy istniejące (z `src/types.ts`):

**UpdateFillupCommand:**

```typescript
export type UpdateFillupCommand = Partial<BaseFillupInput> & {
  odometer?: number;
  distance?: number;
};

interface BaseFillupInput {
  date: string; // ISO 8601 timestamp
  fuel_amount: number;
  total_price: number;
}
```

**UpdatedFillupDTO:**

```typescript
export type UpdatedFillupDTO = FillupDTO & {
  updated_entries_count: number;
  warnings: ValidationWarningDTO[];
};
```

**FillupDTO:**

```typescript
export type FillupDTO = Pick<
  Fillup,
  | 'id'
  | 'car_id'
  | 'date'
  | 'fuel_amount'
  | 'total_price'
  | 'odometer'
  | 'distance_traveled'
  | 'fuel_consumption'
  | 'price_per_liter'
>;
```

**ValidationWarningDTO:**

```typescript
export interface ValidationWarningDTO {
  field: string;
  message: string;
}
```

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

### Typy nowe dla widoku edycji:

**EditFillupFormState:**

```typescript
interface EditFillupFormState {
  date: string; // Format: YYYY-MM-DD
  fuelAmount: string; // String for editing, converted to number
  totalPrice: string; // String for editing, converted to number
  inputMode: 'odometer' | 'distance';
  odometer: string; // String, optional when mode = odometer
  distance: string; // String, optional when mode = distance
}
```

**EditFillupFormErrors:**

```typescript
interface EditFillupFormErrors {
  date?: string;
  fuelAmount?: string;
  totalPrice?: string;
  odometer?: string;
  distance?: string;
  inputMode?: string;
  submit?: string;
}
```

## 6. Zarządzanie stanem

Widok używa custom hook `useEditFillupForm` do kompleksowego zarządzania stanem. Hook ten będzie podobny do `useNewFillupForm`, ale z dodatkową funkcjonalnością:

**Zarządzanie stanem w hook:**

1. **Stan ładowania danych** - `isLoading: boolean` - informuje o toku pobierania danych z API
2. **Stan formularza** - `formState: EditFillupFormState` - przechowuje wartości pól formularza
3. **Błędy formularza** - `formErrors: EditFillupFormErrors` - przechowuje błędy walidacji dla każdego pola
4. **Dotknięte pola** - `touchedFields: Set<keyof EditFillupFormState>` - śledzi które pola użytkownik już dotknął
5. **Stan wysyłania** - `isSubmitting: boolean` - informuje o trwającym zapisie
6. **Ostrzeżenia** - `warnings: ValidationWarningDTO[]` - przechowuje ostrzeżenia zwrócone przez API
7. **Licznik przekierowania** - `redirectIn: number | null` - liczba sekund do automatycznego przekierowania
8. **Oryginalne dane** - `originalFillupData: FillupDTO | null` - przechowuje początkowy stan tankowania do porównywania zmian

**Funkcje hook:**

1. `useEditFillupForm({ carId, fillupId })` - inicjalizacja hook z parametrami
2. `loadFillupData()` - pobranie danych tankowania z API przy montowaniu komponentu
3. `validateField(field)` - walidacja pojedynczego pola
4. `validateAllFields()` - walidacja wszystkich pól przed submit
5. `handleFieldChange(field, value)` - aktualizacja wartości pola z walidacją
6. `handleFieldBlur(field)` - walidacja pola przy opuszczeniu
7. `handleModeToggle(mode)` - zmiana trybu wprowadzania z czyszczeniem nieaktywnego pola
8. `hasChanges()` - sprawdzenie czy użytkownik wprowadził jakieś zmiany
9. `handleSubmit(e)` - wysłanie żądania PATCH do API z obsługą błędów
10. `handleCancel()` - anulowanie i powrót do historii tankowań

**Abortable Fetch:**
Hook używa mechanizmu abortable fetch z timeoutem (10 sekund) do obsługi długotrwałych żądań i umożliwienia ich przerwania.

**Struktura danych stanu w hook:**

```typescript
interface UseEditFillupFormReturn {
  formState: EditFillupFormState;
  formErrors: EditFillupFormErrors;
  isSubmitting: boolean;
  isLoading: boolean;
  touchedFields: Set<keyof EditFillupFormState>;
  warnings: ValidationWarningDTO[];
  redirectIn: number | null;
  dateInputRef: RefObject<HTMLInputElement>;
  originalFillupData: FillupDTO | null;
  handleFieldChange: (field: keyof EditFillupFormState, value: string) => void;
  handleFieldBlur: (field: keyof EditFillupFormState) => void;
  handleModeToggle: (mode: 'odometer' | 'distance') => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  handleSkipCountdown: () => void;
  validateField: (field: keyof EditFillupFormState) => boolean;
}
```

## 7. Integracja API

### GET /api/cars/{carId}/fillups/{fillupId}

**Endpoint:** Pobiera dane pojedynczego tankowania

**Request:**

- Method: `GET`
- Path: `/api/cars/{carId}/fillups/{fillupId}`
- Headers: `Authorization: Bearer {token}`
- Path params:
  - `carId: string` (UUID)
  - `fillupId: string` (UUID)

**Response 200 OK:**

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100,
  "distance_traveled": 600,
  "fuel_consumption": 7.67,
  "price_per_liter": 5.0
}
```

**Response 400 Bad Request:**

```json
{
  "error": {
    "code": "INVALID_FILLUP_ID",
    "message": "Invalid fillup ID format",
    "details": { "issues": "..." }
  }
}
```

**Response 401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Missing or invalid Authorization header"
  }
}
```

**Response 404 Not Found:**

```json
{
  "error": {
    "code": "FILLUP_NOT_FOUND",
    "message": "Fillup not found or does not belong to user's car"
  }
}
```

### PATCH /api/cars/{carId}/fillups/{fillupId}

**Endpoint:** Aktualizuje istniejące tankowanie

**Request:**

- Method: `PATCH`
- Path: `/api/cars/{carId}/fillups/{fillupId}`
- Headers: `Authorization: Bearer {token}`, `Content-Type: application/json`
- Path params:
  - `carId: string` (UUID)
  - `fillupId: string` (UUID)
- Body (wszystkie pola opcjonalne):

```json
{
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100
}
```

**Response 200 OK:**

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100,
  "distance_traveled": 600,
  "fuel_consumption": 7.67,
  "price_per_liter": 5.0,
  "updated_entries_count": 3,
  "warnings": []
}
```

**Response 400 Bad Request:**

```json
{
  "error": {
    "code": "INVALID_REQUEST_BODY",
    "message": "Invalid request body",
    "details": { "issues": "..." }
  }
}
```

**Response 401 Unauthorized:** (jak w GET)
**Response 404 Not Found:** (jak w GET)

## 8. Interakcje użytkownika

### 1. Załadowanie widoku edycji

**Scenariusz:** Użytkownik klika na kafelek tankowania w historii lub wchodzi bezpośrednio na URL edycji

**Reakcja systemu:**

1. Komponent React montuje się i uruchamia `useEditFillupForm`
2. Hook wykonuje GET request do `/api/cars/{carId}/fillups/{fillupId}`
3. Jeśli dane zostaną pobrane pomyślnie:
   - Formularz jest wypełniany danymi tankowania
   - Tryb wprowadzania jest automatycznie ustawiony na podstawie danych
   - Pole daty otrzymuje automatyczny fokus
4. Jeśli żądanie zakończy się błędem:
   - Wyświetlane są odpowiednie komunikaty błędów
   - Automatyczne przekierowanie do listy tankowań (po 3 sekundach dla 404)

### 2. Modyfikacja pola daty

**Scenariusz:** Użytkownik zmienia datę tankowania

**Reakcja systemu:**

1. Pole jest aktualizowane w czasie rzeczywistym (stan formularza)
2. Jeśli pole było dotknięte, uruchamiana jest walidacja (deferred)
3. Błędy walidacji są wyświetlane pod polem
4. Przycisk "Zapisz" może zostać zablokowany jeśli są błędy

### 3. Zmiana trybu wprowadzania przebiegu

**Scenariusz:** Użytkownik zmienia tryb z "Stan licznika" na "Przejechany dystans" lub odwrotnie

**Reakcja systemu:**

1. Sekcja wizualnie zmienia się (odometer input ↔ distance input)
2. Wartość nieaktywnego pola jest czyszczona
3. Błędy walidacji dla nieaktywnego pola są usuwane
4. Fokus jest automatycznie przekazywany do aktywnego pola

### 4. Zapisywanie zmian

**Scenariusz:** Użytkownik klika przycisk "Zapisz"

**Reakcja systemu:**

1. Wszystkie pola są walidowane
2. Jeśli są błędy:
   - Wyświetlane są komunikaty błędów pod odpowiednimi polami
   - Fokus jest ustawiany na pierwszym polu z błędem
   - Formularz nie jest wysyłany
3. Jeśli walidacja jest poprawna:
   - Przycisk "Zapisz" zmienia tekst na "Zapisywanie..."
   - Formularz jest blokowany (disabled)
   - Wykonywany jest PATCH request do API
4. Jeśli PATCH zwróci sukces:
   - Wyświetlane są ostrzeżenia (jeśli wystąpiły)
   - Automatyczne przekierowanie do historii tankowań (z countdown jeśli są ostrzeżenia)
5. Jeśli PATCH zwróci błąd:
   - Wyświetlane są odpowiednie komunikaty błędów
   - Formularz jest odblokowany
   - W zależności od błędu może nastąpić przekierowanie (401, 404)

### 5. Anulowanie zmian

**Scenariusz:** Użytkownik klika przycisk "Anuluj"

**Reakcja systemu:**

1. Natychmiastowe przekierowanie do `/cars/{carId}/fillups`
2. Brak potwierdzenia (zmiany nie zostaną zapisane)

### 6. Wyświetlanie ostrzeżeń walidacyjnych

**Scenariusz:** Po zapisaniu zmian API zwróciło ostrzeżenia (np. stan licznika jest mniejszy niż poprzedni)

**Reakcja systemu:**

1. Wyświetlane jest żółte okno z listą ostrzeżeń
2. Licznik odlicza czas do automatycznego przekierowania (5 sekund)
3. Użytkownik może kliknąć "Rozumiem, przejdź dalej" aby natychmiast przejść dalej

### 7. Obsługa błędów sieciowych

**Scenariusz:** Brak połączenia z serwerem lub timeout

**Reakcja systemu:**

1. Wyświetlany jest komunikat błędu: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
2. Formularz jest odblokowany
3. Użytkownik może spróbować ponownie

## 9. Warunki i walidacja

### Walidacja po stronie klienta (frontend):

**Pole Data:**

- Wymagane
- Format: YYYY-MM-DD
- Data nie może być z przyszłości
- Data nie może być starsza niż 10 lat
- Błąd pojawia się gdy pole jest puste, ma nieprawidłowy format lub jest poza zakresem

**Pole Ilości Paliwa:**

- Wymagane
- Musi być liczbą
- Musi być większa od zera
- Maksymalna wartość: 2000 litrów
- Błąd pojawia się gdy pole jest puste, nie jest liczbą, jest mniejsze lub równe zero lub przekracza maksimum

**Pole Całkowitej Ceny:**

- Wymagane
- Musi być liczbą
- Musi być większa od zera
- Maksymalna wartość: 100000 PLN
- Błąd pojawia się gdy pole jest puste, nie jest liczbą, jest mniejsze lub równe zero lub przekracza maksimum

**Pole Stanu Licznika (gdy tryb "odometer"):**

- Wymagane gdy tryb "odometer" jest aktywny
- Musi być liczbą całkowitą
- Musi być nieujemne
- Błąd pojawia się gdy pole jest puste lub nie spełnia wymagań

**Pole Dystans (gdy tryb "distance"):**

- Wymagane gdy tryb "distance" jest aktywny
- Musi być liczbą całkowitą
- Musi być większe od zera
- Błąd pojawia się gdy pole jest puste lub nie spełnia wymagań

**Tryb Wprowadzania:**

- Wymagany
- Wartość musi być "odometer" lub "distance"
- Błąd pojawia się gdy wartość nie jest jedną z powyższych

### Walidacja po stronie serwera (backend):

**Format UUID:**

- `carId` i `fillupId` muszą być prawidłowymi UUID
- Błąd 400 jeśli format jest nieprawidłowy

**Autoryzacja:**

- Token Bearer musi być obecny w nagłówku Authorization
- Token musi być prawidłowy i nie wygaszony
- Błąd 401 jeśli brak tokenu lub token jest nieprawidłowy

**Własność zasobów:**

- Tankowanie musi należeć do podanego samochodu
- Samochód musi należeć do uwierzytelnionego użytkownika
- Błąd 404 jeśli tankowanie lub samochód nie istnieją lub nie należą do użytkownika

**Dane wejściowe:**

- Wszystkie pola w request body są opcjonalne (partial update)
- Data musi być w formacie ISO 8601
- Ilość paliwa musi być dodatnią liczbą
- Całkowita cena musi być dodatnią liczbą
- Stan licznika lub dystans musi być podany (wzajemnie wykluczające się)
- Błąd 400 jeśli dane są nieprawidłowe

**Konsystencja danych:**

- Stan licznika nie powinien być mniejszy niż w poprzednim tankowaniu (generuje ostrzeżenie, nie błąd)
- Stan licznika nie powinien być taki sam jak w poprzednim tankowaniu (generuje ostrzeżenie, nie błąd)
- API automatycznie przelicza statystyki dla dotkniętych wpisów

### Warunki decydujące o stanie UI:

**Stan "Ładowanie danych":**

- `isLoading === true`
- Wyświetlany jest komunikat "Ładowanie danych tankowania..."
- Formularz jest niedostępny

**Stan "Zapisywanie":**

- `isSubmitting === true`
- Przycisk "Zapisz" pokazuje "Zapisywanie..."
- Wszystkie pola formularza są zablokowane
- Przycisk "Anuluj" jest zablokowany

**Stan "Ostrzeżenia":**

- `warnings.length > 0`
- Wyświetlane jest żółte okno z ostrzeżeniami
- Licznik przekierowania jest aktywny (jeśli `redirectIn > 0`)

**Stan "Błąd":**

- `formErrors.submit` lub `formErrors[field]` jest ustawiony
- Wyświetlane są komunikaty błędów
- Formularz może być zablokowany w zależności od typu błędu

**Stan "Przycisk Zapisz nieaktywny":**

- `isSubmitting === true` LUB
- `hasErrors && touchedFields.size > 0`
- Przycisk "Zapisz" jest nieaktywny (disabled)

## 10. Obsługa błędów

### Błąd 400 Bad Request

**Przyczyna:** Nieprawidłowe dane w formularzu (np. puste pola, złe formaty)

**Obsługa:**

1. Mapowanie błędów z API do odpowiednich pól formularza
2. Wyświetlenie komunikatów błędów pod odpowiednimi polami
3. Ustawienie fokusa na pierwszym polu z błędem
4. Formularz pozostaje aktywny (możliwość poprawy)

### Błąd 401 Unauthorized

**Przyczyna:** Brak tokenu uwierzytelnienia lub nieprawidłowy token

**Obsługa:**

1. Wyświetlenie komunikatu: "Wymagana autoryzacja. Przekierowywanie..."
2. Automatyczne przekierowanie do `/login` po 2 sekundach
3. Formularz jest zablokowany

### Błąd 404 Not Found

**Przyczyna:** Tankowanie nie istnieje lub nie należy do użytkownika/samochodu

**Obsługa:**

1. Wyświetlenie komunikatu: "Tankowanie nie zostało znalezione. Przekierowywanie..."
2. Automatyczne przekierowanie do `/cars/{carId}/fillups` po 3 sekundach
3. Formularz jest zablokowany

### Błąd 500 Internal Server Error

**Przyczyna:** Błąd po stronie serwera

**Obsługa:**

1. Wyświetlenie komunikatu: "Wystąpił błąd serwera. Spróbuj ponownie później."
2. Formularz pozostaje aktywny (użytkownik może spróbować ponownie)
3. Logowanie błędu w konsoli do debugowania

### Timeout połączenia

**Przyczyna:** Przekroczony limit czasu połączenia (10 sekund)

**Obsługa:**

1. Wyświetlenie komunikatu: "Przekroczono limit czasu połączenia. Spróbuj ponownie."
2. Formularz pozostaje aktywny
3. Użytkownik może spróbować ponownie

### Brak połączenia sieciowego

**Przyczyna:** Brak połączenia z internetem

**Obsługa:**

1. Wyświetlenie komunikatu: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
2. Formularz pozostaje aktywny
3. Użytkownik może spróbować ponownie gdy połączenie wróci

### Błędy walidacji pól

**Przyczyna:** Nieprawidłowe wartości w polach formularza (po stronie klienta)

**Obsługa:**

1. Wyświetlenie komunikatu błędu pod odpowiednim polem
2. Pole jest oznaczone czerwoną ramką (`border-destructive`)
3. Etykieta pola jest dostępna dla czytników ekranu
4. Formularz nie jest wysyłany dopóki wszystkie błędy nie zostaną naprawione

### Inne błędy

**Przyczyna:** Nieoczekiwane błędy (niezdefiniowane statusy)

**Obsługa:**

1. Wyświetlenie ogólnego komunikatu błędu z kodem statusu
2. Formularz pozostaje aktywny
3. Logowanie szczegółów błędu w konsoli

## 11. Kroki implementacji

1. **Utworzenie custom hook `useEditFillupForm`**
   - Plik: `src/lib/hooks/useEditFillupForm.ts`
   - Wzorowanie na `useNewFillupForm` i `useEditCarForm`
   - Implementacja logiki:
     - Pobieranie danych tankowania przy montowaniu (GET request)
     - Zarządzanie stanem formularza
     - Walidacja pól (funkcje podobne do useNewFillupForm)
     - Wysyłanie żądania PATCH
     - Obsługa błędów i ostrzeżeń
     - Sprawdzanie czy wprowadzono zmiany (`hasChanges`)
   - Timeout i abortable fetch
   - Zwracanie interfejsu zgodnego z UseEditFillupFormReturn

2. **Utworzenie komponentu React `EditFillupView`**
   - Plik: `src/components/cars/EditFillupView.tsx`
   - Wzorowanie na `NewFillupView.tsx` i `EditCarView.tsx`
   - Implementacja struktury:
     - Import komponentów UI (Button, Input, Label, Select)
     - Wykorzystanie hook `useEditFillupForm`
     - Struktura nawigacji okruszkowej (breadcrumbs)
     - Nagłówek z tytułem i opisem
     - Grupa pól formularza
     - Sekcje ostrzeżeń i błędów
     - Grupa przycisków akcji
   - Wykorzystanie reużywalnych komponentów UI z Shadcn

3. **Utworzenie strony Astro `edit.astro`**
   - Plik: `src/pages/cars/[carId]/fillups/[fillupId]/edit.astro`
   - Wzorowanie na `new.astro` i `edit.astro` dla samochodu
   - Implementacja:
     - Ekstrakcja parametrów `carId` i `fillupId` z URL
     - Walidacja parametrów (UUID)
     - Opcjonalne pobranie danych tankowania na SSR (GET request)
     - Renderowanie Layout i EditFillupView
     - Obsługa przekierowań w przypadku błędów
   - Meta data (title, description)

4. **Testy implementacji**
   - Test widoku edycji z prawidłowymi danymi
   - Test walidacji pól formularza
   - Test obsługi błędów (400, 401, 404, 500)
   - Test wyświetlania ostrzeżeń walidacyjnych
   - Test zmiany trybu wprowadzania przebiegu
   - Test sprawdzania czy wprowadzono zmiany (`hasChanges`)
   - Test timeoutu połączenia
   - Test braku połączenia sieciowego

5. **Dostosowanie istniejących widoków (jeśli potrzebne)**
   - Sprawdzenie czy lista tankowań (FillupsListView) przekierowuje do widoku edycji
   - Sprawdzenie czy kafelek tankowania jest klikalny i prowadzi do edycji
   - Aktualizacja ścieżek nawigacji jeśli potrzebne

6. **Dokumentacja i code review**
   - Sprawdzenie zgodności z PRD (US-010)
   - Sprawdzenie zgodności z wytycznymi dostępności (ARIA)
   - Sprawdzenie zgodności z istniejącymi konwencjami projektu
   - Finalizacja implementacji
