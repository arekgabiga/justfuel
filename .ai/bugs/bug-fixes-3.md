# Plan Napraw Błędów - Batch 3

> Data utworzenia: 2025-11-30  
> Dokument źródłowy: `.ai/bugs/bugs-3.md`

## Podsumowanie

Ten dokument zawiera szczegółowy plan napraw dla 7 zidentyfikowanych błędów w aplikacji JustFuel. Każdy błąd został przeanalizowany pod kątem:

- Przyczyny problemu
- Dotknięte komponenty i widoki
- Wymagane endpointy API
- Kroki naprawcze
- Sposób weryfikacji

---

## BUG-16: RLS wyłączony na tabelach w Supabase

### Opis problemu

Row Level Security (RLS) jest wyłączony na tabelach w bazie danych, co stanowi poważne zagrożenie bezpieczeństwa. Użytkownicy mogą potencjalnie uzyskać dostęp do danych innych użytkowników.

### Lokalizacja problemu

- **Baza danych**: Tabele `cars` i `fillups` w Supabase
- **Migracje**: `/supabase/migrations/20251013110121_initial_schema.sql`

### Dotknięte komponenty

**Backend/Database:**

- Tabela `cars`
- Tabela `fillups`
- Widok `car_statistics`

**Kluczowe serwisy (wymagają weryfikacji, że używają RLS):**

- `/src/lib/services/cars.service.ts`
- `/src/lib/services/fillups.service.ts`
- `/src/lib/services/charts.service.ts`

### Wymagane endpointy API

Wszystkie endpointy są już zaimplementowane, ale wymagają weryfikacji:

- `GET /api/cars`
- `GET /api/cars/{carId}`
- `POST /api/cars`
- `PATCH /api/cars/{carId}`
- `DELETE /api/cars/{carId}`
- `GET /api/cars/{carId}/fillups`
- `POST /api/cars/{carId}/fillups`
- `PATCH /api/cars/{carId}/fillups/{fillupId}`
- `DELETE /api/cars/{carId}/fillups/{fillupId}`

### Kroki naprawcze

#### 1. Weryfikacja obecnego stanu RLS

```bash
# Sprawdź stan RLS w Supabase
# W Supabase Dashboard lub przez SQL:
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('cars', 'fillups');
```

#### 2. Włączenie RLS (jeśli wyłączone)

W pliku migracji lub przez nową migrację:

```sql
-- Włącz RLS na tabelach
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;
ALTER TABLE fillups ENABLE ROW LEVEL SECURITY;
```

#### 3. Weryfikacja polityk RLS

Sprawdź, czy polityki istnieją w migracji `20251013110121_initial_schema.sql`:

- Polityki dla tabeli `cars` (SELECT, INSERT, UPDATE, DELETE)
- Polityki dla tabeli `fillups` (SELECT, INSERT, UPDATE, DELETE)

#### 4. Utworzenie nowej migracji (jeśli potrzebne)

```bash
# Utwórz nową migrację
npx supabase migration new enable_rls
```

Dodaj do nowej migracji:

```sql
-- Enable RLS on cars table
ALTER TABLE cars ENABLE ROW LEVEL SECURITY;

-- Enable RLS on fillups table
ALTER TABLE fillups ENABLE ROW LEVEL SECURITY;

-- Verify policies exist (should already be created in initial migration)
-- If not, create them:

-- Cars policies
CREATE POLICY "Users can view their own cars"
  ON cars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cars"
  ON cars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cars"
  ON cars FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cars"
  ON cars FOR DELETE
  USING (auth.uid() = user_id);

-- Fillups policies (via car ownership)
CREATE POLICY "Users can view fillups for their cars"
  ON fillups FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = fillups.car_id
    AND cars.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert fillups for their cars"
  ON fillups FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = fillups.car_id
    AND cars.user_id = auth.uid()
  ));

CREATE POLICY "Users can update fillups for their cars"
  ON fillups FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = fillups.car_id
    AND cars.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete fillups for their cars"
  ON fillups FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM cars
    WHERE cars.id = fillups.car_id
    AND cars.user_id = auth.uid()
  ));
```

