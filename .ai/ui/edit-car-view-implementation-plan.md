# Plan implementacji widoku: Edycja Samochodu

## 1. Przegląd

Widok edycji samochodu (`/cars/{carId}/edit`) to dedykowana strona pozwalająca użytkownikowi na modyfikację danych samochodu. Widok jest dostępny jako pełnoekranowy formularz z pre-wypełnionymi danymi, umożliwiający edycję nazwy samochodu oraz preferencji wprowadzania przebiegu. Implementacja jest spójna z istniejącym widokiem dodawania nowego samochodu, zapewniając intuicyjne doświadczenie użytkownika. Widok obsługuje pełną walidację danych, prezentuje komunikaty błędów zgodnie z odpowiedziami API oraz zapewnia sprawne nawigowanie po aplikacji.

## 2. Routing widoku

Widok będzie dostępny pod ścieżką:

- **Ścieżka:** `/cars/[carId]/edit.astro`
- **Route parameter:** `carId` - UUID identyfikator samochodu
- **Metoda dostępu:** Użytkownik może dostać się do widoku poprzez link z widoku szczegółów samochodu lub bezpośrednie wpisanie URL

## 3. Struktura komponentów

```
EditCarView (React Component)
├── Breadcrumbs (Komponent nawigacji)
│   ├── "Strona główna" (link)
│   ├── "Samochody" (link do listy)
│   ├── [Nazwa samochodu] (link do szczegółów)
│   └── "Edycja" (aktywny element)
├── Header (Nagłówek strony)
│   ├── Tytuł: "Edytuj samochód"
│   └── Opis: "Zmodyfikuj dane samochodu"
└── EditCarForm (Główny formularz)
    ├── Pole: Nazwa samochodu
    │   ├── Input (pre-wypełniony)
    │   ├── Label
    │   └── Message (komunikat błędu, jeśli istnieje)
    ├── Pole: Preferencja wprowadzania przebiegu
    │   ├── Select (pre-wypełniony)
    │   ├── Label
    │   └── Message (komunikat błędu, jeśli istnieje)
    ├── Globalne komunikaty błędów (jeśli istnieją)
    └── Akcje formularza
        ├── Przycisk "Zapisz"
        └── Przycisk "Anuluj"
```

## 4. Szczegóły komponentów

### EditCarView (Główny komponent widoku)

**Opis komponentu:** Główny komponent React renderujący pełnoekranowy widok edycji samochodu. Zawiera nawigację breadcrumbs, nagłówek z opisem oraz formularz edycji. Komponent wykorzystuje custom hook `useEditCarForm` do zarządzania stanem formularza, walidacją oraz komunikacją z API.

**Główne elementy:**

- Breadcrumbs z nawigacją: Strona główna → Samochody → [Nazwa samochodu] → Edycja
- Nagłówek sekcji z tytułem i opisem
- Formularz edycji z polami: nazwa, preferencja wprowadzania przebiegu
- Komunikaty błędów walidacji (pole-specyficzne oraz globalne)
- Przyciski akcji: Zapisz i Anuluj
- Stan ładowania podczas zapisywania

**Obsługiwane interakcje:**

- `handleSubmit` - wysłanie formularza z walidacją i zapis zmian do API
- `handleCancel` - anulowanie edycji i powrót do szczegółów samochodu
- `handleFieldChange` - zmiana wartości pól z walidacją w czasie rzeczywistym
- `handleFieldBlur` - dodatkowa walidacja po opuszczeniu pola
- Nawigacja przez breadcrumbs do różnych poziomów aplikacji

**Obsługiwana walidacja:**

1. **Nazwa samochodu:**
   - Pole wymagane (nie może być puste)
   - Maksymalnie 100 znaków
   - Po przycięciu białych znaków minimalnie 1 znak
   - Sprawdzenie unikalności nazwy względem innych samochodów użytkownika

