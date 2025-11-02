# Plan implementacji widoku Usuwania Tankowania (w kontekście widoku edycji)

## 1. Przegląd

Widok edycji tankowania (`/cars/{carId}/fillups/{fillupId}/edit`) zostanie rozszerzony o funkcjonalność usuwania wpisu o tankowaniu. Po usunięciu, system automatycznie przelicza statystyki dla wszystkich kolejnych wpisów tankowań dla danego samochodu. Usuwanie wymaga potwierdzenia przez użytkownika poprzez dialog, aby zapobiec przypadkowemu usunięciu danych.

Kluczowe funkcjonalności:

- Przycisk usuwania w widoku edycji tankowania
- Dialog potwierdzenia usunięcia z informacją o nieodwracalności operacji
- Obsługa usuwania przez API endpoint DELETE
- Informacja o liczbie zaktualizowanych wpisów po usunięciu
- Automatyczne przekierowanie do historii tankowań po usunięciu
- Obsługa błędów i przypadków brzegowych

## 2. Routing widoku

**Ścieżka:** `/cars/{carId}/fillups/{fillupId}/edit`

**Plik Astro:** `src/pages/cars/[carId]/fillups/[fillupId]/edit.astro`

Widok pozostaje na tej samej ścieżce, ponieważ funkcjonalność usuwania jest zintegrowana z widokiem edycji jako dodatkowa opcja.

## 3. Struktura komponentów

```
EditFillupView (React Component - rozszerzony)
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
│       └── DeleteButton (NOWY - wywołuje dialog)
└── DeleteFillupDialog (NOWY - modal potwierdzenia)
    ├── DialogContent
    │   ├── DialogTitle (ostrzeżenie)
    │   ├── DialogDescription (informacja o konsekwencjach)
    │   ├── DeleteConfirmationMessage (opcjonalnie)
    │   └── DialogActions
    │       ├── CancelButton
    │       └── ConfirmDeleteButton
```

Komponenty z Shadcn/ui używane w widoku:

- `Button` - przyciski akcji (w tym przycisk usuwania)
- `Input` - pola wprowadzania danych (istniejące)
- `Label` - etykiety dla pól formularza (istniejące)
- `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` - selektor trybu wprowadzania (istniejące)
- `AlertDialog` lub własny komponent modalny - dialog potwierdzenia (do implementacji lub wykorzystania z Shadcn/ui)

## 4. Szczegóły komponentów

### EditFillupView (główny komponent React - rozszerzony)

**Opis:** Główny komponent widoku edycji tankowania został rozszerzony o funkcjonalność usuwania. Komponent wykorzystuje custom hook `useEditFillupForm` do zarządzania stanem formularza, walidacji, komunikacji z API oraz obsługi usuwania.

**Główne elementy:**

- Wszystkie istniejące elementy widoku edycji
- Przycisk "Usuń" w sekcji akcji formularza (nowy element)
- Komponent `DeleteFillupDialog` warunkowo renderowany na podstawie stanu `isDeleteDialogOpen`

**Obsługiwane zdarzenia:**

- Wszystkie istniejące zdarzenia widoku edycji
- `onDeleteClick` - otwarcie dialogu potwierdzenia usunięcia
- `onDeleteConfirm` - potwierdzenie i wykonanie usunięcia
- `onDeleteCancel` - anulowanie dialogu usunięcia

**Walidacja:**

- Brak dodatkowej walidacji dla funkcjonalności usuwania (walidacja po stronie API)

**Typy:**

- Props: `carId: string`, `fillupId: string` (bez zmian)
- Dodatkowe typy z hooka: `isDeleteDialogOpen: boolean`, `handleDeleteClick: () => void`, `handleDeleteConfirm: () => Promise<void>`, `handleDeleteCancel: () => void`, `isDeleting: boolean`, `deleteError: string | null`

**Props:**

```typescript
interface EditFillupViewProps {
  carId: string;
  fillupId: string;
}
```

