# Specyfikacja architektury modułu autentykacji - JustFuel

## 1. Przegląd

Niniejszy dokument opisuje szczegółową architekturę modułu rejestracji, logowania, wylogowywania i odzyskiwania hasła dla aplikacji JustFuel. Specyfikacja uwzględnia wymagania z PRD (US-001, US-002, US-003) oraz integrację z istniejącą architekturą aplikacji opartą na Astro 5, React 19 i Supabase.

### 1.1. Zakres funkcjonalności

- **Rejestracja użytkownika** (US-001): Formularz rejestracji z walidacją e-mail i hasła, automatyczne logowanie po rejestracji, przekierowanie do głównego widoku aplikacji (listy samochodów na `/`)
- **Logowanie użytkownika** (US-002): Formularz logowania z walidacją, zabezpieczenie wszystkich stron i endpointów API wymagające autoryzacji, przekierowanie do głównego widoku aplikacji (listy samochodów na `/`)
- **Wylogowanie użytkownika** (US-003): Przycisk wylogowania w interfejsie, zakończenie sesji, przekierowanie do strony logowania
- **Odzyskiwanie hasła** (opcjonalne, poza zakresem MVP): Funkcjonalność resetowania hasła przez e-mail. Nie jest wymieniona w PRD, ale jest standardowa dla systemów autentykacji. Może być zaimplementowana w późniejszej fazie rozwoju produktu.

### 1.2. Wymagania bezpieczeństwa

- Wszystkie strony aplikacji (poza stronami autentykacji) wymagają zalogowanego użytkownika
- Wszystkie endpointy API wymagają ważnej sesji użytkownika
- Nie korzystamy z zewnętrznych serwisów logowania (Google, Facebook)
- Hasła są hashowane przez Supabase (bcrypt)
- Sesje są zarządzane przez Supabase Auth z JWT tokenami

---

## 2. ARCHITEKTURA INTERFEJSU UŻYTKOWNIKA

### 2.1. Struktura stron Astro

#### 2.1.1. Nowe strony autentykacji

**`src/pages/login.astro`**

- **Przeznaczenie**: Strona logowania użytkownika
- **Dostępność**: Publiczna (dostępna bez autoryzacji)
- **Komponenty**:
  - `LoginForm` (React, client:load) - formularz logowania
  - Layout: `AuthLayout` (nowy layout dla stron autentykacji)
- **Logika server-side**:
  - Sprawdzenie, czy użytkownik jest już zalogowany (przez middleware)
  - Jeśli zalogowany → przekierowanie do `/` (główna strona z listą samochodów)
  - Renderowanie formularza logowania dla niezalogowanych użytkowników
- **SEO**: Meta tagi z tytułem "Logowanie - JustFuel"

**`src/pages/register.astro`**

- **Przeznaczenie**: Strona rejestracji nowego użytkownika
- **Dostępność**: Publiczna
- **Komponenty**:
  - `RegisterForm` (React, client:load) - formularz rejestracji
  - Layout: `AuthLayout`
- **Logika server-side**:
  - Sprawdzenie, czy użytkownik jest już zalogowany
  - Jeśli zalogowany → przekierowanie do `/` (główna strona z listą samochodów)
  - Renderowanie formularza rejestracji
- **SEO**: Meta tagi z tytułem "Rejestracja - JustFuel"

**`src/pages/reset-password.astro`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Strona resetowania hasła (wyświetlana po kliknięciu w link z e-maila)
- **Dostępność**: Publiczna
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Komponenty**:
  - `ResetPasswordForm` (React, client:load) - formularz nowego hasła
  - Layout: `AuthLayout`
- **Logika server-side**:
  - Pobranie tokenu resetowania z query parametrów (`?token=...`)
  - Walidacja tokenu przez Supabase Auth
  - Jeśli token nieprawidłowy/wygasły → wyświetlenie komunikatu błędu
  - Jeśli token prawidłowy → renderowanie formularza resetowania
- **SEO**: Meta tagi z tytułem "Resetowanie hasła - JustFuel"

**`src/pages/forgot-password.astro`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Strona żądania resetowania hasła
- **Dostępność**: Publiczna
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Komponenty**:
  - `ForgotPasswordForm` (React, client:load) - formularz z polem e-mail
  - Layout: `AuthLayout`
- **Logika server-side**:
  - Sprawdzenie, czy użytkownik jest już zalogowany
  - Jeśli zalogowany → przekierowanie do `/` (główna strona z listą samochodów)
  - Renderowanie formularza
- **SEO**: Meta tagi z tytułem "Odzyskiwanie hasła - JustFuel"

#### 2.1.2. Modyfikacja istniejących stron

**`src/pages/index.astro`**

