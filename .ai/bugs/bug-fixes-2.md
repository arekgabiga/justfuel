# Plan napraw błędów - JustFuel (Część 2)

## Przegląd

Ten dokument zawiera szczegółowy plan naprawy wszystkich błędów zidentyfikowanych w pliku `bugs-2.md`. Dla każdego błędu określono:

- Wpływ na użytkownika
- Potrzebne zmiany w kodzie
- Endpointy API i widoki zaangażowane
- Szczegółowe kroki implementacji

---

## BUG-13: Przycisk "Zapisz" pozostaje zablokowany po wprowadzeniu zmian

### Opis problemu

Podczas edycji danych samochodu, jeśli użytkownik kliknie "Zapisz" bez wprowadzenia zmian, pojawia się komunikat "Nie wprowadzono żadnych zmian" i przycisk "Zapisz" zostaje zablokowany. Po tym, jakakolwiek zmiana nie jest możliwa, ponieważ przycisk pozostaje zablokowany, mimo że nazwa lub preferencja wprowadzania przebiegu zostaje zmieniona. Przycisk powinien się odblokować, jeśli coś się zmieni.

### Wpływ na użytkownika

- Użytkownik nie może zapisać zmian po przypadkowym kliknięciu "Zapisz" bez zmian
- Blokuje to normalny przepływ pracy edycji samochodu
- Utrudnia to poprawianie błędów w formularzu

### Zaangażowane pliki

- `src/lib/hooks/useEditCarForm.ts` - hook zarządzający stanem formularza edycji
- `src/components/cars/EditCarView.tsx` - komponent widoku edycji samochodu

### Endpointy API

- `PATCH /api/cars/{carId}` - aktualizacja samochodu (już używany)

### Analiza problemu

Problem występuje w dwóch miejscach:

1. **W `useEditCarForm.ts` (linia 307-309)**: Po kliknięciu "Zapisz" bez zmian, ustawiany jest `formErrors.submit = "Nie wprowadzono żadnych zmian"`, ale ten błąd nie jest czyszczony gdy użytkownik wprowadza zmiany.

2. **W `EditCarView.tsx` (linia 77)**: Logika `isSubmitDisabled` blokuje przycisk gdy `hasErrors && touchedFields.size > 0`. Problem polega na tym, że `formErrors.submit` jest traktowany jako błąd walidacji, który blokuje przycisk nawet gdy są zmiany.

### Kroki naprawcze

1. **Zmodyfikuj `src/lib/hooks/useEditCarForm.ts`**
   - W funkcji `handleFieldChange` (około linii 267-289), dodaj czyszczenie `formErrors.submit` gdy użytkownik wprowadza zmiany
   - Upewnij się, że `formErrors.submit` jest czyszczony przed walidacją, jeśli są zmiany w formularzu

2. **Zmodyfikuj `src/components/cars/EditCarView.tsx`**
   - Zmień logikę `isSubmitDisabled` (linia 77), aby nie blokowała przycisku gdy jedynym błędem jest `submit` i są zmiany w formularzu
   - Alternatywnie: wyklucz `formErrors.submit` z warunku `hasErrors` lub sprawdź czy są zmiany przed zablokowaniem

3. **Dodaj funkcję pomocniczą do sprawdzania zmian**
   - Upewnij się, że `hasChanges()` jest wywoływane przed blokowaniem przycisku
   - Jeśli są zmiany, przycisk powinien być aktywny (chyba że są błędy walidacji pól)

### Szczegółowa implementacja

#### Krok 1: Napraw `useEditCarForm.ts`

```typescript
// src/lib/hooks/useEditCarForm.ts

// W funkcji handleFieldChange, dodaj czyszczenie submit error:
const handleFieldChange = useCallback(
  (field: keyof EditCarFormState, value: string) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
    setTouchedFields((prev) => new Set(prev).add(field));

    // Clear submit error when user makes changes
    if (formErrors.submit) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.submit;
        return newErrors;
      });
    }

    // Clear field error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }

    // Real-time validation for critical fields (run async to not block input)
    if (touchedFields.has(field)) {
      // Defer validation to next tick to avoid blocking input
      setTimeout(() => {
        validateField(field);
      }, 0);
    }
  },
  [formErrors, touchedFields, validateField]
);
```

