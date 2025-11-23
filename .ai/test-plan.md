# Plan Testów - JustFuel

## 1. Wprowadzenie i Cele Testowania

### 1.1. Cel Dokumentu

Niniejszy dokument stanowi kompleksowy plan testów dla aplikacji JustFuel - minimalistycznej aplikacji webowej do śledzenia zużycia paliwa. Plan testów definiuje strategię, zakres, metody i narzędzia testowania, zapewniając wysoką jakość produktu przed wdrożeniem produkcyjnym.

### 1.2. Cele Testowania

- **Weryfikacja funkcjonalności**: Potwierdzenie, że wszystkie funkcje działają zgodnie z wymaganiami
- **Zapewnienie bezpieczeństwa**: Weryfikacja mechanizmów autentykacji i autoryzacji (RLS)
- **Sprawdzenie integralności danych**: Walidacja poprawności obliczeń i spójności danych
- **Ocena wydajności**: Testowanie wydajności zapytań do bazy danych i renderowania UI
- **Zapewnienie użyteczności**: Weryfikacja intuicyjności interfejsu użytkownika
- **Kompatybilność**: Testowanie na różnych przeglądarkach i urządzeniach

### 1.3. Zakres Dokumentu

Plan testów obejmuje:

- Testy jednostkowe (Unit Tests)
- Testy integracyjne (Integration Tests)
- Testy end-to-end (E2E Tests)
- Testy bezpieczeństwa (Security Tests)
- Testy wydajnościowe (Performance Tests)
- Testy użyteczności (Usability Tests)

## 2. Zakres Testów

### 2.1. Funkcjonalności w Zakresie Testów

#### 2.1.1. Autentykacja i Autoryzacja

- Rejestracja nowego użytkownika
- Logowanie użytkownika
- Wylogowanie użytkownika
- Resetowanie hasła (forgot password)
- Potwierdzenie adresu e-mail
- Ochrona tras przed nieautoryzowanym dostępem
- Row-Level Security (RLS) w bazie danych

#### 2.1.2. Zarządzanie Samochodami

- Tworzenie nowego samochodu
- Listowanie samochodów użytkownika
- Wyświetlanie szczegółów samochodu
- Edycja samochodu (nazwa, preferencja wprowadzania)
- Usuwanie samochodu (z potwierdzeniem)
- Walidacja unikalności nazwy samochodu
- Statystyki samochodu (agregowane)

#### 2.1.3. Zarządzanie Tankowaniami

- Tworzenie nowego tankowania (metoda: odometer)
- Tworzenie nowego tankowania (metoda: distance)
- Listowanie tankowań z paginacją
- Wyświetlanie szczegółów tankowania
- Edycja tankowania
- Usuwanie tankowania
- Automatyczne obliczanie spalania i ceny za litr
- Walidacja spójności licznika
- Ostrzeżenia walidacyjne (odometer wstecz, zero distance)
- Rekalkulacja statystyk po edycji/usunięciu

#### 2.1.4. Statystyki i Wykresy

- Wyświetlanie statystyk samochodu
- Wykres spalania w czasie
- Wykres ceny za litr w czasie
- Wykres dystansu między tankowaniami
- Filtrowanie danych wykresów (date range)

#### 2.1.5. Interfejs Użytkownika

- Responsywność na różnych urządzeniach
- Nawigacja między widokami
- Komunikaty błędów i sukcesu
- Formularze z walidacją
- Infinite scroll dla listy tankowań
- Kolorowanie tankowań według spalania

### 2.2. Funkcjonalności poza Zakresem Testów

- Eksport danych (CSV/PDF)
- Integracje zewnętrzne (GPS, OBD-II)
- Aplikacje mobilne (iOS/Android)
- Funkcje społecznościowe

## 3. Typy Testów do Przeprowadzenia

### 3.1. Testy Jednostkowe (Unit Tests)

#### 3.1.1. Serwisy (Services)

**Narzędzie**: Vitest + MSW (Mock Service Worker)
**Zakres**:

- `auth.service.ts`
  - `loginUser()` - walidacja danych wejściowych, mapowanie błędów Supabase
  - `registerUser()` - tworzenie użytkownika, obsługa potwierdzenia e-mail
  - `logoutUser()` - wylogowanie
  - `resetPasswordForEmail()` - wysyłka e-maila resetującego
  - `updatePasswordWithToken()` - aktualizacja hasła
  - `mapSupabaseError()` - mapowanie błędów Supabase na błędy aplikacji
  - Testowanie custom error classes (InvalidCredentialsError, EmailAlreadyExistsError, etc.)
  - Testowanie z MSW dla mockowania Supabase client

- `cars.service.ts`
  - `listUserCarsWithStats()` - listowanie z sortowaniem
  - `getUserCarWithStats()` - pobieranie szczegółów z statystykami
  - `createCar()` - tworzenie z walidacją unikalności nazwy
  - `updateCar()` - aktualizacja z walidacją
  - `deleteCar()` - usuwanie z potwierdzeniem
  - `getCarStatistics()` - agregacja statystyk

- `fillups.service.ts`
  - `listFillupsByCar()` - paginacja kursorem, sortowanie
  - `getFillupById()` - pobieranie pojedynczego tankowania
  - `createFillup()` - tworzenie z metodą odometer/distance, walidacja
  - `updateFillup()` - aktualizacja z rekalkulacją
  - `deleteFillup()` - usuwanie z rekalkulacją następnych tankowań
  - `encodeCursor()` / `decodeCursor()` - kodowanie/dekodowanie kursora

- `charts.service.ts`
  - Generowanie danych wykresów
  - Filtrowanie po zakresie dat
  - Obliczanie średnich i metadanych

#### 3.1.2. Walidacja (Validation)

**Narzędzie**: Vitest
**Zakres**:

- `validation/cars.ts`
  - Schematy Zod dla tworzenia/edycji samochodu
  - Walidacja parametrów zapytań
  - Walidacja UUID w parametrach ścieżki
  - Testowanie edge cases (puste stringi, zbyt długie nazwy, nieprawidłowe UUID)

- `validation/fillups.ts`
  - Schematy Zod dla tworzenia/edycji tankowania
  - Walidacja wzajemnej wyłączności odometer/distance
  - Walidacja daty (ISO 8601)
  - Walidacja wartości liczbowych (positive, non-negative)
  - Testowanie edge cases (ujemne wartości, NaN, Infinity)

#### 3.1.3. Komponenty React

**Narzędzie**: Vitest + React Testing Library + @testing-library/user-event
**Zakres**:

- Komponenty formularzy autentykacji
  - `LoginForm.tsx` - walidacja pól, obsługa błędów
  - `RegisterForm.tsx` - walidacja, obsługa sukcesu
  - `ForgotPasswordForm.tsx` - wysyłka e-maila
  - `ResetPasswordForm.tsx` - reset hasła z tokenem

- Komponenty zarządzania samochodami
  - `NewCarFormView.tsx` - formularz tworzenia
  - `EditCarView.tsx` - formularz edycji
  - `DeleteCarDialog.tsx` - dialog potwierdzenia
  - `CarsListView.tsx` - lista z sortowaniem

- Komponenty zarządzania tankowaniami
  - `NewFillupView.tsx` - formularz z przełącznikiem odometer/distance
  - `EditFillupView.tsx` - formularz edycji
  - `FillupsView.tsx` - lista z infinite scroll
  - Obsługa ostrzeżeń walidacyjnych

- Komponenty UI (Shadcn/ui)
  - `Button.tsx` - różne warianty i stany
  - `Input.tsx` - walidacja, stany błędów
  - `Select.tsx` - wybór opcji

- Testowanie z MSW dla mockowania API calls
- Testowanie accessibility z @axe-core/react

#### 3.1.4. Hooks React

**Narzędzie**: Vitest + React Testing Library
**Zakres**:

- `useLoginForm.ts` - stan formularza, walidacja, submit
- `useRegisterForm.ts` - stan formularza, walidacja, submit
- `useNewCarForm.ts` - stan formularza, walidacja, submit
- `useNewFillupForm.ts` - przełączanie odometer/distance, walidacja
- `useEditFillupForm.ts` - aktualizacja, obsługa ostrzeżeń
- `useCarsList.ts` - pobieranie danych, sortowanie
- `useFillupsView.ts` - paginacja, infinite scroll

**Uwaga**: Hooks testowane przez komponenty używające ich (best practice), nie bezpośrednio przez renderHook, chyba że jest to konieczne dla izolacji logiki.

#### 3.1.5. Komponenty Astro

**Narzędzie**: Vitest + @astrojs/testing (lub alternatywa)
**Zakres**:

- Komponenty Astro (`.astro` files)
  - `Layout.astro` - renderowanie layoutu
  - `AuthLayout.astro` - layout dla stron autentykacji
  - `Welcome.astro` - komponenty statyczne
  - Testowanie SSR rendering
  - Testowanie props i slots
  - Testowanie integracji z React components (Islands)

- Strony Astro (`.astro` files w `src/pages/`)
  - Testowanie renderowania stron
  - Testowanie danych z API/context
  - Testowanie redirects i status codes

**Uwaga**: Astro components wymagają specjalnego podejścia do testowania ze względu na SSR i Islands Architecture.

#### 3.1.6. TypeScript Types

**Narzędzie**: tsd
**Zakres**:

- Testowanie typów TypeScript
  - Weryfikacja poprawności typów w `types.ts`
  - Weryfikacja typów zwracanych przez serwisy
  - Weryfikacja typów props komponentów
  - Weryfikacja zgodności typów z Supabase types

### 3.2. Testy Integracyjne (Integration Tests)

#### 3.2.1. API Endpoints

**Narzędzie**: Playwright API Testing + Vitest (dla handlerów)
**Zakres**:

**Uwaga**: Astro API routes wymagają specjalnego podejścia. Zamiast Supertest (który jest dla Express/Node.js), używamy Playwright do testowania przez HTTP lub bezpośredniego testowania handlerów z Astro Test Utils.

**Autentykacja**:

- `POST /api/auth/register` - rejestracja, walidacja, obsługa błędów
- `POST /api/auth/login` - logowanie, ustawianie sesji
- `POST /api/auth/logout` - wylogowanie, czyszczenie sesji
- `POST /api/auth/forgot-password` - wysyłka e-maila
- `POST /api/auth/reset-password` - reset hasła z tokenem

**Samochody**:

- `GET /api/cars` - listowanie z sortowaniem, filtrowanie po user_id (RLS)
- `GET /api/cars/{carId}` - szczegóły z statystykami, weryfikacja własności
- `POST /api/cars` - tworzenie, walidacja unikalności nazwy
- `PATCH /api/cars/{carId}` - aktualizacja, walidacja
- `DELETE /api/cars/{carId}` - usuwanie z potwierdzeniem, cascade delete

**Tankowania**:

- `GET /api/cars/{carId}/fillups` - paginacja, sortowanie, weryfikacja własności
- `GET /api/cars/{carId}/fillups/{fillupId}` - szczegóły, weryfikacja własności
- `POST /api/cars/{carId}/fillups` - tworzenie (odometer/distance), obliczenia
- `PATCH /api/cars/{carId}/fillups/{fillupId}` - aktualizacja, rekalkulacja
- `DELETE /api/cars/{carId}/fillups/{fillupId}` - usuwanie, rekalkulacja następnych

**Statystyki i Wykresy**:

- `GET /api/cars/{carId}/statistics` - agregacja statystyk
- `GET /api/cars/{carId}/charts` - generowanie danych wykresów

**Scenariusze testowe**:

- Pełny przepływ CRUD dla samochodu
- Pełny przepływ CRUD dla tankowania
- Weryfikacja RLS - użytkownik nie może zobaczyć danych innego użytkownika
- Weryfikacja cascade delete - usunięcie samochodu usuwa tankowania
- Weryfikacja rekalkulacji po edycji/usunięciu tankowania

#### 3.2.2. Integracja z Bazą Danych

**Narzędzie**: Vitest + Supabase Test Helpers + Lokalna instancja Supabase
**Zakres**:

- Weryfikacja RLS policies
  - Testowanie z różnymi klientami (anon, authenticated)
  - Weryfikacja, że użytkownik widzi tylko swoje dane
  - Weryfikacja, że użytkownik nie może modyfikować danych innych użytkowników
  - Testowanie prób obejścia RLS przez bezpośrednie zapytania SQL

- Weryfikacja constraintów (unique, foreign keys)
- Weryfikacja triggerów i funkcji (jeśli istnieją)
- Weryfikacja widoków (car_statistics)
- Weryfikacja indeksów (wydajność zapytań)

**Narzędzia pomocnicze**:

- Supabase Local Development (Docker) dla testów integracyjnych
- Różne Supabase clients z różnymi tokenami autoryzacji

#### 3.2.3. Middleware

**Narzędzie**: Vitest + Astro Test Utils + Playwright
**Zakres**:

- `middleware/index.ts`
  - Przekierowanie na publiczne ścieżki
  - Weryfikacja autentykacji dla chronionych ścieżek
  - Przekierowanie na login z parametrem redirect
  - Obsługa kodu resetowania hasła w URL
  - Testowanie Astro middleware specyfiki (Astro.locals, Astro.cookies)
  - Testowanie efektów middleware (redirects, cookies, headers)
  - Testowanie SSR context w middleware

### 3.3. Testy End-to-End (E2E Tests)

#### 3.3.1. Narzędzie

**Playwright** (zalecane)

**Uzasadnienie**: Playwright ma doskonałe wsparcie dla Astro SSR, automatyczne czekanie na elementy, wsparcie dla wielu przeglądarek i lepszą integrację z CI/CD niż Cypress.

#### 3.3.2. Scenariusze Testowe

**Scenariusz 1: Rejestracja i Pierwsze Użycie**

1. Użytkownik odwiedza stronę główną
2. Przekierowanie na `/auth/login`
3. Przejście do rejestracji
4. Wypełnienie formularza rejestracji
5. Potwierdzenie e-maila (symulacja)
6. Logowanie
7. Dodanie pierwszego samochodu
8. Dodanie pierwszego tankowania
9. Weryfikacja wyświetlenia statystyk

**Scenariusz 2: Zarządzanie Samochodami**

1. Logowanie
2. Dodanie nowego samochodu
3. Edycja nazwy samochodu
4. Wyświetlenie szczegółów samochodu
5. Dodanie kilku tankowań
6. Weryfikacja aktualizacji statystyk
7. Usunięcie samochodu (z potwierdzeniem)

**Scenariusz 3: Zarządzanie Tankowaniami - Metoda Odometer**

1. Logowanie
2. Wybór samochodu
3. Dodanie tankowania z odometer
4. Weryfikacja automatycznego obliczenia distance
5. Weryfikacja obliczenia spalania i ceny za litr
6. Edycja tankowania
7. Weryfikacja rekalkulacji
8. Usunięcie tankowania
9. Weryfikacja rekalkulacji następnych tankowań

**Scenariusz 4: Zarządzanie Tankowaniami - Metoda Distance**

1. Logowanie
2. Wybór samochodu
3. Przełączenie na tryb "distance"
4. Dodanie tankowania z distance
5. Weryfikacja automatycznego obliczenia odometer
6. Weryfikacja obliczeń

**Scenariusz 5: Walidacja i Ostrzeżenia**

1. Logowanie
2. Dodanie tankowania z odometer mniejszym niż poprzednie
3. Weryfikacja wyświetlenia ostrzeżenia
4. Dodanie tankowania z distance = 0
5. Weryfikacja ostrzeżenia

**Scenariusz 6: Paginacja i Infinite Scroll**

1. Logowanie
2. Wybór samochodu z wieloma tankowaniami (>20)
3. Weryfikacja wyświetlenia pierwszych 20
4. Przewinięcie w dół
5. Weryfikacja załadowania kolejnych tankowań
6. Weryfikacja kursora paginacji

**Scenariusz 7: Wykresy**

1. Logowanie
2. Wybór samochodu z tankowaniami
3. Przejście do widoku wykresów
4. Przełączenie między typami wykresów
5. Filtrowanie po zakresie dat
6. Weryfikacja poprawności danych

**Scenariusz 8: Reset Hasła**

1. Odwiedzenie `/auth/forgot-password`
2. Wprowadzenie adresu e-mail
3. Symulacja otrzymania e-maila
4. Kliknięcie linku resetującego
5. Wprowadzenie nowego hasła
6. Weryfikacja możliwości logowania nowym hasłem

**Scenariusz 9: Bezpieczeństwo - Izolacja Danych**

1. Utworzenie dwóch kont użytkowników
2. Logowanie jako User A
3. Utworzenie samochodu i tankowań
4. Wylogowanie
5. Logowanie jako User B
6. Weryfikacja, że User B nie widzi danych User A
7. Próba dostępu do samochodu User A przez URL (404)

**Scenariusz 10: Responsywność**

1. Testowanie na różnych rozdzielczościach (mobile, tablet, desktop)
2. Weryfikacja działania formularzy
3. Weryfikacja wyświetlania list i wykresów
4. Weryfikacja nawigacji

**Scenariusz 11: Visual Regression**

1. Logowanie
2. Przejście do różnych widoków
3. Weryfikacja screenshotów (Playwright Visual Comparisons)
4. Wykrywanie nieoczekiwanych zmian wizualnych

### 3.4. Testy Bezpieczeństwa (Security Tests)