- **Zmiany**:
  - Dodanie logiki server-side sprawdzającej autoryzację użytkownika
  - Jeśli użytkownik niezalogowany → przekierowanie do `/login`
  - Jeśli użytkownik zalogowany → renderowanie listy samochodów (strona już wyświetla `CarsListView`, więc nie wymaga przekierowania)
  - **Uwaga**: Strona `/` jest głównym widokiem aplikacji (lista samochodów) zgodnie z PRD. Strona `/cars` również wyświetla listę samochodów i może być używana jako alternatywna ścieżka.

**`src/pages/cars.astro` i wszystkie strony w `src/pages/cars/`**

- **Zmiany**:
  - Dodanie logiki server-side sprawdzającej autoryzację
  - Jeśli użytkownik niezalogowany → przekierowanie do `/login` z parametrem `redirect` wskazującym na żądaną stronę
  - Renderowanie zawartości tylko dla zalogowanych użytkowników

**Wszystkie strony w `src/pages/cars/[carId]/`**

- **Zmiany**: Analogiczne do powyższych - wymagają autoryzacji

### 2.2. Nowe layouty

**`src/layouts/AuthLayout.astro`**

- **Przeznaczenie**: Layout dedykowany dla stron autentykacji (login, register, reset-password, forgot-password)
- **Cechy**:
  - Minimalistyczny design, skoncentrowany na formularzu
  - Brak nawigacji głównej (brak przycisku wylogowania)
  - Linki do przełączania między logowaniem a rejestracją
  - Link do strony głównej (logo JustFuel)
  - Responsywny design zgodny z podejściem mobile-first
- **Props**:
  - `title?: string` - tytuł strony (domyślnie "JustFuel")
  - `description?: string` - meta description

**Modyfikacja `src/layouts/Layout.astro`**

- **Zmiany**:
  - Dodanie komponentu `AuthHeader` (React, client:load) w sekcji `<head>` lub `<body>`
  - `AuthHeader` zawiera przycisk "Wyloguj" po prawej stronie u góry (zgodnie z US-003)
  - Przycisk widoczny tylko dla zalogowanych użytkowników
  - Przycisk wykonuje akcję wylogowania i przekierowuje do `/login`

### 2.3. Komponenty React (client-side)

#### 2.3.1. Komponenty formularzy autentykacji

**`src/components/auth/LoginForm.tsx`**

- **Przeznaczenie**: Formularz logowania użytkownika
- **Hook**: `useLoginForm` (custom hook w `src/lib/hooks/useLoginForm.ts`)
- **Pola formularza**:
  - `email` (type="email", required) - adres e-mail użytkownika
  - `password` (type="password", required) - hasło użytkownika
- **Funkcjonalności**:
  - Walidacja pól w czasie rzeczywistym (on blur)
  - Wyświetlanie komunikatów błędów pod polami
  - Przycisk "Zaloguj się" (disabled podczas przetwarzania)
  - Link "Nie masz konta? Zarejestruj się" → `/register`
  - Link "Zapomniałeś hasła?" → `/forgot-password` (opcjonalne, poza zakresem MVP - można pominąć w pierwszej wersji)
  - Obsługa błędów z API (nieprawidłowe dane, konto nie istnieje)
  - Po pomyślnym logowaniu: zapisanie tokenu w HTTP-only cookie, przekierowanie do `/` (główna strona z listą samochodów) lub URL z parametru `redirect`
- **Walidacja**:
  - E-mail: format zgodny z RFC 5322, nie może być pusty
  - Hasło: nie może być puste
- **Komunikaty błędów**:
  - "Nieprawidłowy adres e-mail"
  - "Hasło jest wymagane"
  - "Nieprawidłowy adres e-mail lub hasło" (dla błędów z API)
  - "Wystąpił błąd podczas logowania. Spróbuj ponownie." (dla błędów sieciowych)

**`src/components/auth/RegisterForm.tsx`**

- **Przeznaczenie**: Formularz rejestracji nowego użytkownika
- **Hook**: `useRegisterForm` (custom hook w `src/lib/hooks/useRegisterForm.ts`)
- **Pola formularza**:
  - `email` (type="email", required) - adres e-mail
  - `password` (type="password", required) - hasło (min. 6 znaków zgodnie z konfiguracją Supabase)
  - `confirmPassword` (type="password", required) - potwierdzenie hasła
- **Funkcjonalności**:
  - Walidacja pól w czasie rzeczywistym
  - Sprawdzenie, czy hasła się zgadzają
  - Wyświetlanie komunikatów błędów
  - Przycisk "Zarejestruj się" (disabled podczas przetwarzania)
  - Link "Masz już konto? Zaloguj się" → `/login`
  - Po pomyślnej rejestracji: automatyczne logowanie, przekierowanie do `/` (główna strona z listą samochodów)
- **Walidacja**:
  - E-mail: format zgodny z RFC 5322, nie może być pusty
  - Hasło: minimum 6 znaków (zgodnie z konfiguracją Supabase), nie może być puste
  - Potwierdzenie hasła: musi być identyczne z hasłem