2. **Preferencja wprowadzania przebiegu:**
   - Pole wymagane
   - Wartość musi być jednym z: "odometer" lub "distance"
   - Walidacja po stronie API

3. **Walidacja globalna:**
   - Wymagane podanie przynajmniej jednego pola do aktualizacji
   - Sprawdzenie autoryzacji użytkownika
   - Sprawdzenie przynależności samochodu do użytkownika

**Typy:**

- `CarDetailsDTO` - dane samochodu otrzymane z API przy ładowaniu widoku
- `UpdateCarCommand` - dane do aktualizacji wysyłane do API
- `EditCarFormState` - stan formularza (nazwa, preferencja)
- `EditCarFormErrors` - błędy walidacji formularza
- `ErrorResponseDTO` - format błędów z API

**Props:**

- `carId: string` - identyfikator edytowanego samochodu (przekazywany z Astro)

### Breadcrumbs (Komponent nawigacji)

**Opis komponentu:** Komponent nawigacji breadcrumbs pokazujący ścieżkę: Strona główna → Samochody → [Nazwa samochodu] → Edycja. Każdy element oprócz aktywnego jest klikalnym linkiem umożliwiającym nawigację do danego poziomu.

**Główne elementy:**

- Ikona domu dla "Strona główna"
- Tekst "Strona główna" (klikalny link)
- Separator "/"
- Tekst "Samochody" (klikalny link)
- Separator "/"
- Nazwa samochodu (klikalny link)
- Separator "/"
- Tekst "Edycja" (aktywny element, nie klikalny)

**Obsługiwane zdarzenia:**

- Kliknięcie w "Strona główna" - nawigacja do `/`
- Kliknięcie w "Samochody" - nawigacja do `/cars`
- Kliknięcie w nazwę samochodu - nawigacja do `/cars/{carId}`

**Typy:**

- `carName: string` - nazwa edytowanego samochodu

**Props:**

- `carName: string` - nazwa samochodu do wyświetlenia w breadcrumbs

### EditCarForm (Formularz edycji)

**Opis komponentu:** Formularz zawierający pola edycji samochodu: nazwę oraz preferencję wprowadzania przebiegu. Formularz jest pre-wypełniony aktualnymi danymi samochodu i obsługuje walidację w czasie rzeczywistym oraz obsługę błędów z API.

**Główne elementy:**

- Input field dla nazwy samochodu (wymagany, pre-wypełniony)
- Select field dla preferencji wprowadzania przebiegu (wymagany, pre-wypełniony)
- Sekcja z komunikatami błędów pola-specyficznymi
- Sekcja z globalnymi komunikatami błędów
- Przyciski akcji: "Zapisz" (primary) i "Anuluj" (outline)

**Obsługiwane zdarzenia:**

- `onSubmit` - wysłanie formularza z walidacją i zapis do API
- `onChange` dla pól input - zmiana wartości z walidacją
- `onBlur` dla pól input - dodatkowa walidacja po opuszczeniu pola
- `onCancel` - anulowanie edycji i powrót do szczegółów samochodu

**Obsługiwana walidacja:**

- Walidacja nazwy (wymagane, max 100 znaków, unikalność)
- Walidacja preferencji (wymagane, enum)
- Walidacja przynajmniej jednego zmienionego pola

**Typy:**

- `EditCarFormState` - stan formularza
- `EditCarFormErrors` - błędy formularza
- `UpdateCarCommand` - dane do wysłania do API

**Props:**

- `formState: EditCarFormState` - aktualny stan formularza
- `formErrors: EditCarFormErrors` - błędy walidacji
- `isSubmitting: boolean` - stan ładowania
- `touchedFields: Set<string>` - zbiór dotkniętych pól
- `carName: string` - nazwa samochodu do wyświetlenia w komunikacie
- `onFieldChange: (field: string, value: string) => void` - handler zmiany pola
- `onFieldBlur: (field: string) => void` - handler blur pola
- `onSubmit: (e: React.FormEvent) => void` - handler wysłania
- `onCancel: () => void` - handler anulowania

