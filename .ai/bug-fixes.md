# Plan napraw błędów - JustFuel

## Przegląd

Ten dokument zawiera szczegółowy plan naprawy wszystkich błędów zidentyfikowanych w pliku `bugs.md`. Dla każdego błędu określono:

- Wpływ na użytkownika
- Potrzebne zmiany w kodzie
- Endpointy API i widoki zaangażowane
- Szczegółowe kroki implementacji

---

## BUG-1: Strona główna powinna być listą samochodów

### Opis problemu

Obecna strona główna (`/`) wyświetla komponent `Welcome`, który jest stroną demo. Po wejściu do aplikacji, główna strona powinna być listą samochodów.

### Wpływ na użytkownika

- Użytkownik widzi niepotrzebną stronę demo zamiast głównej funkcjonalności aplikacji
- Utrudnia to dostęp do listy samochodów

### Zaangażowane pliki

- `src/pages/index.astro` - strona główna
- `src/pages/cars.astro` - istniejąca strona z listą samochodów
- `src/components/Welcome.astro` - komponent demo (można usunąć lub przenieść)

### Endpointy API

- `GET /api/cars` - już używany przez `CarsListView`

### Kroki naprawcze

1. **Zmodyfikuj `src/pages/index.astro`**
   - Usuń import `Welcome`
   - Zaimportuj `CarsListView` z `../components/cars/CarsListView.tsx`
   - Zastąp `<Welcome />` komponentem `<CarsListView client:load />`
   - Zaktualizuj meta dane (title, description) na odpowiednie dla listy samochodów

2. **Opcjonalnie: Przekierowanie z `/cars` na `/`**
   - Rozważ przekierowanie z `/cars` na `/` jeśli chcesz, aby `/` była jedyną ścieżką do listy samochodów
   - Lub pozostaw obie ścieżki działające

3. **Aktualizacja nawigacji**
   - Sprawdź wszystkie miejsca w kodzie, które odwołują się do `/cars` jako głównej strony
   - Zaktualizuj breadcrumbs i linki nawigacyjne, jeśli potrzebne

### Przykładowa implementacja

```typescript
// src/pages/index.astro
---
import Layout from "../layouts/Layout.astro";
import CarsListView from "../components/cars/CarsListView.tsx";

const title = "Lista Samochodów - JustFuel";
const description = "Zarządzaj swoimi samochodami i śledź zużycie paliwa";
---

<Layout title={title} description={description}>
  <main class="container mx-auto px-4 py-8">
    <CarsListView client:load />
  </main>
</Layout>
```

---

## BUG-2: Powrót po dodaniu/edycji tankowania powinien być na /cars/{carId} z zakładką fillups

### Opis problemu

Po dodaniu lub edycji tankowania, użytkownik jest przekierowywany na `/cars/{carId}/fillups`, podczas gdy powinien wrócić na `/cars/{carId}` z aktywną zakładką "fillups".

### Wpływ na użytkownika

- Użytkownik trafia na dedykowaną stronę fillups zamiast na widok szczegółów samochodu
- Brak spójności w nawigacji - tankowania powinny być widoczne tylko w zakładce

### Zaangażowane pliki

- `src/lib/hooks/useNewFillupForm.ts` - hook do formularza dodawania tankowania
- `src/lib/hooks/useEditFillupForm.ts` - hook do formularza edycji tankowania
- `src/components/cars/CarDetailsView.tsx` - widok szczegółów samochodu z zakładkami
- `src/pages/cars/[carId]/fillups.astro` - dedykowana strona fillups (może być niepotrzebna)

### Endpointy API

- `POST /api/cars/{carId}/fillups` - tworzenie tankowania
- `PATCH /api/cars/{carId}/fillups/{fillupId}` - aktualizacja tankowania

### Kroki naprawcze

1. **Zmodyfikuj `useNewFillupForm.ts`**
   - Znajdź miejsce, gdzie następuje redirect po sukcesie (około linii 546-564)
   - Zmień `window.location.href = `/cars/${carId}/fillups`;` na `window.location.href = `/cars/${carId}`;`
   - Dodaj parametr query string `?tab=fillups` jeśli `CarDetailsView` używa query params do zarządzania zakładkami
   - Lub użyj hash `#fillups` jeśli zakładki są zarządzane przez hash

2. **Zmodyfikuj `useEditFillupForm.ts`**
   - Znajdź miejsce, gdzie następuje redirect po sukcesie (około linii 695-712)
   - Zmień `window.location.href = `/cars/${carId}/fillups`;` na `window.location.href = `/cars/${carId}`;`
   - Dodaj ten sam parametr/hash jak wyżej

3. **Sprawdź `CarDetailsView.tsx`**
   - Upewnij się, że komponent obsługuje aktywację zakładki przez URL (query param lub hash)
   - Jeśli nie obsługuje, dodaj logikę do odczytu parametru z URL i ustawienia aktywnej zakładki przy mount

