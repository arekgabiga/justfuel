# Plan implementacji widoku Dodawanie Nowego Tankowania

## 1. Przegląd

Widok służy do dodawania nowego wpisu o tankowaniu dla konkretnego samochodu. Użytkownik może wprowadzić dane o tankowaniu na dwa sposoby: podając aktualny stan licznika (odometer) lub dystans od ostatniego tankowania (distance). System automatycznie oblicza brakujące wartości oraz wyświetla ostrzeżenia walidacji w przypadku wykrycia potencjalnych nieprawidłowości (np. cofnięcie się licznika).

**Kluczowe cechy:**

- Inteligentny formularz z dynamicznym przełącznikiem między trybem odometer/distance
- Walidacja po stronie frontendu (wymagane pola, formaty numeryczne)
- Soft validation warnings z API (ostrzeżenia, które nie blokują zapisania)
- Automatyczne obliczenia (spalanie, cena za litr)
- Obsługa błędów z mapowaniem na odpowiednie pola formularza
- Przyjazna dla użytkownika walidacja czasu rzeczywistego

## 2. Routing widoku

**Ścieżka:** `/cars/{carId}/fillups/new`

**Plik:** `src/pages/cars/[carId]/fillups/new.astro`

**Struktura URL:**

- `{carId}` - UUID samochodu (wymagany parametr path)
- Widok dostępny z poziomu listy tankowań (`/cars/{carId}/fillups`) poprzez przycisk "Dodaj tankowanie"

**Przykładowe wywołanie:**

```
GET /cars/123e4567-e89b-12d3-a456-426614174000/fillups/new
```

## 3. Struktura komponentów

```
NewFillupView (komponent główny)
├── Breadcrumbs (nawigacja)
├── Header (tytuł i opis)
├── Form (formularz)
│   ├── DateInput (pole daty - wymagane)
│   ├── FuelAmountInput (ilość paliwa - wymagane)
│   ├── TotalPriceInput (całkowita cena - wymagane)
│   ├── MileageModeToggle (przełącznik trybu odometer/distance)
│   ├── OdometerInput (warunkowe - gdy tryb = odometer)
│   ├── DistanceInput (warunkowe - gdy tryb = distance)
│   ├── ValidationWarningsDisplay (wyświetlanie ostrzeżeń z API)
│   └── FormActions (przyciski Zapisz/Anuluj)
└── ErrorMessages (ogólne komunikaty błędów)
```

**Hierarchia:**

- `NewFillupView` - komponent główny React (React.FC)
- Wszystkie pola formularza - komponenty Input z Shadcn/ui
- Przełącznik trybu - komponent Select z Shadcn/ui
- Custom hook: `useNewFillupForm` - zarządzanie stanem i logiką formularza

## 4. Szczegóły komponentów

### NewFillupView

**Opis:** Główny komponent widoku formularza dodawania tankowania. Odpowiada za renderowanie całego formularza, obsługę interakcji użytkownika, integrację z API oraz zarządzanie stanem formularza poprzez custom hook.

**Główne elementy:**

- Kontener formularza z `max-w-2xl`
- Breadcrumbs z nawigacją do samochodu i listy tankowań
- Header z tytułem "Dodaj Nowe Tankowanie" i opisem
- Formularz z polami: data, ilość paliwa, całkowita cena, przebieg (odometer/distance)
- Sekcja z ostrzeżeniami walidacji (jeśli zwrócone z API)
- Przyciski akcji (Zapisz, Anuluj)

**Obsługiwane interakcje:**

- `onSubmit` - wysłanie formularza do API
- `onCancel` - powrót do widoku samochodu
- `onFieldChange` - zmiana wartości pól z walidacją w czasie rzeczywistym
- `onFieldBlur` - walidacja po opuszczeniu pola
- `onModeToggle` - przełączenie między trybem odometer/distance

**Obsługiwana walidacja:**

- Data: wymagana, format ISO 8601
- Ilość paliwa: wymagana, liczba dodatnia > 0
- Całkowita cena: wymagana, liczba dodatnia > 0
- Odometr/dystans: wymagany jeden z tych pól, liczba całkowita >= 0
- Wzajemne wykluczenie: tylko jedno z pól (odometer LUB distance) może być wypełnione

