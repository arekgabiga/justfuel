## API Endpoint Implementation Plan: GET /api/cars

### 1. Przegląd punktu końcowego

Punkt końcowy zwraca listę wszystkich samochodów uwierzytelnionego użytkownika wraz z podstawowymi statystykami zagregowanymi z widoku `car_statistics`. Dane są filtrowane RLS (po `auth.uid()`), sortowane wg parametrów zapytania i zwracane w lekkim DTO.

### 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **URL**: `/api/cars`
- **Parametry zapytania**:
  - `sort` (opcjonalny): `name` | `created_at` (domyślnie `created_at`)
  - `order` (opcjonalny): `asc` | `desc` (domyślnie `desc`)
- **Nagłówki**:
  - `Authorization: Bearer <token>` (wymagany)
- **Body**: brak

Walidacja parametrów odbywa się przez Zod w warstwie API.

### 3. Wykorzystywane typy

- Z `src/types.ts`:
  - `CarDTO` — struktura pojedynczego samochodu (bez pól wewnętrznych)
  - `CarWithStatisticsDTO` — `CarDTO` + pole `statistics` z metrykami
  - `ListResponseDTO<T>` — standardowa odpowiedź listy
  - `ListCarsQueryParams` — typ parametrów zapytania (sort/order)
  - `CarStatisticsView` — typ widoku agregacji

Dla walidacji requestu w API: schemat Zod odzwierciedlający `ListCarsQueryParams`.

### 4. Szczegóły odpowiedzi

- **200 OK**:
  - JSON: `{ "cars": CarWithStatisticsDTO[] }`
- **401 Unauthorized**: gdy brak/nieprawidłowy token
- **400 Bad Request**: niepoprawne parametry `sort`/`order`
- **500 Internal Server Error**: błąd serwera/połączenia z DB

Przykład 200 OK (skrócony):

```json
{
  "cars": [
    {
      "id": "uuid",
      "name": "My Audi A4",
      "initial_odometer": 50000,
      "mileage_input_preference": "odometer",
      "created_at": "2025-10-17T12:00:00Z",
      "statistics": {
        "total_fuel_cost": 2500.5,
        "total_fuel_amount": 500.25,
        "total_distance": 5000,
        "average_consumption": 8.5,
        "average_price_per_liter": 5.0,
        "fillup_count": 25
      }
    }
  ]
}
```

### 5. Przepływ danych

1. Klient wywołuje `GET /api/cars` z tokenem Bearer.
2. Middleware Astro weryfikuje sesję i do `locals` dołącza `supabase` (wg reguł backend/astro).
3. Handler API parsuje i waliduje `sort`/`order` (Zod) oraz ustawia domyślne wartości.
4. Warstwa serwisu (`src/lib/services/cars.service.ts`) pobiera dane:
   - Z tabeli `cars` (z RLS) dla `auth.uid()`.
   - Łączy (LEFT JOIN) lub wykonuje dodatkowe zapytanie do widoku `car_statistics` po `car_id`.
   - Mapuje wynik do `CarWithStatisticsDTO` (w tym `statistics` z widoku; brakujące statystyki → wartości `0`/`null` zgodnie z typami).
5. API zwraca `200` z `{ cars: CarWithStatisticsDTO[] }`.

Uwaga: Dzięki RLS nie ma potrzeby dodawać warunku user_id w zapytaniu (jest egzekwowany po stronie DB), ale można dodatkowo filtrować po `user_id` jeśli serwis tego wymaga dla jawności.

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany Bearer token; brak → `401`.
- **Autoryzacja/RLS**: Tabele `cars`, `fillups` mają RLS zgodnie z planem DB; zapytania działają w kontekście użytkownika (`auth.uid()`).
- **Walidacja wejścia**: Zod dla `sort`/`order` eliminuje nieprawidłowe wartości i SQL injection przez parametry sterujące sortowaniem (mapowanie do bezpiecznych kolumn/porządków).
- **Minimalne dane**: Zwracamy tylko pola wymagane przez `CarDTO` + `statistics`.
- **Nagłówki**: Nie logujemy pełnych tokenów; ewentualnie skrót/ostatnie znaki do korelacji.