4. **Opcjonalnie: Usuń dedykowaną stronę fillups**
   - Jeśli `/cars/{carId}/fillups` nie jest już potrzebna, rozważ jej usunięcie
   - Upewnij się, że wszystkie linki wskazują na `/cars/{carId}` z zakładką

### Przykładowa implementacja

```typescript
// W useNewFillupForm.ts i useEditFillupForm.ts
// Zmień redirect z:
window.location.href = `/cars/${carId}/fillups`;

// Na:
window.location.href = `/cars/${carId}?tab=fillups`;
// lub
window.location.href = `/cars/${carId}#fillups`;

// W CarDetailsView.tsx - dodaj obsługę parametru URL
useEffect(() => {
  const urlParams = new URLSearchParams(window.location.search);
  const tab = urlParams.get("tab");
  if (tab === "fillups" || tab === "charts") {
    switchMainTab(tab);
  }
}, []);
```

---

## BUG-3 i BUG-4: Breadcrumbs nie mieszczą się na ekranach mobilnych

### Opis problemu

Breadcrumbs są zbyt długie i nie mieszczą się na ekranach mobilnych. Powinny być uproszczone do: `/Auta`, `/Auta/{nazwa_auta}`, ewentualnie `/Auta/{nazwa_auta}/Tankowanie`.

### Wpływ na użytkownika

- Breadcrumbs są nieczytelne na małych ekranach
- Utrudnia to nawigację na urządzeniach mobilnych

### Zaangażowane pliki

- `src/components/cars/Breadcrumbs.tsx` - główny komponent breadcrumbs
- `src/components/cars/CarDetailsView.tsx` - używa breadcrumbs
- `src/components/cars/FillupsView.tsx` - używa breadcrumbs
- `src/components/cars/EditCarView.tsx` - ma własną implementację breadcrumbs
- `src/components/cars/CarsListHeader.tsx` - ma własną implementację breadcrumbs

### Endpointy API

- Brak zmian w API

### Kroki naprawcze

1. **Uprość `Breadcrumbs.tsx`**
   - Usuń niepotrzebne elementy (np. "Strona główna")
   - Zostaw tylko: "Auta" → "{nazwa_auta}" → (opcjonalnie) "Tankowanie"
   - Dodaj responsywne style dla mobile (np. `truncate`, `max-w-[...]`)
   - Użyj skróconych nazw na małych ekranach

2. **Zaktualizuj `EditCarView.tsx`**
   - Zastąp własną implementację breadcrumbs komponentem `Breadcrumbs`
   - Lub uprość własną implementację do tego samego formatu

3. **Zaktualizuj `CarsListHeader.tsx`**
   - Uprość breadcrumbs do tylko "Auta" (bez "Strona główna")
   - Lub całkowicie usuń breadcrumbs z tego widoku (lista samochodów nie potrzebuje breadcrumbs)

4. **Dodaj responsywne style**
   - Użyj Tailwind classes: `truncate`, `max-w-[...]`, `text-sm` na mobile
   - Rozważ ukrycie niektórych elementów na bardzo małych ekranach

### Przykładowa implementacja

```typescript
// src/components/cars/Breadcrumbs.tsx
export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ carName, showFillups = false, carId }) => {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 overflow-x-auto">
        <li className="flex-shrink-0">
          <a
            href="/cars"
            onClick={(e) => {
              e.preventDefault();
              if (typeof window !== "undefined") {
                window.location.href = "/cars";
              }
            }}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
          >
            Auta
          </a>
        </li>
        <li className="flex-shrink-0">
          <span className="mx-2">/</span>
        </li>
        {showFillups && carId ? (
          <>
            <li className="flex-shrink-0 min-w-0">
              <a
                href={`/cars/${carId}`}
                onClick={(e) => {
                  e.preventDefault();
                  if (typeof window !== "undefined") {
                    window.location.href = `/cars/${carId}`;
                  }
                }}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer truncate max-w-[120px] sm:max-w-none"
              >
                {carName}
              </a>
            </li>
            <li className="flex-shrink-0">
              <span className="mx-2">/</span>
            </li>
            <li className="flex-shrink-0 text-gray-900 dark:text-gray-100 font-medium">
              Tankowanie
            </li>
          </>
        ) : (
          <li className="flex-shrink-0 min-w-0 text-gray-900 dark:text-gray-100 font-medium truncate max-w-[200px] sm:max-w-none">
            {carName}
          </li>
        )}
      </ol>
    </nav>
  );
};
```

---

## BUG-5: Dystans przejechany musi mieć dokładność do 2 miejsc po przecinku

### Opis problemu

Pole "Dystans" w formularzu tankowania ma `step="1"`, co pozwala tylko na liczby całkowite. Powinno mieć `step="0.01"` aby umożliwić wprowadzenie wartości z dokładnością do 2 miejsc po przecinku.

### Wpływ na użytkownika

- Użytkownik nie może wprowadzić wartości dziesiętnych dla dystansu
- Ogranicza to precyzję danych o tankowaniach

### Zaangażowane pliki

- `src/components/cars/NewFillupView.tsx` - formularz dodawania tankowania
- `src/components/cars/EditFillupView.tsx` - formularz edycji tankowania

### Endpointy API

- `POST /api/cars/{carId}/fillups` - akceptuje `distance` jako numeric (już obsługuje wartości dziesiętne)
- `PATCH /api/cars/{carId}/fillups/{fillupId}` - akceptuje `distance` jako numeric

### Kroki naprawcze

1. **Zmodyfikuj `NewFillupView.tsx`**
   - Znajdź pole input dla "distance" (około linii 353-376)
   - Zmień `step="1"` na `step="0.01"`
   - Opcjonalnie dodaj `min="0"` jeśli jeszcze nie ma

2. **Zmodyfikuj `EditFillupView.tsx`**
   - Znajdź pole input dla "distance" (około linii 381-404)
   - Zmień `step="1"` na `step="0.01"`
   - Opcjonalnie dodaj `min="0"` jeśli jeszcze nie ma

3. **Sprawdź walidację**
   - Upewnij się, że walidacja w `useNewFillupForm.ts` i `useEditFillupForm.ts` akceptuje wartości dziesiętne
   - Sprawdź, czy formatowanie wartości w polu input obsługuje wartości dziesiętne

### Przykładowa implementacja

```typescript
// W NewFillupView.tsx i EditFillupView.tsx
<Input
  id="distance"
  name="distance"
  type="number"
  min="0"
  step="0.01"  // Zmienione z step="1"
  value={formState.distance}
  onChange={(e) => handleFieldChange("distance", e.target.value)}
  // ... reszta props