**Typy:**

- Props: `{ carId: string }`
- DTO: `FillupWithWarningsDTO` (odpowiedź z API)
- Command: `CreateFillupCommand` (żądanie do API)
- State: `NewFillupFormState` (stan formularza)
- Errors: `NewFillupFormErrors` (błędy walidacji)

**Props:**

- `carId: string` - UUID samochodu (wymagany)

### Breadcrumbs

**Opis:** Komponent nawigacji breadcrumb pokazujący ścieżkę do widoku. Zawiera linki do strony głównej, listy samochodów, szczegółów samochodu oraz listy tankowań.

**Główne elementy:**

- Lista uporządkowana `<ol>` z semantyką ARIA
- Przyciski nawigacji z ikonami (Home)
- Separatory "/" między elementami
- Oznaczenie bieżącej strony (`aria-current="page"`)

**Obsługiwane interakcje:**

- Kliknięcie "Strona główna" - przekierowanie do `/`
- Kliknięcie "Samochody" - przekierowanie do `/cars`
- Kliknięcie "Nazwa samochodu" - przekierowanie do `/cars/{carId}`
- Kliknięcie "Tankowania" - przekierowanie do `/cars/{carId}/fillups`

**Props:** Brak (komponent bezstanowy, używa `window.location` lub routera)

### DateInput

**Opis:** Pole wprowadzania daty tankowania. Używa natywnego `<input type="date">` z lokalizacją PL.

**Główne elementy:**

- Label z gwiazdką wymaganej pola
- Input type="date" z walidacją
- Komunikat błędu walidacji
- Ukryty opis dla screen readerów (`sr-only`)

**Obsługiwana walidacja:**

- Pole wymagane (nie może być puste)
- Format daty (natywny walidator HTML5)
- Data nie może być z przyszłości (opcjonalnie, w celu soft validation)
- Data nie może być starsza niż 10 lat (opcjonalnie, w celu sanity check)

**Typy:**

- Value: `string` (format YYYY-MM-DD)
- Error: `string | undefined`

### FuelAmountInput

**Opis:** Pole wprowadzania ilości zatankowanego paliwa w litrach. Obsługuje wartości dziesiętne z precyzją do 2 miejsc po przecinku.

**Główne elementy:**

- Label z gwiazdką wymaganej pola
- Input type="number" z min="0", step="0.01"
- Komunikat błędu walidacji
- Ukryty opis dla screen readerów

**Obsługiwana walidacja:**

- Pole wymagane (nie może być puste)
- Wartość musi być > 0
- Wartość musi być <= 2000 (rozsądne maximum)
- Format: liczba dziesiętna z maksymalnie 2 miejscami po przecinku

**Typy:**

- Value: `string` (domyślnie string dla edycji, konwersja na number przed wysłaniem)
- Error: `string | undefined`

### TotalPriceInput

**Opis:** Pole wprowadzania całkowitej ceny tankowania w PLN. Obsługuje wartości dziesiętne z precyzją do 2 miejsc po przecinku.

**Główne elementy:**

- Label z gwiazdką wymaganej pola
- Input type="number" z min="0", step="0.01"
- Komunikat błędu walidacji
- Ukryty opis dla screen readerów

**Obsługiwana walidacja:**

- Pole wymagane (nie może być puste)
- Wartość musi być > 0
- Wartość musi być <= 100000 (rozsądne maximum)
- Format: liczba dziesiętna z maksymalnie 2 miejscami po przecinku

**Typy:**

- Value: `string`
- Error: `string | undefined`

### MileageModeToggle

**Opis:** Przełącznik trybu wprowadzania przebiegu. Pozwala wybrać czy użytkownik podaje stan licznika czy przejechany dystans.

**Główne elementy:**

- Label z opisem pola
- Select dropdown z dwoma opcjami:
  - "odometer" - Stan licznika
  - "distance" - Przejechany dystans
- Komunikat błędu walidacji (jeśli wymagane)

**Obsługiwana walidacja:**

- Pole wymagane (musi być wybrana opcja)
- Wartość musi być jednym z: "odometer" | "distance"

**Typy:**

- Value: `"odometer" | "distance"`
- Error: `string | undefined`