- **Komunikaty błędów**:
  - "Nieprawidłowy adres e-mail"
  - "Hasło musi mieć minimum 6 znaków"
  - "Hasła nie są identyczne"
  - "Konto z tym adresem e-mail już istnieje" (dla błędów z API)
  - "Wystąpił błąd podczas rejestracji. Spróbuj ponownie."

**`src/components/auth/ForgotPasswordForm.tsx`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Formularz żądania resetowania hasła
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Hook**: `useForgotPasswordForm` (custom hook)
- **Pola formularza**:
  - `email` (type="email", required) - adres e-mail konta
- **Funkcjonalności**:
  - Walidacja e-maila
  - Przycisk "Wyślij link resetujący"
  - Po wysłaniu: wyświetlenie komunikatu sukcesu z informacją o sprawdzeniu skrzynki e-mail
  - Link "Wróć do logowania" → `/login`
- **Komunikaty**:
  - Sukces: "Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła."
  - Błąd: "Wystąpił błąd. Spróbuj ponownie."

**`src/components/auth/ResetPasswordForm.tsx`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Formularz ustawienia nowego hasła
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Hook**: `useResetPasswordForm` (custom hook)
- **Pola formularza**:
  - `password` (type="password", required) - nowe hasło
  - `confirmPassword` (type="password", required) - potwierdzenie nowego hasła
- **Funkcjonalności**:
  - Walidacja hasła i potwierdzenia
  - Przycisk "Zresetuj hasło"
  - Po pomyślnym resetowaniu: przekierowanie do `/login` z komunikatem sukcesu
- **Komunikaty błędów**:
  - "Token resetowania jest nieprawidłowy lub wygasł" (jeśli token z URL jest nieprawidłowy)
  - "Hasło musi mieć minimum 6 znaków"
  - "Hasła nie są identyczne"

**`src/components/auth/AuthHeader.tsx`**

- **Przeznaczenie**: Nagłówek z przyciskiem wylogowania dla zalogowanych użytkowników
- **Lokalizacja**: Renderowany w `Layout.astro` po prawej stronie u góry
- **Funkcjonalności**:
  - Sprawdzenie stanu autoryzacji (czy użytkownik jest zalogowany)
  - Wyświetlenie przycisku "Wyloguj" tylko dla zalogowanych użytkowników
  - Po kliknięciu: wywołanie akcji wylogowania, przekierowanie do `/login`
- **Styling**: Przycisk zgodny z komponentem `Button` z Shadcn/ui, wariant "ghost" lub "outline"

#### 2.3.2. Komponenty pomocnicze

**`src/components/auth/AuthError.tsx`**

- **Przeznaczenie**: Komponent wyświetlający ogólne błędy autentykacji
- **Props**:
  - `message: string` - komunikat błędu
  - `onDismiss?: () => void` - opcjonalna funkcja zamknięcia komunikatu
- **Styling**: Czerwony alert z ikoną błędu (z Lucide React)

**`src/components/auth/AuthSuccess.tsx`**

- **Przeznaczenie**: Komponent wyświetlający komunikaty sukcesu
- **Props**: Analogiczne do `AuthError`
- **Styling**: Zielony alert z ikoną sukcesu

### 2.4. Custom hooks React

**`src/lib/hooks/useLoginForm.ts`**

- **Przeznaczenie**: Logika formularza logowania
- **Stan**:
  - `email: string`
  - `password: string`
  - `errors: { email?: string; password?: string; general?: string }`
  - `isSubmitting: boolean`
  - `touchedFields: Set<string>`
- **Funkcje**:
  - `handleEmailChange(value: string)`
  - `handlePasswordChange(value: string)`
  - `handleSubmit(e: FormEvent)`
  - `validateEmail(email: string): string | undefined`
  - `validatePassword(password: string): string | undefined`
- **Integracja z API**: Wywołanie `POST /api/auth/login` przez `auth.service.ts`

**`src/lib/hooks/useRegisterForm.ts`**

- **Przeznaczenie**: Logika formularza rejestracji
- **Stan**: Analogiczny do `useLoginForm` + `confirmPassword: string`
- **Funkcje**: Analogiczne + `validateConfirmPassword()`
- **Integracja z API**: Wywołanie `POST /api/auth/register`

**`src/lib/hooks/useForgotPasswordForm.ts`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Logika formularza żądania resetowania hasła
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Stan**: `email: string`, `errors`, `isSubmitting`, `isSuccess: boolean`
- **Funkcje**: `handleEmailChange()`, `handleSubmit()`, `validateEmail()`
- **Integracja z API**: Wywołanie `POST /api/auth/forgot-password`

**`src/lib/hooks/useResetPasswordForm.ts`** (opcjonalne, poza zakresem MVP)

- **Przeznaczenie**: Logika formularza resetowania hasła
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Stan**: `password: string`, `confirmPassword: string`, `errors`, `isSubmitting`
- **Funkcje**: Analogiczne do `useRegisterForm`
- **Integracja z API**: Wywołanie `POST /api/auth/reset-password` z tokenem z URL

