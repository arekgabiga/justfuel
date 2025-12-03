# Plan implementacji widoku Lista Samochodów

## 1. Przegląd

Widok Lista Samochodów (`/cars`) to główny ekran aplikacji JustFuel, który wyświetla wszystkie samochody użytkownika w formie responsywnych kart. Każda karta prezentuje kluczowe metryki samochodu (średnie spalanie, całkowity koszt, dystans, liczba tankowań) i umożliwia przejście do widoku szczegółowego. Widok zawiera również przycisk do dodawania nowych samochodów oraz obsługuje sortowanie i różne stany (ładowanie, błąd, pusty stan).

## 2. Routing widoku

- **Ścieżka**: `/cars`
- **Plik**: `src/pages/cars.astro`
- **Dostępność**: Po zalogowaniu (wymagana autoryzacja)
- **Nawigacja**: Główny ekran aplikacji, dostępny z menu nawigacyjnego

## 3. Struktura komponentów

```
CarsListView (Astro page)
├── CarsListHeader
│   ├── PageTitle
│   └── AddCarButton
├── CarsGrid
│   └── CarCard (xN)
│       ├── CarName
│       ├── CarStatistics
│       │   ├── AverageConsumption
│       │   ├── TotalCost
│       │   ├── TotalDistance
│       │   └── FillupCount
│       └── CarActions
├── EmptyState (conditional)
├── LoadingState (conditional)
└── ErrorState (conditional)
```

## 4. Szczegóły komponentów

### CarsListView

- **Opis**: Główny kontener widoku, strona Astro z integracją React
- **Główne elementy**: Layout, header, grid, stany warunkowe
- **Obsługiwane interakcje**: Nawigacja, zarządzanie stanem
- **Obsługiwana walidacja**: Walidacja autoryzacji, walidacja danych API
- **Typy**: `CarsListState`, `CarWithStatisticsDTO[]`
- **Propsy**: Brak (komponent główny)

### CarsListHeader

- **Opis**: Nagłówek z tytułem strony i przyciskiem dodawania samochodu
- **Główne elementy**: `h1`, `AddCarButton`
- **Obsługiwane interakcje**: Kliknięcie przycisku → nawigacja do `/cars/new`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### AddCarButton

- **Opis**: Przycisk do dodawania nowego samochodu
- **Główne elementy**: `Button` (shadcn/ui), ikona plus
- **Obsługiwane interakcje**: `onClick` → nawigacja do formularza dodawania
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### CarsGrid

- **Opis**: Responsywna siatka kart samochodów
- **Główne elementy**: `div` z grid layout, `CarCard` komponenty
- **Obsługiwane interakcje**: Brak (deleguje do CarCard)
- **Obsługiwana walidacja**: Brak
- **Typy**: `CarWithStatisticsDTO[]`
- **Propsy**: `cars: CarWithStatisticsDTO[]`

### CarCard

- **Opis**: Karta pojedynczego samochodu z podstawowymi informacjami
- **Główne elementy**: `div` (karta), `CarName`, `CarStatistics`, hover effects
- **Obsługiwane interakcje**: `onClick` → nawigacja do `/cars/{carId}`, hover states
- **Obsługiwana walidacja**: Walidacja danych samochodu
- **Typy**: `CarWithStatisticsDTO`
- **Propsy**: `car: CarWithStatisticsDTO`, `onClick: (carId: string) => void`

### CarName

- **Opis**: Wyświetlanie nazwy samochodu
- **Główne elementy**: `h3` z nazwą
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja długości nazwy
- **Typy**: `string`
- **Propsy**: `name: string`

### CarStatistics

- **Opis**: Kontener z kluczowymi metrykami samochodu
- **Główne elementy**: `div` z metrykami, `AverageConsumption`, `TotalCost`, `TotalDistance`, `FillupCount`
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja wartości numerycznych
- **Typy**: `CarStatisticsView`
- **Propsy**: `statistics: CarStatisticsView`

### AverageConsumption

- **Opis**: Wyświetlanie średniego spalania z kolorowym wskaźnikiem
- **Główne elementy**: `span` z wartością i jednostką, kolorowy wskaźnik
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja wartości numerycznej, zakresu
- **Typy**: `number | null`
- **Propsy**: `value: number | null`, `average: number | null`

### TotalCost

- **Opis**: Wyświetlanie całkowitego kosztu paliwa
- **Główne elementy**: `span` z wartością i walutą
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja wartości numerycznej
- **Typy**: `number | null`
- **Propsy**: `value: number | null`

### TotalDistance

