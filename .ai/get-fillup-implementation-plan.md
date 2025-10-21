# API Endpoint Implementation Plan: GET /api/cars/{carId}/fillups/{fillupId}

## 1. Przegląd punktu końcowego

Ten endpoint służy do pobierania szczegółowych informacji o konkretnym tankowaniu dla określonego samochodu. Jest to operacja tylko do odczytu, która wymaga uwierzytelnienia i zwraca wszystkie dostępne dane o tankowaniu, w tym obliczone pola jak zużycie paliwa czy cena za litr.

**Główne funkcjonalności:**

- Pobieranie pojedynczego tankowania po ID
- Weryfikacja przynależności tankowania do użytkownika
- Zwracanie wszystkich dostępnych danych o tankowaniu
- Obsługa błędów dla nieistniejących zasobów

## 2. Szczegóły żądania

- **Metoda HTTP:** `GET`
- **Struktura URL:** `/api/cars/{carId}/fillups/{fillupId}`
- **Parametry:**
  - **Wymagane:**
    - `carId` (path parameter) - UUID samochodu
    - `fillupId` (path parameter) - UUID tankowania
- **Opcjonalne:** Brak
- **Request Body:** Brak
- **Headers:**
  - `Authorization: Bearer <token>` - Token uwierzytelniający użytkownika
  - `Content-Type: application/json` (w odpowiedzi)

## 3. Wykorzystywane typy

**DTOs (Data Transfer Objects):**

- `FillupDTO` - podstawowa struktura danych tankowania zwracana przez API
- `ErrorResponseDTO` - standardowy format odpowiedzi błędów

**Entity Types:**

- `Fillup` - bazowy typ encji z bazy danych
- `Car` - bazowy typ encji samochodu (dla weryfikacji)

**Validation Schemas:**

- `carIdParamSchema` - walidacja parametru carId
- `fillupIdParamSchema` - walidacja parametru fillupId (do utworzenia)

## 4. Szczegóły odpowiedzi

**Success Response (200 OK):**

```json
{
  "id": "uuid",
  "car_id": "uuid",
  "date": "2025-10-17T12:00:00Z",
  "fuel_amount": 45.5,
  "total_price": 227.5,
  "odometer": 55000,
  "distance_traveled": 500,
  "fuel_consumption": 9.1,
  "price_per_liter": 5.0,
  "created_at": "2025-10-17T12:05:00Z"
}
```

**Error Responses:**

- `400 Bad Request` - Nieprawidłowy format parametrów
- `401 Unauthorized` - Brak lub nieprawidłowy token uwierzytelniający
- `404 Not Found` - Tankowanie lub samochód nie istnieje lub nie należy do użytkownika
- `500 Internal Server Error` - Błąd serwera

## 5. Przepływ danych

1. **Weryfikacja uwierzytelnienia:**
   - Sprawdzenie nagłówka `Authorization`
   - Walidacja tokenu Bearer
   - Pobranie ID użytkownika z tokenu

2. **Walidacja parametrów:**
   - Walidacja formatu UUID dla `carId` i `fillupId`
   - Sprawdzenie poprawności parametrów ścieżki

3. **Zapytanie do bazy danych:**
   - Pojedyncze zapytanie do tabeli `fillups`
   - Wykorzystanie RLS (Row Level Security) do automatycznej weryfikacji przynależności
   - Filtrowanie po `car_id` i `id`

4. **Przetwarzanie odpowiedzi:**
   - Mapowanie danych z bazy na `FillupDTO`
   - Obsługa przypadków braku danych

5. **Zwrócenie odpowiedzi:**
   - Sukces: 200 OK z danymi tankowania
   - Błąd: Odpowiedni kod statusu z opisem błędu

## 6. Względy bezpieczeństwa

**Uwierzytelnienie:**

- Wymagany token Bearer w nagłówku Authorization
- Walidacja tokenu przez Supabase Auth
- Fallback dla środowiska deweloperskiego (opcjonalny)

**Autoryzacja:**

- Row Level Security (RLS) w bazie danych zapewnia dostęp tylko do własnych danych
- Automatyczna weryfikacja przynależności tankowania do użytkownika
- Brak możliwości dostępu do danych innych użytkowników

