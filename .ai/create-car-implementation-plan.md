## API Endpoint Implementation Plan: POST /api/cars

### 1. Przegląd punktu końcowego

Tworzy nowy wpis samochodu przypisany do zalogowanego użytkownika. Wymaga uwierzytelnienia Bearer i respektuje RLS w Supabase. Zwraca nowo utworzony zasób.

### 2. Szczegóły żądania

- **Metoda HTTP**: POST
- **Struktura URL**: /api/cars
- **Parametry**:
  - **Wymagane**: brak parametrów URL/query
  - **Opcjonalne**: brak parametrów URL/query
- **Request Body (JSON)**:
  - `name` (string, required, trimmed, length 1..100)
  - `initial_odometer` (number, optional, >= 0)
  - `mileage_input_preference` (string, required, enum: "odometer" | "distance")

Przykład:

```json
{
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer"
}
```

### 3. Wykorzystywane typy

- `CreateCarCommand` (src/types.ts): Pick<TablesInsert<"cars">, "name" | "initial_odometer" | "mileage_input_preference">
- `CarDetailsDTO` (src/types.ts): `CarWithStatisticsDTO & { created_at: string }`
- `ErrorResponseDTO` (src/types.ts)

Uwaga: Specyfikacja sukcesu wymaga `created_at`; zwracamy zatem `CarDetailsDTO` zawierające `created_at` i puste statystyki (0) dla nowego auta.

### 4. Szczegóły odpowiedzi

- **201 Created** – ciało:

```json
{
  "id": "uuid",
  "name": "My Audi A4",
  "initial_odometer": 50000,
  "mileage_input_preference": "odometer",
  "created_at": "2025-10-17T12:00:00Z",
  "statistics": {
    "total_fuel_cost": 0,
    "total_fuel_amount": 0,
    "total_distance": 0,
    "average_consumption": 0,
    "average_price_per_liter": 0,
    "fillup_count": 0
  }
}
```

- **400 Bad Request** – walidacja (brak `name`, zła wartość `mileage_input_preference`, niepoprawne typy/liczby)
- **401 Unauthorized** – brak/niepoprawny Bearer
- **409 Conflict** – `name` już zajęte dla użytkownika (naruszenie `UNIQUE (user_id, name)`)
- **500 Internal Server Error** – nieoczekiwany błąd serwera/Supabase

### 5. Przepływ danych

1. Astrowy endpoint `POST` w `src/pages/api/cars.ts`:
   - Odczyt `authorization` (Bearer ...).
   - W środowisku dev dopuszczalny fallback (`DEV_AUTH_FALLBACK === "true"`) jak w istniejących GET-ach.
   - Walidacja payloadu przez `zod` (nowe: `createCarCommandSchema`).
   - Pozyskanie `userId` poprzez `supabase.auth.getUser(token)` lub `DEFAULT_USER_ID` w dev fallback.
   - Delegacja do serwisu: `createCar` w `src/lib/services/cars.service.ts`.
2. Serwis `createCar`:
   - Wykonuje `insert` do tabeli `cars` z polami: `user_id`, `name`, `initial_odometer`, `mileage_input_preference`.
   - Zwraca utworzony rekord (select po `id` z `created_at`) i puste statystyki (0) bez odpytywania widoku.
   - Mapuje błędy Supabase (w tym konflikt 23505) na kody HTTP i kody aplikacyjne.
3. RLS w DB gwarantuje, że `INSERT` jest dozwolony tylko dla `auth.uid() = user_id`.

### 6. Względy bezpieczeństwa

- **Uwierzytelnienie**: Bearer token wymagany poza dev fallback. Walidacja przez `supabase.auth.getUser(token)`.
- **Autoryzacja/RLS**: `cars` posiada polityki RLS (INSERT/SELECT/UPDATE/DELETE). Wstawiamy `user_id` = identyfikator uwierzytelnionego użytkownika.
- **Walidacja wejścia**: ścisła walidacja `zod` przed zapisem.
- **Nagłówki**: akceptacja i zwracanie `Content-Type: application/json`.
- **Rate limiting (opcjonalnie)**: rozważyć middleware w `src/middleware/index.ts` w przyszłości.
- **Logowanie**: log błędów na serwerze z `requestId`.

### 7. Obsługa błędów

- 400: z `zod` (`createCarCommandSchema.safeParse`), treść `ErrorResponseDTO` z `details.issues`.
- 401: brak Bearer lub `getUser` zwrócił błąd/brak `user.id`.
- 409: Supabase/PostgREST błąd naruszenia unikalności (kod postgres `23505` lub komunikat zawierający `duplicate key value violates unique constraint`).
- 500: każdy inny błąd Supabase/nieoczekiwany wyjątek.

Mapowanie do `ErrorResponseDTO`:

- `UNAUTHORIZED` (401), `BAD_REQUEST` (400), `CONFLICT` (409), `INTERNAL_ERROR` (500).

### 8. Rozważania dotyczące wydajności

- Operacja to pojedynczy `INSERT` – koszt minimalny.
- Brak dodatkowego zapytania do widoku `car_statistics` przy tworzeniu (statystyki zwracamy jako zera), co redukuje RTT.
- Indeks `UNIQUE (user_id, name)` i indeks `cars(user_id)` już przewidziane w planie DB.

### 9. Kroki implementacji

