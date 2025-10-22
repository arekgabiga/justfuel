# API Endpoint Implementation Plan: POST /api/cars/{carId}/fillups

## 1. Przegląd punktu końcowego

Ten endpoint tworzy nowy wpis tankowania dla określonego samochodu. Obsługuje dwa warianty wprowadzania danych:

- **Wariant 1**: Podanie odometru - system automatycznie obliczy przebyty dystans
- **Wariant 2**: Podanie przebytego dystansu - system automatycznie obliczy odometr

Endpoint wymaga uwierzytelnienia Bearer token i zwraca utworzony wpis wraz z obliczonymi polami oraz opcjonalnymi ostrzeżeniami walidacji.

## 2. Szczegóły żądania

- **Metoda HTTP**: `POST`
- **Struktura URL**: `/api/cars/{carId}/fillups`
- **Parametry**:
  - **Wymagane**:
    - `carId` (path parameter) - UUID samochodu
    - `date` - Data tankowania w formacie ISO 8601
    - `fuel_amount` - Ilość paliwa (liczba dodatnia)
    - `total_price` - Całkowita cena (liczba dodatnia)
    - `odometer` LUB `distance` (wzajemnie wykluczające się)
- **Opcjonalne**: Brak
- **Request Body**: JSON z danymi tankowania (wariant odometr lub dystans)

## 3. Wykorzystywane typy

### Typy z `src/types.ts`:

- `CreateFillupCommand` - Komenda tworzenia tankowania (wariant odometr lub dystans)
- `FillupWithWarningsDTO` - Odpowiedź z ostrzeżeniami walidacji
- `ValidationWarningDTO` - Struktura ostrzeżenia
- `ErrorResponseDTO` - Standardowy format błędu
- `FillupDTO` - Podstawowy DTO tankowania

### Nowe typy do utworzenia:

- `CreateFillupRequestSchema` - Schema Zod dla walidacji request body
- `CreateFillupValidationResult` - Wynik walidacji biznesowej

## 4. Szczegóły odpowiedzi

### Sukces (201 Created):

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
  "warnings": [
    {
      "field": "odometer",
      "message": "Odometer reading is lower than the previous fillup"
    }
  ]
}
```

### Błędy:

- **400 Bad Request**: Błędy walidacji (ujemne wartości, brakujące pola, podanie obu: odometr i dystans)
- **401 Unauthorized**: Nieprawidłowy lub wygasły token
- **404 Not Found**: Samochód nie istnieje lub nie należy do użytkownika
- **500 Internal Server Error**: Błędy serwera

## 5. Przepływ danych

1. **Walidacja uwierzytelnienia**: Sprawdzenie Bearer token lub fallback dev
2. **Walidacja parametrów ścieżki**: Sprawdzenie formatu UUID carId
3. **Walidacja request body**: Schema Zod dla danych tankowania
4. **Weryfikacja własności samochodu**: Sprawdzenie czy samochód należy do użytkownika
5. **Walidacja biznesowa**: Sprawdzenie spójności odometru, obliczenie dystansu
6. **Obliczenia**: fuel_consumption, price_per_liter, distance_traveled
7. **Wstawienie do bazy**: Utworzenie rekordu w tabeli fillups
8. **Zwrócenie wyniku**: FillupWithWarningsDTO z ostrzeżeniami

## 6. Względy bezpieczeństwa

### Uwierzytelnienie:

- Wymagany Bearer token w nagłówku Authorization
- Fallback dla środowiska deweloperskiego (DEV_AUTH_FALLBACK)

### Autoryzacja:

- Row Level Security (RLS) w Supabase automatycznie weryfikuje własność samochodu
- Użytkownik może tworzyć tankowania tylko dla swoich samochodów

### Walidacja danych:

- Schema Zod zapobiega SQL injection
- Walidacja formatów UUID
- Sprawdzanie wartości dodatnich dla paliwa i ceny
- Wzajemne wykluczenie odometr/dystans

### Sanityzacja:

- Supabase client automatycznie sanityzuje zapytania SQL
- Walidacja typów TypeScript na poziomie kompilacji

## 7. Obsługa błędów

### Błędy walidacji (400):

- Nieprawidłowy format carId (nie UUID)
- Brakujące wymagane pola
- Ujemne wartości fuel_amount lub total_price
- Podanie zarówno odometr jak i dystans
- Nieprawidłowy format daty

### Błędy autoryzacji (401):

- Brak nagłówka Authorization
- Nieprawidłowy format tokenu
- Wygasły lub nieprawidłowy token

### Błędy zasobów (404):

- Samochód nie istnieje
- Samochód nie należy do użytkownika

### Błędy serwera (500):

- Błąd połączenia z bazą danych
- Nieoczekiwane błędy walidacji biznesowej
- Błędy obliczeniowe

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:

- Indeks `idx_fillups_on_car_id` dla szybkiego wyszukiwania po car_id
- Indeks `idx_fillups_on_date` dla sortowania po dacie
- RLS policies są zoptymalizowane przez Supabase

### Optymalizacje aplikacji:

- Pojedyncze zapytanie do bazy dla weryfikacji samochodu i tworzenia tankowania
- Walidacja Zod jest szybka i lokalna
- Obliczenia odbywają się w pamięci przed zapisem

### Potencjalne wąskie gardła:

- Obliczenia dla samochodów z dużą liczbą tankowań (sprawdzanie poprzedniego odometru)
- Współbieżne tworzenie tankowań dla tego samego samochodu

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie walidacji

1. Utworzenie `createFillupRequestSchema` w `src/lib/validation/fillups.ts`
2. Dodanie walidacji dla wzajemnie wykluczających się pól odometr/dystans
3. Walidacja formatów daty i wartości liczbowych

### Krok 2: Rozszerzenie serwisu

1. Dodanie funkcji `createFillup` w `src/lib/services/fillups.service.ts`
2. Implementacja logiki obliczania dystansu/odometru
3. Implementacja walidacji biznesowej (spójność odometru)
4. Implementacja obliczeń fuel_consumption i price_per_liter

### Krok 3: Utworzenie endpointu

1. Utworzenie pliku `src/pages/api/cars/[carId]/fillups.ts`
2. Implementacja handlera POST z pełną walidacją
3. Obsługa wszystkich scenariuszy błędów
4. Zwracanie odpowiedniego FillupWithWarningsDTO

### Krok 4: Testy i walidacja

1. Testy jednostkowe dla funkcji serwisu
2. Testy integracyjne dla endpointu
3. Testy walidacji różnych scenariuszy błędów
4. Testy wydajności dla dużych zbiorów danych

### Krok 5: Dokumentacja i optymalizacja

1. Aktualizacja dokumentacji API
2. Optymalizacja zapytań do bazy danych
3. Dodanie logowania dla monitorowania
4. Przegląd bezpieczeństwa i testy penetracyjne

### Krok 6: Wdrożenie produkcyjne

1. Testy w środowisku staging
2. Migracja bazy danych (jeśli potrzebna)
3. Wdrożenie na produkcję
4. Monitorowanie błędów i wydajności