### useEditCarForm (Custom hook)

**Opis komponentu:** Custom hook zarządzający stanem formularza edycji samochodu, walidacją pól, obsługą błędów oraz komunikacją z API. Hook inicjuje się danymi samochodu otrzymanymi z API, zarządza walidacją w czasie rzeczywistym, obsługuje wysyłanie żądania PATCH do API oraz nawigację po sukcesie.

**Stan hooka:**

- `formState` - stan formularza (nazwa, preferencja)
- `formErrors` - błędy walidacji dla poszczególnych pól
- `isSubmitting` - stan ładowania podczas wysyłania żądania
- `touchedFields` - zbiór dotkniętych pól do decyzji o wyświetleniu błędów
- `originalCarData` - oryginalne dane samochodu do porównania zmian

**Obsługiwane akcje:**

- `handleFieldChange` - zmiana wartości pola z walidacją
- `handleFieldBlur` - walidacja po opuszczeniu pola
- `handleSubmit` - wysłanie formularza z pełną walidacją i obsługą błędów
- `handleCancel` - anulowanie edycji i powrót
- `validateField` - walidacja pojedynczego pola
- `validateAllFields` - walidacja wszystkich pól

**Obsługiwane warunki:**

- Sprawdzenie czy użytkownik wprowadził jakieś zmiany
- Walidacja nazwy (wymagane, długość, unikalność)
- Walidacja preferencji (wymagane, enum)
- Obsługa różnych kodów błędów z API (400, 401, 404, 409, 500)
- Timeout żądań (10 sekund)
- Autofocus na pierwszym polu po załadowaniu

**Typy:**

- Input: `carId: string` - identyfikator samochodu
- Output: Obiekt zawierający stan formularza, błędy, handlery, oraz ref do inputa

## 5. Typy

### UpdateCarCommand (Request DTO)

```typescript
type UpdateCarCommand = Partial<Pick<Car, 'name' | 'mileage_input_preference'>>;
```

**Opis:** Typ przedstawiający dane żądania aktualizacji samochodu. Wszystkie pola są opcjonalne - podaje się tylko te, które mają zostać zaktualizowane.

**Pola:**

- `name?: string` - nowa nazwa samochodu (opcjonalne)
- `mileage_input_preference?: "odometer" | "distance"` - nowa preferencja wprowadzania przebiegu (opcjonalne)

**Walidacja (po stronie API):**

- Wymagane podanie przynajmniej jednego pola
- `name`: string, po trim min 1 znak, max 100 znaków
- `mileage_input_preference`: musi być jednym z "odometer" lub "distance"
- Nazwa musi być unikalna dla danego użytkownika

### CarDetailsDTO (Response DTO)

```typescript
type CarDetailsDTO = CarWithStatisticsDTO & { created_at: string };
```

**Opis:** Typ danych zwracanych przez API przy pobieraniu szczegółów samochodu. Zawiera wszystkie dane samochodu wraz ze statystykami oraz datą utworzenia.

**Pola:**

- `id: string` - identyfikator samochodu (UUID)
- `name: string` - nazwa samochodu
- `initial_odometer: number | null` - początkowy stan licznika
- `mileage_input_preference: "odometer" | "distance"` - preferencja wprowadzania przebiegu
- `created_at: string` - data utworzenia (ISO 8601)
- `statistics: { ... }` - obiekt ze statystykami (całkowity koszt, paliwo, dystans, średnie spalanie, cena za litr, liczba tankowań)

### EditCarFormState (ViewModel)

```typescript
interface EditCarFormState {
  name: string;
  mileageInputPreference: 'odometer' | 'distance';
}
```

**Opis:** Stan formularza edycji samochodu zarządzany przez hook `useEditCarForm`. Zawiera aktualne wartości pól formularza.

**Pola:**

- `name: string` - aktualna wartość pola nazwy samochodu
- `mileageInputPreference: "odometer" | "distance"` - aktualna wartość preferencji wprowadzania przebiegu