### OdometerInput

**Opis:** Pole wprowadzania stanu licznika. Wyświetlane tylko gdy tryb = "odometer".

**Główne elementy:**

- Label z opisem
- Input type="number" z min="0", step="1"
- Komunikat błędu walidacji
- Ukryty opis dla screen readerów

**Obsługiwana walidacja:**

- Pole wymagane gdy tryb = "odometer"
- Wartość musi być >= 0
- Wartość musi być liczbą całkowitą
- Wartość nie powinna być mniejsza od ostatniego stanu licznika (soft warning, nie blokuje zapisania)

**Typy:**

- Value: `string`
- Error: `string | undefined`

### DistanceInput

**Opis:** Pole wprowadzania przejechanego dystansu. Wyświetlane tylko gdy tryb = "distance".

**Główne elementy:**

- Label z opisem
- Input type="number" z min="0", step="1"
- Komunikat błędu walidacji
- Ukryty opis dla screen readerów

**Obsługiwana walidacja:**

- Pole wymagane gdy tryb = "distance"
- Wartość musi być >= 0
- Wartość musi być liczbą całkowitą
- Wartość nie powinna być równa 0 (soft warning)

**Typy:**

- Value: `string`
- Error: `string | undefined`

### ValidationWarningsDisplay

**Opis:** Komponent wyświetlający ostrzeżenia zwrócone przez API. Te ostrzeżenia nie blokują zapisania wpisu, ale informują użytkownika o potencjalnych problemach (np. cofnięcie się licznika).

**Główne elementy:**

- Kontener z klasy: `bg-yellow-50 border border-yellow-200 rounded-md p-4`
- Lista ostrzeżeń (jeśli zwrócone z API)
- Każde ostrzeżenie pokazuje pole i komunikat

**Obsługiwane interakcje:**

- Brak (komponent tylko do wyświetlania)

**Typy:**

- Props: `{ warnings?: ValidationWarningDTO[] }`
- ValidationWarningDTO: `{ field: string, message: string }`

### FormActions

**Opis:** Sekcja z przyciskami akcji formularza (Zapisz, Anuluj).

**Główne elementy:**

- Kontener z layoutem flex (kolumna na mobile, rząd na desktop)
- Przycisk "Zapisz" (type="submit") z disabled gdy są błędy lub submit w toku
- Przycisk "Anuluj" (type="button") z obsługą cancel

**Obsługiwane interakcje:**

- Kliknięcie "Zapisz" - wywołanie `handleSubmit`
- Kliknięcie "Anuluj" - wywołanie `handleCancel`

**Props:**

- `isSubmitting: boolean` - stan submitowania
- `isDisabled: boolean` - czy przycisk zapisu jest wyłączony
- `onCancel: () => void` - handler anulowania

## 5. Typy

### Typy z src/types.ts (istniejące)

```typescript
// Komenda tworzenia tankowania
type CreateFillupCommand =
  | { date: string; fuel_amount: number; total_price: number; odometer: number }
  | { date: string; fuel_amount: number; total_price: number; distance: number };

// Odpowiedź z tankowaniem i ostrzeżeniami
type FillupWithWarningsDTO = FillupDTO & {
  warnings?: ValidationWarningDTO[];
};

// Struktura ostrzeżenia
interface ValidationWarningDTO {
  field: string;
  message: string;
}

// DTO tankowania
type FillupDTO = {
  id: string;
  car_id: string;
  date: string;
  fuel_amount: number;
  total_price: number;
  odometer: number;
  distance_traveled: number;
  fuel_consumption: number | null;
  price_per_liter: number | null;
};

// Odpowiedź błędu
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

### Nowe typy w useNewFillupForm

```typescript
// Stan formularza
interface NewFillupFormState {
  date: string; // Format: YYYY-MM-DD
  fuelAmount: string; // String dla edycji, konwersja na number
  totalPrice: string; // String dla edycji, konwersja na number
  inputMode: 'odometer' | 'distance';
  odometer: string; // String, opcjonalne gdy tryb = odometer
  distance: string; // String, opcjonalne gdy tryb = distance
}

