# API Endpoint Implementation Plan: GET /api/cars/{carId}/statistics

## 1. Przegląd punktu końcowego

Endpoint `GET /api/cars/{carId}/statistics` służy do pobierania zagregowanych statystyk dla konkretnego samochodu użytkownika. Zwraca szczegółowe informacje o kosztach paliwa, zużyciu, dystansie oraz dodatkowe metadane jak data ostatniego tankowania i aktualny stan licznika.

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/cars/{carId}/statistics`
- **Parametry:**
  - **Wymagane:**
    - `carId` (string, UUID) - identyfikator samochodu w ścieżce URL
  - **Opcjonalne:** brak
- **Request Body:** brak
- **Headers:**
  - `Authorization: Bearer <token>` - wymagany token uwierzytelnienia
  - `x-request-id` - opcjonalny identyfikator żądania dla logowania

## 3. Wykorzystywane typy

### DTOs (Data Transfer Objects)

- `CarStatisticsDTO` - główny typ odpowiedzi zawierający wszystkie statystyki
- `ErrorResponseDTO` - standardowy format błędów

### Schematy walidacji

- `carIdParamSchema` - walidacja parametru carId jako UUID

## 4. Szczegóły odpowiedzi

### Sukces (200 OK)

```json
{
  "car_id": "uuid",
  "total_fuel_cost": 2500.5,
  "total_fuel_amount": 500.25,
  "total_distance": 5000,
  "average_consumption": 8.5,
  "average_price_per_liter": 5.0,
  "fillup_count": 25,
  "latest_fillup_date": "2025-10-17T12:00:00Z",
  "current_odometer": 55000
}
```

### Błędy

- **401 Unauthorized** - Brak lub nieprawidłowy token uwierzytelnienia
- **404 Not Found** - Samochód nie istnieje lub nie należy do użytkownika
- **400 Bad Request** - Nieprawidłowy format carId
- **500 Internal Server Error** - Błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja parametrów:** Sprawdzenie czy carId jest prawidłowym UUID
2. **Uwierzytelnienie:** Weryfikacja tokenu Bearer i pobranie userId
3. **Weryfikacja dostępu:** Sprawdzenie czy samochód istnieje i należy do użytkownika (RLS)
4. **Pobranie statystyk:** Zapytanie do widoku `car_statistics` dla danego carId
5. **Pobranie dodatkowych danych:** Zapytanie o najnowszy fillup dla `latest_fillup_date` i `current_odometer`
6. **Formatowanie odpowiedzi:** Złożenie danych w strukturę `CarStatisticsDTO`
7. **Zwrócenie wyniku:** JSON response z kodem 200

## 6. Względy bezpieczeństwa

### Uwierzytelnienie

- Wymagany token Bearer w nagłówku Authorization
- Weryfikacja tokenu przez `supabase.auth.getUser()`
- Fallback dla środowiska deweloperskiego (`DEV_AUTH_FALLBACK`)

### Autoryzacja

- Row-Level Security (RLS) w bazie danych zapewnia izolację danych między użytkownikami
- Sprawdzenie czy samochód należy do uwierzytelnionego użytkownika
- Brak możliwości dostępu do danych innych użytkowników

### Walidacja danych

- Walidacja carId jako prawidłowy UUID
- Sanityzacja parametrów zapytań SQL przez Supabase
- Obsługa błędów bez ujawniania wrażliwych informacji

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi

| Scenariusz                | Kod | Opis                                      |
| ------------------------- | --- | ----------------------------------------- |
| Brak tokenu Authorization | 401 | "Missing or invalid Authorization header" |
| Nieprawidłowy token       | 401 | "Invalid token"                           |
| Nieprawidłowy carId       | 400 | "Invalid carId" z detalami walidacji      |
| Samochód nie istnieje     | 404 | "Car not found"                           |
| Błąd bazy danych          | 500 | "Unexpected server error"                 |
| Brak klienta Supabase     | 500 | "Supabase client not available"           |

### Logowanie błędów

- Wszystkie błędy logowane z `requestId` dla śledzenia
- Szczegółowe logi błędów w konsoli serwera
- Nie ujawnianie wrażliwych informacji w odpowiedziach

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych

- Wykorzystanie widoku `car_statistics` dla szybkich agregacji
- Indeksy na `fillups(car_id)` i `fillups(date)` dla wydajnych zapytań
- RLS policies nie wpływają znacząco na wydajność dzięki indeksom

### Strategie cache'owania

- Brak cache'owania na poziomie API (dane mogą się często zmieniać)
- Supabase automatycznie cache'uje zapytania na poziomie bazy danych
- Rozważenie cache'owania w przyszłości dla często używanych statystyk

### Potencjalne wąskie gardła

- Zapytanie o najnowszy fillup może być kosztowne dla samochodów z wieloma tankowaniami
- Rozwiązanie: indeks na `fillups(car_id, date DESC)`

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie serwisu cars.service.ts

```typescript
export async function getCarStatistics(
  supabase: AppSupabaseClient,
  carId: string,
  options?: { userId?: string }
): Promise<CarStatisticsDTO | null>;
```

### Krok 2: Utworzenie endpointu API

- Utworzenie pliku `/src/pages/api/cars/[carId]/statistics.ts`
- Implementacja metody `GET` z pełną obsługą błędów
- Wykorzystanie istniejących wzorców uwierzytelnienia i walidacji

### Krok 3: Implementacja logiki biznesowej

- Pobranie podstawowych statystyk z widoku `car_statistics`
- Dodatkowe zapytanie o najnowszy fillup dla `latest_fillup_date` i `current_odometer`
- Obsługa przypadku gdy samochód nie ma jeszcze tankowań

### Krok 4: Walidacja i testowanie

- Testy jednostkowe dla nowej funkcji serwisu
- Testy integracyjne dla endpointu API
- Weryfikacja wszystkich scenariuszy błędów

### Krok 5: Dokumentacja i wdrożenie

- Aktualizacja dokumentacji API
- Testy w środowisku deweloperskim
- Wdrożenie na środowisko produkcyjne

### Krok 6: Monitoring i optymalizacja

- Monitoring wydajności zapytań
- Analiza logów błędów
- Ewentualne optymalizacje na podstawie rzeczywistego użycia