### DeleteFillupDialog (NOWY - komponent modalny)

**Opis:** Dialog potwierdzenia usunięcia tankowania wyświetlany po kliknięciu przycisku "Usuń". Dialog informuje użytkownika o nieodwracalności operacji i wymaga potwierdzenia przed wykonaniem usunięcia.

**Główne elementy:**

- Tło modalne z półprzezroczystym overlay (`fixed inset-0 z-50 bg-black bg-opacity-50`)
- Kontener dialogu z białym/ciemnym tłem (`bg-white dark:bg-gray-800 rounded-lg shadow-xl`)
- Tytuł dialogu z ostrzeżeniem ("Usuń tankowanie")
- Tekst informacyjny o konsekwencjach usunięcia
- Informacja o automatycznym przeliczeniu statystyk dla kolejnych wpisów
- Grupa przycisków akcji:
  - Przycisk "Anuluj" (outline variant)
  - Przycisk "Usuń" (destructive variant, czerwony)

**Obsługiwane zdarzenia:**

- `onConfirm` - potwierdzenie i wykonanie usunięcia
- `onCancel` - anulowanie dialogu (zamknięcie bez usuwania)
- `onOpenChange` - zmiana stanu otwarcia dialogu (obsługa ESC, kliknięcie poza dialog)

**Walidacja:**

- Brak walidacji po stronie frontendu (wszystko jest obsługiwane przez API)
- Dialog może być zamknięty tylko przez przycisk "Anuluj" lub ESC (przycisk "Usuń" nie jest aktywny podczas trwającego usuwania)

**Typy:**

```typescript
interface DeleteFillupDialogProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
  fillupDate?: string; // Opcjonalnie - data tankowania do wyświetlenia w komunikacie
}
```

**Props:**

- `isOpen: boolean` - stan otwarcia dialogu
- `onConfirm: () => Promise<void>` - handler potwierdzenia usunięcia
- `onCancel: () => void` - handler anulowania dialogu
- `isDeleting?: boolean` - stan trwającego usuwania (dla wyłączenia przycisku)
- `fillupDate?: string` - opcjonalna data tankowania dla bardziej szczegółowego komunikatu

### Przycisk Usuwania (DeleteButton)

**Opis:** Przycisk wywołujący dialog potwierdzenia usunięcia. Znajduje się w sekcji akcji formularza obok przycisków "Zapisz" i "Anuluj".

**Główne elementy:**

- Przycisk z wariantem "destructive" lub "outline" z czerwonym kolorem
- Ikona kosza/trash (opcjonalnie z lucide-react)
- Tekst "Usuń tankowanie"
- Wyłączony podczas zapisywania formularza (`isSubmitting`)

**Obsługiwane zdarzenia:**

- `onClick` - otwarcie dialogu potwierdzenia

**Walidacja:**

- Przycisk jest wyłączony gdy `isSubmitting === true` lub `isDeleting === true`

**Typy:**

- Props: `onClick: () => void`, `disabled: boolean`

**Styl:**

- Czerwony kolor przycisku (`bg-red-600 hover:bg-red-700` lub variant="destructive")
- Możliwa ikona `Trash2` z lucide-react

## 5. Typy

### Typy istniejące (z `src/types.ts`):

**DeleteResponseDTO:**

```typescript
export interface DeleteResponseDTO {
  message: string;
  updated_entries_count?: number;
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

**FillupDTO:**

```typescript
export type FillupDTO = Pick<
  Fillup,
  | "id"
  | "car_id"
  | "date"
  | "fuel_amount"
  | "total_price"
  | "odometer"
  | "distance_traveled"
  | "fuel_consumption"
  | "price_per_liter"
>;
```

### Typy nowe dla funkcjonalności usuwania:

**DeleteFillupDialogProps:**

```typescript
interface DeleteFillupDialogProps {
  isOpen: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
  isDeleting?: boolean;
  fillupDate?: string;
}
```

**Rozszerzenie hooka useEditFillupForm:**

```typescript
interface UseEditFillupFormReturn {
  // ... istniejące pola ...