#### 5. Zastosowanie migracji

```bash
# Reset bazy danych i zastosuj wszystkie migracje
npx supabase db reset
```

### Sposób weryfikacji

#### Weryfikacja automatyczna

1. **Test jednostkowy bezpieczeństwa RLS**:
   - Utwórz test w `/src/lib/services/__tests__/rls.security.test.ts`
   - Testuj, że użytkownik A nie może uzyskać dostępu do danych użytkownika B

2. **Testy integracyjne**:
   - Sprawdź, że istniejące testy dalej działają z włączonym RLS
   ```bash
   npm test
   ```

#### Weryfikacja manualna

1. Zaloguj się jako użytkownik A
2. Utwórz samochód i tankowanie
3. Zanotuj ID samochodu
4. Wyloguj się i zaloguj jako użytkownik B
5. Spróbuj uzyskać dostęp do `/api/cars/{car_id_user_A}`
6. Oczekiwany wynik: błąd 404 (Not Found) lub 403 (Forbidden)

---

## BUG-17: Dodawanie tankowania nie respektuje preferencji dystansu/licznika

### Opis problemu

Formularz dodawania tankowania nie używa wartości `mileage_input_preference` zapisanej na poziomie samochodu, co wymusza użytkownika do ręcznego przełączania trybu za każdym razem.

### Lokalizacja problemu

- **Widok**: `/src/components/cars/NewFillupView.tsx`
- **Hook**: `/src/lib/hooks/useNewFillupForm.ts`

### Dotknięte komponenty

**Frontend:**

- `NewFillupView.tsx` - główny widok formularza
- `useNewFillupForm.ts` - logika formularza (linie 35-43, wartość `initialInputMode`)

**Backend:**

- Endpoint `GET /api/cars/{carId}` - musi zwracać `mileage_input_preference`

### Wymagane endpointy API

- `GET /api/cars/{carId}` - już istnieje, zwraca `mileage_input_preference`

### Kroki naprawcze

#### 1. Modyfikacja `NewFillupView.tsx`

Dodaj pobieranie danych samochodu przed renderowaniem formularza:

```typescript
// W NewFillupView.tsx
const [car, setCar] = useState<CarDetailsDTO | null>(null);
const [isLoadingCar, setIsLoadingCar] = useState(true);

useEffect(() => {
  const fetchCar = async () => {
    try {
      const response = await fetch(`/api/cars/${carId}`, {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setCar(data);
      }
    } catch (error) {
      console.error("Failed to load car:", error);
    } finally {
      setIsLoadingCar(false);
    }
  };
  fetchCar();
}, [carId]);

// Przekaż preferencję do hooka
const formHook = useNewFillupForm({
  carId,
  initialInputMode: car?.mileage_input_preference || "odometer",
});
```

#### 2. Weryfikacja hooka `useNewFillupForm.ts`

Hook już przyjmuje `initialInputMode` jako parametr (linia 32-33, 40), więc wystarczy przekazać odpowiednią wartość z komponentu.

#### 3. Dodanie obsługi stanu ładowania

Wyświetl stan ładowania, jeśli dane samochodu są pobierane:

```typescript
if (isLoadingCar) {
  return <LoadingState />;
}
```

### Sposób weryfikacji

#### Weryfikacja automatyczna

Rozszerz test `/src/lib/hooks/__tests__/useNewFillupForm.test.ts`:

```typescript
it("should use car mileage preference as initial input mode", () => {
  const { result } = renderHook(() =>
    useNewFillupForm({
      carId: "test-car",
      initialInputMode: "distance",
    })
  );
  expect(result.current.formState.inputMode).toBe("distance");
});
```

#### Weryfikacja manualna

