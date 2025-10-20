# API Endpoint Implementation Plan: DELETE /api/cars/{carId}

## 1. Przegląd punktu końcowego

Endpoint `DELETE /api/cars/{carId}` służy do trwałego usunięcia samochodu wraz ze wszystkimi powiązanymi tankowaniami. Operacja wymaga potwierdzenia poprzez podanie nazwy samochodu, co zapewnia dodatkowe zabezpieczenie przed przypadkowym usunięciem danych. Endpoint wykorzystuje kaskadowe usuwanie na poziomie bazy danych, gdzie usunięcie samochodu automatycznie usuwa wszystkie powiązane rekordy tankowań.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/cars/{carId}`
- **Parametry:**
  - **Wymagane:** `carId` (UUID) - identyfikator samochodu do usunięcia
- **Request Body:**

```json
{
  "confirmation_name": "My Audi A4"
}
```

- **Nagłówki wymagane:**
  - `Authorization: Bearer {token}` - token JWT dla uwierzytelnienia
  - `Content-Type: application/json`

## 3. Wykorzystywane typy

### DTOs i Command Modele:

- `DeleteCarCommand` - struktura żądania z polem `confirmation_name`
- `DeleteResponseDTO` - struktura odpowiedzi z komunikatem o powodzeniu
- `ErrorResponseDTO` - standardowa struktura błędów

### Typy z bazy danych:

- `Car` - encja samochodu z tabeli `cars`
- `Fillup` - encje tankowań z tabeli `fillups` (usuwane kaskadowo)

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "message": "Car and all associated fillups deleted successfully"
}
```

### Błędy:

- **400 Bad Request** - Nazwa potwierdzenia nie pasuje do nazwy samochodu
- **401 Unauthorized** - Nieprawidłowy lub wygasły token
- **404 Not Found** - Samochód nie został znaleziony lub nie należy do użytkownika
- **500 Internal Server Error** - Nieoczekiwany błąd serwera

## 5. Przepływ danych

1. **Walidacja parametrów:** Sprawdzenie poprawności UUID `carId`
2. **Uwierzytelnienie:** Weryfikacja tokenu JWT i pobranie `userId`
3. **Walidacja żądania:** Parsowanie i walidacja JSON body z `confirmation_name`
4. **Weryfikacja samochodu:** Sprawdzenie czy samochód istnieje i należy do użytkownika
5. **Weryfikacja nazwy:** Porównanie `confirmation_name` z rzeczywistą nazwą samochodu
6. **Usunięcie:** Wykonanie operacji DELETE na tabeli `cars` (kaskadowe usunięcie tankowań)
7. **Odpowiedź:** Zwrócenie komunikatu o powodzeniu

## 6. Względy bezpieczeństwa

### Uwierzytelnienie i autoryzacja:

- **JWT Token:** Wymagany token Bearer w nagłówku Authorization
- **RLS Policies:** Row-Level Security w Supabase zapewnia izolację danych użytkowników
- **Ownership Verification:** Sprawdzenie czy samochód należy do uwierzytelnionego użytkownika

### Walidacja danych:

- **Confirmation Name:** Wymagane potwierdzenie nazwy samochodu zapobiega przypadkowemu usunięciu
- **UUID Validation:** Walidacja formatu identyfikatora samochodu
- **Input Sanitization:** Oczyszczenie danych wejściowych przed przetworzeniem

### Zabezpieczenia przed atakami:

- **SQL Injection:** Użycie Supabase ORM eliminuje ryzyko SQL injection
- **CSRF Protection:** Wymagany token JWT zapewnia ochronę przed CSRF
- **Rate Limiting:** Ograniczenia częstotliwości zapytań (30 zapytań/min dla operacji zapisu)

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi:

1. **Nieprawidłowy UUID carId:**
   - Kod: `400 Bad Request`
   - Komunikat: "Invalid carId"