**Walidacja danych:**

- Walidacja formatu UUID dla wszystkich parametrów
- Sprawdzenie istnienia zasobów przed zwróceniem danych
- Sanityzacja parametrów ścieżki

**Bezpieczeństwo bazy danych:**

- Wykorzystanie przygotowanych zapytań przez Supabase
- Brak bezpośredniego SQL injection
- Automatyczne escapowanie parametrów

## 7. Obsługa błędów

**400 Bad Request:**

- Nieprawidłowy format UUID dla `carId` lub `fillupId`
- Nieprawidłowa struktura parametrów ścieżki

**401 Unauthorized:**

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu Bearer
- Wygaśnięty lub nieprawidłowy token
- Brak danych użytkownika w tokenie

**404 Not Found:**

- Tankowanie nie istnieje w bazie danych
- Tankowanie istnieje ale nie należy do określonego samochodu
- Samochód nie istnieje lub nie należy do użytkownika
- Brak uprawnień dostępu do zasobu

**500 Internal Server Error:**

- Błąd połączenia z bazą danych
- Nieoczekiwany błąd podczas przetwarzania
- Błąd konfiguracji Supabase

**Logowanie błędów:**

- Logowanie wszystkich błędów z kontekstem request ID
- Szczegółowe logi dla błędów serwera
- Brak logowania wrażliwych danych użytkownika

## 8. Rozważania dotyczące wydajności

**Optymalizacje bazy danych:**

- Wykorzystanie istniejących indeksów:
  - `idx_fillups_on_car_id` - dla filtrowania po car_id
  - Indeks na `fillups.id` (klucz główny) - dla szybkiego wyszukiwania po ID
- Pojedyncze zapytanie SQL bez dodatkowych JOIN-ów
- Minimalna ilość danych przesyłanych z bazy

**Optymalizacje aplikacji:**

- Brak dodatkowego przetwarzania danych
- Bezpośrednie mapowanie z bazy na DTO
- Minimalna ilość operacji w pamięci
- Wykorzystanie RLS zamiast dodatkowych zapytań weryfikacyjnych

**Potencjalne wąskie gardła:**

- Zapytania do bazy danych (minimalizowane przez indeksy)
- Walidacja tokenu uwierzytelniającego (cache'owane przez Supabase)
- Serializacja JSON odpowiedzi (minimalna)

## 9. Etapy wdrożenia

### Krok 1: Utworzenie funkcji serwisu

- Dodanie funkcji `getFillupById` do `src/lib/services/fillups.service.ts`
- Implementacja logiki pobierania pojedynczego tankowania
- Obsługa błędów na poziomie serwisu
- Dodanie odpowiednich typów TypeScript

### Krok 2: Utworzenie schematu walidacji

- Dodanie `fillupIdParamSchema` do `src/lib/validation/fillups.ts`
- Walidacja formatu UUID dla parametru fillupId
- Integracja z istniejącymi schematami walidacji

### Krok 3: Implementacja endpointu API

- Utworzenie pliku `src/pages/api/cars/[carId]/fillups/[fillupId].ts`
- Implementacja funkcji `GET` zgodnie ze specyfikacją
- Wykorzystanie istniejących wzorców uwierzytelniania
- Obsługa wszystkich scenariuszy błędów

### Krok 4: Testy jednostkowe

- Testy funkcji serwisu `getFillupById`
- Testy walidacji parametrów
- Testy endpointu API z różnymi scenariuszami
- Testy obsługi błędów

### Krok 5: Testy integracyjne

- Testy end-to-end z rzeczywistą bazą danych
- Weryfikacja działania RLS
- Testy wydajności z różnymi rozmiarami danych
- Testy bezpieczeństwa

### Krok 6: Dokumentacja i wdrożenie

- Aktualizacja dokumentacji API
- Dodanie przykładów użycia
- Wdrożenie na środowisko testowe
- Weryfikacja działania w środowisku produkcyjnym

### Krok 7: Monitoring i optymalizacja

- Dodanie metryk wydajności
- Monitoring błędów i ich częstotliwości
- Optymalizacja na podstawie rzeczywistego użycia
- Regularne przeglądy bezpieczeństwa