1. Utwórz samochód i ustaw `mileage_input_preference` na `distance`
2. Przejdź do formularza dodawania tankowania
3. Sprawdź, czy domyślnie wybrany jest tryb "Dystans"
4. Powtórz dla samochodu z preferencją `odometer`

---

## BUG-18: Walidacja przy logowaniu/rejestracji odpala się co chwilę podczas pisania

### Opis problemu

Walidacja formularzy autoryzacji jest wywoływana zbyt często podczas wpisywania, co powoduje "drganie" formularza i złe doświadczenie użytkownika.

### Lokalizacja problemu

- **Komponenty**:
  - `/src/components/auth/LoginForm.tsx`
  - `/src/components/auth/RegisterForm.tsx`
- **Hooki**:
  - `/src/lib/hooks/useLoginForm.ts`
  - `/src/lib/hooks/useRegisterForm.ts`

### Dotknięte komponenty

**Frontend:**

- `LoginForm.tsx` (linie 71, 93 - wywołania `handleEmailChange`, `handlePasswordChange`)
- `RegisterForm.tsx` (linie 71, 93, 115 - wywołania change handlers)
- `useLoginForm.ts` - logika walidacji
- `useRegisterForm.ts` - logika walidacji

### Wymagane endpointy API

Brak - problem tylko po stronie frontendu

### Kroki naprawcze

#### 1. Implementacja debounce dla walidacji

Dodaj debounce do walidacji w hookach formularzy:

```typescript
// W useLoginForm.ts i useRegisterForm.ts
import { useState, useCallback, useRef } from "react";

const handleFieldChange = useCallback(
  (field: keyof FormState, value: string) => {
    // Natychmiast zaktualizuj wartość pola (nie blokuj wpisywania)
    const newState = { ...formState, [field]: value };
    setFormState(newState);

    // Wyczyść poprzedni błąd walidacji
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const { [field]: _, ...rest } = prev;
        return rest;
      });
    }

    // USUŃ lub ZMIEŃ: Real-time validation
    // Zamiast tego, walidacja powinna się odpalić tylko na blur
  },
  [formState, formErrors]
);
```

#### 2. Walidacja tylko na `blur` i `submit`

Przenieś walidację z `onChange` na `onBlur`:

```typescript
// Walidacja tylko gdy użytkownik opuści pole
const handleFieldBlur = useCallback(
  (field: keyof FormState) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    validateField(field);
  },
  [validateField]
);
```

#### 3. Aktualizacja komponentów

Upewnij się, że komponenty używają tylko `onBlur` do walidacji:

```typescript
// W LoginForm.tsx i RegisterForm.tsx
<Input
  value={formState.email}
  onChange={(e) => handleEmailChange(e.target.value)}
  onBlur={() => handleFieldBlur('email')}
  // Walidacja tylko na blur, nie na każdą zmianę
/>
```

#### 4. Sprawdź hook `useNewFillupForm.ts`

Ten sam problem może występować w `useNewFillupForm.ts` (linie 338-342):

```typescript
// PROBLEM: Real-time validation w setTimeout
setTimeout(() => {
  validateField(field, newState);
}, 0);
```

Rozważ usunięcie lub warunkowe włączenie tej walidacji.

### Sposób weryfikacji

#### Weryfikacja automatyczna

Dodaj test w `/src/components/auth/__tests__/LoginForm.test.tsx`:

```typescript
it('should not trigger validation while typing', async () => {
  const { getByLabelText, queryByRole } = render(<LoginForm />);
  const emailInput = getByLabelText(/email/i);

  // Wpisz niepełny adres email
  fireEvent.change(emailInput, { target: { value: 'test@' } });

  // Nie powinno być błędu walidacji podczas pisania
  expect(queryByRole('alert')).not.toBeInTheDocument();

  // Błąd pojawi się dopiero po opuszczeniu pola
  fireEvent.blur(emailInput);
  await waitFor(() => {
    expect(queryByRole('alert')).toBeInTheDocument();
  });
});
```

#### Weryfikacja manualna