#### Krok 2: Napraw `EditCarView.tsx`

```typescript
// src/components/cars/EditCarView.tsx

// Zmień logikę isSubmitDisabled:
const hasErrors = Object.keys(formErrors).length > 0;
// Wyklucz submit error z blokowania przycisku jeśli są zmiany
const hasFieldErrors = Object.keys(formErrors).filter((key) => key !== 'submit').length > 0;
const isSubmitDisabled = isSubmitting || (hasFieldErrors && touchedFields.size > 0) || !hasChanges();
```

**Alternatywne rozwiązanie** (bardziej precyzyjne):

```typescript
// Sprawdź czy są błędy walidacji pól (nie submit)
const hasFieldValidationErrors = Object.keys(formErrors).some(
  (key) => key !== 'submit' && formErrors[key as keyof typeof formErrors]
);

// Przycisk jest zablokowany tylko gdy:
// 1. Trwa zapisywanie
// 2. Są błędy walidacji pól I pola były dotknięte
// 3. Nie ma zmian w formularzu
const isSubmitDisabled = isSubmitting || (hasFieldValidationErrors && touchedFields.size > 0) || !hasChanges();
```

### Testowanie

1. Otwórz formularz edycji samochodu
2. Kliknij "Zapisz" bez wprowadzenia zmian
3. Sprawdź, że pojawia się komunikat "Nie wprowadzono żadnych zmian"
4. Wprowadź zmianę w nazwie lub preferencji
5. Sprawdź, że przycisk "Zapisz" się odblokowuje
6. Kliknij "Zapisz" - powinno działać poprawnie

---

## BUG-14: Kolorowanie tankowań powinno używać wszystkich 7 kolorów zgodnie z opisem

### Opis problemu

Obecnie kolorowanie tankowań używa procentowych odchyleń od średniej, ale implementuje tylko 5 poziomów kolorów. Zgodnie z wymaganiami w `bugs-2.md`, system powinien używać wszystkich 7 kolorów: Ciemna Zieleń, Jasna Zieleń, Jasna Żółto-Zieleń, Żółty, Pomarańczowy, Średnia Czerwień, Bordowy.

### Wpływ na użytkownika

- Obecny system kolorowania nie wykorzystuje pełnej palety kolorów zgodnie z wymaganiami
- Brakuje dwóch poziomów kolorów (Jasna Żółto-Zieleń i Bordowy)
- Ulepszona wizualizacja pozwoli na lepsze zróżnicowanie wyników tankowań

### Zaangażowane pliki

- `src/components/cars/FillupCard.tsx` - komponent kafelka tankowania z logiką kolorowania

### Endpointy API

- `GET /api/cars/{carId}/fillups` - pobieranie listy tankowań (już używany)
- `GET /api/cars/{carId}/statistics` - pobieranie statystyk samochodu (już używany, zawiera `average_consumption`)

### Wymagania systemu kolorowania

Zgodnie z dokumentacją w `bugs-2.md`, system powinien używać następujących 7 kolorów:

| Kolor              | Nazwa Progowa        | Opis                                                    |
| ------------------ | -------------------- | ------------------------------------------------------- |
| Ciemna Zieleń      | EKSTREMALNIE NISKIE  | Znacząco lepsze niż średnia. Największa oszczędność.    |
| Jasna Zieleń       | BARDZO NISKIE        | Wyraźnie lepsze niż średnia. Duża oszczędność.          |
| Jasna Żółto-Zieleń | LEKKO NISKIE         | Nieznacznie lepsze niż średnia. Delikatna oszczędność.  |
| Żółty              | NEUTRALNE            | Wynik w granicach normy/blisko średniej.                |
| Pomarańczowy       | LEKKO WYSOKIE        | Nieznacznie gorsze niż średnia. Wymaga uwagi.           |
| Średnia Czerwień   | BARDZO WYSOKIE       | Wyraźnie gorsze niż średnia. Duże zużycie paliwa.       |
| Bordowy            | EKSTREMALNIE WYSOKIE | Znacząco gorsze niż średnia. Alarmujące zużycie paliwa. |

