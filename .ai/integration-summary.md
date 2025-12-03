# Podsumowanie integracji logowania - JustFuel

## Data: 2025-01-XX

## Status: W trakcie implementacji

---

## 📋 Przegląd wykonanych zadań

### ✅ 1. Instalacja i konfiguracja Supabase SSR

- **Zainstalowano**: `@supabase/ssr`
- **Zaktualizowano**: `src/db/supabase.client.ts`
  - Dodano `createSupabaseServerInstance()` z obsługą cookies
  - Konfiguracja cookies: `secure: import.meta.env.PROD` (działa w development)
  - `sameSite: 'lax'` dla bezpieczeństwa cross-site requests
  - `httpOnly: true` dla ochrony przed XSS

### ✅ 2. Reorganizacja struktur stron

- **Przeniesiono strony**:
  - `/login` → `/auth/login`
  - `/register` → `/auth/register`
- **Naprawiono ścieżki importów** w przeniesionych plikach
- **Zaktualizowano linki** w komponentach (`LoginForm`, `RegisterForm`)

### ✅ 3. Serwis autoryzacji (`src/lib/services/auth.service.ts`)

- **Funkcje**:
  - `loginUser()` - logowanie użytkownika
  - `registerUser()` - rejestracja z automatycznym logowaniem
  - `logoutUser()` - wylogowanie
  - `getCurrentUser()` - pobranie aktualnego użytkownika
- **Mapowanie błędów Supabase**:
  - `InvalidCredentialsError` → "Nieprawidłowy adres e-mail lub hasło"
  - `EmailAlreadyExistsError` → "Konto z tym adresem e-mail już istnieje"
  - `InvalidTokenError` → "Token resetowania jest nieprawidłowy lub wygasł"
  - `SupabaseAuthError` → ogólne błędy autentykacji

### ✅ 4. Helper funkcje (`src/lib/utils/auth.ts`)

- **`getUserFromRequest()`** - pobiera użytkownika z requestu (może zwrócić null)
- **`requireAuth()`** - wymusza autoryzację, zwraca błąd 401 jeśli użytkownik niezalogowany

### ✅ 5. Endpoint API logowania (`src/pages/api/auth/login.ts`)

- **Metoda**: `POST /api/auth/login`
- **Walidacja**: Zod schema dla email i password
- **Obsługa błędów**: Mapowanie błędów Supabase na komunikaty po polsku
- **Sesja**: Automatyczne zapisywanie w HTTP-only cookies przez `@supabase/ssr`

### ✅ 6. Middleware autoryzacji (`src/middleware/index.ts`)

- **Publiczne ścieżki**:
  - `/auth/login`
  - `/auth/register`
  - `/api/auth/login`
  - `/api/auth/register`
- **Funkcjonalność**:
  - Automatyczne przekierowanie niezalogowanych użytkowników do `/auth/login?redirect=...`
  - Dodawanie `user` i `isAuthenticated` do `Astro.locals`
  - Tworzenie instancji Supabase z obsługą cookies

### ✅ 7. Integracja frontend

- **`useLoginForm` hook** (`src/lib/hooks/useLoginForm.ts`):
  - Wywołanie API `/api/auth/login`
  - Obsługa parametru `redirect` po zalogowaniu
  - Obsługa błędów z API
- **`LoginForm` component** (`src/components/auth/LoginForm.tsx`):
  - Przyjmuje `redirectUrl` jako prop
  - Zaktualizowane linki do `/auth/register`
- **`login.astro`** (`src/pages/auth/login.astro`):
  - Sprawdzanie czy użytkownik już zalogowany (przekierowanie)
  - Przekazywanie parametru `redirect` do komponentu

### ✅ 8. Aktualizacja typów TypeScript

- **`src/env.d.ts`**:
  - Dodano `user?: { id: string; email?: string }` do `App.Locals`
  - Dodano `isAuthenticated?: boolean` do `App.Locals`
  - Usunięto `DEV_AUTH_FALLBACK` z typów środowiskowych

### ✅ 9. Aktualizacja endpointów API (częściowo)

- **Zaktualizowane**:
  - ✅ `/api/cars` (GET, POST)
  - ✅ `/api/cars/[carId]` (GET, PATCH, DELETE)
- **Wzorzec zastosowany**:
  - Import `requireAuth` z `lib/utils/auth.ts`
  - Usunięcie logiki `DEV_AUTH_FALLBACK` i `DEFAULT_USER_ID`
  - Użycie `const user = await requireAuth(context)` na początku każdego endpointu
  - Obsługa błędów autoryzacji w catch block

---

## 🔨 Do wykonania

### ⚠️ 1. Aktualizacja pozostałych endpointów API

Następujące endpointy wymagają aktualizacji do użycia `requireAuth()`:

#### `/api/cars/[carId]/fillups.ts`

- [ ] GET - lista tankowań
- [ ] POST - dodanie tankowania

#### `/api/cars/[carId]/fillups/[fillupId].ts`

- [ ] GET - szczegóły tankowania
- [ ] PATCH - edycja tankowania
- [ ] DELETE - usunięcie tankowania

#### `/api/cars/[carId]/charts.ts`

- [ ] GET - dane wykresów

#### `/api/cars/[carId]/statistics.ts`

- [ ] GET - statystyki samochodu

**Wzorzec aktualizacji** (dla każdego endpointu):