// Błędy formularza
interface NewFillupFormErrors {
  date?: string;
  fuelAmount?: string;
  totalPrice?: string;
  odometer?: string;
  distance?: string;
  inputMode?: string;
  submit?: string; // Ogólny błąd submitowania
}

// Props hooka
interface UseNewFillupFormProps {
  carId: string;
}
```

**Pola i typy:**

- `date`: string - data w formacie YYYY-MM-DD, wymagana
- `fuelAmount`: string - ilość paliwa (edytowalna jako string, konwertowana na number), wymagana
- `totalPrice`: string - całkowita cena (edytowalna jako string, konwertowana na number), wymagana
- `inputMode`: enum - "odometer" lub "distance", wymagany, domyślnie "odometer"
- `odometer`: string - stan licznika, wymagany gdy inputMode = "odometer"
- `distance`: string - dystans, wymagany gdy inputMode = "distance"

## 6. Zarządzanie stanem

Zarządzanie stanem realizowane jest przez custom hook `useNewFillupForm`.

### Stan React Hooka

```typescript
const [formState, setFormState] = useState<NewFillupFormState>({
  date: '', // Format: YYYY-MM-DD, domyślnie dziś
  fuelAmount: '',
  totalPrice: '',
  inputMode: 'odometer', // Domyślnie odometer
  odometer: '',
  distance: '',
});

const [formErrors, setFormErrors] = useState<NewFillupFormErrors>({});
const [isSubmitting, setIsSubmitting] = useState(false);
const [touchedFields, setTouchedFields] = useState<Set<keyof NewFillupFormState>>(new Set());
const dateInputRef = useRef<HTMLInputElement>(null);
```

**Wyjaśnienie stanów:**

- `formState` - aktualne wartości pól formularza
- `formErrors` - błędy walidacji dla poszczególnych pól
- `isSubmitting` - czy formularz jest w trakcie wysyłania (blokuje przyciski)
- `touchedFields` - zbiór pól, które były edytowane (pokazuje błędy tylko dla touched)
- `dateInputRef` - ref do pola daty dla automatycznego focusowania

### Funkcje validacji

```typescript
const validateDate = (date: string): string | undefined
const validateFuelAmount = (amount: string): string | undefined
const validateTotalPrice = (price: string): string | undefined
const validateOdometer = (odometer: string): string | undefined
const validateDistance = (distance: string): string | undefined
const validateInputMode = (mode: string): string | undefined
```

**Cel funkcji:**

- Sprawdzanie poprawności danych przed wysłaniem
- Wyświetlanie błędów walidacji w czasie rzeczywistym
- Zapobieganie wysłaniu nieprawidłowych danych

### Funkcje obsługi zdarzeń

```typescript
const handleFieldChange = (field: keyof NewFillupFormState, value: string) => void
const handleFieldBlur = (field: keyof NewFillupFormState) => void
const handleModeToggle = (mode: "odometer" | "distance") => void
const handleSubmit = async (e: React.FormEvent) => Promise<void>
const handleCancel = () => void
```

**Cel funkcji:**

- `handleFieldChange` - aktualizacja stanu pola z walidacją czasu rzeczywistego
- `handleFieldBlur` - walidacja po opuszczeniu pola przez użytkownika
- `handleModeToggle` - przełączanie między trybami i czyszczenie warunkowych pól
- `handleSubmit` - wysłanie formularza do API z obsługą błędów
- `handleCancel` - anulowanie i powrót do widoku samochodu

### Hook zwraca

```typescript
return {
  formState,
  formErrors,
  isSubmitting,
  touchedFields,
  dateInputRef,
  handleFieldChange,
  handleFieldBlur,
  handleModeToggle,
  handleSubmit,
  handleCancel,
};
```

## 7. Integracja API

### Endpoint

- **Method:** `POST`
- **Path:** `/api/cars/{carId}/fillups`
- **Authentication:** Required (Bearer token)

### Request Body

**Option 1: Odometer**

```json
{
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000
}
```

**Option 2: Distance**

```json
{
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "distance": 500
}
```

### Success Response (201 Created)

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000,
  "distance_traveled": 500,
  "fuel_consumption": 9.1,
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z",
  "warnings": [
    {
      "field": "odometer",
      "message": "Odometer reading is lower than the previous fillup"
    }
  ]
}
```

