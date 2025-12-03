## API Endpoint Implementation Plan: GET /api/cars/{carId}

### 1. Przegląd punktu końcowego

Punkt końcowy zwraca szczegółowe informacje o jednym aucie (należącym do uwierzytelnionego użytkownika), łącznie z podstawowymi danymi oraz zagregowanymi statystykami z widoku `car_statistics`.

### 2. Szczegóły żądania

- **Metoda HTTP**: GET
- **Struktura URL**: `/api/cars/{carId}`
- **Parametry**:
  - **Wymagane**: `carId` (UUID w ścieżce)
  - **Opcjonalne**: brak
- **Nagłówki**:
  - `Authorization: Bearer <JWT>` — wymagany (z włączonym trybem deweloperskim dopuszczamy fallback)
  - `x-request-id` — opcjonalny, do korelacji logów
- **Request Body**: brak

### 3. Wykorzystywane typy

- `Car` (entity) — bazowy typ tabeli `cars` (z `src/types.ts` przez `Tables<"cars">`)
- `CarStatisticsView` (entity) — wiersz z widoku `car_statistics`
- `CarWithStatisticsDTO` — aktualnie istnieje dla listy; dla tego endpointu potrzebujemy rozszerzenia o pole `created_at`:
  - Nowy DTO: `CarDetailsDTO` = `CarWithStatisticsDTO & { created_at: string }` (ISO 8601)
- `ErrorResponseDTO` — standardowy format błędów

Uwagi typowe:

- W `src/types.ts` dodać `export type CarDetailsDTO = CarWithStatisticsDTO & { created_at: string };`

### 4. Szczegóły odpowiedzi

- **200 OK** — sukces
  ```json
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
  ```
- **401 Unauthorized** — brak/niepoprawny token
- **404 Not Found** — auto nie istnieje lub nie należy do użytkownika
- **400 Bad Request** — niepoprawny `carId` (np. nie-UUID)
- **500 Internal Server Error** — błąd serwera

### 5. Przepływ danych

1. Żądanie trafia do `src/pages/api/cars/[carId].ts` (SSR endpoint, `export const prerender = false`).
2. Middleware (`src/middleware/index.ts`) dostarcza `context.locals.supabase` jako klienta Supabase (anon key).
3. Endpoint:
   - Waliduje nagłówki autoryzacji: `Authorization: Bearer <JWT>` lub w DEV – fallback do `DEFAULT_USER_ID`.
   - Waliduje `carId` (UUID) przez Zod.
   - Jeśli dostępny Bearer token — pozyskuje `userId` przez `supabase.auth.getUser(token)` lub polega na RLS (preferowane: jawnie sprawdzić przynależność zasobu do użytkownika).
   - Wywołuje serwis `getUserCarWithStats(supabase, carId, { userId? })`:
     - Pobiera rekord z `cars` z polami: `id, name, initial_odometer, mileage_input_preference, created_at` oraz sprawdza własność (`user_id == userId` przy znanym userId; w przeciwnym wypadku polega na RLS z tokenem).
     - Pobiera z `car_statistics` wiersz dla `car_id`.
     - Składa `CarDetailsDTO` z `statistics` (puste wartości → `0`).
   - Zwraca 200 z JSON, w przeciwnym razie 404/401/400.

### 6. Względy bezpieczeństwa

- **Uwierzytelnianie**: Wymagany Bearer JWT (produkcja); w DEV dopuszczony fallback (`DEFAULT_USER_ID`) kontrolowany przez `DEV_AUTH_FALLBACK` (jak w istniejącym `/api/cars`).
- **Autoryzacja/IDOR**: Zawsze potwierdzać, że `car.user_id === authUserId`. W przypadku RLS z przekazaniem tokena do zapytań Supabase, nadal warto dodać jawny warunek filtru po `user_id` (gdy mamy `userId`) — obrona w głąb.
- **Walidacja danych**: Zod dla `carId` (UUID). Odrzucać niepoprawne formaty – 400.
- **Ekspozycja danych**: Zwracać wyłącznie wymagane pola. Brak ujawniania `user_id`.
- **Rate limiting**: Niewymagane na start; do rozważenia później (np. reverse proxy/CDN).
- **Logowanie**: Logować błędy z `requestId` i minimalnym kontekstem (bez PII).

### 7. Obsługa błędów

- 400 — niepoprawny `carId` (Zod parse fail)
- 401 — brak nagłówka `Authorization` (poza DEV fallback) lub błąd walidacji tokena
- 404 — auto nie istnieje lub nie należy do użytkownika (brak rekordu po filtrach)
- 500 — błąd nieoczekiwany (np. błąd sieciowy Supabase, wyjątek)

Format błędu: `ErrorResponseDTO`:

```json
{
  "error": {
    "code": "UNAUTHORIZED|BAD_REQUEST|NOT_FOUND|INTERNAL_ERROR",
    "message": "...",
    "details": { "...": "..." }
  }
}
```

### 8. Rozważania dotyczące wydajności