1. Przejdź do formularza logowania
2. Zacznij wpisywać adres email (np. "tes")
3. Sprawdź, czy formularz NIE pokazuje błędów walidacji podczas pisania
4. Kliknij poza polem email
5. Sprawdź, czy teraz pojawia się błąd walidacji
6. Powtórz dla hasła i formularza rejestracji

---

## BUG-19: Walidacja potwierdzenia hasła nie znika

### Opis problemu

Błąd walidacji pola "Potwierdzenie hasła" nie znika, nawet gdy oba hasła są identyczne. Błąd znika dopiero po kliknięciu gdzieś obok pola.

### Lokalizacja problemu

- **Komponent**: `/src/components/auth/RegisterForm.tsx`
- **Hook**: `/src/lib/hooks/useRegisterForm.ts`

### Dotknięte komponenty

**Frontend:**

- `RegisterForm.tsx` (linie 108-130 - pole confirmPassword)
- `useRegisterForm.ts` - logika walidacji potwierdzenia hasła

### Wymagane endpointy API

Brak - problem tylko po stronie frontendu

### Kroki naprawcze

#### 1. Analiza problemu w `useRegisterForm.ts`

Sprawdź funkcję walidacji `confirmPassword`:

```typescript
// Prawdopodobny problem: walidacja sprawdza tylko touched field
const validateConfirmPassword = (password: string, confirmPassword: string) => {
  if (!confirmPassword) {
    return "Potwierdzenie hasła jest wymagane";
  }
  // PROBLEM: Ta walidacja może nie być wywoływana przy zmianie password
  if (password !== confirmPassword) {
    return "Hasła muszą być identyczne";
  }
  return undefined;
};
```

#### 2. Dodanie cross-field validation

Przy zmianie `password`, przewaliduj również `confirmPassword`:

```typescript
const handlePasswordChange = useCallback(
  (value: string) => {
    const newState = { ...formState, password: value };
    setFormState(newState);

    // Wyczyść błąd hasła
    if (formErrors.password) {
      setFormErrors((prev) => {
        const { password: _, ...rest } = prev;
        return rest;
      });
    }

    // DODAJ: Jeśli confirmPassword jest filled i touched, przewaliduj
    if (touchedFields.has("confirmPassword") && formState.confirmPassword) {
      // Sprawdź, czy teraz hasła się zgadzają
      if (value === formState.confirmPassword) {
        // Wyczyść błąd confirmPassword
        setFormErrors((prev) => {
          const { confirmPassword: _, ...rest } = prev;
          return rest;
        });
      }
    }
  },
  [formState, formErrors, touchedFields]
);
```

#### 3. Podobnie dla `handleConfirmPasswordChange`

```typescript
const handleConfirmPasswordChange = useCallback(
  (value: string) => {
    const newState = { ...formState, confirmPassword: value };
    setFormState(newState);

    // Natychmiast sprawdź, czy hasła się zgadzają
    if (value === formState.password) {
      // Wyczyść błąd jeśli są identyczne
      setFormErrors((prev) => {
        const { confirmPassword: _, ...rest } = prev;
        return rest;
      });
    } else if (touchedFields.has("confirmPassword")) {
      // Tylko pokaż błąd jeśli pole było touched
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword: "Hasła muszą być identyczne",
      }));
    }
  },
  [formState, touchedFields]
);
```

### Sposób weryfikacji

#### Weryfikacja automatyczna

Dodaj test w `/src/components/auth/__tests__/RegisterForm.test.tsx`:

```typescript
it('should clear confirm password error when passwords match', async () => {
  const { getByLabelText, queryByText } = render(<RegisterForm />);
  const passwordInput = getByLabelText(/^Hasło$/i);
  const confirmPasswordInput = getByLabelText(/Potwierdzenie hasła/i);

  // Wpisz różne hasła
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
  fireEvent.blur(confirmPasswordInput);

  // Powinien pojawić się błąd
  await waitFor(() => {
    expect(queryByText(/hasła muszą być identyczne/i)).toBeInTheDocument();
  });

  // Popraw confirmPassword na takie same
  fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });

  // Błąd powinien zniknąć NATYCHMIAST (bez blur)
  await waitFor(() => {
    expect(queryByText(/hasła muszą być identyczne/i)).not.toBeInTheDocument();
  });
});
```