/>
```

---

## BUG-6: Tryb wprowadzania przebiegu przy edycji powinien być zgodny z konfiguracją auta

### Opis problemu

Przy edycji tankowania, tryb wprowadzania przebiegu (odometer vs distance) jest zawsze ustawiony na "odometer", niezależnie od preferencji ustawionych w konfiguracji samochodu (`mileage_input_preference`).

### Wpływ na użytkownika

- Użytkownik musi ręcznie przełączać tryb wprowadzania, nawet jeśli ma ustawioną preferencję
- Brak spójności z preferencjami użytkownika

### Zaangażowane pliki

- `src/lib/hooks/useEditFillupForm.ts` - hook do formularza edycji
- `src/components/cars/EditFillupView.tsx` - komponent formularza edycji
- `src/pages/cars/[carId]/fillups/[fillupId]/edit.astro` - strona edycji tankowania

### Endpointy API

- `GET /api/cars/{carId}` - pobiera dane samochodu z `mileage_input_preference`
- `GET /api/cars/{carId}/fillups/{fillupId}` - pobiera dane tankowania

### Kroki naprawcze

1. **Zmodyfikuj `useEditFillupForm.ts`**
   - W funkcji `loadFillupData` (około linii 67-159), pobierz również dane samochodu
   - Użyj `mileage_input_preference` z danych samochodu zamiast hardkodowanego `"odometer"`
   - Ustaw `inputMode` na podstawie `car.mileage_input_preference`

2. **Aktualizuj typy i interfejsy**
   - Upewnij się, że dane samochodu są dostępne w hooku
   - Dodaj fetch dla danych samochodu jeśli jeszcze nie ma

3. **Sprawdź `EditFillupView.tsx`**
   - Upewnij się, że komponent poprawnie wyświetla tryb wprowadzania na podstawie stanu formularza

### Przykładowa implementacja

```typescript
// W useEditFillupForm.ts
useEffect(() => {
  const loadFillupData = async () => {
    try {
      // Pobierz dane samochodu i tankowania równolegle
      const [carResponse, fillupResponse] = await Promise.all([
        fetch(`/api/cars/${carId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
        fetch(`/api/cars/${carId}/fillups/${fillupId}`, {
          headers: {
            Authorization: `Bearer ${authToken}`,
            "Content-Type": "application/json",
          },
        }),
      ]);

      if (!carResponse.ok || !fillupResponse.ok) {
        throw new Error("Failed to fetch data");
      }

      const carData = await carResponse.json();
      const fillupData = await fillupResponse.json();

      // Użyj preferencji z samochodu
      const inputMode = carData.mileage_input_preference || "odometer";

      setOriginalFillupData(fillupData);
      setFormState({
        date: new Date(fillupData.date).toISOString().split("T")[0],
        fuelAmount: fillupData.fuel_amount.toString(),
        totalPrice: fillupData.total_price.toString(),
        inputMode, // Użyj preferencji z samochodu
        odometer: fillupData.odometer?.toString() || "",
        distance: fillupData.distance_traveled?.toString() || "",
      });
      // ... reszta
    } catch (error) {
      // ... obsługa błędów
    }
  };

  loadFillupData();
}, [carId, fillupId]);
```

---

## BUG-7: Kafelek tankowania powinien zawierać Data, Spalanie, Dystans, Cena za litr (bez Licznika)

### Opis problemu

Kafelek z listy tankowań obecnie wyświetla: Data, Spalanie, Dystans, Cena za litr, Licznik. Zgodnie z wymaganiami, powinien wyświetlać tylko: Data, Spalanie, Dystans, Cena za litr. Statystyka "Licznik" powinna zostać usunięta.

### Wpływ na użytkownika

- Kafelek zawiera niepotrzebną informację (Licznik)
- Dystans powinien być zawsze widoczny, nawet jeśli został wyliczony z licznika

### Zaangażowane pliki

- `src/components/cars/FillupCard.tsx` - komponent kafelka tankowania

### Endpointy API

- Brak zmian w API (dane już są dostępne w `FillupDTO`)

### Kroki naprawcze

1. **Zmodyfikuj `FillupCard.tsx`**
   - Usuń sekcję wyświetlającą "Licznik" (około linii 74-77)
   - Upewnij się, że "Dystans" jest zawsze wyświetlany (już jest, ale sprawdź formatowanie)
   - Sprawdź, czy grid ma odpowiednią liczbę kolumn (zmień z `grid-cols-2 md:grid-cols-4` na `grid-cols-2 md:grid-cols-4` - zostaje 4 kolumny)

2. **Sprawdź formatowanie**
   - Upewnij się, że dystans jest zawsze wyświetlany, nawet jeśli `distance_traveled` jest null (powinien pokazać "N/A")
   - Sprawdź, czy formatowanie liczb jest poprawne (2 miejsca po przecinku)

### Przykładowa implementacja

```typescript
// src/components/cars/FillupCard.tsx
export const FillupCard: React.FC<FillupCardProps> = ({ fillup, averageConsumption, onClick }) => {
  // ... funkcje pomocnicze pozostają bez zmian

  return (
    <div
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 p-4"
      onClick={onClick}
      // ... reszta props
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Data</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">{formatDate(fillup.date)}</div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Spalanie</div>
          <div className={`font-medium ${getConsumptionColor(fillup.fuel_consumption, averageConsumption)}`}>
            {formatNumber(fillup.fuel_consumption)} L/100km
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Dystans</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.distance_traveled)} km
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">Cena za litr</div>
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {formatNumber(fillup.price_per_liter)} zł
          </div>
        </div>
        {/* Usunięta sekcja Licznik */}
      </div>
    </div>
  );
};
```

---

## BUG-8: Kafelek samochodu nie powinien mieć przycisku "Zobacz szczegóły"

### Opis problemu

Kafelek samochodu na liście samochodów zawiera przycisk "Zobacz szczegóły", który dubluje akcję wykonywaną po kliknięciu w kafelek.

### Wpływ na użytkownika

- Niepotrzebny element UI, który wprowadza zamieszanie
- Dubluje funkcjonalność już dostępną przez kliknięcie w kafelek

### Zaangażowane pliki

- `src/components/cars/CarCard.tsx` - komponent kafelka samochodu
- `src/components/cars/CarActions.tsx` - komponent z przyciskiem "Zobacz szczegóły"

### Endpointy API

- Brak zmian w API

### Kroki naprawcze

1. **Zmodyfikuj `CarCard.tsx`**
   - Usuń renderowanie komponentu `<CarActions carId={car.id} />` (około linii 34)
   - Usuń import `CarActions` jeśli nie jest używany gdzie indziej

2. **Opcjonalnie: Usuń `CarActions.tsx`**
   - Jeśli komponent nie jest używany w innych miejscach, można go usunąć
   - Lub pozostaw na przyszłość, jeśli może być potrzebny

### Przykładowa implementacja

```typescript
// src/components/cars/CarCard.tsx
export const CarCard: React.FC<CarCardProps> = ({ car, onClick }) => {
  const handleClick = () => {
    onClick(car.id);
  };

  return (
    <div
      className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:-translate-y-1 transform"
      onClick={handleClick}
      // ... reszta props
    >
      <div className="p-6">
        <CarName name={car.name} />
        <CarStatistics statistics={car.statistics} />
        {/* Usunięte: <CarActions carId={car.id} /> */}
      </div>
    </div>
  );
};
```

---

## BUG-9: Średnie spalanie na kafelku samochodu nie powinno mieć kolorowania opartego na wartości

### Opis problemu

Średnie spalanie na kafelku samochodu (`AverageConsumption.tsx`) obecnie używa kolorowania opartego na wartości bezwzględnej (zielony dla ≤6, żółty dla ≤8, czerwony dla >8). To jest średnie spalanie i powinno być wyświetlane w jednym, neutralnym kolorze, bez odniesienia do jakichkolwiek wartości progowych.

**Ważne**: To dotyczy TYLKO średniego spalania na kafelku samochodu. Kolorowanie spalania na kafelkach tankowań (`FillupCard.tsx`), które porównuje spalanie z konkretnego tankowania względem średniej dla danego samochodu, jest poprawne i powinno pozostać bez zmian.

### Wpływ na użytkownika

- Kolorowanie sugeruje ocenę wartości spalania (dobra/zła), podczas gdy to tylko informacja statystyczna
- Może wprowadzać użytkownika w błąd - sugeruje, że pewne wartości są "złe"
- Średnie spalanie to po prostu wartość statystyczna, nie powinna być oceniana kolorem
- Różnica między kolorowaniem średniego spalania (statystyka) a kolorowaniem spalania z konkretnego tankowania (porównanie z średnią) jest myląca

### Zaangażowane pliki

- `src/components/cars/AverageConsumption.tsx` - komponent wyświetlający średnie spalanie na kafelku samochodu
- `src/components/cars/FillupCard.tsx` - **NIE DOTYCZY** - kolorowanie spalania na kafelkach tankowań jest poprawne i pozostaje bez zmian

### Endpointy API

- Brak zmian w API

### Kroki naprawcze

1. **Zmodyfikuj `AverageConsumption.tsx`**
   - Usuń logikę kolorowania opartą na wartości bezwzględnej w funkcji `getConsumptionColor`
   - Zastąp ją prostą logiką, która zwraca zawsze jeden neutralny kolor (np. niebieski, szary, lub kolor z palety aplikacji)
   - Zachowaj tylko sprawdzanie dla wartości null/undefined/nieprawidłowych (dla nich można użyć szarego)

2. **Uprość `getColorClasses`**
   - Usuń niepotrzebne kolory z typu `ConsumptionColor`
   - Zostaw tylko jeden kolor dla prawidłowych wartości i szary dla nieprawidłowych

3. **Sprawdź kolorystykę aplikacji**
   - Użyj koloru pasującego do akcentów w aplikacji (np. niebieski, jeśli to główny kolor akcentowy)
   - Lub użyj neutralnego szarego/niebieskiego

4. **NIE ZMIENIAJ `FillupCard.tsx`**
   - Kolorowanie spalania na kafelkach tankowań jest poprawne - porównuje spalanie z konkretnego tankowania względem średniej dla danego samochodu
   - Ta funkcjonalność powinna pozostać bez zmian

### Przykładowa implementacja

```typescript
// src/components/cars/AverageConsumption.tsx
type ConsumptionColor = "primary" | "gray";

export const AverageConsumption: React.FC<AverageConsumptionProps> = ({ value, average }) => {
  const getConsumptionColor = (consumption: number | null): ConsumptionColor => {
    // Tylko sprawdzenie dla nieprawidłowych wartości
    if (consumption === null || consumption === undefined || isNaN(consumption)) return "gray";
    if (consumption < 0 || consumption > 50) return "gray";
    // Dla wszystkich prawidłowych wartości używamy jednego koloru
    return "primary";
  };

  const getColorClasses = (color: ConsumptionColor) => {
    switch (color) {
      case "primary":
        // Użyj koloru akcentowego z aplikacji (np. niebieski)
        return "text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20";
      case "gray":
        return "text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20";
    }
  };

  const formatValue = (val: number | null) => {
    if (val === null || val === undefined || isNaN(val)) return "N/A";
    if (val < 0 || val > 50) return "N/A";
    return `${val.toFixed(1)} L/100km`;
  };

  const color = getConsumptionColor(value);
  const colorClasses = getColorClasses(color);

  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-600 dark:text-gray-400">Średnie spalanie:</span>
      <span className={`px-2 py-1 rounded-full text-sm font-medium ${colorClasses}`}>
        {formatValue(value)}
      </span>
    </div>
  );
};
```

**Uwaga**:

- Jeśli aplikacja używa innego koloru akcentowego, zastąp `text-blue-600 bg-blue-100` odpowiednimi klasami Tailwind z palety aplikacji.
- Pamiętaj, że `FillupCard.tsx` ma inne kolorowanie (porównanie z średnią) i nie powinno być zmieniane w ramach tego błędu.

---

## BUG-10: Sortowanie samochodów powinno być domyślnie po nazwie, bez możliwości zmiany

### Opis problemu

Użytkownik może sortować listę samochodów według różnych kryteriów (nazwa, data dodania). Zgodnie z wymaganiami, sortowanie powinno być zawsze po nazwie, bez możliwości zmiany przez użytkownika.

### Wpływ na użytkownika

- Niepotrzebna funkcjonalność, która może wprowadzać zamieszanie
- Uproszczenie interfejsu

### Zaangażowane pliki

- `src/components/cars/CarsListHeader.tsx` - zawiera kontrolki sortowania
- `src/components/cars/CarsListView.tsx` - używa `CarsListHeader`
- `src/lib/hooks/useCarsList.ts` - zarządza stanem sortowania
- `src/pages/api/cars.ts` - endpoint API (może wymagać zmiany domyślnego sortowania)

### Endpointy API

- `GET /api/cars?sort=name&order=asc` - endpoint już obsługuje sortowanie

### Kroki naprawcze

1. **Zmodyfikuj `CarsListHeader.tsx`**
   - Usuń sekcję z kontrolkami sortowania (około linii 60-84)
   - Usuń props `sortBy`, `sortOrder`, `onSortChange` z interfejsu
   - Zaktualizuj wywołania komponentu w `CarsListView.tsx`

2. **Zmodyfikuj `CarsListView.tsx`**
   - Usuń przekazywanie props sortowania do `CarsListHeader`
   - Upewnij się, że hook `useCarsList` jest wywoływany z domyślnymi wartościami

3. **Zmodyfikuj `useCarsList.ts`**
   - Zmień domyślne wartości sortowania na `sortBy: "name"`, `sortOrder: "asc"`
   - Usuń funkcję `handleSortChange` lub pozostaw ją, ale nie eksportuj
   - Upewnij się, że `fetchCars` jest wywoływane z `sortBy: "name"`, `sortOrder: "asc"`

4. **Sprawdź endpoint API**
   - Upewnij się, że `GET /api/cars` domyślnie sortuje po nazwie, jeśli nie podano parametrów

### Przykładowa implementacja

```typescript
// src/components/cars/CarsListHeader.tsx
interface CarsListHeaderProps {
  onAddCar: () => void;
  // Usunięte: sortBy, sortOrder, onSortChange
}

export const CarsListHeader: React.FC<CarsListHeaderProps> = ({ onAddCar }) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs - uproszczone */}
      <nav className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
        <span className="text-gray-900 dark:text-gray-100">Auta</span>
      </nav>

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Moje Samochody
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Zarządzaj swoimi samochodami i śledź zużycie paliwa
          </p>
        </div>

        <Button
          onClick={onAddCar}
          className="flex items-center gap-2"
          size="lg"
        >
          <Plus className="h-4 w-4" />
          Dodaj samochód
        </Button>
      </div>
    </div>
  );
};

// src/lib/hooks/useCarsList.ts
export const useCarsList = () => {
  const [state, setState] = useState<CarsListState>({
    loading: true,
    error: null,
    cars: [],
    sortBy: "name", // Zmienione z "created_at"
    sortOrder: "asc", // Zmienione z "desc"
  });

  // Usuń handleSortChange z return, jeśli nie jest używany
  return {
    ...state,
    fetchCars,
    handleRetry,
    handleCarClick,
    handleAddCar,
    // Usunięte: handleSortChange
  };
};
```

---

## BUG-11: Lista tankowań powinna być sortowana po dacie tankowania (date), nie po created_at

### Opis problemu

Lista tankowań powinna być zawsze sortowana po polu `date` (data tankowania), a nie po `created_at` (data utworzenia wpisu w systemie).

### Wpływ na użytkownika

- Tankowania mogą być wyświetlane w nieprawidłowej kolejności czasowej
- Utrudnia to analizę historii tankowań

### Zaangażowane pliki

- `src/lib/services/fillups.service.ts` - serwis do pobierania tankowań
- `src/pages/api/cars/[carId]/fillups.ts` - endpoint API
- `src/lib/validation/fillups.ts` - walidacja parametrów (może zawierać domyślne sortowanie)

### Endpointy API

- `GET /api/cars/{carId}/fillups?sort=date&order=desc` - endpoint już obsługuje sortowanie po `date`

### Kroki naprawcze

1. **Sprawdź `fillups.service.ts`**
   - W funkcji `listFillupsByCar` (około linii 80-221), sprawdź domyślne sortowanie
   - Upewnij się, że domyślnie używa `sort: "date"` (już jest w linii 88)
   - Sprawdź, czy wszystkie zapytania używają `date` zamiast `created_at`

2. **Sprawdź endpoint API**
   - W `src/pages/api/cars/[carId]/fillups.ts`, sprawdź domyślne wartości parametrów
   - Upewnij się, że jeśli `sort` nie jest podany, domyślnie używa `"date"`

3. **Sprawdź walidację**
   - W `src/lib/validation/fillups.ts`, sprawdź schemat walidacji
   - Upewnij się, że domyślna wartość dla `sort` to `"date"`

4. **Sprawdź wywołania API z frontendu**
   - Sprawdź wszystkie miejsca, gdzie wywoływany jest endpoint fillups
   - Upewnij się, że nie przekazują `sort: "created_at"`

### Przykładowa implementacja

```typescript
// src/lib/services/fillups.service.ts - już powinno być poprawne
export async function listFillupsByCar(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  params: ListFillupsParams
): Promise<PaginatedFillupsResponseDTO> {
  const limit = params.limit ?? 20;
  const sort = params.sort ?? "date"; // ✅ Już jest "date"
  const order = params.order ?? "desc";
  // ... reszta
}

// Sprawdź czy gdzieś nie ma użycia created_at
// Wszystkie zapytania powinny używać:
.order(sortColumn, orderCfg) // gdzie sortColumn to "date" lub "odometer", nigdy "created_at"
```

**Uwaga**: Jeśli problem nadal występuje, sprawdź wszystkie miejsca w kodzie, gdzie są wywoływane zapytania do fillups i upewnij się, że używają `date` jako pola sortowania.

---

## BUG-12: Operacje na tankowaniach powinny opierać się na polu "date", nie "odometer"

### Opis problemu

W `fillups.service.ts`, operacje wymagające znalezienia poprzedniego tankowania lub historii tankowań opierają się na polu `odometer` zamiast `date`. Powinny używać `date`, aby mieć pewność, że znajdujemy poprzednie tankowanie w czasie.

### Wpływ na użytkownika

- W przypadku błędów w danych (np. odometer został zresetowany, lub są nieprawidłowe wartości), system może znaleźć nieprawidłowe poprzednie tankowanie
- Przeliczanie statystyk po aktualizacji może być nieprawidłowe

### Zaangażowane pliki

- `src/lib/services/fillups.service.ts` - główny plik z logiką biznesową

### Endpointy API

- `POST /api/cars/{carId}/fillups` - tworzenie tankowania
- `PATCH /api/cars/{carId}/fillups/{fillupId}` - aktualizacja tankowania
- `DELETE /api/cars/{carId}/fillups/{fillupId}` - usuwanie tankowania

### Kroki naprawcze

1. **Zmodyfikuj `createFillup`**
   - Znajdź zapytanie do poprzedniego tankowania (około linii 346-352)
   - Zmień sortowanie z `.order("odometer", { ascending: false })` na `.order("date", { ascending: false })`
   - Zmień warunek z `.lt("odometer", ...)` na `.lt("date", ...)` jeśli jest używany
   - Upewnij się, że używa `date` do znajdowania poprzedniego tankowania

2. **Zmodyfikuj `updateFillup`**
   - Znajdź wszystkie zapytania do poprzednich/następnych tankowań
   - Zmień sortowanie z `.order("odometer", ...)` na `.order("date", ...)`
   - Zmień warunki filtrowania z odometer na date
   - W szczególności:
     - Zapytanie do poprzedniego tankowania przy aktualizacji z `distance` (około linii 600-607)
     - Zapytanie do następnych tankowań przy przeliczaniu statystyk (około linii 666-671)

3. **Zmodyfikuj `deleteFillup`**
   - Znajdź zapytanie do następnych tankowań (około linii 811)
   - Zmień sortowanie z `.order("odometer", { ascending: true })` na `.order("date", { ascending: true })`
   - Zmień warunek z `.gt("odometer", ...)` na `.gt("date", ...)`

4. **Sprawdź wszystkie miejsca używające odometer do sortowania**
   - Użyj grep do znalezienia wszystkich `.order("odometer"` w pliku
   - Zamień na `.order("date"` gdzie jest to odpowiednie
   - Upewnij się, że warunki filtrowania również używają `date`

### Przykładowa implementacja

```typescript
// src/lib/services/fillups.service.ts

// W createFillup - zmień:
const { data: previousFillup, error: previousError } = await supabase
  .from("fillups")
  .select("odometer, date")
  .eq("car_id", carId)
  .order("date", { ascending: false }) // ✅ Zmienione z "odometer"
  .limit(1)
  .maybeSingle();

// W updateFillup - przy aktualizacji z distance, zmień:
const { data: previousFillup, error: prevError } = await supabase
  .from("fillups")
  .select("odometer")
  .eq("car_id", carId)
  .lt("date", existingFillup.date) // ✅ Zmienione z .lt("odometer", ...)
  .order("date", { ascending: false }) // ✅ Zmienione z "odometer"
  .limit(1)
  .maybeSingle();

// W updateFillup - przy przeliczaniu następnych tankowań, zmień:
const { data: subsequentFillups, error: subsequentError } = await supabase
  .from("fillups")
  .select("id, odometer, fuel_amount, total_price, distance_traveled")
  .eq("car_id", carId)
  .gt("date", updatedFillup.date) // ✅ Zmienione z .gt("odometer", ...)
  .order("date", { ascending: true }); // ✅ Zmienione z "odometer"

// W deleteFillup - zmień:
const { data: subsequentFillups, error: subsequentError } = await supabase
  .from("fillups")
  .select("id, odometer, fuel_amount, total_price, distance_traveled, date")
  .eq("car_id", carId)
  .gt("date", deletedFillup.date) // ✅ Zmienione z .gt("odometer", ...)
  .order("date", { ascending: true }); // ✅ Zmienione z "odometer"
```

**Ważne uwagi:**

- Po zmianie sortowania na `date`, upewnij się, że logika przeliczania `distance_traveled` nadal działa poprawnie
- Sprawdź, czy nie ma przypadków, gdzie odometer jest używany do porównań czasowych (powinien być używany tylko do obliczeń matematycznych)
- Przetestuj scenariusze z tankowaniami w różnych kolejnościach czasowych

---

## Podsumowanie zmian

### Pliki do modyfikacji (Frontend)

1. `src/pages/index.astro` - zmiana strony głównej
2. `src/lib/hooks/useNewFillupForm.ts` - zmiana redirectu
3. `src/lib/hooks/useEditFillupForm.ts` - zmiana redirectu i trybu wprowadzania
4. `src/components/cars/CarDetailsView.tsx` - obsługa parametru URL dla zakładki
5. `src/components/cars/Breadcrumbs.tsx` - uproszczenie breadcrumbs
6. `src/components/cars/EditCarView.tsx` - uproszczenie breadcrumbs
7. `src/components/cars/CarsListHeader.tsx` - usunięcie sortowania i uproszczenie breadcrumbs
8. `src/components/cars/NewFillupView.tsx` - zmiana step dla dystansu
9. `src/components/cars/EditFillupView.tsx` - zmiana step dla dystansu
10. `src/components/cars/FillupCard.tsx` - usunięcie "Licznik"
11. `src/components/cars/CarCard.tsx` - usunięcie przycisku "Zobacz szczegóły"
12. `src/components/cars/AverageConsumption.tsx` - zmiana koloru z czerwonego
13. `src/components/cars/CarsListView.tsx` - usunięcie props sortowania
14. `src/lib/hooks/useCarsList.ts` - zmiana domyślnego sortowania

### Pliki do modyfikacji (Backend)

1. `src/lib/services/fillups.service.ts` - zmiana sortowania z odometer na date we wszystkich operacjach

### Pliki do usunięcia (opcjonalnie)

1. `src/components/cars/CarActions.tsx` - jeśli nie jest używany gdzie indziej
2. `src/components/Welcome.astro` - jeśli nie jest potrzebny
3. `src/pages/cars/[carId]/fillups.astro` - jeśli tankowania będą tylko w zakładce

### Testy do wykonania

1. Sprawdź, czy strona główna wyświetla listę samochodów
2. Sprawdź, czy po dodaniu/edycji tankowania użytkownik wraca na `/cars/{carId}` z zakładką fillups
3. Sprawdź breadcrumbs na różnych rozdzielczościach ekranu
4. Sprawdź, czy można wprowadzić wartość dziesiętną dla dystansu
5. Sprawdź, czy tryb wprowadzania przy edycji jest zgodny z konfiguracją auta
6. Sprawdź, czy kafelek tankowania nie zawiera "Licznik"
7. Sprawdź, czy kafelek samochodu nie ma przycisku "Zobacz szczegóły"
8. Sprawdź, czy średnie spalanie nie jest czerwone
9. Sprawdź, czy lista samochodów jest sortowana po nazwie
10. Sprawdź, czy lista tankowań jest sortowana po dacie
11. Sprawdź, czy operacje na tankowaniach używają `date` zamiast `odometer`

---

## Kolejność implementacji (sugerowana)

1. **BUG-1** - Strona główna (najprostszy, duży wpływ)
2. **BUG-12** - Sortowanie po date (krytyczne dla poprawności danych)
3. **BUG-11** - Sortowanie listy tankowań (związane z BUG-12)
4. **BUG-2** - Redirect po dodaniu/edycji tankowania
5. **BUG-6** - Tryb wprowadzania przy edycji
6. **BUG-5** - Dokładność dystansu
7. **BUG-7** - Kafelek tankowania
8. **BUG-8** - Przycisk "Zobacz szczegóły"
9. **BUG-9** - Kolor średniego spalania
10. **BUG-10** - Sortowanie samochodów
11. **BUG-3/BUG-4** - Breadcrumbs (może być wykonane równolegle z innymi)

---

## Uwagi końcowe

- Wszystkie zmiany powinny być przetestowane na różnych rozdzielczościach ekranu (mobile, tablet, desktop)
- Po wprowadzeniu zmian, sprawdź czy nie zepsuły się inne funkcjonalności
- Rozważ dodanie testów jednostkowych dla krytycznych zmian (szczególnie BUG-12)
- Dokumentuj zmiany w kodzie, szczególnie te związane z logiką biznesową (BUG-12)
