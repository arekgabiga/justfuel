# API Endpoint Implementation Plan: PATCH /api/cars/{carId}

## 1. Przegląd punktu końcowego

Endpoint służy do aktualizacji informacji o samochodzie użytkownika. Pozwala na częściową aktualizację danych samochodu, obecnie obsługuje zmianę nazwy samochodu oraz preferencji wprowadzania przebiegu. Endpoint wymaga uwierzytelnienia i zapewnia, że użytkownicy mogą aktualizować tylko swoje własne samochody.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/cars/{carId}`
- **Parametry:**
  - **Wymagane:**
    - `carId` (path parameter) - UUID identyfikator samochodu
  - **Opcjonalne:** Brak
- **Request Body:**

```json
{
  "name": "string (opcjonalne)",
  "mileage_input_preference": "odometer" | "distance (opcjonalne)"
}
```

- **Headers:**
  - `Authorization: Bearer <token>` (wymagane)
  - `Content-Type: application/json`

## 3. Wykorzystywane typy

### Command Models:

- `UpdateCarCommand` - model żądania aktualizacji samochodu
- `CarDetailsDTO` - model odpowiedzi z pełnymi danymi samochodu

### Validation Schemas:

- Zod schema dla walidacji `UpdateCarCommand`
- Walidacja UUID dla `carId`

### Error Types:

- `ErrorResponseDTO` - standardowy format odpowiedzi błędów

## 4. Szczegóły odpowiedzi

### Success Response (200 OK):

```json
{
  "id": "uuid",
  "name": "string",
  "initial_odometer": "number | null",
  "mileage_input_preference": "odometer" | "distance",
  "created_at": "string (ISO 8601)"
}
```

### Error Responses:

- **400 Bad Request** - Błędy walidacji danych wejściowych
- **401 Unauthorized** - Nieprawidłowy lub wygasły token
- **404 Not Found** - Samochód nie znaleziony lub nie należy do użytkownika
- **409 Conflict** - Nowa nazwa już istnieje dla tego użytkownika
- **500 Internal Server Error** - Błąd serwera

## 5. Przepływ danych

1. **Walidacja żądania:**
   - Sprawdzenie formatu UUID dla `carId`
   - Walidacja struktury request body za pomocą Zod schema
   - Sprawdzenie obecności co najmniej jednego pola do aktualizacji

2. **Uwierzytelnienie:**
   - Weryfikacja Bearer token z kontekstu Astro
   - Pobranie `user_id` z tokenu

3. **Autoryzacja:**
   - Sprawdzenie czy samochód istnieje
   - Weryfikacja czy samochód należy do uwierzytelnionego użytkownika

4. **Walidacja biznesowa:**
   - Sprawdzenie unikalności nazwy dla użytkownika (jeśli nazwa jest aktualizowana)
   - Walidacja wartości `mileage_input_preference`

5. **Aktualizacja danych:**
   - Wywołanie metody service do aktualizacji samochodu
   - Zwrócenie zaktualizowanych danych samochodu

## 6. Względy bezpieczeństwa

### Uwierzytelnienie:

- Wymagany Bearer token w nagłówku Authorization
- Token weryfikowany przez Supabase Auth

### Autoryzacja:

- Row Level Security (RLS) w bazie danych zapewnia dostęp tylko do własnych samochodów
- Dodatkowa weryfikacja na poziomie aplikacji przed wykonaniem zapytania

### Walidacja danych:

- Walidacja UUID dla `carId` zapobiega atakom injection
- Walidacja długości i formatu nazwy samochodu
- Walidacja enum dla `mileage_input_preference`

### Rate Limiting:

- Rozważenie implementacji rate limiting dla endpointów modyfikujących dane

## 7. Obsługa błędów

### 400 Bad Request:

- Nieprawidłowy format UUID dla `carId`
- Nieprawidłowa wartość `mileage_input_preference`
- Pusta nazwa samochodu
- Brak pól do aktualizacji w request body

### 401 Unauthorized:

- Brak tokenu autoryzacji
- Nieprawidłowy format tokenu
- Wygasły token

### 404 Not Found:

- Samochód o podanym ID nie istnieje
- Samochód istnieje ale nie należy do uwierzytelnionego użytkownika

### 409 Conflict:

- Nazwa samochodu już istnieje dla tego użytkownika

### 500 Internal Server Error:

- Błąd połączenia z bazą danych
- Nieoczekiwane błędy serwera
- Błędy walidacji na poziomie bazy danych

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:

- Wykorzystanie istniejącego indeksu `idx_cars_on_user_id` dla szybkiego wyszukiwania samochodów użytkownika
- Indeks na `(user_id, name)` dla sprawdzenia unikalności nazwy

### Caching:

- Rozważenie cache'owania danych samochodu dla często aktualizowanych samochodów
- Cache invalidation po aktualizacji

### Monitoring:

- Logowanie czasu wykonania operacji aktualizacji
- Monitoring błędów walidacji i autoryzacji

## 9. Etapy wdrożenia

1. **Przygotowanie walidacji:**
   - Rozszerzenie istniejącego Zod schema w `src/lib/validation/cars.ts` o `UpdateCarCommand`
   - Dodanie walidacji UUID dla `carId`

2. **Implementacja service layer:**
   - Rozszerzenie `src/lib/services/cars.service.ts` o metodę `updateCar()`
   - Implementacja logiki sprawdzania unikalności nazwy
   - Obsługa błędów na poziomie service

3. **Implementacja endpoint handler:**
   - Utworzenie/aktualizacja `src/pages/api/cars/[carId].ts`
   - Implementacja metody PATCH
   - Integracja z service layer
   - Obsługa wszystkich scenariuszy błędów

4. **Testy jednostkowe:**
   - Testy walidacji danych wejściowych
   - Testy autoryzacji i uwierzytelnienia
   - Testy scenariuszy błędów
   - Testy pomyślnej aktualizacji

5. **Testy integracyjne:**
   - Testy end-to-end z rzeczywistą bazą danych
   - Testy z różnymi scenariuszami użytkowników
   - Testy wydajności

6. **Dokumentacja:**
   - Aktualizacja dokumentacji API
   - Przykłady użycia endpointu
   - Dokumentacja kodów błędów

7. **Deployment:**
   - Wdrożenie na środowisko testowe
   - Weryfikacja działania endpointu
   - Wdrożenie na produkcję
   - Monitoring błędów i wydajności
