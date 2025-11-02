# Plan implementacji widoku Usuwania Samochodu w Widoku Edycji

## 1. Przegląd

Widok edycji samochodu (`/cars/{carId}/edit`) zostanie rozszerzony o funkcjonalność usuwania samochodu wraz ze wszystkimi powiązanymi tankowaniami. Funkcjonalność ta będzie dostępna w formie przycisku "Usuń samochód" umieszczonego w sekcji akcji formularza. Po kliknięciu przycisku otworzy się dialog potwierdzenia wymagający wpisania nazwy samochodu. Po pomyślnym usunięciu użytkownik zostanie przekierowany do listy samochodów.

## 2. Routing widoku

Widok jest dostępny pod ścieżką `/cars/{carId}/edit`, która jest już zaimplementowana w pliku `src/pages/cars/[carId]/edit.astro`. Plik ten renderuje komponent `EditCarView` i nie wymaga modyfikacji.

## 3. Struktura komponentów

```
EditCarView (główny widok)
├── Breadcrumbs (nawigacja)
├── Header (tytuł sekcji)
├── Form (formularz edycji)
│   ├── Name Field (pole nazwy)
│   ├── Mileage Preference Field (pole preferencji)
│   └── Form Actions (akcje formularza)
│       ├── Save Button
│       ├── Cancel Button
│       └── Delete Button (NOWY)
└── DeleteCarDialog (dialog potwierdzenia - INTEGRACJA)
    ├── Warning Message
    ├── Confirmation Input
    └── Action Buttons
```

## 4. Szczegóły komponentów

### EditCarView

- **Opis komponentu:** Główny widok edycji samochodu rozszerzony o funkcjonalność usuwania. Komponent wyświetla formularz edycji danych samochodu oraz zapewnia opcję usunięcia samochodu poprzez przycisk w sekcji akcji formularza.

- **Główne elementy:**
  - Breadcrumbs navigation (nawigacja breadcrumbs)
  - Header z tytułem "Edytuj samochód"
  - Formularz edycji zawierający:
    - Pole tekstowe "Nazwa samochodu"
    - Pole select "Preferencja wprowadzania przebiegu"
    - Sekcja akcji formularza z przyciskami: "Zapisz", "Anuluj", "Usuń samochód"
  - Komponent `DeleteCarDialog` renderowany warunkowo (gdy `deleteDialogOpen === true`)

- **Obsługiwane interakcje:**
  - `onSubmit` - wysłanie formularza edycji (istniejąca funkcjonalność)
  - `onCancel` - anulowanie edycji i powrót do widoku szczegółów (istniejąca funkcjonalność)
  - `onDeleteClick` - otwarcie dialogu potwierdzenia usunięcia (NOWE)
  - `onDeleteConfirm` - wykonanie usunięcia samochodu po potwierdzeniu (NOWE)
  - `onDeleteCancel` - zamknięcie dialogu bez usuwania (NOWE)

- **Obsługiwana walidacja:**
  - Walidacja formularza edycji (istniejąca)
  - Walidacja usuwania odbywa się w komponencie `DeleteCarDialog` i wymaga dokładnego dopasowania nazwy samochodu

- **Typy:**
  - Props: `EditCarViewProps` - `{ carId: string }`
  - Stan: zarządzany przez hook `useEditCarForm` rozszerzony o stan dialogu usuwania
  - DTO: `DeleteCarCommand` - `{ confirmation_name: string }` do wysłania do API
  - DTO: `DeleteResponseDTO` - `{ message: string }` z odpowiedzi API

- **Props:**
  - `carId: string` - identyfikator samochodu do edycji/usunięcia

### DeleteCarDialog

- **Opis komponentu:** Dialog potwierdzenia usunięcia samochodu. Komponent wyświetla ostrzeżenie o nieodwracalności operacji oraz wymaga wpisania dokładnej nazwy samochodu w celu potwierdzenia. Dialog jest już zaimplementowany i wymaga jedynie integracji z widokiem edycji.

- **Główne elementy:**
  - Overlay modal (tło z półprzezroczystością)
  - Modal container z:
    - Nagłówkiem "Usuń samochód" w kolorze czerwonym
    - Komunikatem ostrzegawczym o nieodwracalności operacji
    - Komunikatem z wymaganiem wpisania nazwy samochodu
    - Polem tekstowym do wprowadzenia nazwy potwierdzenia
    - Sekcją komunikatów błędów
    - Przyciskami akcji: "Anuluj" i "Usuń samochód"