#### Weryfikacja manualna

1. Przejdź do formularza rejestracji
2. Wpisz hasło (np. "test123")
3. Wpisz inne potwierdzenie (np. "test124") i kliknij poza pole
4. Sprawdź, czy pojawia się błąd "Hasła muszą być identyczne"
5. Popraw potwierdzenie hasła na "test123" (NIE klikaj poza pole)
6. Sprawdź, czy błąd znika natychmiast podczas wpisywania
7. Zmień pierwsze hasło na "test124"
8. Sprawdź, czy błąd znika, bo teraz oba hasła to "test124"

---

## BUG-20: Cena za litr odsuwa się na najmniejszym ekranie

### Opis problemu

Na najmniejszych ekranach mobilnych kolumna "Cena za litr" w kafelku tankowania odsuwa się od pozostałych kolumn, przez co układ wygląda nierówno.

### Lokalizacja problemu

- **Komponent**: `/src/components/cars/FillupCard.tsx` (linia 82)

### Dotknięte komponenty

**Frontend:**

- `FillupCard.tsx` - layout kafelka (grid CSS na linii 82)

### Wymagane endpointy API

Brak - problem tylko z układem CSS

### Kroki naprawcze

#### 1. Analiza obecnego layoutu

Obecny kod (linia 82):

```tsx
<div className="grid grid-cols-[min-content_min-content_1fr_1fr] gap-x-4 gap-y-3 xl:grid-cols-4">
```

Problem: `grid-cols-[min-content_min-content_1fr_1fr]` powoduje, że ostatnie dwie kolumny (`1fr`) mogą się rozciągać nierównomiernie.

#### 2. Popraw grid layout dla małych ekranów

Zmień na równomierne kolumny lub grid responsywny:

**Opcja A - Równomierne kolumny:**

```tsx
<div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3">
```

**Opcja B - Auto-fit z minimalną szerokością:**

```tsx
<div className="grid grid-cols-[repeat(auto-fit,minmax(100px,1fr))] gap-x-4 gap-y-3">
```

**Opcja C - Zachowanie obecnego układu z poprawką:**

```tsx
<div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-[min-content_min-content_1fr_1fr] xl:grid-cols-4">
```

#### 3. Rekomendacja

Używając Opcji C, uzyskamy:

- Na małych ekranach: 2 kolumny (Data/Spalanie w pierwszym rzędzie, Dystans/Cena w drugim)
- Na średnich ekranach: oryginalny układ
- Na dużych ekranach (xl): 4 równe kolumny

### Sposób weryfikacji

#### Weryfikacja automatyczna

Test wizualny z Playwright:

```typescript
// W /tests/visual/fillup-card.spec.ts
test("fillup card layout on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
  await page.goto("/cars/[carId]?tab=fillups");

  // Zrób screenshot kafelka
  const card = page.locator('[role="button"]').first();
  await expect(card).toHaveScreenshot("fillup-card-mobile.png");
});
```

#### Weryfikacja manualna

1. Otwórz DevTools i ustaw viewport na iPhone SE (375px)
2. Przejdź do widoku listy tankowań
3. Sprawdź, czy wszystkie 4 kolumny są równomiernie rozłożone
4. Sprawdź, czy "Cena za litr" nie odsuwa się od innych kolumn
5. Przetestuj również na iPad (768px) i desktop (1920px)

**Kryteria akceptacji:**

- Wszystkie kolumny są wizualnie w jednej siatce
- Odstępy między kolumnami są równomierne
- Layout wygląda dobrze na 320px, 375px, 768px, 1024px, 1920px