**Uwaga**: System zachowuje procentowe odchylenie od średniej, ale używa wszystkich 7 kolorów zgodnie z opisem.

### Kroki naprawcze

1. **Zmodyfikuj `src/components/cars/FillupCard.tsx`**
   - Rozszerz funkcję `getConsumptionColor` o wszystkie 7 poziomów kolorów
   - Zachowaj obliczanie procentowego odchylenia: `deviation = ((consumption - avg) / avg) * 100`
   - Dostosuj progi procentowe tak, aby pasowały do 7 poziomów kolorów
   - Dodaj odpowiednie klasy Tailwind dla każdego koloru

2. **Dodaj klasy Tailwind dla wszystkich kolorów**
   - Ciemna Zieleń: `text-green-800 dark:text-green-300 font-semibold`
   - Jasna Zieleń: `text-green-600 dark:text-green-400 font-semibold`
   - Jasna Żółto-Zieleń: `text-lime-500 dark:text-lime-400`
   - Żółty: `text-yellow-600 dark:text-yellow-400`
   - Pomarańczowy: `text-orange-600 dark:text-orange-400`
   - Średnia Czerwień: `text-red-600 dark:text-red-400 font-semibold`
   - Bordowy: `text-red-800 dark:text-red-300 font-semibold`

### Szczegółowa implementacja

```typescript
// src/components/cars/FillupCard.tsx

// Zastąp funkcję getConsumptionColor:
const getConsumptionColor = (consumption: number | null | undefined, avg: number) => {
  if (!consumption || avg === 0 || !isFinite(consumption) || !isFinite(avg)) {
    return 'text-gray-600 dark:text-gray-400';
  }

  // Oblicz procentowe odchylenie od średniej
  const deviation = ((consumption - avg) / avg) * 100;

  // EKSTREMALNIE NISKIE: Znacząco lepsze niż średnia (odchylenie <= -15%)
  if (deviation <= -15) {
    return 'text-green-800 dark:text-green-300 font-semibold';
  }

  // BARDZO NISKIE: Wyraźnie lepsze niż średnia (-15% < odchylenie <= -8%)
  if (deviation <= -8) {
    return 'text-green-600 dark:text-green-400 font-semibold';
  }

  // LEKKO NISKIE: Nieznacznie lepsze niż średnia (-8% < odchylenie < 0%)
  if (deviation < 0) {
    return 'text-lime-500 dark:text-lime-400';
  }

  // NEUTRALNE: Wynik w granicach normy (0% <= odchylenie < 5%)
  if (deviation < 5) {
    return 'text-yellow-600 dark:text-yellow-400';
  }

  // LEKKO WYSOKIE: Nieznacznie gorsze niż średnia (5% <= odchylenie < 10%)
  if (deviation < 10) {
    return 'text-orange-600 dark:text-orange-400';
  }

  // BARDZO WYSOKIE: Wyraźnie gorsze niż średnia (10% <= odchylenie < 20%)
  if (deviation < 20) {
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  // EKSTREMALNIE WYSOKIE: Znacząco gorsze niż średnia (odchylenie >= 20%)
  return 'text-red-800 dark:text-red-300 font-semibold';
};
```

### Uwagi implementacyjne

1. **Progi procentowe**:
   - Progi zostały dostosowane do 7 poziomów kolorów
   - Wartości progowe (-15%, -8%, 0%, 5%, 10%, 20%) mogą być dostosowane w zależności od potrzeb
   - Progi są symetryczne dla wartości ujemnych i dodatnich, z wyjątkiem neutralnego zakresu (0-5%)