- **Obsługiwane interakcje:**
  - `onChange` - zmiana wartości pola potwierdzenia
  - `onSubmit` - wysłanie formularza usunięcia
  - `onCancel` - zamknięcie dialogu bez wykonania akcji
  - Walidacja w czasie rzeczywistym - przycisk "Usuń" jest aktywny tylko gdy nazwa potwierdzenia dokładnie pasuje do nazwy samochodu

- **Obsługiwana walidacja:**
  - Nazwa potwierdzenia musi być dokładnie równa nazwie samochodu (case-sensitive)
  - Nazwa potwierdzenia nie może być pusta
  - Walidacja odbywa się zarówno po stronie klienta (przed wysłaniem) jak i po stronie serwera

- **Typy:**
  - Props: `DeleteCarDialogProps`:
    - `car: CarDetailsDTO` - dane samochodu do usunięcia
    - `isOpen: boolean` - stan widoczności dialogu
    - `onDelete: (data: DeleteCarCommand) => Promise<void>` - callback wykonania usunięcia
    - `onCancel: () => void` - callback zamknięcia dialogu
  - Stan wewnętrzny:
    - `confirmationName: string` - wprowadzona nazwa potwierdzenia
    - `loading: boolean` - stan ładowania podczas operacji usuwania
    - `error: string | null` - komunikat błędu jeśli operacja się nie powiodła

- **Props:**
  - `car: CarDetailsDTO` - dane samochodu (przekazywane z rodzica)
  - `isOpen: boolean` - stan otwarcia dialogu (zarządzany przez rodzica)
  - `onDelete: (data: DeleteCarCommand) => Promise<void>` - funkcja wykonania usunięcia
  - `onCancel: () => void` - funkcja zamknięcia dialogu

## 5. Typy

### Istniejące typy (używane bez modyfikacji)

**DeleteCarCommand:**
```typescript
export interface DeleteCarCommand {
  confirmation_name: string;
}
```
- `confirmation_name: string` - dokładna nazwa samochodu wymagana do potwierdzenia usunięcia

**DeleteResponseDTO:**
```typescript
export interface DeleteResponseDTO {
  message: string;
  updated_entries_count?: number;
}
```
- `message: string` - komunikat o powodzeniu operacji
- `updated_entries_count?: number` - opcjonalna liczba zaktualizowanych wpisów (nie używana w przypadku usuwania samochodu)

**CarDetailsDTO:**
```typescript
export type CarDetailsDTO = CarWithStatisticsDTO & { created_at: string };
```
- Używany do przekazania danych samochodu do dialogu usuwania

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
- Używany do obsługi błędów z API

### Nowe typy ViewModel (stan wewnętrzny hooka)

**DeleteCarState (rozszerzenie stanu useEditCarForm):**
```typescript
interface DeleteCarState {
  deleteDialogOpen: boolean;
  isDeleting: boolean;
  deleteError: string | null;
}
```

**Rozszerzony EditCarFormState:**
Hook `useEditCarForm` zostanie rozszerzony o następujące pola stanu:
- `deleteDialogOpen: boolean` - stan otwarcia dialogu usuwania
- `isDeleting: boolean` - stan wykonywania operacji usuwania
- `deleteError: string | null` - komunikat błędu związany z usuwaniem

## 6. Zarządzanie stanem

Zarządzanie stanem będzie realizowane poprzez rozszerzenie istniejącego hooka `useEditCarForm` o funkcjonalność usuwania. Hook będzie zarządzał:

1. **Stanem formularza edycji** (istniejący):
   - `formState` - wartości pól formularza
   - `formErrors` - błędy walidacji formularza
   - `isSubmitting` - stan przesyłania formularza
   - `isLoading` - stan ładowania danych samochodu

2. **Stanem usuwania (NOWY)**:
   - `deleteDialogOpen: boolean` - stan widoczności dialogu usuwania
   - `isDeleting: boolean` - stan wykonywania operacji usuwania (blokuje interfejs podczas usuwania)
   - `deleteError: string | null` - komunikat błędu związany z operacją usuwania

3. **Funkcjami obsługi usuwania (NOWE)**:
   - `handleDeleteClick: () => void` - otwarcie dialogu usuwania
   - `handleDeleteCancel: () => void` - zamknięcie dialogu bez wykonania akcji
   - `handleDeleteConfirm: (data: DeleteCarCommand) => Promise<void>` - wykonanie usunięcia samochodu przez wywołanie API DELETE `/api/cars/{carId}`