- Pojedyncze odczyty: 1 select do `cars` + 1 select do `car_statistics` — szybkie.
- Indeksy (zgodnie z @db-plan.md): `idx_cars_on_user_id`, widok `car_statistics` na joinie — wystarczające.
- Możliwe mikrooptymalizacje: łączenie zapytań po stronie aplikacji jest czytelne; nie łączymy w jeden SQL dla prostoty i separacji odpowiedzialności.

### 9. Etapy wdrożenia

1. Walidacja parametrów
   - Dodać `carIdParamSchema` w `src/lib/validation/cars.ts`:
     ```ts
     import { z } from 'zod';
     export const carIdParamSchema = z.object({ carId: z.string().uuid() });
     ```
2. Serwis
   - W `src/lib/services/cars.service.ts` dodać funkcję:
     ```ts
     export async function getUserCarWithStats(
       supabase: AppSupabaseClient,
       carId: string,
       options?: { userId?: string }
     ): Promise<CarDetailsDTO | null>;
     ```
   - Implementacja:
     - `select` z `cars` (w tym `created_at`). Jeśli `options.userId`, dodać `.eq("user_id", options.userId)`; inaczej polegać na RLS (token musi być użyty dla klienta lub explicit call `auth.getUser` → userId i jednak filtrować).
     - Jeśli brak rekordu, zwrócić `null`.
     - `select` z `car_statistics` dla `car_id = carId` (pojedynczy wiersz).
     - Złożyć `CarDetailsDTO` z domyślnymi `0` dla metryk null/undefined.
3. Endpoint
   - Utworzyć `src/pages/api/cars/[carId].ts` z:
     - `export const prerender = false;`
     - Pobranie `supabase` z `context.locals`.
     - Walidacja nagłówków auth analogicznie do `src/pages/api/cars.ts` (z obsługą DEV fallback) oraz pobranie `carId` z `context.params` + Zod.
     - Opcjonalnie: jeżeli dostępny Bearer token, wywołać `supabase.auth.getUser(token)` aby uzyskać `userId` i przekazać do serwisu (lepsza jawna autoryzacja). W razie błędu tokena — 401.
     - Wywołanie `getUserCarWithStats(...)`. Jeśli `null` — 404; inaczej 200 z `CarDetailsDTO`.
     - Obsługa wyjątków: log z `requestId`, zwrot 500.
4. Typy
   - Dodać `CarDetailsDTO` do `src/types.ts` (eksporotwany).
5. Testy ręczne
   - Dodać `.http` plik: `.http/get-car.http` z zapytaniami 200/401/404.
6. Dokumentacja
   - Uaktualnić `README.md` (sekcja API) o nowy endpoint.

### 10. Pseudo-kod (fragmenty)

Serwis:

```ts
export async function getUserCarWithStats(supabase, carId, opts?): Promise<CarDetailsDTO | null> {
  let q = supabase
    .from('cars')
    .select('id, name, initial_odometer, mileage_input_preference, created_at, user_id')
    .eq('id', carId)
    .limit(1)
    .single();
  if (opts?.userId) q = q.eq('user_id', opts.userId);

  const { data: car, error: carError } = await q;
  if (carError || !car) return null;

  const { data: stats } = await supabase
    .from('car_statistics')
    .select(
      'car_id,total_fuel_cost,total_fuel_amount,total_distance,average_consumption,average_price_per_liter,fillup_count'
    )
    .eq('car_id', car.id)
    .limit(1)
    .maybeSingle();

  return {
    id: car.id,
    name: car.name,
    initial_odometer: car.initial_odometer,
    mileage_input_preference: car.mileage_input_preference,
    created_at: car.created_at,
    statistics: {
      total_fuel_cost: stats?.total_fuel_cost ?? 0,
      total_fuel_amount: stats?.total_fuel_amount ?? 0,
      total_distance: stats?.total_distance ?? 0,
      average_consumption: stats?.average_consumption ?? 0,
      average_price_per_liter: stats?.average_price_per_liter ?? 0,
      fillup_count: stats?.fillup_count ?? 0,
    },
  };
}
```

Endpoint (szkic):

```ts
export const GET: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;
  const supabase = context.locals.supabase;
  if (!supabase) return json500('Supabase client not available');

  const authHeader = context.request.headers.get('authorization');
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith('bearer ');
  const devAuth = import.meta.env.DEV_AUTH_FALLBACK === 'true';
  if (!hasBearer && !devAuth) return json401('Missing or invalid Authorization header');

  const paramsParse = carIdParamSchema.safeParse({ carId: context.params.carId });
  if (!paramsParse.success) return json400('Invalid carId', paramsParse.error);

  let userId: string | undefined = undefined;
  if (hasBearer) {
    const token = authHeader!.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return json401('Invalid token');
    userId = data.user.id;
  }

  try {
    const car = await getUserCarWithStats(supabase, paramsParse.data.carId, userId ? { userId } : undefined);
    if (!car) return json404('Car not found');
    return new Response(JSON.stringify(car), { status: 200 });
  } catch (e) {
    console.error(`[GET /api/cars/{carId}] requestId=${requestId ?? '-'}`, e);
    return json500('Unexpected server error');
  }
};
```