- **Opis**: Wyświetlanie całkowitego dystansu
- **Główne elementy**: `span` z wartością i jednostką
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja wartości numerycznej
- **Typy**: `number | null`
- **Propsy**: `value: number | null`

### FillupCount

- **Opis**: Wyświetlanie liczby tankowań
- **Główne elementy**: `span` z wartością i etykietą
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Walidacja wartości całkowitej
- **Typy**: `number | null`
- **Propsy**: `value: number | null`

### EmptyState

- **Opis**: Komunikat dla pustego stanu (brak samochodów)
- **Główne elementy**: `div` z ikoną, tytułem, opisem i przyciskiem
- **Obsługiwane interakcje**: Kliknięcie przycisku → nawigacja do `/cars/new`
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: `onAddCar: () => void`

### LoadingState

- **Opis**: Stan ładowania podczas pobierania danych
- **Główne elementy**: `div` z spinnerem i tekstem
- **Obsługiwane interakcje**: Brak
- **Obsługiwana walidacja**: Brak
- **Typy**: Brak
- **Propsy**: Brak

### ErrorState

- **Opis**: Stan błędu z możliwością ponowienia
- **Główne elementy**: `div` z ikoną błędu, komunikatem i przyciskiem retry
- **Obsługiwane interakcje**: Kliknięcie retry → ponowne pobranie danych
- **Obsługiwana walidacja**: Brak
- **Typy**: `Error`
- **Propsy**: `error: Error`, `onRetry: () => void`

## 5. Typy

### CarCardViewModel

```typescript
interface CarCardViewModel {
  id: string;
  name: string;
  statistics: {
    total_fuel_cost: number | null;
    total_fuel_amount: number | null;
    total_distance: number | null;
    average_consumption: number | null;
    average_price_per_liter: number | null;
    fillup_count: number | null;
  };
  created_at: string;
}
```

### CarsListState

```typescript
interface CarsListState {
  loading: boolean;
  error: Error | null;
  cars: CarWithStatisticsDTO[];
  sortBy: 'name' | 'created_at';
  sortOrder: 'asc' | 'desc';
}
```

### SortOption

```typescript
interface SortOption {
  value: 'name' | 'created_at';
  label: string;
}
```

### ConsumptionColor

```typescript
type ConsumptionColor = 'green' | 'yellow' | 'red' | 'gray';
```

## 6. Zarządzanie stanem

Widok wykorzystuje custom hook `useCarsList` do zarządzania stanem:

```typescript
const useCarsList = () => {
  const [state, setState] = useState<CarsListState>({
    loading: true,
    error: null,
    cars: [],
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const fetchCars = async (sortBy: string, sortOrder: string) => {
    // Implementacja pobierania danych
  };

  const handleSortChange = (sortBy: string, sortOrder: string) => {
    // Implementacja zmiany sortowania
  };

  const handleRetry = () => {
    // Implementacja ponowienia przy błędzie
  };

  return {
    ...state,
    fetchCars,
    handleSortChange,
    handleRetry,
  };
};
```

## 7. Integracja API

### Wywołanie API