**Zasady zarządzania stanem:**
- Stan dialogu jest niezależny od stanu formularza edycji
- Operacja usuwania nie powinna być możliwa podczas przesyłania formularza edycji (`isSubmitting === true`)
- Operacja edycji nie powinna być możliwa podczas usuwania (`isDeleting === true`)
- Po pomyślnym usunięciu następuje przekierowanie do `/cars`, więc nie ma potrzeby aktualizacji stanu lokalnego

## 7. Integracja API

Integracja z endpointem `DELETE /api/cars/{carId}` będzie realizowana bezpośrednio w hooku `useEditCarForm` poprzez funkcję `handleDeleteConfirm`.

**Endpoint:**
- **Metoda:** `DELETE`
- **Ścieżka:** `/api/cars/{carId}`
- **Nagłówki:**
  - `Authorization: Bearer {token}` - token JWT z localStorage/cookies
  - `Content-Type: application/json`

**Request Body:**
```typescript
{
  confirmation_name: string
}
```

**Success Response (200 OK):**
```typescript
{
  message: "Car and all associated fillups deleted successfully"
}
```

**Error Responses:**
- `400 Bad Request` - Nieprawidłowa nazwa potwierdzenia lub nieprawidłowy format UUID
- `401 Unauthorized` - Brak lub nieprawidłowy token autoryzacji
- `404 Not Found` - Samochód nie został znaleziony lub nie należy do użytkownika
- `500 Internal Server Error` - Nieoczekiwany błąd serwera

**Implementacja wywołania API:**
Funkcja `handleDeleteConfirm` w hooku `useEditCarForm`:
1. Ustawia `isDeleting = true` i `deleteError = null`
2. Pobiera token autoryzacji z localStorage/cookies
3. Wykonuje fetch do `/api/cars/${carId}` z metodą DELETE
4. W przypadku błędu 401 - przekierowuje do `/login` lub wyświetla komunikat o braku autoryzacji
5. W przypadku błędu 404 - wyświetla komunikat i przekierowuje do `/cars` po 3 sekundach
6. W przypadku błędu 400 - wyświetla komunikat błędu w dialogu
7. W przypadku sukcesu - przekierowuje do `/cars`
8. W każdym przypadku kończy ustawiając `isDeleting = false`

## 8. Interakcje użytkownika

### Scenariusz 1: Otwarcie dialogu usuwania
1. Użytkownik znajduje się na stronie `/cars/{carId}/edit`
2. Użytkownik przewija do sekcji akcji formularza
3. Użytkownik klika przycisk "Usuń samochód" (czerwony przycisk z ikoną kosza)
4. **Rezultat:** Otwiera się dialog `DeleteCarDialog` z komunikatem ostrzegawczym

### Scenariusz 2: Anulowanie usuwania
1. Dialog usuwania jest otwarty
2. Użytkownik klika przycisk "Anuluj" lub klika poza dialogiem (opcjonalnie ESC)
3. **Rezultat:** Dialog zamyka się, użytkownik pozostaje na stronie edycji

### Scenariusz 3: Potwierdzenie usuwania - sukces
1. Dialog usuwania jest otwarty
2. Użytkownik wpisuje dokładną nazwę samochodu w pole potwierdzenia
3. Przycisk "Usuń samochód" staje się aktywny (gdy nazwa się zgadza)
4. Użytkownik klika "Usuń samochód"
5. **Rezultat:** 
   - Dialog pokazuje stan ładowania ("Usuwanie...")
   - Wykonywane jest żądanie DELETE do API
   - Po pomyślnym usunięciu następuje przekierowanie do `/cars`
   - Użytkownik widzi listę samochodów (bez usuniętego samochodu)

### Scenariusz 4: Potwierdzenie usuwania - błąd walidacji nazwy
1. Dialog usuwania jest otwarty
2. Użytkownik wpisuje nieprawidłową nazwę samochodu
3. Użytkownik klika "Usuń samochód" (jeśli przycisk jest aktywny)
4. **Rezultat:** 
   - Komunikat błędu: "Nazwa potwierdzenia nie pasuje do nazwy samochodu"
   - Dialog pozostaje otwarty
   - Użytkownik może poprawić nazwę lub anulować

### Scenariusz 5: Potwierdzenie usuwania - błąd sieci/serwera
1. Dialog usuwania jest otwarty
2. Użytkownik wpisuje prawidłową nazwę i klika "Usuń samochód"
3. Występuje błąd sieci lub błąd serwera (400, 401, 404, 500)
4. **Rezultat:**
   - Dialog wyświetla komunikat błędu odpowiedni do kodu błędu
   - Dialog pozostaje otwarty
   - Użytkownik może spróbować ponownie lub anulować