---

## BUG-21: Średnie spalanie na kafelku samochodu bez 2 miejsc po przecinku

### Opis problemu

Średnie spalanie wyświetlane na kafelku samochodu nie jest formatowane z dokładnością do 2 miejsc po przecinku, co może pokazywać liczby z różną precyzją.

### Lokalizacja problemu

- **Komponent**: `/src/components/cars/CarStatistics.tsx` lub `/src/components/cars/AverageConsumption.tsx`

### Dotknięte komponenty

**Frontend:**

- `CarCard.tsx` - renderuje `CarStatistics`
- `CarStatistics.tsx` - wyświetla statystyki
- `AverageConsumption.tsx` - formatuje średnie spalanie

### Wymagane endpointy API

Brak - problem tylko z formatowaniem w UI

### Kroki naprawcze

#### 1. Zlokalizuj komponent odpowiedzialny za formatowanie

Prawdopodobnie w `AverageConsumption.tsx` lub `CarStatistics.tsx`:

```typescript
// Znajdź kod typu:
{statistics.average_consumption} L/100km
```

#### 2. Dodaj funkcję formatowania

```typescript
const formatConsumption = (value: number | null | undefined): string => {
  if (value === null || value === undefined || !isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(2); // Zawsze 2 miejsca po przecinku
};
```

#### 3. Użyj funkcji w komponencie

```tsx
<div className="text-2xl font-bold">{formatConsumption(statistics.average_consumption)} L/100km</div>
```

#### 4. Sprawdź spójność z innymi komponentami

Upewnij się, że ta sama funkcja jest używana w:

- `FillupCard.tsx` (już używa `formatNumber` z 2 miejscami - linia 20-23)
- `ChartsTab.tsx` lub inne miejsca pokazujące spalanie

#### 5. Opcjonalnie: Utwórz wspólny utility

```typescript
// W /src/lib/utils/formatters.ts
export const formatNumber = (value: number | null | undefined, decimals: number = 2): string => {
  if (value === null || value === undefined || !isFinite(value)) {
    return "N/A";
  }
  return value.toFixed(decimals);
};

export const formatConsumption = (value: number | null | undefined): string => {
  return formatNumber(value, 2);
};

export const formatDistance = (value: number | null | undefined): string => {
  return formatNumber(value, 2);
};

export const formatPrice = (value: number | null | undefined): string => {
  return formatNumber(value, 2);
};
```

### Sposób weryfikacji

#### Weryfikacja automatyczna

Test jednostkowy:

```typescript
// W /src/lib/utils/__tests__/formatters.test.ts
describe("formatConsumption", () => {
  it("should format with 2 decimal places", () => {
    expect(formatConsumption(8.5)).toBe("8.50");
    expect(formatConsumption(10)).toBe("10.00");
    expect(formatConsumption(7.123456)).toBe("7.12");
  });

  it("should handle edge cases", () => {
    expect(formatConsumption(null)).toBe("N/A");
    expect(formatConsumption(undefined)).toBe("N/A");
    expect(formatConsumption(Infinity)).toBe("N/A");
  });
});
```

#### Weryfikacja manualna

1. Przejdź do listy samochodów
2. Sprawdź kafelki - średnie spalanie powinno mieć dokładnie 2 miejsca po przecinku
3. Przykłady:
   - `8.5` → `8.50 L/100km`
   - `10` → `10.00 L/100km`
   - `7.123` → `7.12 L/100km`

---

## BUG-22: Nazwa samochodu pokrywa się z breadcrumbs

### Opis problemu

W widoku szczegółów samochodu sekcja z nazwą samochodu i breadcrumbs (nawigacja) pokrywają się lub są zbyt blisko siebie, co wygląda nieestetycznie.

### Lokalizacja problemu

- **Komponenty**:
  - `/src/components/cars/CarHeader.tsx` - nagłówek z nazwą
  - `/src/components/cars/Breadcrumbs.tsx` - nawigacja breadcrumb
  - `/src/components/cars/CarDetailsView.tsx` - główny widok