  // Nowe pola dla usuwania:
  isDeleteDialogOpen: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  handleDeleteClick: () => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
}
```

**Stan usuwania w hook:**

```typescript
// Dodatkowy stan w hook:
const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
const [isDeleting, setIsDeleting] = useState(false);
const [deleteError, setDeleteError] = useState<string | null>(null);
```

## 6. Zarządzanie stanem

Hook `useEditFillupForm` zostanie rozszerzony o zarządzanie stanem usuwania:

**Nowy stan w hook:**

1. **Stan dialogu usuwania** - `isDeleteDialogOpen: boolean` - informuje czy dialog potwierdzenia jest otwarty
2. **Stan usuwania** - `isDeleting: boolean` - informuje o trwającym procesie usuwania
3. **Błąd usuwania** - `deleteError: string | null` - przechowuje błędy związane z usuwaniem

**Nowe funkcje hook:**

1. `handleDeleteClick()` - otwarcie dialogu potwierdzenia usunięcia
   - Ustawia `isDeleteDialogOpen = true`
   - Czyści poprzednie błędy usuwania (`deleteError = null`)

2. `handleDeleteCancel()` - anulowanie dialogu usunięcia
   - Ustawia `isDeleteDialogOpen = false`
   - Czyści błąd usuwania

3. `handleDeleteConfirm()` - wykonanie usunięcia
   - Ustawia `isDeleting = true`
   - Wykonuje DELETE request do `/api/cars/{carId}/fillups/{fillupId}`
   - Obsługuje odpowiedź i przekierowanie
   - Obsługuje błędy (401, 404, 500, timeout, brak połączenia)
   - Przekierowuje do `/cars/{carId}/fillups` po sukcesie
   - Jeśli odpowiedź zawiera `updated_entries_count`, może wyświetlić komunikat informacyjny (opcjonalnie)

**Abortable Fetch:**

Hook używa tego samego mechanizmu abortable fetch z timeoutem (10 sekund) jak w przypadku aktualizacji.

**Struktura danych stanu w hook (rozszerzona):**

```typescript
interface UseEditFillupFormReturn {
  // ... istniejące pola ...

  // Nowe pola:
  isDeleteDialogOpen: boolean;
  isDeleting: boolean;
  deleteError: string | null;
  handleDeleteClick: () => void;
  handleDeleteConfirm: () => Promise<void>;
  handleDeleteCancel: () => void;
}
```

## 7. Integracja API

### DELETE /api/cars/{carId}/fillups/{fillupId}

**Endpoint:** Usuwa wpis tankowania i przelicza statystyki dla kolejnych wpisów

**Request:**

- Method: `DELETE`
- Path: `/api/cars/{carId}/fillups/{fillupId}`
- Headers: `Authorization: Bearer {token}`
- Path params:
  - `carId: string` (UUID)
  - `fillupId: string` (UUID)
- Body: Brak (brak body w DELETE request)

**Response 200 OK:**

```json
{
  "message": "Fillup deleted successfully",
  "updated_entries_count": 2
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
    "code": "NOT_FOUND",
    "message": "Fillup or car not found, or doesn't belong to user"
  }
}
```

**Response 500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while deleting fillup"
  }
}
```

**Implementacja w hook:**