2. **Obsługa wartości null/undefined**:
   - Funkcja zwraca szary kolor dla nieprawidłowych wartości
   - Sprawdza `isFinite()` dla obu wartości przed obliczeniami

3. **Dark mode**:
   - Wszystkie kolory mają odpowiednie warianty dla trybu ciemnego
   - Ciemniejsze odcienie dla trybu ciemnego zapewniają lepszą czytelność

4. **Intensywność kolorów**:
   - Kolory ekstremalne (Ciemna Zieleń, Bordowy) używają ciemniejszych odcieni
   - Kolory bardzo niskie/wysokie (Jasna Zieleń, Średnia Czerwień) używają średnich odcieni z `font-semibold`
   - Kolory neutralne i lekko niskie/wysokie używają jaśniejszych odcieni

### Testowanie

1. Utwórz samochód z kilkoma tankowaniami o różnym spalaniu
2. Sprawdź, że kolorowanie działa poprawnie dla każdego progu:
   - Tankowanie znacznie niższe niż średnia (odchylenie ≤ -15%) → Ciemna Zieleń
   - Tankowanie wyraźnie niższe niż średnia (odchylenie -15% do -8%) → Jasna Zieleń
   - Tankowanie lekko niższe (odchylenie -8% do 0%) → Jasna Żółto-Zieleń
   - Tankowanie blisko średniej (odchylenie 0% do 5%) → Żółty
   - Tankowanie lekko wyższe (odchylenie 5% do 10%) → Pomarańczowy
   - Tankowanie wyraźnie wyższe (odchylenie 10% do 20%) → Średnia Czerwień
   - Tankowanie znacznie wyższe (odchylenie ≥ 20%) → Bordowy
3. Sprawdź działanie w trybie ciemnym
4. Sprawdź obsługę przypadków brzegowych (null, undefined, 0)
5. Przetestuj z różnymi wartościami średniego spalania (np. 5 L/100km, 10 L/100km, 15 L/100km)

---

## BUG-15: Lista tankowań powinna być siatką kafelków (3 w rzędzie, responsywnie 2)

### Opis problemu

Zgodnie z historyjką US-009 z `prd.md`, lista tankowań powinna być siatką kafelków. Obecnie jest wyświetlana jako lista pionowa (`space-y-4`). Powinno być 3 kafelki w rzędzie na większych ekranach, a na małych ekranach responsywnie 2.

### Wpływ na użytkownika

- Obecny widok listy nie jest zgodny z wymaganiami produktu
- Siatka kafelków jest bardziej czytelna i efektywniej wykorzystuje przestrzeń
- Lepsze wykorzystanie ekranu na większych urządzeniach

### Zaangażowane pliki

- `src/components/cars/FillupsListView.tsx` - komponent wyświetlający listę tankowań

### Endpointy API

- `GET /api/cars/{carId}/fillups` - pobieranie listy tankowań (już używany, paginacja działa)

### Wymagania z PRD

Zgodnie z US-009:

- Historia tankowań jest prezentowana jako responsywna siatka kafelków
- Każdy kafelek wyświetla datę, obliczone spalanie i przejechany dystans
- Lista tankowań ładuje się dynamicznie podczas przewijania (infinite scroll) - już zaimplementowane

### Kroki naprawcze

1. **Zmodyfikuj `src/components/cars/FillupsListView.tsx`**
   - Zmień kontener z `space-y-4` (lista pionowa) na siatkę z użyciem `grid`
   - Użyj `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` dla responsywności:
     - 1 kolumna na bardzo małych ekranach (mobile)
     - 2 kolumny na średnich ekranach (tablet)
     - 3 kolumny na dużych ekranach (desktop)
   - Dodaj odpowiednie odstępy między kafelkami (`gap-4` lub `gap-6`)
   - Upewnij się, że infinite scroll nadal działa poprawnie