### EditCarFormErrors (ViewModel)

```typescript
interface EditCarFormErrors {
  name?: string;
  mileageInputPreference?: string;
  submit?: string;
}
```

**Opis:** Błędy walidacji formularza edycji. Każde pole może mieć własny komunikat błędu, istnieje również globalny komunikat błędu dla całego formularza (submit).

**Pola:**

- `name?: string` - komunikat błędu dla pola nazwy
- `mileageInputPreference?: string` - komunikat błędu dla pola preferencji
- `submit?: string` - globalny komunikat błędu dla formularza

### ErrorResponseDTO

```typescript
interface ErrorResponseDTO {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
}
```

**Opis:** Standardowy format odpowiedzi błędów z API. Używany do obsługi błędów z endpointu PATCH `/api/cars/{carId}`.

**Pola:**

- `error.code: string` - kod błędu (np. "VALIDATION_ERROR", "CONFLICT")
- `error.message: string` - czytelny komunikat błędu
- `error.details?: Record<string, string>` - dodatkowe szczegóły błędu (opcjonalne)

## 6. Zarządzanie stanem

Stan w widoku edycji samochodu jest zarządzany przez custom hook `useEditCarForm`, który enkapsuluje całą logikę formularza. Hook jest odpowiedzialny za:

1. **Stan formularza (`formState`)**: Przechowuje aktualne wartości pól formularza (nazwa, preferencja)
2. **Błędy walidacji (`formErrors`)**: Przechowuje komunikaty błędów dla poszczególnych pól oraz globalne błędy formularza
3. **Stan ładowania (`isSubmitting`)**: Wskazuje czy trwa wysyłanie żądania do API
4. **Dotknięte pola (`touchedFields`)**: Zbiór pól, które zostały dotknięte przez użytkownika - używany do decyzji o wyświetleniu komunikatów błędów
5. **Oryginalne dane (`originalCarData`)**: Referencja do oryginalnych danych samochodu używana do wykrywania zmian

Hook zapewnia funkcje pomocnicze dla:

- Zmiany wartości pól (`handleFieldChange`) z walidacją w czasie rzeczywistym
- Walidacji po opuszczeniu pola (`handleFieldBlur`)
- Walidacji wszystkich pól (`validateAllFields`)
- Wysłania formularza (`handleSubmit`) z pełną walidacją i obsługą błędów z API
- Anulowania edycji (`handleCancel`) z nawigacją do szczegółów samochodu
- Timeout dla żądań (10 sekund) z właściwą obsługą błędów timeout

## 7. Integracja API

Widok edycji samochodu komunikuje się z API poprzez endpoint `PATCH /api/cars/{carId}`. Integracja jest realizowana wewnątrz hooka `useEditCarForm` w funkcji `handleSubmit`.

### Typ żądania (Request)

**Endpoint:** `PATCH /api/cars/{carId}`

**Headers:**