#### 3.4.1. Autentykacja i Autoryzacja

- **SQL Injection**: Testowanie parametrów zapytań
- **XSS (Cross-Site Scripting)**: Testowanie pól formularzy
- **CSRF (Cross-Site Request Forgery)**: Weryfikacja tokenów
- **Session Management**: Weryfikacja wygaśnięcia sesji
- **Password Security**: Weryfikacja wymagań hasła, hashowanie

#### 3.4.2. Row-Level Security (RLS)

- Weryfikacja, że użytkownik widzi tylko swoje dane
- Weryfikacja, że użytkownik nie może modyfikować danych innych użytkowników
- Weryfikacja, że użytkownik nie może usuwać danych innych użytkowników
- Testowanie prób obejścia RLS przez bezpośrednie zapytania SQL

#### 3.4.3. Walidacja Wejścia

- Testowanie nieprawidłowych UUID
- Testowanie nieprawidłowych wartości liczbowych (ujemne, zero, NaN)
- Testowanie nieprawidłowych dat
- Testowanie zbyt długich stringów
- Testowanie znaków specjalnych w nazwach

#### 3.4.4. API Security

- Weryfikacja wymagania autoryzacji dla chronionych endpointów
- Weryfikacja rate limiting (jeśli zaimplementowany)
- Weryfikacja CORS policies
- Weryfikacja walidacji Content-Type

### 3.5. Testy Wydajnościowe (Performance Tests)

#### 3.5.1. Wydajność Bazy Danych

- Testowanie zapytań z dużą liczbą samochodów (>100)
- Testowanie zapytań z dużą liczbą tankowań (>1000)
- Weryfikacja wykorzystania indeksów
- Weryfikacja wydajności widoku `car_statistics`
- Weryfikacja wydajności paginacji kursorem

#### 3.5.2. Wydajność Frontendu

- Testowanie renderowania listy z wieloma samochodami
- Testowanie infinite scroll z wieloma tankowaniami
- Weryfikacja czasu ładowania strony
- Weryfikacja czasu renderowania wykresów
- Weryfikacja optymalizacji React (memo, useMemo, useCallback)

#### 3.5.3. Narzędzia

- **Lighthouse** - audyt wydajności
- **Lighthouse CI** - automatyczne audyty w CI/CD
- **Web Vitals** - monitoring Core Web Vitals (LCP, FID, CLS, FCP, TTFB)
- **WebPageTest** - szczegółowa analiza
- **Chrome DevTools Performance** - profilowanie
- **Performance budgets** - definiowanie i weryfikacja limitów wydajności

### 3.6. Visual Regression Testing

#### 3.6.1. Narzędzie

**Playwright Visual Comparisons** (wbudowane w Playwright)

#### 3.6.2. Zakres

- Porównywanie screenshotów stron i komponentów
- Wykrywanie nieoczekiwanych zmian wizualnych
- Testowanie na różnych rozdzielczościach ekranu
- Testowanie w różnych przeglądarkach

**Przykład użycia**:

- Screenshot całej strony po zmianach
- Screenshot komponentów w różnych stanach
- Automatyczne porównywanie z baseline

### 3.7. Testy Użyteczności (Usability Tests)

#### 3.7.1. Dostępność (Accessibility)

- **WCAG 2.1 AA Compliance**
  - Kontrast kolorów
  - Nawigacja klawiaturą
  - Screen reader compatibility
  - Etykiety formularzy
  - Komunikaty błędów

**Narzędzia**:

- **@axe-core/react** - integracja z React Testing Library dla testów jednostkowych
- **playwright-axe** - testy dostępności w E2E (Playwright)
- **axe DevTools** - rozszerzenie przeglądarki
- **WAVE** - weryfikacja dostępności
- **Lighthouse Accessibility Audit** - audyt dostępności

#### 3.7.2. Responsywność

- Testowanie na urządzeniach mobilnych (320px - 768px)
- Testowanie na tabletach (768px - 1024px)
- Testowanie na desktopach (>1024px)
- Weryfikacja działania touch gestures

#### 3.7.3. Kompatybilność Przeglądarek

- **Chrome** (najnowsza wersja)
- **Firefox** (najnowsza wersja)
- **Safari** (najnowsza wersja)
- **Edge** (najnowsza wersja)

## 4. Scenariusze Testowe dla Kluczowych Funkcjonalności

### 4.1. Autentykacja

#### TC-AUTH-001: Rejestracja Nowego Użytkownika

**Warunki wstępne**: Brak
**Kroki**:

1. Odwiedź `/auth/register`
2. Wprowadź poprawny adres e-mail
3. Wprowadź hasło (min. 8 znaków)
4. Potwierdź hasło
5. Kliknij "Zarejestruj"

**Oczekiwany rezultat**:

- Komunikat o wysłaniu e-maila potwierdzającego
- Przekierowanie na stronę potwierdzenia

#### TC-AUTH-002: Logowanie Zarejestrowanego Użytkownika

**Warunki wstępne**: Użytkownik zarejestrowany i potwierdzony
**Kroki**:

1. Odwiedź `/auth/login`
2. Wprowadź poprawny e-mail
3. Wprowadź poprawne hasło
4. Kliknij "Zaloguj"

**Oczekiwany rezultat**:

- Przekierowanie na `/cars`
- Wyświetlenie listy samochodów (lub pustej listy)

#### TC-AUTH-003: Logowanie z Nieprawidłowymi Danymi

**Warunki wstępne**: Brak
**Kroki**:

1. Odwiedź `/auth/login`
2. Wprowadź nieprawidłowy e-mail lub hasło
3. Kliknij "Zaloguj"

**Oczekiwany rezultat**:

- Wyświetlenie komunikatu błędu
- Brak przekierowania

#### TC-AUTH-004: Reset Hasła

**Warunki wstępne**: Użytkownik zarejestrowany
**Kroki**:

1. Odwiedź `/auth/forgot-password`
2. Wprowadź adres e-mail
3. Kliknij "Wyślij"
4. Otwórz e-mail z linkiem resetującym
5. Kliknij link
6. Wprowadź nowe hasło
7. Potwierdź nowe hasło
8. Kliknij "Zresetuj hasło"

**Oczekiwany rezultat**:

- Hasło zostało zmienione
- Możliwość logowania nowym hasłem

### 4.2. Zarządzanie Samochodami

#### TC-CAR-001: Tworzenie Nowego Samochodu

**Warunki wstępne**: Użytkownik zalogowany
**Kroki**:

1. Odwiedź `/cars/new`
2. Wprowadź nazwę samochodu
3. (Opcjonalnie) Wprowadź początkowy stan licznika
4. Wybierz preferencję wprowadzania (odometer/distance)
5. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Samochód został utworzony
- Przekierowanie na `/cars`
- Wyświetlenie nowego samochodu na liście

#### TC-CAR-002: Tworzenie Samochodu z Duplikującą Się Nazwą

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód o nazwie "Audi A4"
**Kroki**:

1. Odwiedź `/cars/new`
2. Wprowadź nazwę "Audi A4"
3. Wypełnij pozostałe pola
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Wyświetlenie błędu: "Nazwa samochodu już istnieje"
- Samochód nie został utworzony

#### TC-CAR-003: Edycja Samochodu

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód
**Kroki**:

1. Odwiedź `/cars/{carId}/edit`
2. Zmień nazwę samochodu
3. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Nazwa została zaktualizowana
- Przekierowanie na szczegóły samochodu
- Wyświetlenie zaktualizowanej nazwy

#### TC-CAR-004: Usuwanie Samochodu

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}`
2. Kliknij "Usuń samochód"
3. Wprowadź dokładną nazwę samochodu w polu potwierdzenia
4. Kliknij "Usuń"

**Oczekiwany rezultat**:

- Samochód i wszystkie tankowania zostały usunięte
- Przekierowanie na `/cars`
- Samochód nie jest widoczny na liście

### 4.3. Zarządzanie Tankowaniami

#### TC-FILLUP-001: Tworzenie Tankowania - Metoda Odometer

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups/new`
2. Upewnij się, że wybrano tryb "odometer"
3. Wprowadź datę
4. Wprowadź ilość paliwa
5. Wprowadź całkowitą cenę
6. Wprowadź stan licznika
7. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Tankowanie zostało utworzone
- Automatyczne obliczenie `distance_traveled`
- Automatyczne obliczenie `fuel_consumption` i `price_per_liter`
- Przekierowanie na listę tankowań

#### TC-FILLUP-002: Tworzenie Tankowania - Metoda Distance

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z poprzednim tankowaniem
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups/new`
2. Przełącz na tryb "distance"
3. Wprowadź datę
4. Wprowadź ilość paliwa
5. Wprowadź całkowitą cenę
6. Wprowadź dystans
7. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Tankowanie zostało utworzone
- Automatyczne obliczenie `odometer` na podstawie poprzedniego tankowania
- Automatyczne obliczenie `fuel_consumption` i `price_per_liter`

#### TC-FILLUP-003: Ostrzeżenie - Odometer Wstecz

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z tankowaniem (odometer: 50000)
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups/new`
2. Wprowadź odometer: 49000 (mniejszy niż poprzedni)
3. Wypełnij pozostałe pola
4. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Tankowanie zostało utworzone
- Wyświetlenie ostrzeżenia: "Stan licznika jest mniejszy niż w poprzednim tankowaniu"
- Tankowanie jest widoczne na liście

#### TC-FILLUP-004: Edycja Tankowania z Rekalkulacją

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z kilkoma tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups/{fillupId}/edit`
2. Zmień stan licznika
3. Kliknij "Zapisz"

**Oczekiwany rezultat**:

- Tankowanie zostało zaktualizowane
- `distance_traveled` zostało przeliczone
- `fuel_consumption` zostało przeliczone
- Statystyki samochodu zostały zaktualizowane

#### TC-FILLUP-005: Usuwanie Tankowania z Rekalkulacją

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z kilkoma tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups`
2. Kliknij "Usuń" przy tankowaniu w środku listy
3. Potwierdź usunięcie

**Oczekiwany rezultat**:

- Tankowanie zostało usunięte
- Następne tankowania mają przeliczone `distance_traveled` i `fuel_consumption`
- Statystyki samochodu zostały zaktualizowane

#### TC-FILLUP-006: Paginacja Tankowań

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z >20 tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}/fillups`
2. Przewiń w dół listy
3. Obserwuj automatyczne ładowanie kolejnych tankowań

**Oczekiwany rezultat**:

- Wyświetlenie pierwszych 20 tankowań
- Po przewinięciu załadowanie kolejnych 20
- Płynne przewijanie bez błędów

### 4.4. Statystyki i Wykresy

#### TC-STATS-001: Wyświetlanie Statystyk Samochodu

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}`
2. Sprawdź sekcję statystyk

**Oczekiwany rezultat**:

- Wyświetlenie wszystkich statystyk:
  - Całkowity koszt paliwa
  - Całkowita ilość paliwa
  - Całkowity dystans
  - Średnie spalanie
  - Średnia cena za litr
  - Liczba tankowań

#### TC-CHARTS-001: Wyświetlanie Wykresu Spalania

**Warunki wstępne**: Użytkownik zalogowany, istnieje samochód z >5 tankowaniami
**Kroki**:

1. Odwiedź `/cars/{carId}/charts`
2. Wybierz typ wykresu: "consumption"
3. Sprawdź wyświetlenie wykresu

**Oczekiwany rezultat**:

- Wyświetlenie wykresu liniowego spalania w czasie
- Poprawne wartości na osiach
- Interaktywność (hover, zoom jeśli zaimplementowane)