**`src/lib/hooks/useAuth.ts`**

- **Przeznaczenie**: Globalny hook do zarządzania stanem autoryzacji w aplikacji
- **Stan**:
  - `user: User | null` - aktualny użytkownik (z Supabase)
  - `isLoading: boolean` - czy trwa sprawdzanie autoryzacji
  - `isAuthenticated: boolean` - czy użytkownik jest zalogowany
- **Funkcje**:
  - `login(email: string, password: string): Promise<void>`
  - `register(email: string, password: string): Promise<void>`
  - `logout(): Promise<void>`
  - `refreshSession(): Promise<void>`
  - `checkAuth(): Promise<void>`
- **Użycie**: Hook używany przez komponenty do sprawdzania autoryzacji i wykonywania akcji

### 2.5. Scenariusze użytkownika

#### Scenariusz 1: Rejestracja nowego użytkownika

1. Użytkownik wchodzi na `/register`
2. Wypełnia formularz (e-mail, hasło, potwierdzenie hasła)
3. System waliduje dane w czasie rzeczywistym
4. Po kliknięciu "Zarejestruj się":
   - Jeśli błędy walidacji → wyświetlenie komunikatów
   - Jeśli dane poprawne → wywołanie API `/api/auth/register`
   - Jeśli e-mail zajęty → komunikat "Konto z tym adresem e-mail już istnieje"
   - Jeśli sukces → automatyczne logowanie, przekierowanie do `/` (główna strona z listą samochodów)

#### Scenariusz 2: Logowanie użytkownika

1. Użytkownik wchodzi na `/login` (lub jest przekierowany z chronionej strony)
2. Wypełnia formularz (e-mail, hasło)
3. Po kliknięciu "Zaloguj się":
   - Walidacja → jeśli błędy, wyświetlenie komunikatów
   - Wywołanie API `/api/auth/login`
   - Jeśli nieprawidłowe dane → komunikat "Nieprawidłowy adres e-mail lub hasło"
   - Jeśli sukces → zapisanie tokenu, przekierowanie do `/` (główna strona z listą samochodów) lub URL z parametru `redirect`

#### Scenariusz 3: Próba dostępu do chronionej strony bez logowania

1. Użytkownik wchodzi na `/` lub `/cars` (lub inną chronioną stronę)
2. Middleware/server-side sprawdza autoryzację
3. Jeśli niezalogowany → przekierowanie do `/login?redirect=<current-url>`
4. Po zalogowaniu → przekierowanie z powrotem do żądanej strony (lub `/` jeśli brak parametru `redirect`)

#### Scenariusz 4: Wylogowanie użytkownika

1. Użytkownik klika przycisk "Wyloguj" w nagłówku
2. Wywołanie API `/api/auth/logout`
3. Usunięcie tokenu z HTTP-only cookie
4. Przekierowanie do `/login`

#### Scenariusz 5: Odzyskiwanie hasła (opcjonalne, poza zakresem MVP)

**Uwaga**: Ten scenariusz nie jest wymieniony w PRD i może być zaimplementowany w późniejszej fazie rozwoju produktu.

1. Użytkownik wchodzi na `/forgot-password`
2. Wprowadza adres e-mail
3. Po kliknięciu "Wyślij link resetujący":
   - Wywołanie API `/api/auth/forgot-password`
   - Wyświetlenie komunikatu sukcesu (nawet jeśli konto nie istnieje, dla bezpieczeństwa)
4. Użytkownik otrzymuje e-mail z linkiem resetującym
5. Kliknięcie w link → przekierowanie do `/reset-password?token=...`
6. Wprowadzenie nowego hasła i potwierdzenia
7. Po kliknięciu "Zresetuj hasło":
   - Wywołanie API `/api/auth/reset-password`
   - Przekierowanie do `/login` z komunikatem sukcesu

---

## 3. LOGIKA BACKENDOWA

### 3.1. Struktura endpointów API

Wszystkie endpointy autentykacji znajdują się w `src/pages/api/auth/`:

**`src/pages/api/auth/login.ts`**

- **Metoda**: `POST`
- **Przeznaczenie**: Logowanie użytkownika
- **Request body**:
  ```typescript
  {
    email: string;
    password: string;
  }
  ```
- **Response (200 OK)**:
  ```typescript
  {
    user: {
      id: string;
      email: string;
    }
    session: {
      access_token: string;
      refresh_token: string;
      expires_at: number;
    }
  }
  ```
- **Response (400 Bad Request)**: Błędy walidacji
- **Response (401 Unauthorized)**: Nieprawidłowe dane logowania
- **Response (500 Internal Server Error)**: Błąd serwera

**`src/pages/api/auth/register.ts`**