**Typ odpowiedzi:** `FillupWithWarningsDTO`

### Error Responses

- `400 Bad Request` - Błędy walidacji (ujemne wartości, brakujące pola, podanie obu: odometr i dystans)
- `401 Unauthorized` - Nieprawidłowy lub wygasły token
- `404 Not Found` - Samochód nie istnieje lub nie należy do użytkownika
- `500 Internal Server Error` - Błędy serwera

### Implementacja w hooku

```typescript
// Konwersja daty z YYYY-MM-DD na ISO 8601
const convertDateToISO = (date: string): string => {
  return new Date(date).toISOString();
};

// Konwersja string values na number
const prepareRequestBody = (state: NewFillupFormState): CreateFillupCommand => {
  const baseData = {
    date: convertDateToISO(state.date),
    fuel_amount: parseFloat(state.fuelAmount),
    total_price: parseFloat(state.totalPrice),
  };

  if (state.inputMode === 'odometer') {
    return {
      ...baseData,
      odometer: parseInt(state.odometer, 10),
    };
  } else {
    return {
      ...baseData,
      distance: parseInt(state.distance, 10),
    };
  }
};

// Wysłanie requestu
const response = await fetch(`/api/cars/${carId}/fillups`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(requestBody),
});
```

## 8. Interakcje użytkownika

### 8.1. Przepływ podstawowy (Dodanie tankowania z trybem odometer)

1. **Użytkownik wchodzi na widok** `/cars/{carId}/fillups/new`
2. **Użytkownik widzi formularz** z domyślnie ustawionym trybem "odometer"
3. **Użytkownik wprowadza datę** w polu daty (domyślnie dziś)
4. **Użytkownik wprowadza ilość paliwa** (np. 45.5)
5. **Użytkownik wprowadza całkowitą cenę** (np. 227.5)
6. **Użytkownik wprowadza stan licznika** (np. 55000)
7. **Użytkownik klika "Zapisz"**
8. **System waliduje** wszystkie pola (required, formaty)
9. **System wysyła request** POST `/api/cars/{carId}/fillups` z body: `{ date, fuel_amount, total_price, odometer }`
10. **API zwraca** `FillupWithWarningsDTO` (201 Created)
11. **System wyświetla ostrzeżenia** (jeśli zwrócone z API)
12. **System przekierowuje** do `/cars/{carId}/fillups`

### 8.2. Przepływ alternatywny (Dodanie tankowania z trybem distance)

1-6. Identyczne jak powyżej (data, fuelAmount, totalPrice) 7. **Użytkownik przełącza tryb** na "distance" (Select) 8. **System ukrywa pole odometer**, wyświetla pole distance 9. **Użytkownik wprowadza dystans** (np. 500 km) 10. **Użytkownik klika "Zapisz"**
11-12. Identyczne jak powyżej (walidacja, request, odpowiedź)

### 8.3. Walidacja w czasie rzeczywistym

1. **Użytkownik wprowadza wartość** w polu
2. **System dodaje pole** do `touchedFields` Set
3. **System uruchamia walidację** asynchronicznie
4. **System wyświetla błąd** (jeśli walidacja zakończyła się błędem)
5. **System blokuje przycisk** "Zapisz" dopóki są błędy

### 8.4. Soft Validation Warnings

1. **Użytkownik wprowadza stan licznika** mniejszy od poprzedniego
2. **Użytkownik wysyła formularz**
3. **API zwraca** 201 Created z array `warnings`
4. **System wyświetla ostrzeżenia** w komponencie ValidationWarningsDisplay
5. **Użytkownik może** zignorować ostrzeżenia lub poprawić dane

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie frontend

**Data** (pole: `date`):

- Wymagane: nie może być puste
- Format: YYYY-MM-DD (wymusza natywny input type="date")
- Komponent odpowiedzialny: DateInput
- Komunikat błędu: "Data jest wymagana"

**Ilość paliwa** (pole: `fuelAmount`):

- Wymagane: nie może być puste
- Wartość musi być > 0 (liczba dodatnia)
- Wartość maksymalna: 2000 (rozsądne maximum)
- Format: liczba dziesiętna (maksymalnie 2 miejsca po przecinku)
- Komponent odpowiedzialny: FuelAmountInput
- Komunikaty błędów:
  - "Ilość paliwa jest wymagana"
  - "Ilość paliwa musi być większa od zera"
  - "Ilość paliwa nie może przekraczać 2000 litrów"