## 5. Środowisko Testowe

### 5.1. Środowiska Testowe

#### 5.1.1. Środowisko Lokalne (Development)

- **Przeznaczenie**: Testy jednostkowe, integracyjne, E2E podczas rozwoju
- **Baza danych**: Lokalna instancja Supabase (Docker) lub Supabase Local Development
- **Node.js**: 22.14.0 (zgodnie z .nvmrc)
- **Przeglądarki**: Chrome, Firefox, Safari (lokalne)

#### 5.1.2. Środowisko Testowe (Staging)

- **Przeznaczenie**: Testy integracyjne, E2E przed wdrożeniem produkcyjnym
- **Baza danych**: Dedykowany projekt Supabase dla środowiska testowego
- **Hosting**: DigitalOcean (staging environment)
- **Dane testowe**: Zestaw danych testowych (użytkownicy, samochody, tankowania)

#### 5.1.3. Środowisko Produkcyjne

- **Przeznaczenie**: Testy smoke po wdrożeniu
- **Baza danych**: Produkcyjny projekt Supabase
- **Hosting**: DigitalOcean (production)

### 5.2. Dane Testowe

#### 5.2.1. Użytkownicy Testowi

- `test-user-1@example.com` - użytkownik z samochodami i tankowaniami
- `test-user-2@example.com` - użytkownik z pustym kontem
- `test-user-3@example.com` - użytkownik z dużą ilością danych (testy wydajności)

#### 5.2.2. Samochody Testowe

- Różne nazwy (test unikalności)
- Różne wartości `initial_odometer`
- Różne `mileage_input_preference`

#### 5.2.3. Tankowania Testowe

- Różne daty (test sortowania)
- Różne wartości odometer (test walidacji)
- Różne ilości paliwa i ceny (test obliczeń)
- Edge cases: odometer wstecz, zero distance

### 5.3. Konfiguracja Środowiska

#### 5.3.1. Zmienne Środowiskowe

```bash
# Development
SUPABASE_URL=http://localhost:54321
SUPABASE_KEY=test-anon-key
DEV_AUTH_FALLBACK=true

# Staging
SUPABASE_URL=https://[staging-project].supabase.co
SUPABASE_KEY=[staging-anon-key]
DEV_AUTH_FALLBACK=false

# Production
SUPABASE_URL=https://[production-project].supabase.co
SUPABASE_KEY=[production-anon-key]
DEV_AUTH_FALLBACK=false
```

## 6. Narzędzia do Testowania

### 6.1. Testy Jednostkowe i Integracyjne

#### 6.1.1. Vitest

- **Przeznaczenie**: Framework testowy (główny framework dla projektu)
- **Konfiguracja**: `vitest.config.ts`
- **Zalety**: Szybki, natywne wsparcie ESM, TypeScript out-of-the-box, idealny dla Astro (używa Vite)
- **Coverage**: `@vitest/coverage-v8` - natywne wsparcie dla code coverage

#### 6.1.2. React Testing Library

- **Przeznaczenie**: Testowanie komponentów React
- **Zasady**: Testowanie z perspektywy użytkownika, nie implementacji

#### 6.1.3. MSW (Mock Service Worker)

- **Przeznaczenie**: Mockowanie requestów HTTP w testach
- **Zastosowanie**: Mockowanie Supabase API w testach jednostkowych
- **Zalety**: Działa na poziomie sieci, nie mockuje implementacji, idealne do testowania integracji

#### 6.1.4. @astrojs/testing (lub alternatywa)

- **Przeznaczenie**: Testowanie komponentów Astro (`.astro` files)
- **Zastosowanie**: Renderowanie i testowanie Astro components, SSR testing
- **Uwaga**: Jeśli oficjalne narzędzie nie jest dostępne, użyć bezpośredniego renderowania przez Vitest

#### 6.1.5. tsd

- **Przeznaczenie**: Testowanie typów TypeScript
- **Zastosowanie**: Weryfikacja poprawności typów w kodzie
- **Zalety**: Type-safe testowanie typów, wykrywanie błędów typów w czasie testów

### 6.2. Testy End-to-End

#### 6.2.1. Playwright (Zalecane)

- **Przeznaczenie**: Testy E2E w wielu przeglądarkach
- **Zalety**:
  - Wsparcie dla Chrome, Firefox, Safari, Edge
  - Automatyczne czekanie na elementy
  - Wbudowane narzędzia do debugowania
  - Screenshots i videos

#### 6.2.2. Playwright Visual Comparisons

- **Przeznaczenie**: Visual regression testing
- **Zalety**: Wbudowane w Playwright, automatyczne porównywanie screenshotów

### 6.3. Testy Bezpieczeństwa

#### 6.3.1. OWASP ZAP

- **Przeznaczenie**: Automatyczne skanowanie podatności

#### 6.3.2. Burp Suite

- **Przeznaczenie**: Testy penetracyjne (manual)

### 6.4. Testy Wydajności

#### 6.4.1. Lighthouse

- **Przeznaczenie**: Audyt wydajności, dostępności, SEO
- **Integracja**: Chrome DevTools, CI/CD

#### 6.4.2. WebPageTest

- **Przeznaczenie**: Szczegółowa analiza wydajności

#### 6.4.3. k6 (opcjonalnie)

- **Przeznaczenie**: Load testing API endpoints

### 6.5. Testy Dostępności

#### 6.5.1. axe DevTools

- **Przeznaczenie**: Automatyczne testy dostępności
- **Integracja**: Playwright, Jest

#### 6.5.2. WAVE

- **Przeznaczenie**: Weryfikacja dostępności

### 6.6. Narzędzia Pomocnicze

#### 6.6.1. @testing-library/user-event

- **Przeznaczenie**: Symulacja interakcji użytkownika w testach React
- **Zalety**: Bardziej realistyczne niż fireEvent, lepsze dla accessibility