- **Metoda**: `POST`
- **Przeznaczenie**: Rejestracja nowego użytkownika
- **Request body**: Analogiczny do login
- **Response (201 Created)**: Analogiczny do login (z automatycznym logowaniem)
- **Response (400 Bad Request)**: Błędy walidacji
- **Response (409 Conflict)**: E-mail już zajęty
- **Response (500 Internal Server Error)**: Błąd serwera

**`src/pages/api/auth/logout.ts`**

- **Metoda**: `POST`
- **Przeznaczenie**: Wylogowanie użytkownika
- **Request headers**: `Authorization: Bearer <token>` (opcjonalne, ale zalecane)
- **Response (200 OK)**:
  ```typescript
  {
    message: 'Wylogowano pomyślnie';
  }
  ```
- **Response (401 Unauthorized)**: Brak lub nieprawidłowy token (ale endpoint może zwrócić sukces nawet bez tokenu)

**`src/pages/api/auth/forgot-password.ts`** (opcjonalne, poza zakresem MVP)

- **Metoda**: `POST`
- **Przeznaczenie**: Żądanie resetowania hasła
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Request body**:
  ```typescript
  {
    email: string;
  }
  ```
- **Response (200 OK)**:
  ```typescript
  {
    message: 'Jeśli konto z tym adresem e-mail istnieje, wysłaliśmy link do resetowania hasła.';
  }
  ```
- **Uwaga**: Zawsze zwraca sukces (dla bezpieczeństwa, aby nie ujawniać, czy konto istnieje)

**`src/pages/api/auth/reset-password.ts`** (opcjonalne, poza zakresem MVP)

- **Metoda**: `POST`
- **Przeznaczenie**: Resetowanie hasła z tokenem
- **Status**: Funkcjonalność opcjonalna, nie wymieniona w PRD. Może być zaimplementowana w późniejszej fazie.
- **Request body**:
  ```typescript
  {
    token: string; // Token z linku w e-mailu
    password: string; // Nowe hasło
  }
  ```
- **Response (200 OK)**:
  ```typescript
  {
    message: 'Hasło zostało zresetowane pomyślnie.';
  }
  ```
- **Response (400 Bad Request)**: Nieprawidłowy token lub hasło
- **Response (401 Unauthorized)**: Token wygasł lub nieprawidłowy

**`src/pages/api/auth/session.ts`**

- **Metoda**: `GET`
- **Przeznaczenie**: Sprawdzenie aktualnej sesji użytkownika
- **Request headers**: `Authorization: Bearer <token>`
- **Response (200 OK)**:
  ```typescript
  {
    user: {
      id: string;
      email: string;
    }
    session: {
      expires_at: number;
    }
  }
  ```
- **Response (401 Unauthorized)**: Brak lub nieprawidłowy token

### 3.2. Walidacja danych wejściowych

**`src/lib/validation/auth.ts`**

- **Schematy Zod**:
  - `loginSchema`: `{ email: z.string().email(), password: z.string().min(1) }`
  - `registerSchema`: `{ email: z.string().email(), password: z.string().min(6), confirmPassword: z.string().min(6) }` + custom refinement sprawdzający zgodność haseł
  - `forgotPasswordSchema`: `{ email: z.string().email() }` (opcjonalne, poza zakresem MVP)
  - `resetPasswordSchema`: `{ token: z.string().min(1), password: z.string().min(6), confirmPassword: z.string().min(6) }` + refinement (opcjonalne, poza zakresem MVP)

**Komunikaty błędów walidacji**:

- E-mail: "Nieprawidłowy format adresu e-mail"
- Hasło (min. długość): "Hasło musi mieć minimum 6 znaków"
- Potwierdzenie hasła: "Hasła nie są identyczne"
- Token: "Token resetowania jest wymagany"

### 3.3. Obsługa wyjątków

**Typy błędów w `src/lib/services/auth.service.ts`**:

- `InvalidCredentialsError` - nieprawidłowe dane logowania
- `EmailAlreadyExistsError` - e-mail już zajęty podczas rejestracji
- `InvalidTokenError` - nieprawidłowy lub wygasły token resetowania
- `SupabaseAuthError` - ogólny błąd z Supabase Auth

**Mapowanie błędów Supabase na błędy aplikacji**:

- `auth/invalid-credentials` → `InvalidCredentialsError`
- `auth/email-already-exists` → `EmailAlreadyExistsError`
- `auth/invalid-token` → `InvalidTokenError`
- Inne błędy → `SupabaseAuthError` z oryginalnym komunikatem

### 3.4. Serwisy backendowe

**`src/lib/services/auth.service.ts`**

- **Funkcje**:
  - `loginUser(supabase: AppSupabaseClient, email: string, password: string): Promise<{ user: User; session: Session }>`
  - `registerUser(supabase: AppSupabaseClient, email: string, password: string): Promise<{ user: User; session: Session }>`
  - `logoutUser(supabase: AppSupabaseClient, token?: string): Promise<void>`
  - `requestPasswordReset(supabase: AppSupabaseClient, email: string): Promise<void>` (opcjonalne, poza zakresem MVP)
  - `resetPassword(supabase: AppSupabaseClient, token: string, newPassword: string): Promise<void>` (opcjonalne, poza zakresem MVP)
  - `getUserFromToken(supabase: AppSupabaseClient, token: string): Promise<User | null>`
  - `refreshSession(supabase: AppSupabaseClient, refreshToken: string): Promise<Session>`