2. **Brak tokenu autoryzacji:**
   - Kod: `401 Unauthorized`
   - Komunikat: "Missing or invalid Authorization header"

3. **Nieprawidłowy token:**
   - Kod: `401 Unauthorized`
   - Komunikat: "Invalid token"

4. **Nieprawidłowy JSON:**
   - Kod: `400 Bad Request`
   - Komunikat: "Invalid JSON in request body"

5. **Brak pola confirmation_name:**
   - Kod: `400 Bad Request`
   - Komunikat: "Missing confirmation_name field"

6. **Samochód nie istnieje:**
   - Kod: `404 Not Found`
   - Komunikat: "Car not found"

7. **Nazwa potwierdzenia nie pasuje:**
   - Kod: `400 Bad Request`
   - Komunikat: "Confirmation name does not match car name"

8. **Błąd bazy danych:**
   - Kod: `500 Internal Server Error`
   - Komunikat: "Unexpected server error"

### Logowanie błędów:

- Wszystkie błędy są logowane z `requestId` dla śledzenia
- Szczegółowe informacje o błędach w logach serwera
- Ograniczone informacje w odpowiedziach API (bez ujawniania szczegółów implementacji)

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:

- **Kaskadowe usuwanie:** Wykorzystanie `ON DELETE CASCADE` w foreign key constraints
- **Indeksy:** Istniejące indeksy na `cars.user_id` i `fillups.car_id` przyspieszają operacje
- **RLS Policies:** Zoptymalizowane polityki bezpieczeństwa na poziomie bazy danych

### Ograniczenia wydajności:

- **Czas wykonania:** Operacja może być wolniejsza dla samochodów z dużą liczbą tankowań
- **Blokowanie:** Operacja DELETE może blokować inne zapytania do tabeli podczas usuwania
- **Logi transakcji:** Duże operacje usuwania generują więcej logów transakcji

### Strategie optymalizacji:

- **Batch Operations:** Supabase automatycznie optymalizuje operacje kaskadowe
- **Monitoring:** Śledzenie czasu wykonania operacji DELETE
- **Graceful Degradation:** Obsługa timeoutów i długotrwałych operacji

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie walidacji

1. Dodanie schematu walidacji `deleteCarCommandSchema` w `src/lib/validation/cars.ts`
2. Definicja typu `DeleteCarCommandInput` dla walidacji Zod
3. Walidacja pola `confirmation_name` (wymagane, string, trim, min 1, max 100)

### Krok 2: Implementacja serwisu

1. Utworzenie funkcji `deleteCar` w `src/lib/services/cars.service.ts`
2. Implementacja logiki weryfikacji samochodu i nazwy potwierdzenia
3. Obsługa błędów specyficznych dla operacji usuwania
4. Zwracanie odpowiedniego komunikatu o powodzeniu

### Krok 3: Implementacja endpointu

1. Dodanie metody `DELETE` w `src/pages/api/cars/[carId].ts`
2. Implementacja walidacji parametrów i body
3. Integracja z funkcją `deleteCar` z serwisu
4. Obsługa wszystkich scenariuszy błędów zgodnie z API specification

### Krok 4: Testy i walidacja

1. Testy jednostkowe dla funkcji `deleteCar`
2. Testy integracyjne dla endpointu DELETE
3. Testy scenariuszy błędów (nieprawidłowa nazwa, brak autoryzacji, itp.)
4. Testy wydajności dla samochodów z dużą liczbą tankowań

### Krok 5: Dokumentacja i deployment

1. Aktualizacja dokumentacji API
2. Dodanie przykładów użycia w plikach `.http`
3. Testy w środowisku deweloperskim
4. Deployment do środowiska produkcyjnego

### Krok 6: Monitoring i optymalizacja

1. Implementacja logowania operacji usuwania
2. Monitoring czasu wykonania operacji
3. Analiza wydajności i optymalizacja jeśli potrzeba
4. Dokumentacja lekcji wyciągniętych z implementacji