#### 6.6.2. @testing-library/jest-dom

- **Przeznaczenie**: Dodatkowe matchery dla testów DOM
- **Zastosowanie**: Ułatwia asercje w testach React/Astro

#### 6.6.3. Supabase Test Helpers

- **Przeznaczenie**: Narzędzia pomocnicze do testowania Supabase
- **Zastosowanie**: Tworzenie testowych użytkowników, mockowanie RLS, testowanie z różnymi klientami

#### 6.6.4. Astro Test Utils

- **Przeznaczenie**: Narzędzia pomocnicze do testowania Astro (jeśli dostępne)
- **Zastosowanie**: Testowanie API routes, middleware, SSR rendering

## 7. Harmonogram Testów

### 7.1. Faza 1: Przygotowanie (Tydzień 1)

- [ ] Konfiguracja środowisk testowych
- [ ] Konfiguracja narzędzi testowych (Vitest, Playwright)
- [ ] Przygotowanie danych testowych
- [ ] Utworzenie struktury katalogów testowych
- [ ] Konfiguracja CI/CD dla testów automatycznych

### 7.2. Faza 2: Testy Jednostkowe (Tydzień 2-3)

- [ ] Testy serwisów (auth, cars, fillups, charts) z MSW
- [ ] Testy walidacji (Zod schemas)
- [ ] Testy komponentów React
- [ ] Testy komponentów Astro
- [ ] Testy hooks React (przez komponenty)
- [ ] Testy typów TypeScript (tsd)
- [ ] Cel: >80% code coverage

### 7.3. Faza 3: Testy Integracyjne (Tydzień 4)

- [ ] Testy API endpoints (Playwright API Testing)
- [ ] Testy integracji z bazą danych (Supabase Test Helpers)
- [ ] Testy middleware (Astro middleware specyfika)
- [ ] Testy RLS policies (z różnymi klientami)
- [ ] Testy SSR rendering

### 7.4. Faza 4: Testy E2E (Tydzień 5)

- [ ] Implementacja scenariuszy E2E
- [ ] Testy na różnych przeglądarkach
- [ ] Testy responsywności
- [ ] Testy użyteczności
- [ ] Visual regression testing
- [ ] Accessibility testing w E2E (playwright-axe)

### 7.5. Faza 5: Testy Bezpieczeństwa i Wydajności (Tydzień 6)

- [ ] Testy bezpieczeństwa (autoryzacja, RLS, walidacja)
- [ ] Testy wydajności (baza danych, frontend)
- [ ] Web Vitals monitoring
- [ ] Lighthouse CI integration
- [ ] Audyt dostępności (WCAG)

### 7.6. Faza 6: Testy Regresyjne (Ongoing)

- [ ] Automatyczne testy przy każdym PR
- [ ] Testy smoke przed wdrożeniem
- [ ] Testy sanity po wdrożeniu

## 8. Kryteria Akceptacji Testów

### 8.1. Kryteria Ogólne

- Wszystkie testy jednostkowe przechodzą (>80% coverage)
- Wszystkie testy integracyjne przechodzą
- Wszystkie testy E2E przechodzą
- Brak krytycznych błędów bezpieczeństwa
- Wydajność zgodna z wymaganiami (Lighthouse score >90)
- Dostępność zgodna z WCAG 2.1 AA

### 8.2. Kryteria Funkcjonalne

- Wszystkie funkcje z zakresu MVP działają poprawnie
- Wszystkie scenariusze testowe przechodzą
- Obsługa błędów działa poprawnie
- Komunikaty błędów są zrozumiałe dla użytkownika

### 8.3. Kryteria Bezpieczeństwa

- RLS policies działają poprawnie
- Użytkownicy nie mogą uzyskać dostępu do danych innych użytkowników
- Wszystkie endpointy wymagają autoryzacji (oprócz publicznych)
- Walidacja wejścia działa poprawnie
- Brak podatności na SQL Injection, XSS, CSRF

### 8.4. Kryteria Wydajności

- Czas ładowania strony <2s
- Czas odpowiedzi API <500ms (p95)
- Renderowanie listy z 100 samochodami <1s
- Infinite scroll działa płynnie
- Wykresy renderują się <1s

### 8.5. Kryteria Użyteczności

- Aplikacja działa na urządzeniach mobilnych
- Nawigacja jest intuicyjna
- Formularze są łatwe do wypełnienia
- Komunikaty błędów są pomocne
- Dostępność WCAG 2.1 AA

## 9. Role i Odpowiedzialności w Procesie Testowania

### 9.1. Zespół Rozwojowy

- **Odpowiedzialność**:
  - Pisanie testów jednostkowych podczas rozwoju
  - Naprawa błędów znalezionych w testach
  - Utrzymanie code coverage >80%

### 9.2. QA Engineer

- **Odpowiedzialność**:
  - Tworzenie i utrzymanie planu testów
  - Implementacja testów integracyjnych i E2E
  - Wykonywanie testów ręcznych
  - Raportowanie błędów
  - Weryfikacja napraw błędów

### 9.3. DevOps Engineer

- **Odpowiedzialność**:
  - Konfiguracja środowisk testowych
  - Konfiguracja CI/CD dla testów automatycznych
  - Monitorowanie wydajności testów

### 9.4. Product Owner

- **Odpowiedzialność**:
  - Definiowanie kryteriów akceptacji
  - Weryfikacja zgodności z wymaganiami
  - Zatwierdzanie wdrożenia

## 10. Procedury Raportowania Błędów

### 10.1. Format Raportu Błędu

Każdy raport błędu powinien zawierać:

1. **Tytuł**: Krótki, opisowy tytuł błędu
2. **Priorytet**:
   - **Krytyczny (P0)**: Blokuje główne funkcje, bezpieczeństwo
   - **Wysoki (P1)**: Ważna funkcja nie działa
   - **Średni (P2)**: Funkcja działa częściowo lub z ograniczeniami
   - **Niski (P3)**: Drobne problemy, poprawki kosmetyczne