**Integracja z Supabase Auth**:

- Wszystkie funkcje używają `supabase.auth.signInWithPassword()`, `supabase.auth.signUp()`, `supabase.auth.signOut()`, `supabase.auth.resetPasswordForEmail()`, `supabase.auth.updateUser()`
- Obsługa błędów z Supabase Auth i mapowanie na błędy aplikacji

### 3.5. Modyfikacja renderowania stron server-side

**Middleware `src/middleware/index.ts`**:

- **Rozszerzenie**: Dodanie logiki sprawdzania autoryzacji
- **Logika**:
  1. Pobranie tokenu z cookies lub headerów (jeśli dostępne)
  2. Sprawdzenie, czy strona wymaga autoryzacji (lista publicznych stron: `/login`, `/register`, `/forgot-password`, `/reset-password`)
  3. Jeśli strona wymaga autoryzacji i użytkownik niezalogowany:
     - Przekierowanie do `/login?redirect=<current-url>`
  4. Jeśli strona jest publiczna i użytkownik zalogowany:
     - Przekierowanie do `/` (główna strona z listą samochodów) - opcjonalnie, można pozwolić na dostęp do stron autentykacji nawet gdy zalogowany
  5. Dodanie `context.locals.user` z danymi użytkownika (jeśli zalogowany)
  6. Dodanie `context.locals.isAuthenticated: boolean`

**Helper funkcje w middleware**:

- `isPublicRoute(pathname: string): boolean` - sprawdza, czy ścieżka jest publiczna
- `requiresAuth(pathname: string): boolean` - sprawdza, czy ścieżka wymaga autoryzacji
- `getAuthToken(context: Context): string | null` - pobiera token z cookies/headerów
- `getUserFromContext(context: Context): Promise<User | null>` - pobiera użytkownika z tokenu

**Renderowanie stron Astro**:

- Wszystkie strony chronione mogą używać `Astro.locals.user` i `Astro.locals.isAuthenticated` do renderowania warunkowego
- Przykład w `src/pages/cars.astro`:
  ```astro
  ---
  if (!Astro.locals.isAuthenticated) {
    return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
  }
  ---
  ```

---

## 4. SYSTEM AUTENTYKACJI

### 4.1. Integracja z Supabase Auth

**Konfiguracja Supabase**:

- Włączona autentykacja e-mail/hasło (`auth.email.enabled = true`)
- Wyłączone zewnętrzne providery (Google, Facebook) - zgodnie z wymaganiami
- Minimalna długość hasła: 6 znaków (konfiguracja w `supabase/config.toml`)
- JWT expiry: 3600 sekund (1 godzina)
- Refresh token rotation: włączona

**Klient Supabase**:

- `src/db/supabase.client.ts` - istniejący klient, bez zmian
- Używany w middleware i endpointach API do operacji autentykacji

### 4.2. Zarządzanie sesjami

**Mechanizm sesji**:

- Supabase Auth używa JWT tokenów (access token + refresh token)
- Access token: krótkotrwały (1 godzina), używany do autoryzacji requestów
- Refresh token: długotrwały, używany do odświeżania access tokena

**Przechowywanie tokenów**:

- **HTTP-only cookies** (jedyna dozwolona metoda):
  - Token zapisywany w cookie przez endpoint `/api/auth/login`
  - Cookie ustawiane z flagami `HttpOnly`, `Secure` (w produkcji), `SameSite=Strict`
  - Automatyczne wysyłanie tokenu w requestach do API
  - **Uwaga**: localStorage nie jest używane ze względów bezpieczeństwa (podatność na ataki XSS)

**Odświeżanie sesji**:

- Automatyczne odświeżanie access tokena przed wygaśnięciem
- Implementacja w `useAuth` hook lub w middleware
- Jeśli refresh token wygasł → wylogowanie użytkownika i przekierowanie do `/login`

### 4.3. Zabezpieczenie endpointów API

**Wspólna funkcja autoryzacji**:

- `src/lib/utils/auth.ts` - helper funkcje:
  - `getUserFromRequest(context: APIContext): Promise<User | null>`
  - `requireAuth(context: APIContext): Promise<User>` - rzuca błąd, jeśli użytkownik niezalogowany

**Modyfikacja istniejących endpointów**:

- Wszystkie endpointy w `src/pages/api/cars/**` i `src/pages/api/cars.ts`:
  - Zastąpienie logiki `DEFAULT_USER_ID` i `DEV_AUTH_FALLBACK` przez `requireAuth()`
  - Usunięcie fallbacku dla środowiska deweloperskiego (lub pozostawienie tylko w trybie debug)
  - Użycie `userId` z autoryzowanego użytkownika