### 7. Obsługa błędów

- Scenariusze i kody:
  - Brak tokena / nieprawidłowy token → `401` z `ErrorResponseDTO`.
  - Niepoprawne `sort`/`order` → `400` (komunikat walidacji Zod).
  - Błąd połączenia z DB / nieoczekiwany wyjątek → `500` (ogólny komunikat, bez szczegółów wewnętrznych).
- Logowanie błędów: `console.error` po stronie serwera z `requestId` (jeśli dostępny z middleware). W przyszłości można dodać integrację z Sentry/Logflare. Dedykowanej tabeli błędów brak — nie tworzymy w tym kroku.

### 8. Rozważania dotyczące wydajności

- Indeksy: `cars(user_id)` już przewidziany; widok `car_statistics` opiera się na agregacji `fillups` — rozważyć materializację lub indeksy na `fillups(car_id, date)` jeśli potrzeba.
- Minimalny payload: wybieramy tylko wymagane kolumny; unikamy N+1 poprzez pojedyncze zapytanie z JOIN do widoku lub `IN` po liście `car_id`.
- Sortowanie: ograniczone do `name`/`created_at`; użyć indeksu na `cars(created_at)` jeśli sortowanie po czasie jest domyślne.
- Caching aplikacyjny (opcjonalnie): ETag/Last-Modified po `max(created_at)` lub po liczbie `fillups` (out of scope na teraz).

### 9. Etapy wdrożenia

1. Utwórz serwis `src/lib/services/cars.service.ts`:
   - `listUserCarsWithStats(supabase, params): Promise<CarWithStatisticsDTO[]>`
   - Implementacja: pobierz `cars` użytkownika; dołącz statystyki z widoku `car_statistics` (JOIN po `car_id` lub osobne zapytanie i mapowanie); zaimplementuj sortowanie ograniczone do białej listy kolumn.
2. Dodaj walidację Zod parametrów zapytania w handlerze API:
   - Schemat: `{ sort?: 'name'|'created_at', order?: 'asc'|'desc' }` z domyślnymi.
3. Utwórz endpoint `src/pages/api/cars.ts` (Astro server endpoint):
   - `export const prerender = false`
   - `export async function GET(context) { ... }`
   - Pobierz `supabase` z `context.locals` (nie importuj klienta bezpośrednio).
   - Sprawdź autoryzację użytkownika (sesja/token). Brak → `401`.
   - Parsuj i waliduj query (Zod). Błąd → `400`.
   - Wywołaj serwis i zwróć `200` z `{ cars }`.
4. Obsługa błędów i logowanie:
   - Opakuj wywołanie serwisu `try/catch`; loguj błąd z `requestId`; zwracaj `500` z ogólnym komunikatem.
5. Lint i zgodność z konwencjami projektu: uruchom lint, popraw ewentualne uwagi.
6. Weryfikacja RLS i uprawnień: ręcznie sprawdź, że użytkownik widzi wyłącznie swoje samochody.

### 10. Szczegóły implementacyjne zapytań (propozycja)

- Pobieranie danych jednym zapytaniem:
  - Widok `car_statistics` zawiera jeden rekord na `car_id` (gdy istnieją fillupy). Użyj LEFT JOIN, aby auta bez fillupów też były zwrócone z `statistics` = null/zero.
- Whitelist sortowania:
  - Mapuj `sort` → kolumna SQL: `{ name: 'cars.name', created_at: 'cars.created_at' }`.
  - Mapuj `order` → `ASC|DESC`.
- Mapowanie wartości `statistics`:
  - Dla `null` w polach statystyk ustawiaj wartości `0` lub `null` zgodnie z typami w `CarWithStatisticsDTO`.

### 11. Struktura plików (zgodna z regułami projektu)

- `src/pages/api/cars.ts` — endpoint Astro (server route)
- `src/lib/services/cars.service.ts` — warstwa serwisu i mapowanie DTO
- (opcjonalnie) `src/lib/validation/cars.ts` — schemat Zod dla query