```typescript
const handleDeleteConfirm = useCallback(async () => {
  setIsDeleting(true);
  setDeleteError(null);

  const abortController = new AbortController();
  const timeoutId = setTimeout(() => abortController.abort(), REQUEST_TIMEOUT);

  try {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      throw new Error("Wymagana autoryzacja");
    }

    const response = await fetch(`/api/cars/${carId}/fillups/${fillupId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      if (response.status === 401) {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return;
      }

      if (response.status === 404) {
        // Przekierowanie do listy tankowań
        if (typeof window !== "undefined") {
          window.location.href = `/cars/${carId}/fillups`;
        }
        return;
      }

      const errorData: ErrorResponseDTO = await response.json();
      throw new Error(errorData.error.message);
    }

    const result: DeleteResponseDTO = await response.json();

    // Opcjonalnie: wyświetlenie komunikatu o liczbie zaktualizowanych wpisów
    // Można wykorzystać toast notification lub komunikat przed przekierowaniem

    // Przekierowanie do listy tankowań
    if (typeof window !== "undefined") {
      window.location.href = `/cars/${carId}/fillups`;
    }
  } catch (error) {
    // Obsługa błędów (timeout, network, etc.)
    // ...
    setIsDeleting(false);
  } finally {
    if (abortController) {
      abortController();
    }
  }
}, [carId, fillupId]);
```

## 8. Interakcje użytkownika

### 1. Kliknięcie przycisku "Usuń"

**Scenariusz:** Użytkownik klika przycisk "Usuń" w sekcji akcji formularza

**Reakcja systemu:**

1. Dialog potwierdzenia usunięcia zostaje otwarty (`isDeleteDialogOpen = true`)
2. Poprzednie błędy usuwania są czyszczone
3. Dialog wyświetla informację o nieodwracalności operacji
4. Dialog informuje o automatycznym przeliczeniu statystyk dla kolejnych wpisów

### 2. Anulowanie dialogu

**Scenariusz:** Użytkownik klika "Anuluj" w dialogu lub naciska ESC

**Reakcja systemu:**

1. Dialog zostaje zamknięty (`isDeleteDialogOpen = false`)
2. Użytkownik pozostaje na widoku edycji
3. Formularz edycji pozostaje w niezmienionym stanie

### 3. Potwierdzenie usunięcia

**Scenariusz:** Użytkownik klika "Usuń" w dialogu potwierdzenia

**Reakcja systemu:**

1. Przycisk "Usuń" w dialogu zostaje wyłączony (`isDeleting = true`)
2. Dialog nie może być zamknięty (ESC i kliknięcie poza dialog zablokowane)
3. Wykonywany jest DELETE request do API
4. Jeśli request zakończy się sukcesem:
   - Dialog zostaje zamknięty
   - Użytkownik zostaje przekierowany do `/cars/{carId}/fillups`
   - Opcjonalnie: wyświetlenie komunikatu o liczbie zaktualizowanych wpisów
5. Jeśli request zakończy się błędem:
   - Dialog pozostaje otwarty
   - Wyświetlany jest komunikat błędu w dialogu
   - Przycisk "Usuń" zostaje ponownie włączony
   - Użytkownik może spróbować ponownie lub anulować

### 4. Obsługa błędów podczas usuwania

**Scenariusz:** Wystąpił błąd podczas usuwania (401, 404, 500, timeout, brak połączenia)

**Reakcja systemu:**

1. Błąd jest wyświetlany w dialogu (poniżej przycisków akcji)
2. Dialog pozostaje otwarty (z wyjątkiem 401 i 404, które powodują przekierowanie)
3. Przycisk "Usuń" zostaje ponownie włączony
4. Użytkownik może spróbować ponownie lub anulować operację

### 5. Przekierowanie po sukcesie

**Scenariusz:** Usunięcie zakończyło się sukcesem

**Reakcja systemu:**

1. Dialog zostaje zamknięty
2. Użytkownik zostaje natychmiast przekierowany do `/cars/{carId}/fillups`
3. Lista tankowań jest automatycznie odświeżana (usunięty wpis znika)
4. Statystyki samochodu są automatycznie przeliczone (przez API)

## 9. Warunki i walidacja

### Warunki decydujące o stanie UI:

**Stan "Dialog otwarty":**

- `isDeleteDialogOpen === true`
- Dialog jest widoczny na ekranie
- Tło formularza jest przyciemnione (overlay)
- Dialog ma fokus i obsługuje klawisz ESC (anulowanie)

**Stan "Usuwanie w toku":**

- `isDeleting === true`
- Przycisk "Usuń" w dialogu jest wyłączony i pokazuje "Usuwanie..."
- Dialog nie może być zamknięty (ESC zablokowane)
- Przycisk "Anuluj" może być wyłączony (w zależności od projektu UX)

**Stan "Błąd usuwania":**

- `deleteError !== null`
- Wyświetlany jest komunikat błędu w dialogu
- Dialog pozostaje otwarty
- Przycisk "Usuń" jest ponownie aktywny

**Stan "Przycisk Usuń nieaktywny w formularzu":**

- `isSubmitting === true` LUB `isDeleting === true`
- Przycisk "Usuń" w sekcji akcji formularza jest wyłączony

### Walidacja po stronie frontendu:

**Brak walidacji przed wysłaniem requestu:**

- Wszystkie walidacje są wykonywane po stronie API
- Frontend nie wymaga żadnych dodatkowych walidacji przed usunięciem

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

**Przeliczanie statystyk:**

- System automatycznie przelicza statystyki dla wszystkich kolejnych wpisów
- Liczba zaktualizowanych wpisów jest zwracana w odpowiedzi (`updated_entries_count`)

## 10. Obsługa błędów

### Błąd 400 Bad Request

**Przyczyna:** Nieprawidłowy format UUID w parametrach ścieżki

**Obsługa:**

1. Wyświetlenie komunikatu błędu w dialogu: "Nieprawidłowy format identyfikatora"
2. Dialog pozostaje otwarty
3. Użytkownik może anulować i spróbować ponownie (jeśli poprawi URL)

### Błąd 401 Unauthorized

**Przyczyna:** Brak tokenu uwierzytelnienia lub nieprawidłowy token

**Obsługa:**

1. Dialog zostaje zamknięty
2. Wyświetlenie komunikatu: "Wymagana autoryzacja. Przekierowywanie..."
3. Automatyczne przekierowanie do `/login` po 2 sekundach

### Błąd 404 Not Found

**Przyczyna:** Tankowanie nie istnieje lub nie należy do użytkownika/samochodu

**Obsługa:**

1. Dialog zostaje zamknięty
2. Wyświetlenie komunikatu: "Tankowanie nie zostało znalezione. Przekierowywanie..."
3. Automatyczne przekierowanie do `/cars/{carId}/fillups` po 3 sekundach

### Błąd 500 Internal Server Error

**Przyczyna:** Błąd po stronie serwera

**Obsługa:**

1. Wyświetlenie komunikatu błędu w dialogu: "Wystąpił błąd serwera. Spróbuj ponownie później."
2. Dialog pozostaje otwarty
3. Przycisk "Usuń" zostaje ponownie aktywny
4. Użytkownik może spróbować ponownie lub anulować

### Timeout połączenia

**Przyczyna:** Przekroczony limit czasu połączenia (10 sekund)

**Obsługa:**

1. Wyświetlenie komunikatu błędu w dialogu: "Przekroczono limit czasu połączenia. Spróbuj ponownie."
2. Dialog pozostaje otwarty
3. Przycisk "Usuń" zostaje ponownie aktywny
4. Użytkownik może spróbować ponownie

### Brak połączenia sieciowego

**Przyczyna:** Brak połączenia z internetem

**Obsługa:**

1. Wyświetlenie komunikatu błędu w dialogu: "Nie udało się połączyć z serwerem. Sprawdź połączenie internetowe."
2. Dialog pozostaje otwarty
3. Przycisk "Usuń" zostaje ponownie aktywny
4. Użytkownik może spróbować ponownie gdy połączenie wróci

### Inne błędy

**Przyczyna:** Nieoczekiwane błędy (niezdefiniowane statusy)

**Obsługa:**

1. Wyświetlenie ogólnego komunikatu błędu z kodem statusu w dialogu
2. Dialog pozostaje otwarty
3. Logowanie szczegółów błędu w konsoli do debugowania

## 11. Kroki implementacji

1. **Rozszerzenie custom hook `useEditFillupForm`**
   - Plik: `src/lib/hooks/useEditFillupForm.ts`
   - Dodanie nowego stanu:
     - `isDeleteDialogOpen: boolean`
     - `isDeleting: boolean`
     - `deleteError: string | null`
   - Implementacja funkcji:
     - `handleDeleteClick()` - otwarcie dialogu
     - `handleDeleteCancel()` - zamknięcie dialogu
     - `handleDeleteConfirm()` - wykonanie DELETE request do API
   - Obsługa błędów (401, 404, 500, timeout, brak połączenia)
   - Przekierowanie po sukcesie do `/cars/{carId}/fillups`
   - Zwracanie nowych wartości w interfejsie hook

2. **Utworzenie komponentu `DeleteFillupDialog`**
   - Plik: `src/components/cars/DeleteFillupDialog.tsx`
   - Wzorowanie na `DeleteCarDialog.tsx`, ale bez pola potwierdzenia (prostszy dialog)
   - Implementacja:
     - Modal overlay z półprzezroczystym tłem
     - Kontener dialogu z tytułem i opisem
     - Komunikat o nieodwracalności operacji
     - Informacja o automatycznym przeliczeniu statystyk
     - Przyciski "Anuluj" i "Usuń"
     - Wyświetlanie błędów (jeśli występują)
     - Obsługa ESC do anulowania (gdy nie trwa usuwanie)
   - Wykorzystanie komponentów z Shadcn/ui jeśli dostępne (AlertDialog) lub własna implementacja

3. **Rozszerzenie komponentu `EditFillupView`**
   - Plik: `src/components/cars/EditFillupView.tsx`
   - Dodanie przycisku "Usuń" w sekcji akcji formularza
   - Integracja z hookiem (wywołanie nowych funkcji)
   - Renderowanie `DeleteFillupDialog` warunkowo na podstawie `isDeleteDialogOpen`
   - Wyłączenie przycisku "Usuń" podczas zapisywania (`isSubmitting`) i usuwania (`isDeleting`)
   - Import ikony `Trash2` z lucide-react (opcjonalnie)
   - Stylizacja przycisku (czerwony kolor, variant="destructive" lub custom)

4. **Testy implementacji**
   - Test otwarcia dialogu po kliknięciu przycisku "Usuń"
   - Test anulowania dialogu (przycisk "Anuluj" i ESC)
   - Test pomyślnego usunięcia z przekierowaniem
   - Test obsługi błędów (400, 401, 404, 500)
   - Test timeoutu połączenia
   - Test braku połączenia sieciowego
   - Test wyłączenia przycisku podczas zapisywania i usuwania
   - Test wyświetlania komunikatu o liczbie zaktualizowanych wpisów (jeśli zaimplementowany)
   - Test zgodności z User Story US-011

5. **Dostosowanie stylów i dostępności (ARIA)**
   - Sprawdzenie zgodności z wytycznymi dostępności dla dialogów
   - Dodanie odpowiednich atrybutów ARIA:
     - `role="dialog"`
     - `aria-labelledby` dla tytułu dialogu
     - `aria-describedby` dla opisu dialogu
     - `aria-modal="true"`
     - `aria-busy` dla przycisku podczas usuwania
   - Obsługa trap focus w dialogu (fokus pozostaje w dialogu)
   - Obsługa ESC do zamknięcia (gdy nie trwa usuwanie)

6. **Dokumentacja i code review**
   - Sprawdzenie zgodności z PRD (US-011)
   - Sprawdzenie zgodności z istniejącymi konwencjami projektu
   - Sprawdzenie zgodności z wytycznymi dostępności (ARIA)
   - Finalizacja implementacji