**Przykład modyfikacji endpointu**:

```typescript
export const GET: APIRoute = async (context) => {
  const user = await requireAuth(context); // Rzuca 401, jeśli niezalogowany
  const userId = user.id;

  // Reszta logiki używa userId z autoryzowanego użytkownika
  // ...
};
```

### 4.4. Row-Level Security (RLS) w Supabase

**Polityki RLS**:

- Wszystkie tabele (`cars`, `fillups`) mają włączone RLS
- Polityki zapewniają, że użytkownicy widzą tylko swoje dane:
  - `cars`: `user_id = auth.uid()`
  - `fillups`: `car_id IN (SELECT id FROM cars WHERE user_id = auth.uid())`

**Uwaga**: Polityki RLS są już skonfigurowane w migracjach Supabase (zakładając, że istnieją). Jeśli nie, należy je dodać w nowej migracji.

### 4.5. Obsługa błędów autentykacji

**Typy błędów**:

- **401 Unauthorized**: Brak tokenu, nieprawidłowy token, wygasły token
- **403 Forbidden**: Użytkownik zalogowany, ale brak uprawnień (nie dotyczy w MVP)
- **400 Bad Request**: Błędy walidacji danych wejściowych
- **409 Conflict**: Konflikt (np. e-mail już zajęty)
- **500 Internal Server Error**: Błędy serwera

**Komunikaty błędów dla użytkownika**:

- Przyjazne komunikaty w języku polskim
- Brak ujawniania szczegółów technicznych (np. stack trace)
- Logowanie szczegółów błędów po stronie serwera

---

## 5. INTEGRACJA Z ISTNIEJĄCĄ APLIKACJĄ

### 5.1. Modyfikacja istniejących komponentów

**`src/components/cars/CarsListView.tsx`**:

- Usunięcie logiki sprawdzania tokenu z localStorage (jeśli istnieje)
- Użycie hooka `useAuth()` do sprawdzenia autoryzacji
- Token jest automatycznie wysyłany w cookies przez przeglądarkę
- Jeśli użytkownik niezalogowany → przekierowanie do `/login` (lub wyświetlenie komunikatu)

**Wszystkie hooki używające API** (`useCarsList`, `useCarDetails`, `useFillupsView`, etc.):

- Usunięcie logiki pobierania tokenu z localStorage (jeśli istnieje)
- Token jest automatycznie wysyłany w cookies przez przeglądarkę w każdym żądaniu
- Użycie `useAuth()` do sprawdzenia stanu autoryzacji
- Automatyczne przekierowanie do `/login`, jeśli token nieważny

### 5.2. Aktualizacja typów

**`src/types.ts`**:

- Dodanie typów dla odpowiedzi API autentykacji:
  - `LoginResponseDTO`
  - `RegisterResponseDTO`
  - `SessionResponseDTO`
  - `ErrorResponseDTO` (już istnieje, może wymagać rozszerzenia)

### 5.3. Zmienne środowiskowe

**`.env` i `env.example`**:

- `SUPABASE_URL` - już istnieje
- `SUPABASE_KEY` - już istnieje
- `SUPABASE_SERVICE_ROLE_KEY` - opcjonalnie, dla operacji admin (nie używane w MVP)
- `DEV_AUTH_FALLBACK` - można usunąć po wdrożeniu autentykacji

### 5.4. Testowanie

**Scenariusze testowe**:

1. Rejestracja nowego użytkownika z poprawnymi danymi
2. Rejestracja z e-mailem już zajętym
3. Rejestracja z nieprawidłowym formatem e-maila
4. Logowanie z poprawnymi danymi
5. Logowanie z nieprawidłowymi danymi
6. Próba dostępu do chronionej strony bez logowania
7. Wylogowanie użytkownika
8. Odzyskiwanie hasła (pełny flow)
9. Resetowanie hasła z nieprawidłowym tokenem
10. Wygaśnięcie sesji i automatyczne wylogowanie

---

## 6. PODSUMOWANIE I NASTĘPNE KROKI

### 6.1. Kluczowe komponenty do implementacji

**Frontend** (wymagane dla MVP):

1. Strony Astro: `login.astro`, `register.astro` (wymagane), `forgot-password.astro`, `reset-password.astro` (opcjonalne, poza zakresem MVP)
2. Layout: `AuthLayout.astro`
3. Komponenty React: `LoginForm`, `RegisterForm`, `AuthHeader` (wymagane), `ForgotPasswordForm`, `ResetPasswordForm` (opcjonalne, poza zakresem MVP)
4. Hooks: `useLoginForm`, `useRegisterForm`, `useAuth` (wymagane), `useForgotPasswordForm`, `useResetPasswordForm` (opcjonalne, poza zakresem MVP)
5. Modyfikacja: `Layout.astro`, wszystkie strony w `src/pages/cars/`, `index.astro`