```typescript
const fetchCars = async (sortBy: string, sortOrder: string) => {
  const response = await fetch(`/api/cars?sort=${sortBy}&order=${sortOrder}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data: ListResponseDTO<CarWithStatisticsDTO> = await response.json();
  return data.data;
};
```

### Typy żądania i odpowiedzi

- **Żądanie**: `GET /api/cars?sort={sortBy}&order={sortOrder}`
- **Odpowiedź**: `ListResponseDTO<CarWithStatisticsDTO>`
- **Autoryzacja**: Bearer token w headerze Authorization

## 8. Interakcje użytkownika

### Kliknięcie na kartę samochodu

- **Akcja**: Nawigacja do `/cars/{carId}`
- **Implementacja**: `onClick` handler w `CarCard`
- **Walidacja**: Sprawdzenie czy `carId` jest prawidłowy

### Kliknięcie "Dodaj samochód"

- **Akcja**: Nawigacja do `/cars/new`
- **Implementacja**: `onClick` handler w `AddCarButton`
- **Walidacja**: Brak

### Zmiana sortowania

- **Akcja**: Ponowne pobranie danych z nowymi parametrami
- **Implementacja**: `handleSortChange` w `useCarsList`
- **Walidacja**: Walidacja parametrów sortowania

### Retry przy błędzie

- **Akcja**: Ponowne pobranie danych
- **Implementacja**: `handleRetry` w `useCarsList`
- **Walidacja**: Sprawdzenie stanu błędu

## 9. Warunki i walidacja

### Walidacja autoryzacji

- **Komponent**: `CarsListView`
- **Warunek**: Sprawdzenie obecności Bearer token
- **Wpływ**: Przekierowanie do logowania przy braku autoryzacji

### Walidacja danych samochodu

- **Komponent**: `CarCard`
- **Warunki**:
  - `name` nie może być pusty
  - `statistics` muszą być prawidłowymi liczbami
  - `created_at` musi być prawidłową datą
- **Wpływ**: Ukrycie nieprawidłowych danych

### Walidacja wartości numerycznych

- **Komponenty**: `AverageConsumption`, `TotalCost`, `TotalDistance`, `FillupCount`
- **Warunki**:
  - Wartości muszą być liczbami
  - Wartości nie mogą być ujemne
  - `average_consumption` w zakresie 0-50 L/100km
- **Wpływ**: Wyświetlenie "N/A" dla nieprawidłowych wartości

### Walidacja parametrów sortowania

- **Komponent**: `useCarsList`
- **Warunki**:
  - `sortBy` musi być 'name' lub 'created_at'
  - `sortOrder` musi być 'asc' lub 'desc'
- **Wpływ**: Użycie domyślnych wartości przy błędzie

## 10. Obsługa błędów

### Błąd autoryzacji (401)

- **Obsługa**: Przekierowanie do strony logowania
- **Komunikat**: "Sesja wygasła. Zaloguj się ponownie."
- **Akcja**: Automatyczne przekierowanie

### Błąd sieci

- **Obsługa**: Wyświetlenie `ErrorState` z przyciskiem retry
- **Komunikat**: "Nie udało się pobrać danych. Sprawdź połączenie internetowe."
- **Akcja**: Przycisk "Spróbuj ponownie"

### Błąd serwera (500)

- **Obsługa**: Wyświetlenie `ErrorState` z przyciskiem retry
- **Komunikat**: "Wystąpił błąd serwera. Spróbuj ponownie za chwilę."
- **Akcja**: Przycisk "Spróbuj ponownie"

### Pusty stan

- **Obsługa**: Wyświetlenie `EmptyState`
- **Komunikat**: "Nie masz jeszcze żadnych samochodów. Dodaj pierwszy samochód, aby rozpocząć śledzenie zużycia paliwa."
- **Akcja**: Przycisk "Dodaj samochód"

### Błąd walidacji danych

- **Obsługa**: Filtrowanie nieprawidłowych danych, wyświetlenie ostrzeżenia
- **Komunikat**: "Niektóre dane mogą być nieprawidłowe."
- **Akcja**: Kontynuacja z dostępnymi danymi

## 11. Kroki implementacji

1. **Utworzenie strony Astro**
   - Stworzenie pliku `src/pages/cars.astro`
   - Konfiguracja layoutu i meta danych
   - Integracja z systemem autoryzacji

2. **Implementacja custom hook**
   - Stworzenie `src/lib/hooks/useCarsList.ts`
   - Implementacja logiki pobierania danych
   - Obsługa stanów loading, error, success

3. **Utworzenie komponentów React**
   - `CarsListHeader` - nagłówek z przyciskiem
   - `CarsGrid` - siatka kart
   - `CarCard` - pojedyncza karta samochodu
   - `CarStatistics` - komponenty metryk
   - `EmptyState`, `LoadingState`, `ErrorState`

4. **Implementacja logiki sortowania**
   - Dodanie opcji sortowania w headerze
   - Implementacja `handleSortChange`
   - Aktualizacja URL z parametrami

5. **Stylowanie z Tailwind CSS**
   - Responsywny grid layout
   - Hover effects na kartach
   - Kolorowe wskaźniki spalania
   - Mobile-first design

6. **Integracja z Shadcn/ui**
   - Użycie komponentu `Button`
   - Implementacja spinnera ładowania
   - Ikony dla różnych stanów

7. **Implementacja nawigacji**
   - Router do widoku szczegółowego
   - Router do formularza dodawania
   - Breadcrumbs (opcjonalnie)

8. **Testowanie i optymalizacja**
   - Testy jednostkowe komponentów
   - Testy integracyjne z API
   - Optymalizacja wydajności
   - Testy dostępności

9. **Obsługa błędów i edge cases**
   - Implementacja wszystkich scenariuszy błędów
   - Obsługa pustego stanu
   - Walidacja danych

10. **Finalizacja i dokumentacja**
    - Dokumentacja komponentów
    - Przykłady użycia
    - Instrukcje dla innych deweloperów