2. **Zachowaj istniejącą funkcjonalność**
   - Infinite scroll trigger powinien pozostać na dole siatki
   - Loading state powinien działać tak samo
   - Empty state i error state pozostają bez zmian

### Szczegółowa implementacja

```typescript
// src/components/cars/FillupsListView.tsx

// Zmień kontener z listy na siatkę:
return (
  <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {fillups.map((fillup) => (
      <FillupCard
        key={fillup.id}
        fillup={fillup}
        averageConsumption={averageConsumption}
        onClick={() => onFillupClick(fillup.id)}
      />
    ))}

    {/* Infinite scroll trigger */}
    {pagination.has_more && (
      <div ref={observerTargetRef} className="col-span-full py-4 flex justify-center">
        {loading && (
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Ładowanie kolejnych tankowań...</span>
          </div>
        )}
      </div>
    )}

    {/* Loading indicator at bottom */}
    {!pagination.has_more && fillups.length > 0 && (
      <div className="col-span-full text-center text-sm text-gray-500 dark:text-gray-400 py-4">
        Wyświetlono wszystkie tankowania ({pagination.total_count})
      </div>
    )}
  </div>
);
```

### Uwagi implementacyjne

1. **Responsywność**:
   - `grid-cols-1` - 1 kolumna na mobile (< 768px)
   - `md:grid-cols-2` - 2 kolumny na tablet (≥ 768px)
   - `lg:grid-cols-3` - 3 kolumny na desktop (≥ 1024px)

2. **Infinite scroll trigger**:
   - Użyj `col-span-full` aby trigger zajmował całą szerokość siatki
   - To zapewnia, że trigger jest widoczny i działa poprawnie

3. **Gap między kafelkami**:
   - `gap-4` (16px) powinno być wystarczające
   - Można zwiększyć do `gap-6` (24px) jeśli potrzebne więcej przestrzeni

4. **Wysokość kafelków**:
   - Kafelki powinny mieć równą wysokość w rzędzie (domyślnie w CSS Grid)
   - Jeśli potrzebne, można dodać `items-stretch` do kontenera

### Testowanie

1. Otwórz widok tankowań dla samochodu z kilkoma tankowaniami
2. Sprawdź, że kafelki są wyświetlane w siatce:
   - Na mobile: 1 kolumna
   - Na tablet: 2 kolumny
   - Na desktop: 3 kolumny
3. Sprawdź, że infinite scroll nadal działa poprawnie
4. Sprawdź, że kafelki mają odpowiednie odstępy między sobą
5. Sprawdź responsywność przy zmianie rozmiaru okna przeglądarki
6. Sprawdź, że wszystkie stany (loading, error, empty) działają poprawnie

---

## Podsumowanie

### Priorytety napraw

1. **Wysoki priorytet**: BUG-13 (blokuje funkcjonalność edycji)
2. **Średni priorytet**: BUG-14 (zgodność z wymaganiami produktu)
3. **Średni priorytet**: BUG-15 (zgodność z wymaganiami produktu)

### Zależności

- BUG-13: Niezależny, można naprawić jako pierwszy
- BUG-14: Niezależny, wymaga tylko zmiany w `FillupCard.tsx`
- BUG-15: Niezależny, wymaga tylko zmiany w `FillupsListView.tsx`

### Szacowany czas implementacji

- BUG-13: ~30-45 minut (debugowanie i testowanie logiki formularza)
- BUG-14: ~20-30 minut (zmiana funkcji kolorowania + testowanie)
- BUG-15: ~15-20 minut (zmiana layoutu + testowanie responsywności)

**Łącznie**: ~1.5-2 godziny

### Uwagi końcowe

- Wszystkie błędy są niezależne i można je naprawiać równolegle
- Po naprawie każdego błędu, należy przetestować odpowiednią funkcjonalność
- Należy upewnić się, że zmiany nie wpływają na inne części aplikacji
- Wszystkie zmiany powinny być zgodne z istniejącym stylem kodu i konwencjami projektu