**Backend** (wymagane dla MVP):

1. Endpointy API: `login.ts`, `register.ts`, `logout.ts`, `session.ts` (wymagane), `forgot-password.ts`, `reset-password.ts` (opcjonalne, poza zakresem MVP)
2. Serwisy: `auth.service.ts`
3. Walidacja: `validation/auth.ts`
4. Utils: `utils/auth.ts`
5. Middleware: rozszerzenie `middleware/index.ts`
6. Modyfikacja istniejących endpointów API

### 6.2. Zależności

**Nowe zależności npm** (jeśli potrzebne):

- `zod` - już używane w projekcie, do walidacji
- `@supabase/supabase-js` - już używane
- Komponenty Shadcn/ui: `Button`, `Input`, `Label` - już istnieją

**Konfiguracja Supabase**:

- Sprawdzenie konfiguracji autentykacji w `supabase/config.toml`
- Konfiguracja e-mail SMTP dla wysyłania e-maili resetujących hasło (opcjonalnie, można użyć domyślnego Supabase)

### 6.3. Uwagi implementacyjne

1. **Bezpieczeństwo**: Wszystkie endpointy autentykacji powinny być zabezpieczone przed atakami brute-force (rate limiting w Supabase)
2. **UX**: Komunikaty błędów powinny być przyjazne i nie ujawniać szczegółów technicznych
3. **Responsywność**: Wszystkie formularze powinny być responsywne i zgodne z podejściem mobile-first
4. **Dostępność**: Formularze powinny być dostępne dla czytników ekranu (aria-labels, proper form structure)
5. **Testowanie**: Przed wdrożeniem należy przetestować wszystkie scenariusze, w tym edge cases (wygaśnięcie tokena, nieprawidłowe dane, etc.)

---

## 7. DIAGRAMY I PRZEPŁYWY

### 7.1. Przepływ rejestracji

```
Użytkownik → /register → RegisterForm → Walidacja → POST /api/auth/register
                                                          ↓
                                              Supabase Auth (signUp)
                                                          ↓
                                              Automatyczne logowanie
                                                          ↓
                                              Zwrócenie tokenu
                                                          ↓
                                              Zapisanie tokenu w HTTP-only cookie
                                                          ↓
                                              Przekierowanie → / (główna strona z listą samochodów)
```

### 7.2. Przepływ logowania

```
Użytkownik → /login → LoginForm → Walidacja → POST /api/auth/login
                                                          ↓
                                              Supabase Auth (signInWithPassword)
                                                          ↓
                                              Weryfikacja danych
                                                          ↓
                                              Zwrócenie tokenu
                                                          ↓
                                              Zapisanie tokenu w HTTP-only cookie
                                                          ↓
                                              Przekierowanie → / (główna strona z listą samochodów) lub redirect URL
```

### 7.3. Przepływ dostępu do chronionej strony

```
Użytkownik → / lub /cars → Middleware sprawdza autoryzację
                              ↓
                    Czy token istnieje i jest ważny?
                              ↓
                    TAK → Renderowanie strony (lista samochodów)
                    NIE → Przekierowanie → /login?redirect=<current-url>
```

### 7.4. Przepływ wylogowania

```
Użytkownik → Kliknięcie "Wyloguj" → POST /api/auth/logout
                                              ↓
                                  Supabase Auth (signOut)
                                              ↓
                                  Usunięcie tokenu z HTTP-only cookie
                                              ↓
                                  Przekierowanie → /login
```

---

## 8. ZMIANY W STOSUNKU DO PRD

### 8.1. Rozwiązane sprzeczności

1. **Główny widok aplikacji**: Zaktualizowano wszystkie przekierowania z `/cars` na `/` (główna strona z listą samochodów), zgodnie z rzeczywistą strukturą aplikacji, gdzie `/` wyświetla listę samochodów.

2. **Strona `index.astro`**: Usunięto sprzeczność - strona `/` nie przekierowuje do `/cars`, ale wyświetla listę samochodów bezpośrednio dla zalogowanych użytkowników.

### 8.2. Oznaczone funkcjonalności opcjonalne

1. **Odzyskiwanie hasła**: Funkcjonalność `forgot-password` i `reset-password` została wyraźnie oznaczona jako opcjonalna i poza zakresem MVP, ponieważ nie jest wymieniona w PRD. Może być zaimplementowana w późniejszej fazie rozwoju produktu.

### 8.3. Zgodność z User Stories

- **US-001**: ✅ W pełni zgodne - rejestracja z przekierowaniem do głównego widoku (`/`)
- **US-002**: ✅ W pełni zgodne - logowanie z przekierowaniem do głównego widoku (`/`), zabezpieczenie wszystkich stron i endpointów
- **US-003**: ✅ W pełni zgodne - przycisk wylogowania po prawej u góry, przekierowanie do strony logowania

---

Koniec specyfikacji.