**Całkowita cena** (pole: `totalPrice`):

- Wymagane: nie może być puste
- Wartość musi być > 0 (liczba dodatnia)
- Wartość maksymalna: 100000 (rozsądne maximum)
- Format: liczba dziesiętna (maksymalnie 2 miejsca po przecinku)
- Komponent odpowiedzialny: TotalPriceInput
- Komunikaty błędów:
  - "Całkowita cena jest wymagana"
  - "Całkowita cena musi być większa od zera"
  - "Całkowita cena nie może przekraczać 100000 PLN"

**Tryb wprowadzania** (pole: `inputMode`):

- Wymagane: musi być wybrana opcja
- Dozwolone wartości: "odometer" | "distance"
- Domyślna wartość: "odometer"
- Komponent odpowiedzialny: MileageModeToggle
- Komunikat błędu: "Wybierz tryb wprowadzania przebiegu"

**Odometr** (pole: `odometer`):

- Wymagane: gdy inputMode = "odometer"
- Wartość musi być >= 0
- Format: liczba całkowita
- Komponent odpowiedzialny: OdometerInput (warunkowy)
- Komunikaty błędów:
  - "Stan licznika jest wymagany" (gdy wymagany)
  - "Stan licznika nie może być ujemny"

**Dystans** (pole: `distance`):

- Wymagane: gdy inputMode = "distance"
- Wartość musi być >= 0
- Format: liczba całkowita
- Komponent odpowiedzialny: DistanceInput (warunkowy)
- Komunikaty błędów:
  - "Dystans jest wymagany" (gdy wymagany)
  - "Dystans nie może być ujemny"

### 9.2. Walidacja po stronie API

API wraca do walidacji na backend (endpoint implementuje walidację przez Zod schema):

- `createFillupCommandSchema` z `src/lib/validation/fillups.ts`
- Data: ISO 8601 timestamp
- Ilość paliwa: number > 0
- Całkowita cena: number > 0
- Odometr LUB dystans: wzajemnie wykluczające się pola

**Mapowanie błędów API na UI:**

- 400 Bad Request: szczegółowe komunikaty walidacji zwracane w `details.issues` mapowane na field-level errors
- Soft warnings: zwracane w array `warnings`, wyświetlane jako ostrzeżenia (nie blokują zapisania)

### 9.3. Warunki wymagane dla poprawnego wysłania

**Warunki przed submitem:**

1. Pole `date` nie jest puste
2. Pole `fuelAmount` nie jest puste i jest > 0
3. Pole `totalPrice` nie jest puste i jest > 0
4. Pole `inputMode` ma wybraną wartość "odometer" lub "distance"
5. Jeśli inputMode = "odometer", pole `odometer` nie jest puste i jest >= 0
6. Jeśli inputMode = "distance", pole `distance` nie jest puste i jest >= 0
7. Użytkownik jest zalogowany (token auth dostępny)
8. Nie ma aktywnych błędów walidacji

**Impact na stan formularza:**

- Przycisk "Zapisz" jest disabled gdy `isSubmitting === true` lub są błędy walidacji
- Komunikaty błędów wyświetlane tylko dla pól które były edytowane (`touchedFields`)
- Pole `date` automatycznie focusowane gdy jest błąd submitowania

## 10. Obsługa błędów

### 10.1. Scenariusze błędów i ich obsługa

**1. Błąd walidacji pola formularza** (400 Bad Request):

- Wyświetlenie komunikatów błędów pod odpowiednimi polami
- Focus na pierwsze pole z błędem
- Komunikaty: Opis błędu dla każdego pola z `ErrorResponseDTO.details.issues`

**2. Błąd autoryzacji** (401 Unauthorized):

- Przekierowanie do `/login` lub wyświetlenie komunikatu o błędzie autoryzacji
- Komunikat: "Wymagane jest zalogowanie. Przekierowywanie..."
- Timeout i redirect po 2 sekundach

**3. Samochód nie istnieje** (404 Not Found):