### Dotknięte komponenty

**Frontend:**

- `CarDetailsView.tsx` - layout widoku szczegółów
- `CarHeader.tsx` - wyświetla nazwę samochodu (linia 44)
- `Breadcrumbs.tsx` - wyświetla nawigację breadcrumb
- `CarNameDisplay.tsx` - komponent nazwy (używany w CarHeader)

### Wymagane endpointy API

Brak - problem tylko z layoutem

### Kroki naprawcze

#### 1. Analiza obecnego układu

Sprawdź w `CarDetailsView.tsx`, jak są ułożone:

```tsx
{/* Prawdopodobnie coś takiego: */}
<Breadcrumbs />
<CarHeader car={car} />
```

#### 2. Opcja A: Usunięcie duplikacji nazwy

Jeśli breadcrumbs już pokazuje nazwę samochodu, usuń `CarNameDisplay` z `CarHeader`:

```tsx
// W CarHeader.tsx (linia 44)
// USUŃ lub warunkuj:
{
  !hideName && <CarNameDisplay name={displayName} />;
}
```

I w `CarDetailsView.tsx`:

```tsx
<CarHeader car={car} hideName={true} />
```

#### 3. Opcja B: Powiększenie breadcrumbs i usunięcie nagłówka

Jeśli breadcrumbs jest mały, powiększ go i usuń duplikację:

```tsx
// W Breadcrumbs.tsx
<nav className="mb-6">
  <ol className="flex items-center gap-2 text-lg">
    {" "}
    {/* Zwiększ z text-sm */}
    <li>
      <a href="/cars" className="text-muted-foreground hover:text-foreground">
        Samochody
      </a>
    </li>
    <li className="text-muted-foreground">/</li>
    <li className="font-semibold text-foreground text-xl">{carName}</li>
  </ol>
</nav>
```

#### 4. Opcja C (Rekomendowana): Zintegruj w jeden komponent

Połącz breadcrumbs z nagłówkiem w jedną spójną sekcję:

```tsx
// W CarHeader.tsx
<div className="mb-8">
  {/* Breadcrumbs navigation */}
  <nav className="mb-4">
    <ol className="flex items-center gap-2 text-sm text-muted-foreground">
      <li>
        <a href="/cars" className="hover:text-foreground">
          Samochody
        </a>
      </li>
      <li>/</li>
      <li className="text-foreground">{displayName}</li>
    </ol>
  </nav>

  {/* Action buttons row */}
  <div className="flex items-center justify-between">
    {onBack && (
      <Button onClick={onBack} variant="outline" size="sm">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Powrót
      </Button>
    )}
    {showActions && <div className="flex items-center gap-2">{/* Edit and Delete buttons */}</div>}
  </div>
</div>
```

### Sposób weryfikacji

#### Weryfikacja automatyczna

Test wizualny:

```typescript
// W /tests/visual/car-header.spec.ts
test("car header layout without overlap", async ({ page }) => {
  await page.goto("/cars/[carId]");

  // Screenshot nagłówka
  const header = page.locator('[data-testid="car-header"]');
  await expect(header).toHaveScreenshot("car-header.png");

  // Sprawdź, czy breadcrumbs i nazwa nie nachodzą na siebie
  const breadcrumbs = page.locator('nav[aria-label="breadcrumb"]');
  const carName = page.locator('[data-testid="car-name"]');

  const breadcrumbsBox = await breadcrumbs.boundingBox();
  const carNameBox = await carName.boundingBox();

  // Sprawdź, że nie ma nakładania (overlap)
  if (breadcrumbsBox && carNameBox) {
    expect(breadcrumbsBox.y + breadcrumbsBox.height).toBeLessThan(carNameBox.y);
  }
});
```

#### Weryfikacja manualna

