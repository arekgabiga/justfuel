# API Endpoint Implementation Plan: Update Fillup Entry

## 1. Przegląd punktu końcowego

Endpoint `PATCH /api/cars/{carId}/fillups/{fillupId}` służy do aktualizacji istniejącego wpisu tankowania dla konkretnego samochodu. Po aktualizacji automatycznie przelicza zależne statystyki (distance_traveled, fuel_consumption, price_per_liter) dla wszystkich wpisów, które mogą być dotknięte zmianą. Endpoint zwraca zaktualizowany wpis wraz z metadanymi o liczbie zaktualizowanych wpisów i ewentualnymi ostrzeżeniami walidacyjnymi.

## 2. Szczegóły żądania

- **Metoda HTTP:** `PATCH`
- **Struktura URL:** `/api/cars/{carId}/fillups/{fillupId}`
- **Parametry:**
  - **Wymagane:**
    - `carId` (path) - UUID samochodu
    - `fillupId` (path) - UUID wpisu tankowania
  - **Opcjonalne:** Wszystkie pola w request body są opcjonalne
- **Request Body:**

```json
{
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100
}
```

## 3. Wykorzystywane typy

- **Request DTO:** `UpdateFillupCommand` - Partial update z opcjonalnymi polami
- **Response DTO:** `UpdatedFillupDTO` - Zaktualizowany wpis z metadanymi
- **Validation:** `ValidationWarningDTO[]` - Lista ostrzeżeń walidacyjnych
- **Database Types:** `Fillup` (z database.types.ts)

## 4. Szczegóły odpowiedzi

- **Success Response (200 OK):**

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T13:00:00Z",
  "fuel_amount": 46.0,
  "total_price": 230.0,
  "odometer": 55100,
  "distance_traveled": 600,
  "fuel_consumption": 7.67,
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z",
  "updated_entries_count": 3,
  "warnings": []
}
```

- **Error Responses:**
  - `400 Bad Request` - Błędy walidacji danych wejściowych
  - `401 Unauthorized` - Brak lub nieprawidłowy token uwierzytelnienia
  - `404 Not Found` - Fillup lub car nie istnieje lub nie należy do użytkownika
  - `500 Internal Server Error` - Błąd serwera lub bazy danych

## 5. Przepływ danych

1. **Walidacja uwierzytelnienia** - Sprawdzenie tokenu Bearer z `context.locals.supabase`
2. **Walidacja parametrów ścieżki** - Sprawdzenie czy carId i fillupId są prawidłowymi UUID
3. **Walidacja danych wejściowych** - Walidacja request body przy użyciu Zod schema
4. **Sprawdzenie własności zasobów** - Weryfikacja czy car i fillup należą do uwierzytelnionego użytkownika
5. **Aktualizacja wpisu** - Wywołanie metody `updateFillup` z fillups.service.ts
6. **Przeliczenie statystyk** - Automatyczne przeliczenie distance_traveled, fuel_consumption, price_per_liter dla dotkniętych wpisów
7. **Zwrócenie odpowiedzi** - Zwrócenie zaktualizowanego wpisu z metadanymi

## 6. Względy bezpieczeństwa

- **Uwierzytelnienie:** Wymagany prawidłowy token Bearer w nagłówku Authorization
- **Autoryzacja:** RLS policies w Supabase zapewniają dostęp tylko do własnych danych użytkownika
- **Walidacja własności:** Podwójne sprawdzenie czy car i fillup należą do uwierzytelnionego użytkownika
- **Walidacja danych:** Zod schemas zapewniają walidację typu i formatu danych wejściowych
- **Izolacja danych:** Każdy użytkownik ma dostęp tylko do swoich samochodów i wpisów tankowania

## 7. Obsługa błędów

- **400 Bad Request:**
  - Nieprawidłowy format UUID w parametrach ścieżki
  - Błędy walidacji Zod schema (nieprawidłowe typy danych, wartości poza zakresem)
  - Konflikt między odometer a distance (oba podane jednocześnie)
- **401 Unauthorized:**
  - Brak tokenu uwierzytelnienia
  - Nieprawidłowy lub wygasły token
  - Błąd weryfikacji tokenu przez Supabase

- **404 Not Found:**
  - Car o podanym carId nie istnieje
  - Fillup o podanym fillupId nie istnieje
  - Car lub fillup nie należy do uwierzytelnionego użytkownika

- **500 Internal Server Error:**
  - Błąd połączenia z bazą danych
  - Błąd podczas przeliczania statystyk
  - Nieoczekiwany błąd serwera

## 8. Rozważania dotyczące wydajności

- **Indeksy bazy danych:** Wykorzystanie istniejących indeksów na `fillups(car_id)` i `fillups(date)` dla szybkiego wyszukiwania
- **Batch updates:** Przeliczenie statystyk w jednej transakcji dla wszystkich dotkniętych wpisów
- **Minimalne zapytania:** Jedno zapytanie do pobrania fillup z walidacją własności
- **Efektywne przeliczanie:** Algorytm przeliczania statystyk tylko dla wpisów, które rzeczywiście wymagają aktualizacji
- **Connection pooling:** Wykorzystanie Supabase connection pooling dla optymalnej wydajności

## 9. Etapy wdrożenia

1. **Utworzenie pliku endpoint** - `src/pages/api/cars/[carId]/fillups/[fillupId].ts`
2. **Implementacja metody PATCH** - Obsługa żądań PATCH z walidacją parametrów ścieżki
3. **Walidacja uwierzytelnienia** - Sprawdzenie tokenu Bearer i pobranie użytkownika z context.locals.supabase
4. **Walidacja danych wejściowych** - Implementacja Zod schema dla UpdateFillupCommand
5. **Weryfikacja własności zasobów** - Sprawdzenie czy car i fillup należą do użytkownika
6. **Implementacja logiki aktualizacji** - Wywołanie metody updateFillup z fillups.service.ts
7. **Obsługa błędów** - Implementacja wszystkich scenariuszy błędów z odpowiednimi kodami statusu
8. **Testy jednostkowe** - Testy dla wszystkich scenariuszy (sukces, błędy walidacji, błędy autoryzacji)
9. **Testy integracyjne** - Testy end-to-end z rzeczywistą bazą danych
10. **Dokumentacja** - Aktualizacja dokumentacji API z przykładami użycia
