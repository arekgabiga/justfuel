# API Endpoint Implementation Plan: GET /api/cars/{carId}/charts

## 1. Przegląd punktu końcowego

Endpoint `/api/cars/{carId}/charts` służy do pobierania danych szeregów czasowych dla wizualizacji wykresów. Umożliwia klientom uzyskanie danych historycznych dotyczących zużycia paliwa, ceny za litr oraz przejechanych dystansów dla konkretnego samochodu. Dane są zwracane w formacie zoptymalizowanym do renderowania wykresów z dodatkowymi metadanymi statystycznymi.

## 2. Szczegóły żądania

- **Metoda HTTP**: `GET`
- **Struktura URL**: `/api/cars/{carId}/charts`
- **Parametry ścieżki**:
  - `carId` (wymagane): UUID samochodu
- **Parametry zapytania**:
  - `type` (wymagane): Typ wykresu - `consumption`, `price_per_liter`, `distance`
  - `start_date` (opcjonalne): Filtr danych od tej daty (format ISO 8601)
  - `end_date` (opcjonalne): Filtr danych do tej daty (format ISO 8601)
  - `limit` (opcjonalne): Maksymalna liczba punktów danych (domyślnie: 50)
- **Request Body**: Brak

## 3. Wykorzystywane typy

### Typy DTO (już zdefiniowane w `src/types.ts`):

- `ChartType`: Enum z wartościami `"consumption" | "price_per_liter" | "distance"`
- `ChartDataPointDTO`: Pojedynczy punkt danych z datą, wartością i odometrem
- `ChartMetadataDTO`: Metadane z liczbą, minimum i maksimum
- `ChartDataDTO`: Kompletna odpowiedź z typem, danymi, średnią i metadanymi
- `ChartQueryParams`: Parametry zapytania dla walidacji

### Typy Command Modele:

- Brak dodatkowych Command Modeli wymaganych (endpoint tylko odczytuje dane)

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "type": "consumption|price_per_liter|distance",
  "data": [
    {
      "date": "2025-10-17T12:00:00Z",
      "value": 9.1,
      "odometer": 55000
    }
  ],
  "average": 8.5,
  "metadata": {
    "count": 25,
    "min": 7.2,
    "max": 10.5
  }
}
```

### Kody błędów:

- `400 Bad Request`: Nieprawidłowy typ wykresu lub format daty
- `401 Unauthorized`: Brak lub nieprawidłowy token uwierzytelniania
- `404 Not Found`: Samochód nie znaleziony lub nie należy do użytkownika
- `500 Internal Server Error`: Błąd bazy danych lub serwera

## 5. Przepływ danych

1. **Walidacja uwierzytelniania**: Sprawdzenie tokenu Bearer w middleware
2. **Walidacja parametrów**: Sprawdzenie `type`, `start_date`, `end_date`, `limit`
3. **Weryfikacja własności samochodu**: Sprawdzenie czy samochód należy do użytkownika (RLS)
4. **Pobranie danych**: Zapytanie do tabeli `fillups` z odpowiednimi filtrami
5. **Agregacja danych**: Obliczenie średniej, minimum, maksimum
6. **Formatowanie odpowiedzi**: Mapowanie na `ChartDataDTO`
7. **Zwrócenie odpowiedzi**: JSON z danymi wykresu

## 6. Względy bezpieczeństwa

### Uwierzytelnianie i autoryzacja:

- **Bearer Token**: Wymagany token JWT w nagłówku `Authorization`
- **RLS Policies**: Automatyczna weryfikacja własności samochodu przez Supabase RLS
- **Walidacja UUID**: Sprawdzenie formatu `carId` przed zapytaniem do bazy

### Walidacja danych wejściowych:

- **ChartType**: Enum validation - tylko dozwolone wartości
- **Date Format**: Walidacja ISO 8601 dla `start_date` i `end_date`
- **Limit**: Walidacja zakresu (1-1000) dla `limit`
- **SQL Injection**: Użycie parametrów zapytania zamiast interpolacji stringów

### Ochrona przed atakami:

- **Rate Limiting**: Ograniczenie częstotliwości zapytań (rozważ implementację)
- **Input Sanitization**: Walidacja wszystkich parametrów wejściowych
- **Error Handling**: Nie ujawnianie szczegółów błędów bazy danych

## 7. Obsługa błędów

### Scenariusze błędów i odpowiedzi:

1. **Nieprawidłowy typ wykresu**:
   - Kod: `400 Bad Request`
   - Odpowiedź: `{"error": {"code": "INVALID_CHART_TYPE", "message": "Invalid chart type. Must be one of: consumption, price_per_liter, distance"}}`

2. **Nieprawidłowy format daty**:
   - Kod: `400 Bad Request`
   - Odpowiedź: `{"error": {"code": "INVALID_DATE_FORMAT", "message": "Invalid date format. Use ISO 8601 format"}}`

3. **Nieprawidłowy limit**:
   - Kod: `400 Bad Request`
   - Odpowiedź: `{"error": {"code": "INVALID_LIMIT", "message": "Limit must be between 1 and 1000"}}`

4. **Brak tokenu uwierzytelniania**:
   - Kod: `401 Unauthorized`
   - Odpowiedź: `{"error": {"code": "UNAUTHORIZED", "message": "Authentication required"}}`

5. **Nieprawidłowy token**:
   - Kod: `401 Unauthorized`
   - Odpowiedź: `{"error": {"code": "INVALID_TOKEN", "message": "Invalid or expired token"}}`

6. **Samochód nie znaleziony**:
   - Kod: `404 Not Found`
   - Odpowiedź: `{"error": {"code": "CAR_NOT_FOUND", "message": "Car not found or does not belong to user"}}`

7. **Błąd bazy danych**:
   - Kod: `500 Internal Server Error`
   - Odpowiedź: `{"error": {"code": "DATABASE_ERROR", "message": "Internal server error"}}`

## 8. Rozważania dotyczące wydajności

### Optymalizacje bazy danych:

- **Istniejące indeksy**: Wykorzystanie `idx_fillups_on_car_id` i `idx_fillups_on_date`
- **Filtrowanie**: Efektywne zapytania z filtrami `car_id`, `date` range
- **Limit**: Ograniczenie liczby zwracanych rekordów do maksymalnie 1000
- **Agregacja**: Obliczenie statystyk w jednym zapytaniu SQL

### Optymalizacje aplikacji:

- **Caching**: Rozważ cache dla często żądanych danych wykresów
- **Pagination**: Implementacja paginacji dla dużych zbiorów danych
- **Compression**: Kompresja odpowiedzi JSON dla dużych zbiorów danych

### Potencjalne wąskie gardła:

- **Duże zbiory danych**: Samochody z wieloma tankowaniami
- **Złożone zapytania**: Agregacja danych z wielu rekordów
- **Concurrent requests**: Wiele równoczesnych zapytań do tego samego samochodu

## 9. Etapy wdrożenia

### Etap 1: Przygotowanie struktury

1. **Utworzenie pliku endpointu**: `src/pages/api/cars/[carId]/charts.ts`
2. **Import wymaganych typów**: Z `src/types.ts`
3. **Import serwisów**: `cars.service.ts` i `fillups.service.ts`
4. **Import klienta Supabase**: `src/db/supabase.client.ts`

### Etap 2: Implementacja walidacji

1. **Walidacja parametrów ścieżki**: Sprawdzenie formatu `carId` (UUID)
2. **Walidacja parametrów zapytania**: `type`, `start_date`, `end_date`, `limit`
3. **Walidacja uwierzytelniania**: Sprawdzenie tokenu Bearer
4. **Walidacja własności**: Weryfikacja czy samochód należy do użytkownika

### Etap 3: Implementacja logiki biznesowej

1. **Utworzenie funkcji serwisu**: `getChartData` w `fillups.service.ts`
2. **Implementacja zapytań SQL**: Filtrowanie i agregacja danych
3. **Obliczenie statystyk**: Średnia, minimum, maksimum, liczba
4. **Mapowanie danych**: Konwersja na `ChartDataDTO`

### Etap 4: Implementacja endpointu

1. **Handler funkcji**: `export async function GET()`
2. **Parsowanie parametrów**: URL i query parameters
3. **Wywołanie serwisu**: `getChartData` z odpowiednimi parametrami
4. **Obsługa błędów**: Try-catch z odpowiednimi kodami statusu
5. **Zwrócenie odpowiedzi**: JSON z danymi wykresu

### Etap 5: Testowanie i optymalizacja

1. **Testy jednostkowe**: Walidacja logiki serwisu
2. **Testy integracyjne**: Pełny przepływ endpointu
3. **Testy wydajności**: Sprawdzenie z dużymi zbiorami danych
4. **Optymalizacja zapytań**: Analiza i poprawa wydajności SQL

### Etap 6: Dokumentacja i wdrożenie

1. **Aktualizacja dokumentacji API**: Dodanie endpointu do dokumentacji
2. **Testy końcowe**: Weryfikacja wszystkich scenariuszy
3. **Code review**: Przegląd kodu przez zespół
4. **Wdrożenie**: Deploy do środowiska produkcyjnego

## 10. Szczegóły implementacji

### Struktura pliku endpointu:

```typescript
// src/pages/api/cars/[carId]/charts.ts
import type { APIRoute } from 'astro';
import { getChartData } from '../../../lib/services/charts.service';
import { createSupabaseClient } from '../../../db/supabase.client';

export const GET: APIRoute = async ({ params, url, request }) => {
  // Implementacja endpointu
};
```

### Funkcja serwisu:

```typescript
// src/lib/services/charts.service.ts
export async function getChartData(
  supabase: AppSupabaseClient,
  userId: string,
  carId: string,
  params: ChartQueryParams
): Promise<ChartDataDTO | null> {
  // Implementacja logiki pobierania danych wykresu
}
```

### Walidacja parametrów:

- `type`: Sprawdzenie przeciwko enum `ChartType`
- `start_date`/`end_date`: Walidacja ISO 8601, sprawdzenie zakresu
- `limit`: Walidacja zakresu 1-1000, domyślnie 50
- `carId`: Walidacja formatu UUID

### Zapytania SQL:

- Wykorzystanie istniejących indeksów na `fillups(car_id, date)`
- Filtrowanie według `car_id`, zakresu dat
- Agregacja dla statystyk (AVG, MIN, MAX, COUNT)
- Sortowanie według daty (DESC dla najnowszych danych)

Ten plan zapewnia kompleksowe wdrożenie endpointu z uwzględnieniem wszystkich aspektów bezpieczeństwa, wydajności i obsługi błędów zgodnie z najlepszymi praktykami i istniejącą architekturą projektu.