### Scenariusz 6: Próba usunięcia podczas edycji
1. Użytkownik wprowadza zmiany w formularzu
2. Użytkownik klika "Zapisz" (trwa przesyłanie)
3. Podczas przesyłania użytkownik próbuje kliknąć "Usuń samochód"
4. **Rezultat:** Przycisk "Usuń samochód" jest nieaktywny (`isSubmitting === true`)

## 9. Warunki i walidacja

### Warunki frontendowe (walidacja przed wysłaniem)

**Walidacja nazwy potwierdzenia (w DeleteCarDialog):**
- Nazwa potwierdzenia musi być dokładnie równa nazwie samochodu (case-sensitive, z uwzględnieniem białych znaków)
- Nazwa potwierdzenia nie może być pusta
- Walidacja odbywa się w czasie rzeczywistym - przycisk "Usuń samochód" jest aktywny tylko gdy `confirmationName === car.name`

**Warunki blokujące operację usuwania:**
- Operacja usuwania jest zablokowana gdy `isSubmitting === true` (trwa przesyłanie formularza edycji)
- Operacja edycji jest zablokowana gdy `isDeleting === true` (trwa usuwanie samochodu)
- Operacja wymaga autoryzacji - brak tokenu powoduje błąd 401

### Warunki API (weryfikowane przez backend)

**Walidacja parametrów:**
- `carId` musi być prawidłowym UUID (walidacja przez `carIdParamSchema`)

**Walidacja body:**
- `confirmation_name` musi być stringiem (trim, min 1, max 100 znaków) - walidacja przez `deleteCarCommandSchema`

**Warunki biznesowe:**
- Samochód musi istnieć w bazie danych
- Samochód musi należeć do uwierzytelnionego użytkownika (RLS)
- Nazwa potwierdzenia musi dokładnie pasować do nazwy samochodu w bazie danych

### Wpływ warunków na stan interfejsu

**Stan dialogu:**
- Dialog jest otwarty tylko gdy `deleteDialogOpen === true`
- Przycisk "Usuń samochód" w dialogu jest aktywny tylko gdy `confirmationName === car.name && !loading`

**Stan formularza edycji:**
- Przycisk "Usuń samochód" w sekcji akcji formularza jest nieaktywny gdy `isSubmitting === true || isDeleting === true`
- Wszystkie pola formularza edycji są nieaktywne (`disabled`) gdy `isDeleting === true`

**Komunikaty błędów:**
- Błędy walidacji frontendowej są wyświetlane bezpośrednio w dialogu
- Błędy API są wyświetlane w dialogu jako komunikat błędu pod polem potwierdzenia

## 10. Obsługa błędów

### Scenariusze błędów i obsługa

**1. Błąd 400 Bad Request - Nieprawidłowa nazwa potwierdzenia:**
- **Przyczyna:** Nazwa potwierdzenia nie pasuje do nazwy samochodu w bazie danych
- **Obsługa:** Wyświetlenie komunikatu błędu w dialogu: "Nazwa potwierdzenia nie pasuje do nazwy samochodu"
- **Działanie użytkownika:** Możliwość poprawienia nazwy lub anulowania

**2. Błąd 400 Bad Request - Nieprawidłowy UUID carId:**
- **Przyczyna:** Parametr `carId` nie jest prawidłowym UUID
- **Obsługa:** Przekierowanie do `/cars` z komunikatem błędu (nie powinno się zdarzyć w normalnym użyciu)

**3. Błąd 401 Unauthorized - Brak autoryzacji:**
- **Przyczyna:** Brak tokenu autoryzacji lub nieprawidłowy token
- **Obsługa:** 
  - Jeśli brak tokenu: Wyświetlenie komunikatu "Brak autoryzacji. Ustaw token w localStorage (/dev/set-token) lub włącz DEV_AUTH_FALLBACK=true"
  - Jeśli nieprawidłowy token: Przekierowanie do `/login` po 2 sekundach z komunikatem "Wymagana autoryzacja"
- **Działanie użytkownika:** Konieczność ponownego zalogowania się

**4. Błąd 404 Not Found - Samochód nie istnieje:**
- **Przyczyna:** Samochód nie został znaleziony lub nie należy do użytkownika
- **Obsługa:** Wyświetlenie komunikatu błędu w dialogu: "Samochód nie został znaleziony" i automatyczne przekierowanie do `/cars` po 3 sekundach
- **Działanie użytkownika:** Automatyczne przekierowanie