1. Przejdź do widoku szczegółów samochodu (`/cars/{carId}`)
2. Sprawdź wizualnie, czy:
   - Breadcrumbs i nazwa samochodu są wyraźnie oddzielone
   - Nie ma duplikacji nazwy samochodu
   - Layout wygląda czysty i profesjonalny
3. Przetestuj na różnych rozmiarach ekranu (mobile, tablet, desktop)

**Kryteria akceptacji:**

- Nazwa samochodu pojawia się tylko raz
- Breadcrumbs jest czytelny i nie pokrywa się z innymi elementami
- Odstęp między breadcrumbs a kolejnymi elementami wynosi co najmniej 1rem (16px)

---

## Podsumowanie zmian według komponentów

### Frontend Components

| Komponent                | Błędy          | Zmiany                                                      |
| ------------------------ | -------------- | ----------------------------------------------------------- |
| `NewFillupView.tsx`      | BUG-17         | Dodanie pobierania danych samochodu                         |
| `useNewFillupForm.ts`    | BUG-17, BUG-18 | Przekazanie `initialInputMode`, usunięcie zbędnej walidacji |
| `LoginForm.tsx`          | BUG-18         | Przeniesienie walidacji z onChange na onBlur                |
| `RegisterForm.tsx`       | BUG-18, BUG-19 | Przeniesienie walidacji, cross-field validation             |
| `useLoginForm.ts`        | BUG-18         | Debounce/usunięcie real-time validation                     |
| `useRegisterForm.ts`     | BUG-18, BUG-19 | Cross-field validation dla haseł                            |
| `FillupCard.tsx`         | BUG-20         | Poprawka grid layout                                        |
| `CarStatistics.tsx`      | BUG-21         | Formatowanie spalania do 2 miejsc                           |
| `AverageConsumption.tsx` | BUG-21         | Formatowanie spalania do 2 miejsc                           |
| `CarHeader.tsx`          | BUG-22         | Integracja z breadcrumbs, usunięcie duplikacji              |
| `CarDetailsView.tsx`     | BUG-22         | Aktualizacja layoutu                                        |

### Backend/Database

| Element           | Błędy  | Zmiany                                        |
| ----------------- | ------ | --------------------------------------------- |
| Migracje Supabase | BUG-16 | Włączenie RLS na tabelach `cars` i `fillups`  |
| Polityki RLS      | BUG-16 | Weryfikacja/utworzenie polityk bezpieczeństwa |

### Utilities

| Utility                | Błędy  | Zmiany                             |
| ---------------------- | ------ | ---------------------------------- |
| `formatters.ts` (nowy) | BUG-21 | Wspólne funkcje formatowania liczb |

---

## Kolejność napraw (rekomendacja)

1. **BUG-16** (Priorytet: KRITYCZNY) - RLS - kwestia bezpieczeństwa
2. **BUG-19** (Priorytet: WYSOKI) - Walidacja haseł - blokuje rejestrację
3. **BUG-18** (Priorytet: WYSOKI) - Walidacja formularzy - UX
4. **BUG-17** (Priorytet: ŚREDNI) - Preferencja tankowania - UX
5. **BUG-21** (Priorytet: NISKI) - Formatowanie spalania - wizualne
6. **BUG-20** (Priorytet: NISKI) - Layout kafelka - wizualne
7. **BUG-22** (Priorytet: NISKI) - Breadcrumbs - wizualne

---

## Weryfikacja końcowa

Po naprawie wszystkich błędów wykonaj:

1. **Pełen test suite**:

   ```bash
   npm test
   ```

2. **Test E2E**:

   ```bash
   npx playwright test
   ```

3. **Manualny smoke test**:
   - Rejestracja nowego użytkownika
   - Dodanie samochodu
   - Dodanie 3 tankowań (z różnymi trybami)
   - Sprawdzenie wyświetlania na mobile i desktop
   - Logout i login

4. **Weryfikacja bezpieczeństwa**:
   - Próba dostępu do danych innego użytkownika
   - Próba wykonania operacji bez sesji
