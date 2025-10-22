# API Endpoint Implementation Plan: DELETE /api/cars/{carId}/fillups/{fillupId}

## 1. Przegląd punktu końcowego

Endpoint służy do usuwania konkretnego wpisu fillup z historii tankowania samochodu. Po usunięciu fillup, system automatycznie przelicza statystyki (distance_traveled, fuel_consumption, price_per_liter) dla wszystkich kolejnych wpisów fillup dla tego samochodu, aby zachować spójność danych.

## 2. Szczegóły żądania

- **Metoda HTTP:** `DELETE`
- **Struktura URL:** `/api/cars/{carId}/fillups/{fillupId}`
- **Parametry:**
  - **Wymagane:**
    - `carId` (string) - UUID samochodu
    - `fillupId` (string) - UUID fillup do usunięcia
- **Request Body:** Brak
- **Headers:**
  - `Authorization: Bearer <token>` - Token autoryzacyjny użytkownika

## 3. Wykorzystywane typy

### Response DTOs:

- `DeleteResponseDTO` - Standardowa odpowiedź dla operacji usuwania
- `ErrorResponseDTO` - Standardowa odpowiedź błędów

### Typy z bazy danych:

- `Fillup` - Encja fillup z tabeli fillups
- `Car` - Encja samochodu z tabeli cars

## 4. Szczegóły odpowiedzi

### Sukces (200 OK):

```json
{
  "message": "Fillup deleted successfully",
  "updated_entries_count": 2
}
```

### Błędy:

- **401 Unauthorized:**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired authentication token"
  }
}
```

- **404 Not Found:**

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Fillup or car not found, or doesn't belong to user"
  }
}
```

- **500 Internal Server Error:**

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred while deleting fillup"
  }
}
```

## 5. Przepływ danych

1. **Walidacja autoryzacji** - Middleware sprawdza token Bearer
2. **Walidacja parametrów** - Sprawdzenie formatu UUID dla carId i fillupId
3. **Sprawdzenie ownership** - Weryfikacja czy car należy do użytkownika
4. **Sprawdzenie istnienia fillup** - Weryfikacja czy fillup istnieje i należy do car
5. **Usunięcie fillup** - Usunięcie wpisu z bazy danych
6. **Przeliczenie statystyk** - Aktualizacja distance_traveled, fuel_consumption, price_per_liter dla kolejnych wpisów
7. **Zwrócenie odpowiedzi** - Informacja o sukcesie i liczbie zaktualizowanych wpisów

## 6. Względy bezpieczeństwa

### Autoryzacja:

- Wymagany token Bearer w headerze Authorization
- Middleware weryfikuje token przed dostępem do endpointu

### Autoryzacja danych:

- Row Level Security (RLS) w Supabase zapewnia izolację danych użytkowników
- Sprawdzenie ownership car przed operacją na fillup
- Sprawdzenie czy fillup należy do car użytkownika

### Walidacja danych:

- Walidacja formatu UUID dla carId i fillupId
- Sprawdzenie istnienia zasobów przed operacją

## 7. Obsługa błędów

### 401 Unauthorized:

- Brak tokenu autoryzacyjnego
- Nieprawidłowy format tokenu
- Wygasły token
- Nieprawidłowy token

### 404 Not Found:

- Car o podanym carId nie istnieje
- Fillup o podanym fillupId nie istnieje
- Car nie należy do zalogowanego użytkownika
- Fillup nie należy do car użytkownika

### 500 Internal Server Error:

- Błąd połączenia z bazą danych
- Błąd podczas usuwania fillup
- Błąd podczas przeliczania statystyk
- Nieoczekiwany błąd systemu

## 8. Rozważania dotyczące wydajności

### Optymalizacje:

- Wykorzystanie indeksów na kolumnach car_id i date w tabeli fillups
- Batch update dla przeliczania statystyk kolejnych wpisów
- Minimalizacja liczby zapytań do bazy danych

### Potencjalne wąskie gardła:

- Przeliczanie statystyk dla dużej liczby kolejnych wpisów
- Brak indeksów może spowolnić operacje na dużej tabeli fillups

### Strategie optymalizacji:

- Użycie transakcji dla zapewnienia spójności danych
- Optymalizacja zapytań SQL dla przeliczania statystyk
- Rozważenie asynchronicznego przeliczania dla bardzo dużych zbiorów danych

## 9. Etapy wdrożenia

### Krok 1: Rozszerzenie service layer

- Dodanie metody `deleteFillup(carId: string, fillupId: string, userId: string)` w `fillups.service.ts`
- Implementacja logiki usuwania fillup z walidacją ownership
- Implementacja przeliczania statystyk dla kolejnych wpisów

### Krok 2: Implementacja endpointu

- Utworzenie pliku `src/pages/api/cars/[carId]/fillups/[fillupId].ts`
- Implementacja metody DELETE
- Integracja z service layer

### Krok 3: Walidacja i error handling

- Implementacja walidacji parametrów URL
- Dodanie obsługi błędów zgodnie ze specyfikacją
- Testowanie wszystkich scenariuszy błędów

### Krok 4: Testy i dokumentacja

- Utworzenie testów jednostkowych dla service layer
- Utworzenie testów integracyjnych dla endpointu
- Aktualizacja dokumentacji API

### Krok 5: Optymalizacja i monitoring

- Analiza wydajności operacji usuwania
- Implementacja logowania dla monitoringu
- Optymalizacja zapytań SQL jeśli potrzeba

### Krok 6: Code review i deployment

- Przegląd kodu pod kątem bezpieczeństwa i wydajności
- Testy na środowisku staging
- Deployment na środowisko produkcyjne