1. Walidacja wejścia (Zod)
   - Dodaj w `src/lib/validation/cars.ts` schemat `createCarCommandSchema`:
     - `name`: string().trim().min(1).max(100)
     - `initial_odometer`: number().int().nonnegative().optional()
     - `mileage_input_preference`: enum(["odometer", "distance"]) (wartość wymagana)
2. Serwis – `createCar`
   - W `src/lib/services/cars.service.ts` dodaj funkcję:
     - sygnatura: `createCar(supabase: AppSupabaseClient, userId: string, input: CreateCarCommand): Promise<CarDetailsDTO>`
     - wykonaj `insert` do `cars` z `user_id` = `userId` i polami z inputu; użyj `.select("id, name, initial_odometer, mileage_input_preference, created_at").single()`.
     - obsłuż konflikt 23505 -> rzutuj na błąd serwisowy typu `ConflictError` (lub zwróć sygnał do warstwy API).
     - zbuduj i zwróć `CarDetailsDTO` z `statistics` = zera.
3. Endpoint – `POST /api/cars`
   - W `src/pages/api/cars.ts` dodaj `export const POST: APIRoute = async (context) => { ... }` obok istniejącego `GET`.
   - Sprawdź obecność `context.locals.supabase` (500 w przeciwnym razie) – zachowaj spójność z istniejącym `GET`.
   - Walidacja Bearer/fallback identyczna do `GET` w `[carId].ts`:
     - Przy Bearer: pobierz `token`, zrób `supabase.auth.getUser(token)`, waliduj `user.id`.
     - W dev+brak Bearer: użyj `DEFAULT_USER_ID`.
   - Parsuj body: `await context.request.json()` i waliduj `createCarCommandSchema`.
   - Wywołaj `createCar(supabase, userId, parsed.data)`.
   - Zwróć `Response(JSON.stringify(carDetailsDto), { status: 201 })`.
   - Błędy mapuj do właściwych statusów (400/401/409/500) i `ErrorResponseDTO`.
4. Testy ręczne (HTTP files)
   - Dodaj `.http/post-car.http` z przykładowymi żądaniami 201/400/401/409.
5. Opcjonalne logowanie błędów
   - Pozostań przy `console.error` z `requestId` jak w istniejących endpointach.

### 10. Pseudokod (istotne fragmenty)

Walidacja (zod):

```ts
export const createCarCommandSchema = z.object({
  name: z.string().trim().min(1).max(100),
  initial_odometer: z.number().int().nonnegative().optional(),
  mileage_input_preference: z.enum(['odometer', 'distance']),
});
```

Serwis:

```ts
export async function createCar(
  supabase: AppSupabaseClient,
  userId: string,
  input: CreateCarCommand
): Promise<CarDetailsDTO> {
  const { data, error } = await supabase
    .from('cars')
    .insert({ user_id: userId, ...input })
    .select('id, name, initial_odometer, mileage_input_preference, created_at')
    .single();
  if (error) {
    if (error.code === '23505' || /duplicate key/i.test(error.message)) {
      throw new ConflictError('Car name already exists');
    }
    throw error;
  }
  return {
    id: data.id,
    name: data.name,
    initial_odometer: data.initial_odometer,
    mileage_input_preference: data.mileage_input_preference,
    created_at: data.created_at,
    statistics: {
      total_fuel_cost: 0,
      total_fuel_amount: 0,
      total_distance: 0,
      average_consumption: 0,
      average_price_per_liter: 0,
      fillup_count: 0,
    },
  };
}
```

Endpoint:

```ts
export const POST: APIRoute = async (context) => {
  const requestId = context.request.headers.get('x-request-id') ?? undefined;
  const supabase = context.locals.supabase;
  if (!supabase) return json500('Supabase client not available');

  const authHeader = context.request.headers.get('authorization');
  const devAuthFallbackEnabled = import.meta.env.DEV_AUTH_FALLBACK === 'true';
  const hasBearer = !!authHeader && authHeader.toLowerCase().startsWith('bearer ');
  if (!hasBearer && !devAuthFallbackEnabled) return json401('Missing or invalid Authorization header');

  let userId: string | undefined;
  if (hasBearer) {
    const token = authHeader!.slice(7);
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user?.id) return json401('Invalid token');
    userId = data.user.id;
  } else {
    userId = DEFAULT_USER_ID;
  }

  const raw = await context.request.json().catch(() => undefined);
  const parsed = createCarCommandSchema.safeParse(raw);
  if (!parsed.success) return json400('Invalid body', { issues: parsed.error.message });

  try {
    const result = await createCar(supabase, userId!, parsed.data);
    return new Response(JSON.stringify(result), { status: 201 });
  } catch (err: any) {
    if (err?.name === 'ConflictError') return json409('Car name already exists for this user');
    console.error(`[POST /api/cars] requestId=${requestId ?? '-'}`, err);
    return json500('Unexpected server error');
  }
};
```

### 11. Zgodność z regułami implementacji

- Astro API: `export const prerender = false`, użycie `APIRoute`, handler `POST` w `src/pages/api/cars.ts`.
- Supabase: użycie `context.locals.supabase` (nie bezpośrednio klienta), typ `AppSupabaseClient`.
- Zod: walidacja wejścia w endpointzie.
- Logika domenowa w serwisie (`src/lib/services/cars.service.ts`).
- Kody statusu: 201/400/401/409/500 – zgodne ze specyfikacją.