- Przekierowanie do `/cars` z komunikatem błędu
- Komunikat: "Samochód nie został znaleziony"
- Timeout i redirect po 3 sekundach

**4. Błąd serwera** (500 Internal Server Error):

- Wyświetlenie ogólnego komunikatu o błędzie
- Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk "Zapisz" ponownie aktywny

**5. Timeout połączenia:**

- Wyświetlenie komunikatu o timeout
- Komunikat: "Przekroczono limit czasu połączenia. Spróbuj ponownie."
- Przycisk "Zapisz" ponownie aktywny

**6. Błąd sieci:**

- Wyświetlenie komunikatu o problemie z siecią
- Komunikat: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- Przycisk "Zapisz" ponownie aktywny

**7. Soft validation warnings:**

- Wyświetlenie ostrzeżeń w komponencie ValidationWarningsDisplay
- Ostrzeżenia nie blokują zapisania wpisu
- User może zignorować lub poprawić dane

## 11. Kroki implementacji

### Krok 1: Utworzenie custom hooka

1. **Utworzenie pliku** `src/lib/hooks/useNewFillupForm.ts`
2. **Implementacja interfejsów** stanu i błędów (NewFillupFormState, NewFillupFormErrors)
3. **Implementacja funkcji walidacji** (validateDate, validateFuelAmount, etc.)
4. **Implementacja funkcji obsługi** zdarzeń (handleFieldChange, handleFieldBlur, handleSubmit)
5. **Implementacja integracji API** (z timeout i error handling)
6. **Implementacja logiki przełączania** między trybami odometer/distance
7. **Testy jednostkowe** dla hooka

### Krok 2: Utworzenie komponentu NewFillupView

1. **Utworzenie pliku** `src/components/cars/NewFillupView.tsx`
2. **Implementacja struktury HTML** (formularz z polami)
3. **Podpięcie custom hooka** (useNewFillupForm)
4. **Implementacja Breadcrumbs** (nawigacja)
5. **Implementacja Inputów** (DateInput, FuelAmountInput, TotalPriceInput)
6. **Implementacja przełącznika** trybu (MileageModeToggle)
7. **Implementacja warunkowych pól** (OdometerInput, DistanceInput)
8. **Implementacja komponentu** ValidationWarningsDisplay
9. **Implementacja przycisków** akcji (FormActions)
10. **Dodanie accessibility** (aria-labels, sr-only, focus management)

### Krok 3: Utworzenie strony Astro

1. **Utworzenie pliku** `src/pages/cars/[carId]/fillups/new.astro`
2. **Implementacja layoutu** (Layout.astro)
3. **Wydobycie parametru carId** z URL
4. **Przekazanie carId** do komponentu NewFillupView
5. **Dodanie meta tags** (title, description)
6. **Dodanie redirect** dla nieprawidłowego carId

### Krok 4: Aktualizacja istniejących komponentów

1. **Sprawdzenie** czy istnieje przycisk "Dodaj tankowanie" w widoku listy tankowań
2. **Dodanie linku** do nowego widoku (jeśli nie istnieje)
3. **Aktualizacja Breadcrumbs** w widokach pokrewnych (jeśli potrzeba)

### Krok 5: Walidacja i debugowanie

1. **Testowanie scenariuszy** podstawowego przepływu
2. **Testowanie scenariuszy** z błędami walidacji
3. **Testowanie scenariuszy** z błędami API
4. **Testowanie** przełączania między trybami
5. **Testowanie** soft validation warnings
6. **Testowanie** accessibility (screen reader, keyboard navigation)

### Krok 6: Dokumentacja i optymalizacja

1. **Dodanie komentarzy** do kluczowych części kodu
2. **Optymalizacja walidacji** (performance)
3. **Sprawdzenie** zgodności z wzorcami projektowymi
4. **Przegląd kodu** (code review)
5. **Aktualizacja** dokumentacji API (jeśli potrzeba)

### Krok 7: Wdrożenie

1. **Testy na środowisku** testowym
2. **Sprawdzenie** integracji z istniejącymi widokami
3. **Sprawdzenie** responsywności (mobile-first)
4. **Sprawdzenie** performance (loading states, timeouts)
5. **Wdrożenie** na produkcję
