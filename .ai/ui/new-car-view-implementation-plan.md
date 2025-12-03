# Plan implementacji widoku: Formularz dodawania nowego samochodu

## 1. Przegląd

Widok formularza dodawania nowego samochodu jest kluczowym punktem wprowadzania użytkownika do aplikacji. Pozwala użytkownikowi dodać swój pierwszy lub kolejny samochód do konta poprzez wypełnienie prostego formularza z trzema polami: nazwą samochodu (wymagane), początkowym stanem licznika (opcjonalne) oraz preferencją wprowadzania przebiegu. Po zapisaniu, użytkownik jest przekierowywany do widoku listy samochodów, gdzie może zobaczyć nowo utworzony samochód.

Widok jest zbudowany przy użyciu React 19 w Astro 5, wykorzystuje komponenty z biblioteki Shadcn/ui, stylizację Tailwind 4 oraz integruje się z endpointem API `POST /api/cars` do utworzenia nowego samochodu w systemie.

## 2. Routing widoku

- **Ścieżka**: `/cars/new`
- **Plik**: `src/pages/cars/new.astro`
- **Komponent główny**: `NewCarFormView` (React, client:load)
- **Layout**: `Layout.astro` ze standardowymi meta-danymi

## 3. Struktura komponentów

```
Layout.astro
└── NewCarFormView (React - client:load)
    ├── Breadcrumbs
    ├── FormContainer
    │   ├── FormField: Name (input text)
    │   ├── FormField: Initial Odometer (input number, optional)
    │   ├── FormField: Mileage Input Preference (select: odometer/distance)
    │   ├── ErrorMessage (conditional)
    │   └── FormActions
    │       ├── Button: Save (submit)
    │       └── Button: Cancel (navigation)
```

**Komponenty do utworzenia**:

- `NewCarFormView` - główny komponent widoku zarządzający stanem formularza i integracją z API
- Lokalne komponenty formularza (opcjonalnie można rozbić na osobne komponenty)

**Komponenty istniejące do wykorzystania**:

- `Button` z `@/components/ui/button`
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` z `@/components/ui/select`

## 4. Szczegóły komponentów

### NewCarFormView

**Opis**: Główny komponent React zarządzający formularzem dodawania nowego samochodu. Obsługuje stan formularza, walidację, integrację z API, obsługę błędów oraz nawigację.

**Główne elementy HTML i komponenty dzieci**:

- Sekcja breadcrumbs (nav)
- Nagłówek strony (h1)
- Formularz (`<form>`) z elementami:
  - Input pola tekstowego dla nazwy samochodu
  - Input pola numerycznego dla początkowego stanu licznika (opcjonalne)
  - Select dropdown dla preferencji wprowadzania przebiegu
  - Komunikaty błędów walidacji (conditionally rendered)
  - Sekcja przycisków akcji (Zapisz, Anuluj)

**Obsługiwane zdarzenia**:

- `onSubmit` - obsługa wysłania formularza z walidacją i wywołaniem API
- `onChange` dla każdego pola - aktualizacja stanu i walidacja w czasie rzeczywistym
- `onBlur` dla pól wymaganych - dodatkowa walidacja po opuszczeniu pola
- `onCancel` - anulowanie i nawigacja powrotna do listy samochodów

**Obsługiwana walidacja**:

- **Nazwa samochodu**:
  - Wymagane (nie może być puste)
  - Trimowanie białych znaków
  - Długość: 1-100 znaków
  - Unikalność na poziomie użytkownika (weryfikacja przez API - zwraca 409 Conflict)
- **Początkowy stan licznika**:
  - Opcjonalne (może być puste)
  - Musi być liczbą całkowitą >= 0 jeśli podane
  - Tylko cyfry
- **Preferencja wprowadzania przebiegu**:
  - Wymagane
  - Enum: "odometer" | "distance"
  - Domyślna wartość: "odometer"

**Typy**:

- Wykorzystuje: `CreateCarCommand` (typ request body), `CarDetailsDTO` (typ success response), `ErrorResponseDTO` (typ error responses) z `src/types.ts`
- Lokalny ViewModel dla formularza: `NewCarFormState` (interfejs opisujący stan formularza przed submit)

**Propsy**: Komponent nie przyjmuje propsów - jest kontenerem widoku

### Breadcrumbs

**Opis**: Element nawigacyjny pokazujący ścieżkę w hierarchii aplikacji. Umożliwia powrót do listy samochodów.

**Główne elementy**:

- Link do "/" (Strona główna)
- Separator "/"
- Link do "/cars" (Samochody)
- Separator "/"
- Tekst "Nowy samochód" (current page)

**Obsługiwane zdarzenia**: `onClick` na linkach do nawigacji

## 5. Typy

### Wykorzystywane z API

**Request (do API)**:

```typescript
CreateCarCommand {
  name: string;              // 1-100 znaków, trimmed, required
  initial_odometer?: number;  // >= 0, integer, optional
  mileage_input_preference: "odometer" | "distance"; // required enum
}
```

**Response - Success (201 Created)**:

```typescript
CarDetailsDTO {
  id: string;                // UUID
  name: string;
  initial_odometer: number | null;
  mileage_input_preference: "odometer" | "distance";
  created_at: string;        // ISO 8601 timestamp
  statistics: {
    total_fuel_cost: 0;
    total_fuel_amount: 0;
    total_distance: 0;
    average_consumption: 0;
    average_price_per_liter: 0;
    fillup_count: 0;
  };
}
```

**Response - Error (400/401/409/500)**:

```typescript
ErrorResponseDTO {
  error: {
    code: "BAD_REQUEST" | "UNAUTHORIZED" | "CONFLICT" | "INTERNAL_ERROR";
    message: string;
    details?: Record<string, string>;
  };
}
```

### Nowe typy lokalne dla widoku

**NewCarFormState**:

```typescript
interface NewCarFormState {
  name: string;
  initialOdometer: string; // string bo może być puste
  mileageInputPreference: 'odometer' | 'distance';
}
```

**NewCarFormErrors**:

```typescript
interface NewCarFormErrors {
  name?: string;
  initialOdometer?: string;
  mileageInputPreference?: string;
  submit?: string; // Ogólny błąd z API
}
```

**useNewCarForm hooks return type**:

```typescript
interface UseNewCarFormReturn {
  formState: NewCarFormState;
  formErrors: NewCarFormErrors;
  isSubmitting: boolean;
  handleFieldChange: (field: keyof NewCarFormState, value: string) => void;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  handleCancel: () => void;
  validateField: (field: keyof NewCarFormState) => boolean;
}
```

## 6. Zarządzanie stanem

Komponent `NewCarFormView` zarządza stanem lokalnym przy użyciu hooka `useState`. Dodatkowo, można utworzyć customowy hook `useNewCarForm` do enkapsulacji logiki formularza i zarządzania stanem.

**Zmienne stanu**:

- `formState: NewCarFormState` - aktualne wartości pól formularza
- `formErrors: NewCarFormErrors` - błędy walidacji dla każdego pola
- `isSubmitting: boolean` - czy formularz jest w trakcie submitu (disable buttons)
- `touchedFields: Set<keyof NewCarFormState>` - które pola były edytowane (do conditional error display)

**Customowy hook: `useNewCarForm`**:

- **Cel**: Oddzielenie logiki formularza od prezentacji, ponowna używalność, łatwiejsze testowanie
- **Funkcjonalność**:
  - Zarządzanie stanem formularza
  - Walidacja pól po zmianie (onChange)
  - Walidacja pól po opuszczeniu (onBlur)
  - Obsługa wysłania formularza
  - Integracja z API (POST /api/cars)
  - Obsługa odpowiedzi sukcesu (nawigacja do /cars)
  - Obsługa błędów (mapowanie na komunikaty użytkownika)
- **Pola zwracane**:
  - `formState`, `formErrors`, `isSubmitting`
  - `handleFieldChange`, `handleSubmit`, `handleCancel`
  - `validateField`, `validateAllFields`

## 7. Integracja API

**Endpoint**: `POST /api/cars`

**Request headers**:

- `Authorization: Bearer {token}` (pobrany z localStorage lub cookies)
- `Content-Type: application/json`

**Request body** (CreateCarCommand):

```json
{
  "name": "string (trimmed, 1-100 chars)",
  "initial_odometer": "number? (>= 0, integer)",
  "mileage_input_preference": "odometer" | "distance"
}
```

**Response sukcesu (201 Created)**:

```json
{
  "id": "uuid",
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-10-17T12:00:00Z",
  "statistics": {
    /* zeroed stats */
  }
}
```

**Response błędów**:

- **400 Bad Request**: Niepoprawne dane formularza - walidacja field-level
- **401 Unauthorized**: Brak/niepoprawny token - przekierowanie do logowania
- **409 Conflict**: Nazwa samochodu już istnieje - wyświetlenie błędu pod polem name
- **500 Internal Server Error**: Błąd serwera - ogólny komunikat o błędzie

**Implementacja fetch**:

```typescript
const response = await fetch('/api/cars', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: formState.name.trim(),
    initial_odometer: formState.initialOdometer ? parseInt(formState.initialOdometer) : undefined,
    mileage_input_preference: formState.mileageInputPreference,
  }),
});
```

## 8. Interakcje użytkownika

### 8.1. Wypełnianie formularza

1. **Użytkownik wpisuje nazwę samochodu**:
   - Pole jest wymagane
   - Walidacja w czasie rzeczywistym: wyświetlenie błędu jeśli puste po opuszczeniu pola
   - Limity: 1-100 znaków
   - Trimowanie białych znaków na początku i końcu
   - **Oczekiwany wynik**: Brak błędu walidacji przy poprawnych danych

2. **Użytkownik wprowadza stan licznika** (opcjonalne):
   - Pole opcjonalne, może pozostać puste
   - Tylko cyfry (numer typu)
   - > = 0 jeśli podane
   - **Oczekiwany wynik**: Pusty lub poprawna liczba, brak błędu

3. **Użytkownik wybiera preferencję wprowadzania przebiegu**:
   - Wymagane, default: "odometer"
   - Opcje: "odometer" (stan licznika) lub "distance" (przejechany dystans)
   - **Oczekiwany wynik**: Wybrana opcja zapamiętana w stanie

### 8.2. Submitujanie formularza

1. **Użytkownik klika "Zapisz"**:
   - Walidacja wszystkich pól przed wysłaniem
   - Jeśli błędy: wyświetlenie komunikatów, focus na pierwsze pole z błędem
   - Jeśli OK: disable przycisku, wyświetlenie loading state, wywołanie API
   - **Oczekiwany wynik**: Nowy samochód utworzony, przekierowanie do /cars

2. **Użytkownik klika "Anuluj"**:
   - Nawigacja do /cars (lista samochodów)
   - **Oczekiwany wynik**: Powrót do listy samochodów bez zapisywania

### 8.3. Obsługa błędów

1. **Błąd 400 Bad Request**:
   - Mapowanie na błędy field-level
   - Focus na pierwsze pole z błędem
   - **Oczekiwany wynik**: Komunikaty błędów przy odpowiednich polach

2. **Błąd 401 Unauthorized**:
   - Przekierowanie do /login
   - **Oczekiwany wynik**: Użytkownik przekierowany do logowania

3. **Błąd 409 Conflict** (nazwa już istnieje):
   - Wyświetlenie błędu pod polem "name"
   - Automatyczny focus na pole "name"
   - Możliwość poprawy i ponownego zapisu
   - **Oczekiwany wynik**: Użytkownik widzi komunikat, może zmienić nazwę

4. **Błąd 500 Internal Server Error**:
   - Wyświetlenie ogólnego komunikatu o błędzie
   - **Oczekiwany wynik**: Użytkownik informowany o problemie serwera

## 9. Warunki i walidacja

### 9.1. Walidacja po stronie frontend

**Nazwa samochodu** (pole: `name`):

- Wymagane: nie może być puste ani zawierać samych białych znaków
- Długość: po trimowaniu 1-100 znaków
- Trimowanie: usunięcie białych znaków na początku i końcu przed walidacją
- Walidacja: po onBlur (opuszczenie pola) oraz przed submit
- **Komponent odpowiedzialny**: Input w formularzu
- **Komunikat błędu**: "Nazwa jest wymagana" lub "Nazwa musi mieć od 1 do 100 znaków"

**Początkowy stan licznika** (pole: `initialOdometer`):

- Opcjonalne: może być puste
- Format: jeśli podane, musi być liczbą całkowitą >= 0
- Walidacja: po onBlur oraz przed submit
- **Komponent odpowiedzialny**: Input w formularzu
- **Komunikat błędu**: "Stan licznika musi być liczbą większą lub równą 0"

**Preferencja wprowadzania przebiegu** (pole: `mileageInputPreference`):

- Wymagane: musi być wybrana opcja z enum
- Domyślna wartość: "odometer"
- Walidacja: przed submit
- **Komponent odpowiedzialny**: Select dropdown
- **Komunikat błędu**: "Wybierz preferencję wprowadzania przebiegu"

### 9.2. Walidacja po stronie API

API wraca do walidacji na backend (endpoint implementuje walidację przez Zod schema):

- `createCarCommandSchema` z `src/lib/validation/cars.ts`
- Nazwa: trim().min(1).max(100)
- Stan licznika: int().nonnegative().optional()
- Preferencja: enum(["odometer", "distance"])

**Mapowanie błędów API na UI**:

- 400 Bad Request: szczegółowe komunikaty walidacji zwracane w `details.issues` mapowane na field-level errors
- 409 Conflict: błąd pod polem "name" - "Samochód o tej nazwie już istnieje"

### 9.3. Warunki wymagane dla poprawnego wysłania

**Warunki przed submitują**:

1. Pole "name" nie jest puste i ma 1-100 znaków po trimowaniu
2. Pole "initialOdometer" jest puste LUB jest liczbą >= 0
3. Pole "mileageInputPreference" ma wybraną wartość "odometer" lub "distance"
4. Użytkownik jest zalogowany (token auth dostępny)
5. Nie ma aktywnych błędów walidacji

**Impact na stan formularza**:

- Przycisk "Zapisz" jest disabled gdy `isSubmitting === true` lub są błędy walidacji
- Komunikaty błędów wyświetlane tylko dla pól które były edytowane (`touchedFields`)
- Pole "name" automatycznie focusowane gdy jest błąd 409 Conflict

## 10. Obsługa błędów

### 10.1. Scenariusze błędów i ich obsługa

**1. Błąd walidacji pola formularza** (400 Bad Request):

- Wyświetlenie komunikatów błędów pod odpowiednimi polami
- Focus na pierwsze pole z błędem
- **Komunikaty**: Opis błędu dla każdego pola z `ErrorResponseDTO.details.issues`

**2. Błąd autoryzacji** (401 Unauthorized):

- Przekierowanie do `/login` lub wyświetlenie komunikatu o błędzie autoryzacji
- **Komunikat**: "Wymagane jest zalogowanie. Przekierowywanie..."

**3. Konflikt nazwy** (409 Conflict):

- Wyświetlenie błędu bezpośrednio pod polem "name"
- Automatyczny focus na pole "name"
- Komunikat: "Samochód o tej nazwie już istnieje. Wybierz inną nazwę."
- Użytkownik może poprawić nazwę i ponownie wysłać

**4. Błąd serwera** (500 Internal Server Error):

- Wyświetlenie ogólnego komunikatu o błędzie
- Komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później."
- Przycisk "Zapisz" ponownie aktywny po błędzie

**5. Błąd sieci** (network error, timeout):

- Wyświetlenie komunikatu o problemie z połączeniem
- Komunikat: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
- Opcja retry (ponowne wysłanie formularza)

**6. Timeout podczas ładowania**:

- If request > 10s, timeout i błąd
- Komunikat: "Przekroczono limit czasu połączenia. Spróbuj ponownie."

### 10.2. Transitions i loading states

- **Submitting state**: Disable przyciski, wyświetlenie "Zapisywanie..." na przycisku
- **Success state**: Przekierowanie do `/cars` (lista samochodów)
- **Error state**: Wyświetlenie komunikatów błędów, re-enable przyciski

## 11. Kroki implementacji

### Krok 1: Utworzenie strony Astro

- Utwórz plik `src/pages/cars/new.astro`
- Import Layout z `../layouts/Layout.astro`
- Import komponentu `NewCarFormView` (React, client:load)
- Ustaw meta-dane (title, description)
- Dodaj strukturę HTML z kontenerem

### Krok 2: Utworzenie customowego hooka zarządzania formularzem

- Utwórz plik `src/lib/hooks/useNewCarForm.ts`
- Zdefiniuj typy: `NewCarFormState`, `NewCarFormErrors`, `UseNewCarFormReturn`
- Zaimplementuj hook z:
  - `useState` dla formState, formErrors, isSubmitting, touchedFields
  - `handleFieldChange` - aktualizacja pola i walidacja
  - `validateField` - walidacja pojedynczego pola
  - `validateAllFields` - walidacja wszystkich pól
  - `handleSubmit` - obsługa wysłania z wywołaniem API
  - `handleCancel` - nawigacja do /cars
- Zwróć wszystkie funkcje i stan potrzebne do UI

### Krok 3: Utworzenie głównego komponentu React

- Utwórz plik `src/components/cars/NewCarFormView.tsx`
- Import hooka `useNewCarForm`
- Import komponentów UI: `Button`, `Select`, etc.
- Zbuduj strukturę HTML z breadcrumbs, formularzem i polami
- Podłącz zdarzenia: onChange, onBlur, onSubmit
- Wyświetl komunikaty błędów conditionally
- Style Tailwind dla responsywności

### Krok 4: Implementacja walidacji

- W hooku `useNewCarForm`:
  - Zaimplementuj `validateName`: trim, min 1, max 100 znaków
  - Zaimplementuj `validateInitialOdometer`: optional, >= 0 jeśli podane
  - Zaimplementuj `validateMileagePreference`: enum check
- Walidacja po onChange dla wszystkich pól
- Walidacja po onBlur dla pól wymaganych
- Walidacja wszystkich pól przed submit

### Krok 5: Implementacja integracji z API

- W hooku `useNewCarForm`, funkcja `handleSubmit`:
  - Pobierz token z localStorage lub cookies
  - Waliduj wszystkie pola przed wysłaniem
  - Jeśli błędy walidacji: wyświetl i focus na pierwsze pole
  - Jeśli OK: wywołaj `fetch('/api/cars', { method: 'POST', ... })`
  - Obsłuż odpowiedzi 201/400/401/409/500
  - Przekieruj do `/cars` po sukcesie
  - Wyświetl błędy po błędach

### Krok 6: Obsługa błędów

- Mapowanie odpowiedzi API na komunikaty użytkownika (error.code → message)
- Wyświetlanie błędów field-level dla 400
- Wyświetlanie błędu 409 pod polem "name" z auto-focus
- Obsługa 401 (redirect) i 500 (ogólny komunikat)
- Obsługa network errors i timeouts

### Krok 7: Breadcrumbs i nawigacja

- Dodaj komponent breadcrumbs do widoku
- Styluj breadcrumbs zgodnie z `CarsListHeader`
- Implementacja nawigacji onclick: / → /cars → (current)
- Implementacja nawigacji na "Anuluj" → /cars

### Krok 8: Stylowanie i responsywność

- Stwórz layout formularza zgodny z aplikacją (mobile-first)
- Styl pól formularza: label, input, select
- Styl komunikatów błędów
- Styl przycisków (Zapisz, Anuluj)
- Responsywność: flex-col na mobile, flex-row na desktop
- Dark mode support (Tailwind dark:)

### Krok 9: Dostępność (a11y)

- Dodaj `aria-label` dla pól formularza
- Dodaj `aria-required` dla pól wymaganych
- Dodaj `aria-invalid` gdy pole ma błąd walidacji
- Dodaj `aria-describedby` dla komunikatów błędów
- Focus management: auto-focus pierwszego pola z błędem
- Keyboard navigation: tab order, enter submit formularza

### Krok 10: Testowanie

- Test ręczny: wszystkie pola, walidacja, submit, błędy
- Test z pustym formularzem: czy przycisk zapisu jest disabled
- Test z niepoprawnymi danymi: czy pokazują się błędy
- Test konfliktu nazwy: czy błąd 409 jest obsłużony
- Test nawigacji: czy anulowanie prowadzi do /cars
- Test responsywności: mobile/tablet/desktop

### Krok 11: Integracja z istniejącymi komponentami

- Upewnij się że routing z `/cars` do `/cars/new` działa (przycisk "Dodaj samochód")
- Upewnij się że po utworzeniu, użytkownik jest przekierowany i widzi nowy samochód na liście
- Sprawdź że token auth jest przekazywany poprawnie

### Krok 12: Dokumentacja i konsystencja

- Sprawdź zgodność z design systemem (Tailwind + Shadcn/ui)
- Sprawdź zgodność z architekturą aplikacji (Astro + React patterns)
- Upewnij się że komunikaty błędów są w języku polskim
- Upewnij się że kod jest zgodny z linting rules