**5. Błąd 500 Internal Server Error:**
- **Przyczyna:** Nieoczekiwany błąd serwera
- **Obsługa:** Wyświetlenie komunikatu błędu w dialogu: "Wystąpił błąd serwera. Spróbuj ponownie później"
- **Działanie użytkownika:** Możliwość ponowienia próby lub anulowania

**6. Błąd sieci (NetworkError, Failed to fetch):**
- **Przyczyna:** Brak połączenia z serwerem lub timeout
- **Obsługa:** Wyświetlenie komunikatu błędu w dialogu: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe"
- **Działanie użytkownika:** Możliwość ponowienia próby po sprawdzeniu połączenia

**7. Timeout żądania:**
- **Przyczyna:** Przekroczenie czasu oczekiwania na odpowiedź (10 sekund)
- **Obsługa:** Wyświetlenie komunikatu błędu: "Przekroczono limit czasu połączenia. Spróbuj ponownie"
- **Działanie użytkownika:** Możliwość ponowienia próby

**8. Błąd parsowania odpowiedzi JSON:**
- **Przyczyna:** Nieprawidłowa odpowiedź z serwera
- **Obsługa:** Wyświetlenie komunikatu błędu: "Nie udało się przetworzyć odpowiedzi serwera"
- **Działanie użytkownika:** Możliwość ponowienia próby lub anulowania

### Strategie obsługi błędów

**Komunikaty błędów:**
- Wszystkie komunikaty błędów są wyświetlane w języku polskim
- Komunikaty są zrozumiałe dla użytkownika końcowego (bez szczegółów technicznych)
- Błędy krytyczne (401, 404) powodują przekierowanie po krótkim opóźnieniu
- Błędy niekrytyczne (400, 500, network) pozwalają użytkownikowi na ponowienie próby

**Logowanie błędów:**
- Wszystkie błędy są logowane do konsoli przeglądarki z prefiksem `[useEditCarForm]`
- Szczegółowe informacje o błędach są dostępne w konsoli deweloperskiej

**Stan interfejsu po błędzie:**
- Po błędzie dialog pozostaje otwarty (z wyjątkiem błędów 401 i 404 powodujących przekierowanie)
- Pole potwierdzenia pozostaje wypełnione (użytkownik może poprawić wartość)
- Stan `isDeleting` jest resetowany do `false`, umożliwiając ponowienie próby

## 11. Kroki implementacji

### Krok 1: Rozszerzenie hooka useEditCarForm

1. Otwórz plik `src/lib/hooks/useEditCarForm.ts`
2. Dodaj do interfejsu stanu następujące pola:
   - `deleteDialogOpen: boolean` - początkowo `false`
   - `isDeleting: boolean` - początkowo `false`
   - `deleteError: string | null` - początkowo `null`
3. Dodaj funkcję `handleDeleteClick`:
   - Ustawia `deleteDialogOpen = true`
   - Resetuje `deleteError = null`
4. Dodaj funkcję `handleDeleteCancel`:
   - Ustawia `deleteDialogOpen = false`
   - Resetuje `deleteError = null`
   - Resetuje stan wewnętrzny dialogu (jeśli potrzebne)
5. Dodaj funkcję `handleDeleteConfirm`:
   - Przyjmuje parametr `DeleteCarCommand`
   - Ustawia `isDeleting = true` i `deleteError = null`
   - Pobiera token autoryzacji (analogicznie do `handleSubmit`)
   - Wykonuje fetch do `DELETE /api/cars/${carId}` z body `DeleteCarCommand`
   - Obsługuje wszystkie kody błędów zgodnie z sekcją "Obsługa błędów"
   - W przypadku sukcesu przekierowuje do `/cars`
   - W każdym przypadku kończy ustawiając `isDeleting = false`
6. Zwróć nowe funkcje i stan w return hooka:
   - `deleteDialogOpen`
   - `isDeleting`
   - `deleteError`
   - `handleDeleteClick`
   - `handleDeleteCancel`
   - `handleDeleteConfirm`

### Krok 2: Integracja DeleteCarDialog w EditCarView

1. Otwórz plik `src/components/cars/EditCarView.tsx`
2. Dodaj import komponentu `DeleteCarDialog`:
   ```typescript
   import { DeleteCarDialog } from "./DeleteCarDialog";
   ```