3. **Środowisko**: Development / Staging / Production
4. **Kroki do odtworzenia**: Szczegółowe kroki prowadzące do błędu
5. **Oczekiwany rezultat**: Co powinno się wydarzyć
6. **Rzeczywisty rezultat**: Co się faktycznie wydarzyło
7. **Zrzuty ekranu / Logi**: Jeśli dostępne
8. **Dodatkowe informacje**:
   - Przeglądarka i wersja
   - System operacyjny
   - Dane testowe użyte
   - Request ID (jeśli dostępne)

### 10.2. Przykład Raportu Błędu

```
Tytuł: Użytkownik może zobaczyć samochody innego użytkownika

Priorytet: P0 (Krytyczny - Bezpieczeństwo)

Środowisko: Staging

Kroki do odtworzenia:
1. Zaloguj się jako User A (test-user-1@example.com)
2. Utwórz samochód "Audi A4"
3. Wyloguj się
4. Zaloguj się jako User B (test-user-2@example.com)
5. Odwiedź URL: /cars/{carId-from-user-a}
6. Obserwuj wyświetlenie samochodu User A

Oczekiwany rezultat:
- Wyświetlenie błędu 404 Not Found
- Komunikat: "Samochód nie został znaleziony"

Rzeczywisty rezultat:
- Wyświetlenie szczegółów samochodu User A
- User B może zobaczyć dane User A

Zrzuty ekranu: [załącznik]

Dodatkowe informacje:
- Przeglądarka: Chrome 120.0
- System: macOS 14.0
- Request ID: req_abc123xyz
```

### 10.3. Narzędzie do Śledzenia Błędów

**Zalecane**: GitHub Issues lub Jira

**Struktura etykiet**:

- `bug` - Błąd funkcjonalny
- `security` - Problem bezpieczeństwa
- `performance` - Problem wydajności
- `accessibility` - Problem dostępności
- `priority:p0` - Priorytet krytyczny
- `priority:p1` - Priorytet wysoki
- `priority:p2` - Priorytet średni
- `priority:p3` - Priorytet niski

### 10.4. Proces Naprawy Błędu

1. **Raportowanie**: QA Engineer tworzy raport błędu
2. **Triage**: Zespół ocenia priorytet i przypisuje do developera
3. **Naprawa**: Developer naprawia błąd i dodaje testy
4. **Weryfikacja**: QA Engineer weryfikuje naprawę
5. **Zamknięcie**: Błąd zostaje zamknięty po weryfikacji

### 10.5. Metryki Błędów

Śledzenie następujących metryk:

- Liczba błędów znalezionych vs naprawionych
- Średni czas naprawy błędu (według priorytetu)
- Wskaźnik ponownego otwierania błędów
- Pokrycie testami obszarów z błędami

## 11. Załączniki

### 11.1. Checklist Testów Przed Wdrożeniem

#### Funkcjonalność

- [ ] Wszystkie testy jednostkowe przechodzą
- [ ] Wszystkie testy integracyjne przechodzą
- [ ] Wszystkie testy E2E przechodzą
- [ ] Wszystkie scenariusze testowe przechodzą
- [ ] Code coverage >80%

#### Bezpieczeństwo

- [ ] RLS policies działają poprawnie
- [ ] Wszystkie endpointy wymagają autoryzacji
- [ ] Walidacja wejścia działa poprawnie
- [ ] Brak podatności na SQL Injection, XSS, CSRF
- [ ] Hasła są bezpiecznie hashowane

#### Wydajność

- [ ] Czas ładowania strony <2s
- [ ] Czas odpowiedzi API <500ms (p95)
- [ ] Renderowanie list działa płynnie
- [ ] Wykresy renderują się szybko

#### Użyteczność

- [ ] Aplikacja działa na urządzeniach mobilnych
- [ ] Dostępność WCAG 2.1 AA
- [ ] Komunikaty błędów są zrozumiałe
- [ ] Nawigacja jest intuicyjna

#### Dokumentacja

- [ ] README jest aktualne
- [ ] API documentation jest aktualne
- [ ] Changelog jest aktualny

### 11.2. Przykładowe Komendy Testowe

```bash
# Testy jednostkowe
npm run test

# Testy jednostkowe z coverage
npm run test:coverage

# Testy jednostkowe w trybie watch
npm run test:watch

# Testy typów TypeScript
npm run test:types

# Testy komponentów Astro
npm run test:astro

# Testy E2E
npm run test:e2e

# Testy E2E w trybie UI (Playwright)
npm run test:e2e:ui

# Testy E2E z visual regression
npm run test:e2e:visual

# Testy accessibility
npm run test:a11y

# Testy wydajności (Lighthouse)
npm run test:lighthouse

# Wszystkie testy
npm run test:all

# Linting
npm run lint

# Formatowanie
npm run format
```

---

**Wersja dokumentu**: 2.0  
**Data utworzenia**: 2025-01-XX  
**Ostatnia aktualizacja**: 2025-01-XX  
**Autor**: Zespół QA JustFuel

## 12. Zmiany w Wersji 2.0

### Dodane:

- Testowanie komponentów Astro (sekcja 3.1.5)
- Testowanie typów TypeScript z tsd (sekcja 3.1.6)
- Visual Regression Testing (sekcja 3.6)
- Rozszerzone testowanie Supabase RLS z Supabase Test Helpers
- Web Vitals monitoring
- Lighthouse CI integration
- @axe-core/react i playwright-axe dla accessibility
- Playwright API Testing zamiast Supertest
- Specyfika testowania Astro middleware

### Zaktualizowane:

- Narzędzia testowe zgodnie z najlepszymi praktykami dla Astro
- Przykładowe komendy testowe
- Harmonogram testów z nowymi fazami
- Sekcja narzędzi z szczegółowymi rekomendacjami