```typescript
// 1. Dodać import
import { requireAuth } from '../../../lib/utils/auth.ts'; // (dostosować ścieżkę)

// 2. Usunąć import DEFAULT_USER_ID
// import { DEFAULT_USER_ID } from "../../../db/supabase.client.ts"; // USUNĄĆ

// 3. Na początku funkcji endpointu:
export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;

  try {
    // Require authentication
    const user = await requireAuth(context);
    const userId = user.id;

    const supabase = context.locals.supabase;
    if (!supabase) {
      // ... error handling
    }

    // ... reszta logiki używając userId
  } catch (error) {
    // Handle auth errors (thrown by requireAuth)
    if (error instanceof Response) {
      return error;
    }
    // ... reszta obsługi błędów
  }
};

// 4. Usunąć całą logikę z:
// - DEV_AUTH_FALLBACK
// - DEFAULT_USER_ID
// - hasBearer checks
// - Manual token validation
```

### ⚠️ 2. Usunięcie nieużywanych eksportów

Po zaktualizowaniu wszystkich endpointów:

- [ ] Sprawdzić czy `DEFAULT_USER_ID` jest jeszcze używany gdziekolwiek
- [ ] Jeśli nie, można go usunąć z `src/db/supabase.client.ts` (lub zostawić jako komentarz dla historii)

### ⚠️ 3. Endpoint rejestracji (`/api/auth/register.ts`)

- [ ] Stworzyć endpoint `/api/auth/register.ts` (analogiczny do login)
- [ ] Użyć `registerUser()` z `auth.service.ts`
- [ ] Dodać walidację Zod (email, password, confirmPassword)
- [ ] Dodać do publicznych ścieżek w middleware (już dodane)

### ⚠️ 4. Endpoint wylogowania (`/api/auth/logout.ts`)

- [ ] Stworzyć endpoint `/api/auth/logout.ts`
- [ ] Użyć `logoutUser()` z `auth.service.ts`
- [ ] Dodać do publicznych ścieżek w middleware (jeśli potrzebne)

### ⚠️ 5. Integracja rejestracji

- [ ] Zaktualizować `useRegisterForm` hook do wywołania `/api/auth/register`
- [ ] Dodać obsługę automatycznego logowania po rejestracji
- [ ] Przekierowanie do `/` po rejestracji

### ⚠️ 6. Komponent AuthHeader

- [ ] Stworzyć `src/components/auth/AuthHeader.tsx`
- [ ] Wyświetlać przycisk "Wyloguj" dla zalogowanych użytkowników
- [ ] Wywołanie `/api/auth/logout` i przekierowanie do `/auth/login`
- [ ] Dodać do `Layout.astro` (główny layout aplikacji)

### ⚠️ 7. Aktualizacja istniejących komponentów

- [ ] Sprawdzić wszystkie komponenty używające API
- [ ] Usunąć logikę z localStorage (jeśli istnieje)
- [ ] Upewnić się, że tokeny są automatycznie wysyłane w cookies
- [ ] Zaktualizować obsługę błędów 401 (przekierowanie do logowania)

### ⚠️ 8. Testowanie

- [ ] Test logowania z poprawnymi danymi
- [ ] Test logowania z nieprawidłowymi danymi
- [ ] Test przekierowania po logowaniu (parametr `redirect`)
- [ ] Test dostępu do chronionych stron bez logowania
- [ ] Test wylogowania
- [ ] Test wszystkich endpointów API z autoryzacją
- [ ] Test wygaśnięcia sesji

### ⚠️ 9. Dokumentacja

- [ ] Zaktualizować README z informacjami o autoryzacji
- [ ] Dodać instrukcje konfiguracji Supabase Auth
- [ ] Udokumentować zmienne środowiskowe

---

## 📝 Uwagi techniczne

### Konfiguracja cookies

- `secure: import.meta.env.PROD` - cookies będą secure tylko w produkcji
- `sameSite: 'lax'` - pozwala na cross-site requests (np. z innych domen)
- `httpOnly: true` - ochrona przed XSS (JavaScript nie ma dostępu)

### Middleware

- Middleware sprawdza autoryzację przed renderowaniem każdej strony
- Publiczne ścieżki są pomijane w sprawdzaniu
- Niezalogowani użytkownicy są automatycznie przekierowywani

### Bezpieczeństwo

- Wszystkie endpointy API wymagają autoryzacji (po aktualizacji pozostałych)
- Tokeny są przechowywane w HTTP-only cookies (nie w localStorage)
- RLS (Row-Level Security) w Supabase zapewnia izolację danych użytkowników

---

## 🎯 Priorytety

1. **Wysoki priorytet**: Aktualizacja pozostałych endpointów API (punkt 1)
2. **Wysoki priorytet**: Endpoint rejestracji i integracja (punkty 3, 5)
3. **Średni priorytet**: Endpoint wylogowania i AuthHeader (punkty 4, 6)
4. **Średni priorytet**: Testowanie (punkt 8)
5. **Niski priorytet**: Dokumentacja i czyszczenie kodu (punkty 2, 9)

---

## 📚 Pliki utworzone/zmodyfikowane

### Nowe pliki:

- `src/lib/services/auth.service.ts`
- `src/lib/utils/auth.ts`
- `src/pages/api/auth/login.ts`
- `src/pages/auth/login.astro` (przeniesiony)
- `src/pages/auth/register.astro` (przeniesiony)

### Zmodyfikowane pliki:

- `src/db/supabase.client.ts`
- `src/middleware/index.ts`
- `src/env.d.ts`
- `src/lib/hooks/useLoginForm.ts`
- `src/components/auth/LoginForm.tsx`
- `src/pages/api/cars.ts`
- `src/pages/api/cars/[carId].ts`

### Pliki do modyfikacji:

- `src/pages/api/cars/[carId]/fillups.ts`
- `src/pages/api/cars/[carId]/fillups/[fillupId].ts`
- `src/pages/api/cars/[carId]/charts.ts`
- `src/pages/api/cars/[carId]/statistics.ts`

---

_Ostatnia aktualizacja: 2025-01-XX_