3. Dodaj import typu `DeleteCarCommand`:
   ```typescript
   import type { DeleteCarCommand } from "../../types";
   ```
4. Rozszerz destrukturyzację hooka `useEditCarForm` o nowe wartości:
   - `deleteDialogOpen`
   - `isDeleting`
   - `deleteError`
   - `handleDeleteClick`
   - `handleDeleteCancel`
   - `handleDeleteConfirm`
5. Dodaj przycisk "Usuń samochód" w sekcji akcji formularza (po przycisku "Anuluj"):
   - Użyj komponentu `Button` z `variant="outline"`
   - Dodaj ikonę `Trash2` z `lucide-react`
   - Ustaw klasę z czerwonym kolorem tekstu: `text-red-600 dark:text-red-400`
   - Ustaw `onClick={handleDeleteClick}`
   - Ustaw `disabled={isSubmitting || isDeleting}`
   - Dodaj odpowiednie `aria-label` dla dostępności
6. Dodaj komponent `DeleteCarDialog` na końcu komponentu (przed zamknięciem `</div>`):
   - Przekaż `car={originalCarData}` (tylko gdy `originalCarData !== null`)
   - Przekaż `isOpen={deleteDialogOpen}`
   - Przekaż `onDelete={handleDeleteConfirm}` (opakuj w funkcję async)
   - Przekaż `onCancel={handleDeleteCancel}`
   - Renderuj warunkowo tylko gdy `originalCarData !== null`

### Krok 3: Walidacja i testowanie

1. **Testowanie otwarcia dialogu:**
   - Zweryfikuj, że kliknięcie przycisku "Usuń samochód" otwiera dialog
   - Zweryfikuj, że przycisk jest nieaktywny podczas przesyłania formularza edycji

2. **Testowanie walidacji nazwy:**
   - Wprowadź nieprawidłową nazwę - przycisk "Usuń" powinien być nieaktywny
   - Wprowadź prawidłową nazwę - przycisk "Usuń" powinien być aktywny
   - Zweryfikuj, że porównanie jest case-sensitive

3. **Testowanie anulowania:**
   - Otwórz dialog i kliknij "Anuluj" - dialog powinien się zamknąć
   - Stan formularza powinien pozostać niezmieniony

4. **Testowanie pomyślnego usunięcia:**
   - Wprowadź prawidłową nazwę i kliknij "Usuń"
   - Zweryfikuj przekierowanie do `/cars`
   - Zweryfikuj, że usunięty samochód nie pojawia się na liście

5. **Testowanie błędów:**
   - Przefiltruj scenariusze błędów z sekcji "Obsługa błędów"
   - Zweryfikuj odpowiednie komunikaty błędów
   - Zweryfikuj przekierowania dla błędów 401 i 404

### Krok 4: Optymalizacja i dostępność

1. **Dostępność:**
   - Upewnij się, że przycisk "Usuń samochód" ma odpowiedni `aria-label`
   - Upewnij się, że dialog ma odpowiednie atrybuty ARIA (`role="dialog"`, `aria-labelledby`, `aria-describedby`)
   - Zaimplementuj obsługę klawisza ESC do zamknięcia dialogu (opcjonalnie, jeśli nie jest już zaimplementowane)

2. **UX:**
   - Upewnij się, że przycisk "Usuń samochód" jest wyraźnie wyróżniony kolorem czerwonym
   - Zweryfikuj, że komunikaty błędów są czytelne i zrozumiałe
   - Zweryfikuj, że stan ładowania jest wyraźnie widoczny

3. **Performance:**
   - Upewnij się, że dialog nie jest renderowany gdy `isOpen === false` (renderowanie warunkowe)
   - Zweryfikuj, że nie ma memory leaków przy wielokrotnym otwieraniu/zamykaniu dialogu

### Krok 5: Dokumentacja i finalizacja

1. **Dokumentacja kodu:**
   - Dodaj komentarze JSDoc do nowych funkcji w hooku
   - Upewnij się, że typy są prawidłowo zdefiniowane

2. **Testy końcowe:**
   - Przetestuj wszystkie scenariusze z sekcji "Interakcje użytkownika"
   - Zweryfikuj działanie na różnych urządzeniach (responsive design)
   - Zweryfikuj działanie w trybie ciemnym

3. **Code review:**
   - Sprawdź zgodność z konwencjami kodu projektu
   - Zweryfikuj obsługę błędów i przypadków brzegowych
   - Upewnij się, że nie ma duplikacji kodu