```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**

```typescript
{
  name?: string,
  mileage_input_preference?: "odometer" | "distance"
}
```

**Obsługa:**

- Hook pobiera token autoryzacji z localStorage lub cookies
- Przygotowuje body zawierające tylko zmienione pola
- Wysyła żądanie z timeout 10 sekund
- Obsługuje różne kody błędów (400, 401, 404, 409, 500) z odpowiednimi komunikatami

### Typ odpowiedzi (Response)

**Success (200 OK):**

```json
{
  "id": "uuid",
  "name": "My Updated Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "distance",
  "created_at": "2025-10-17T12:00:00Z",
  "statistics": { ... }
}
```

**Error Responses:**

- **400 Bad Request**: Błędy walidacji danych
- **401 Unauthorized**: Nieprawidłowy lub wygasły token
- **404 Not Found**: Samochód nie znaleziony lub nie należy do użytkownika
- **409 Conflict**: Nazwa samochodu już istnieje
- **500 Internal Server Error**: Błąd serwera

**Obsługa:**

- Po sukcesie następuje nawigacja do szczegółów samochodu (`/cars/{carId}`)
- Po błędzie wyświetlane są odpowiednie komunikaty w formularzu
- Błędy 401 powodują przekierowanie do strony logowania

## 8. Interakcje użytkownika

### Wprowadzanie tekstu w pola formularza

**Akcja:** Użytkownik wprowadza tekst w pole "Nazwa samochodu"

**Obsługa:**

1. Wartość pola jest aktualizowana w stanie (`handleFieldChange`)
2. Pole jest oznaczone jako "dotknięte" (`touchedFields`)
3. W przypadku wcześniejszego błędu, komunikat błędu jest czyszczony
4. Jeśli pole zostało wcześniej dotknięte, uruchamiana jest walidacja w czasie rzeczywistym (deferowana do następnego ticka)
5. Zmiana wartości preferencji w select działa analogicznie

### Opuszczenie pola (Blur)

**Akcja:** Użytkownik opuszcza pole formularza

**Obsługa:**

1. Pole jest oznaczone jako "dotknięte"
2. Wykonywana jest pełna walidacja pola
3. Jeśli wystąpi błąd, komunikat błędu jest wyświetlany pod polem
4. Pole z błędem otrzymuje czerwoną ramkę (`border-destructive`)

### Wysłanie formularza

**Akcja:** Użytkownik klika przycisk "Zapisz" lub naciska Enter w polu formularza

**Obsługa:**

1. Formularz jest walidowany przed wysłaniem (`validateAllFields`)
2. W przypadku błędów walidacji, pierwsze niepoprawne pole otrzymuje focus
3. Wyświetlane są komunikaty błędów pod odpowiednimi polami
4. Przycisk "Zapisz" jest wyłączony podczas wysyłania żądania
5. Wyświetlany jest tekst "Zapisywanie..." na przycisku
6. Po sukcesie następuje krótkie opóźnienie (300ms) i nawigacja do szczegółów samochodu
7. Po błędzie wyświetlane są komunikaty błędów (pole-specyficzne lub globalne)

### Anulowanie edycji

**Akcja:** Użytkownik klika przycisk "Anuluj" lub breadcrumb "Samochody" / nazwa samochodu

**Obsługa:**

1. Następuje natychmiastowa nawigacja do szczegółów samochodu (`/cars/{carId}`)
2. Wprowadzone zmiany w formularzu są tracone (bez zapisywania)
3. Przycisk "Anuluj" może być wyłączony podczas wysyłania żądania

### Nawigacja przez breadcrumbs

**Akcja:** Użytkownik klika elementy breadcrumbs

**Obsługa:**

1. "Strona główna" → nawigacja do `/`
2. "Samochody" → nawigacja do `/cars`
3. Nazwa samochodu → nawigacja do `/cars/{carId}`

## 9. Warunki i walidacja

### Walidacja po stronie klienta

1. **Nazwa samochodu:**
   - Warunek: Pole musi być wypełnione
   - Walidacja: Po trim() minimalnie 1 znak
   - Warunek: Pole nie może przekraczać 100 znaków
   - Walidacja: Sprawdzenie długości po trim()
   - Obsługa: Komunikat błędu pod polem, czerwona ramka

2. **Preferencja wprowadzania przebiegu:**
   - Warunek: Pole musi być wypełnione
   - Walidacja: Wartość musi być jednym z "odometer" lub "distance"
   - Obsługa: Komunikat błędu pod polem, czerwona ramka

3. **Wymaganie co najmniej jednej zmiany:**
   - Warunek: Co najmniej jedno pole musi być zmienione względem oryginalnych danych
   - Walidacja: Porównanie aktualnego stanu z oryginalnym stanem
   - Obsługa: Komunikat błędu globalny ("Nie wprowadzono żadnych zmian")

### Walidacja po stronie API

1. **Format UUID dla carId:**
   - Warunek: carId musi być poprawnym UUID
   - Walidacja: Po stronie API przez Zod schema
   - Obsługa: 400 Bad Request z komunikatem błędu

2. **Unikalność nazwy:**
   - Warunek: Jeśli nazwa jest aktualizowana, musi być unikalna dla użytkownika
   - Walidacja: Sprawdzenie w bazie danych
   - Obsługa: 409 Conflict z komunikatem "Car name already exists"

3. **Autoryzacja:**
   - Warunek: Użytkownik musi być zalogowany
   - Walidacja: Token Bearer w nagłówku Authorization
   - Obsługa: 401 Unauthorized, przekierowanie do logowania

4. **Własność samochodu:**
   - Warunek: Samochód musi należeć do zalogowanego użytkownika
   - Walidacja: Sprawdzenie w bazie danych przez RLS
   - Obsługa: 404 Not Found z komunikatem "Car not found"

### Reguły biznesowe

1. **Opcjonalność pól w UpdateCarCommand:**
   - Wszystkie pola w `UpdateCarCommand` są opcjonalne
   - Wymagane jest podanie przynajmniej jednego pola do aktualizacji
   - Jeśli nie podano żadnego pola, zwracany jest błąd walidacji

2. **Wykrywanie zmian:**
   - Hook porównuje aktualny stan formularza z oryginalnym stanem
   - Jeśli żadne pole nie zostało zmienione, nie wysyła żądania do API
   - Komunikuje użytkownikowi, że nie wprowadzono żadnych zmian

3. **Komunikaty błędów:**
   - Błędy walidacji są wyświetlane przy odpowiednich polach
   - Błędy globalne (timeout, network errors) są wyświetlane nad przyciskami akcji
   - Po usunięciu błędu przez użytkownika, komunikaty są automatycznie czyszczone

## 10. Obsługa błędów

### Błędy walidacji (400 Bad Request)

**Scenariusz:** Użytkownik wprowadza nieprawidłowe dane (np. nazwa powyżej 100 znaków)

**Obsługa:**

1. API zwraca błąd 400 z szczegółami walidacji
2. Hook analizuje szczegóły błędu i mapuje je do odpowiednich pól
3. Komunikaty błędów są wyświetlane pod odpowiednimi polami
4. Pole z błędem otrzymuje czerwoną ramkę
5. Pierwsze pole z błędem otrzymuje focus

**Komunikaty:**

- "Nazwa może mieć maksymalnie 100 znaków"
- "Nieprawidłowa preferencja wprowadzania przebiegu"
- "Nie wprowadzono żadnych zmian"

### Błąd autoryzacji (401 Unauthorized)

**Scenariusz:** Token użytkownika wygasł lub jest nieprawidłowy

**Obsługa:**

1. API zwraca błąd 401
2. Wyświetlany jest komunikat: "Wymagana autoryzacja. Przekierowywanie..."
3. Po 2 sekundach użytkownik jest przekierowywany do `/login`
4. Formularz jest wyłączony do momentu przekierowania

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

### Samochód nie znaleziony (404 Not Found)

**Scenariusz:** Samochód o podanym ID nie istnieje lub nie należy do użytkownika

**Obsługa:**

1. API zwraca błąd 404
2. Wyświetlany jest komunikat: "Samochód nie został znaleziony"
3. Użytkownik może spróbować ponownie lub wrócić do listy samochodów
4. Po 3 sekundach automatyczne przekierowanie do `/cars`

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

### Konflikt nazwy (409 Conflict)

**Scenariusz:** Użytkownik próbuje zmienić nazwę na nazwę, która już istnieje dla tego użytkownika

**Obsługa:**

1. API zwraca błąd 409
2. Pole "Nazwa samochodu" otrzymuje komunikat błędu: "Samochód o tej nazwie już istnieje. Wybierz inną nazwę."
3. Globalny komunikat: "Nazwa samochodu musi być unikalna"
4. Pole nazwy otrzymuje czerwoną ramkę i focus

**Komunikaty:**

- Pole-specyficzny komunikat pod polem nazwy
- Globalny komunikat nad przyciskami akcji

### Błąd serwera (500 Internal Server Error)

**Scenariusz:** Wystąpił nieoczekiwany błąd po stronie serwera

**Obsługa:**

1. API zwraca błąd 500, 502, 503 lub 504
2. Wyświetlany jest komunikat: "Wystąpił błąd serwera. Spróbuj ponownie później"
3. Użytkownik może spróbować ponownie lub skontaktować się z supportem
4. Formularz pozostaje w stanie umożliwiającym ponowne wysłanie

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

### Timeout żądania

**Scenariusz:** Żądanie do API przekroczyło limit czasu (10 sekund)

**Obsługa:**

1. Abort controller przerywa żądanie po 10 sekundach
2. Wyświetlany jest komunikat: "Przekroczono limit czasu połączenia. Spróbuj ponownie."
3. Użytkownik może spróbować ponownie
4. Formularz pozostaje w stanie umożliwiającym ponowne wysłanie

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

### Błąd połączenia sieciowego

**Scenariusz:** Brak połączenia z internetem lub problem z siecią

**Obsługa:**

1. Fetch rzuca błąd "Failed to fetch"
2. Wyświetlany jest komunikat: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
3. Użytkownik może spróbować ponownie po przywróceniu połączenia
4. Formularz pozostaje w stanie umożliwiającym ponowne wysłanie

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

### Brak zmian w formularzu

**Scenariusz:** Użytkownik nie wprowadził żadnych zmian w formularzu

**Obsługa:**

1. Hook wykrywa, że żadne pole nie zostało zmienione
2. Wyświetlany jest globalny komunikat: "Nie wprowadzono żadnych zmian"
3. Żądanie nie jest wysyłane do API
4. Formularz pozostaje otwarty

**Komunikat:**

- Globalny komunikat nad przyciskami akcji

## 11. Kroki implementacji

1. **Utworzenie strony Astro** (`src/pages/cars/[carId]/edit.astro`)
   - Utworzenie strony Astro z odpowiednim layoutem
   - Wyekstrahowanie parametru `carId` z URL
   - Renderowanie komponentu `EditCarView` z `client:load`
   - Przekazanie `carId` jako prop do komponentu

2. **Utworzenie walidacji dla formularza edycji** (`src/lib/validation/cars.ts`)
   - Walidacja jest już zaimplementowana w `updateCarCommandSchema`
   - Schemat sprawdza:
     - Opcjonalność pól (name, mileage_input_preference)
     - Wymaganie co najmniej jednego pola do aktualizacji
     - Długość nazwy (min 1, max 100)
     - Enum dla preferencji

3. **Utworzenie custom hook** (`src/lib/hooks/useEditCarForm.ts`)
   - Utworzenie hooka podobnego do `useNewCarForm`
   - Inicjalizacja stanu formularza danymi samochodu z API
   - Implementacja walidacji pól (name, mileageInputPreference)
   - Implementacja funkcji pomocniczych (handleFieldChange, handleFieldBlur, validateField, validateAllFields)
   - Implementacja funkcji `handleSubmit` z:
     - Walidacją przed wysłaniem
     - Wykrywaniem zmian w formularzu
     - Obsługą timeout (10 sekund)
     - Obsługą różnych kodów błędów z API
     - Nawigacją po sukcesie do szczegółów samochodu
   - Implementacja funkcji `handleCancel` z nawigacją do szczegółów samochodu
   - Implementacja pomocniczej funkcji `getErrorMessage` dla mapowania kodów błędów

4. **Utworzenie komponentu EditCarView** (`src/components/cars/EditCarView.tsx`)
   - Import i wykorzystanie hooka `useEditCarForm`
   - Utworzenie komponentu Breadcrumbs
   - Utworzenie nagłówka z tytułem i opisem
   - Utworzenie formularza z polami: nazwa, preferencja
   - Implementacja komunikatu ładowania podczas wysyłania
   - Implementacja komunikatów błędów (pole-specyficzne i globalne)
   - Implementacja przycisków akcji: "Zapisz" i "Anuluj"
   - Dodanie odpowiednich ARIA atrybutów dla dostępności
   - Implementacja obsługi klawiatury (Enter w polach formularza)

5. **Implementacja komponentu Breadcrumbs dla edycji** (wewnątrz `EditCarView.tsx` lub jako osobny komponent)
   - Hierarchia: Strona główna → Samochody → [Nazwa samochodu] → Edycja
   - Implementacja klikalnych linków
   - Implementacja obsługi klawiatury (Enter/Space na focusable elements)
   - Dodanie ikony Home z lucide-react

6. **Implementacja auto-focus dla pola nazwy**
   - Wykorzystanie `useRef` do utworzenia referencji do inputa nazwy
   - Wywołanie `focus()` na referencji w `useEffect` po załadowaniu komponentu
   - Zapewnienie focus tylko jeśli użytkownik przybył z innej strony (nie naciskał przycisku "Edytuj" w dialogu)

7. **Testowanie walidacji**
   - Test walidacji nazwy (pusty, za długi, poprawny)
   - Test walidacji preferencji (nieprawidłowa wartość, poprawna wartość)
   - Test wykrywania zmian w formularzu
   - Test anulowania edycji

8. **Testowanie integracji z API**
   - Test pomyślnej aktualizacji samochodu
   - Test obsługi błędu walidacji (400)
   - Test obsługi błędu autoryzacji (401)
   - Test obsługi samochodu nie znalezionego (404)
   - Test obsługi konfliktu nazwy (409)
   - Test obsługi błędu serwera (500)
   - Test obsługi timeout

9. **Testowanie nawigacji**
   - Test nawigacji przez breadcrumbs
   - Test nawigacji po sukcesie do szczegółów samochodu
   - Test nawigacji po anulowaniu
   - Test nawigacji po 401 do strony logowania
   - Test nawigacji po 404 do listy samochodów

10. **Dostosowanie stylów**
    - Zapewnienie spójności stylów z `NewCarFormView`
    - Implementacja responsywności na urządzenia mobilne
    - Dodanie ciemnego motywu (dark mode)
    - Dodanie animacji podczas ładowania

11. **Implementacja dostępności (A11y)**
    - Dodanie ARIA atrybutów do formularza (`aria-label`, `aria-describedby`, `aria-invalid`, `aria-required`)
    - Implementacja komunikatów dostępowych dla czytników ekranu (`sr-only` dla pomocniczych tekstów)
    - Implementacja `role="alert"` dla komunikatów błędów
    - Implementacja `aria-live="polite"` dla komunikatów błędów
    - Implementacja `aria-busy` dla przycisku podczas wysyłania
    - Implementacja obsługi klawiatury dla wszystkich interaktywnych elementów

12. **Aktualizacja linków w innych komponentach**
    - Sprawdzenie czy istnieją linki do edycji samochodu w innych widokach
    - Aktualizacja linków do wskazania `/cars/{carId}/edit` zamiast otwierania dialogu
    - Opcjonalnie: zachowanie dialogu `EditCarDialog` jako alternatywnej metody edycji

13. **Optymalizacja wydajności**
    - Upewnienie się, że hook nie powoduje niepotrzebnych re-renderów
    - Wykorzystanie `useCallback` dla wszystkich handlerów
    - Wykorzystanie `useMemo` dla złożonych obliczeń (np. porównanie zmian w formularzu)
    - Implementacja abort controller dla żądań, aby uniknąć memory leaks

14. **Dokumentacja i testy**
    - Aktualizacja dokumentacji API z informacją o nowym widoku
    - Dodanie komentarzy kodu dla złożonych logik
    - Utworzenie testów jednostkowych dla hooka `useEditCarForm`
    - Utworzenie testów integracyjnych dla widoku edycji
