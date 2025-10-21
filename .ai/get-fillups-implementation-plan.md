# API Endpoint Implementation Plan: GET /api/cars/{carId}/fillups

## 1. Przegląd punktu końcowego

Punkt końcowy umożliwia pobranie stronicowanej historii tankowań dla wybranego samochodu.

## 2. Szczegóły żądania

- Metoda HTTP: GET
- Struktura URL: `/api/cars/{carId}/fillups`
- Nagłówek autoryzacji: `Authorization: Bearer <token>`
- Parametry:
  - Wymagane:
    - `carId` (ścieżka) – UUID samochodu
  - Opcjonalne (query):
    - `limit` – liczba wyników na stronę (liczba, min: 1, max: 100, domyślnie 20)
    - `cursor` – ciąg znaków do stronicowania
    - `sort` – pole sortowania (`date` | `odometer`, domyślnie `date`)
    - `order` – kolejność (`asc` | `desc`, domyślnie `desc`)
- Request Body: brak

## 3. Wykorzystywane typy

- Query params: `ListFillupsQueryParams` (@types)
- DTO:
  - `FillupDTO` (@types)
  - `PaginationDTO` (@types)
  - `PaginatedFillupsResponseDTO` (@types)

## 4. Szczegóły odpowiedzi

- 200 OK
  ```json
  {
    "fillups": [ FillupDTO... ],
    "pagination": { next_cursor, has_more, total_count }
  }
  ```
- Błędy:
  - 400 Bad Request – nieprawidłowe parametry query
  - 401 Unauthorized – brak lub nieprawidłowy token
  - 404 Not Found – samochód nie istnieje lub nie należy do użytkownika
  - 500 Internal Server Error – błąd serwera

## 5. Przepływ danych

1. Astro route `src/pages/api/cars/[carId]/fillups.ts`
2. Wyciągnięcie `supabase` z `context.locals` i `user` z JWT
3. Parsowanie i walidacja query params przy pomocy Zod (@backend.mdc)
4. Wywołanie serwisu `fillupsService.listFillupsByCar(supabase, user.id, carId, params)`
5. Serwis buduje zapytanie do `public.fillups`:
   - `.eq('car_id', carId)`
   - `.order(sort, { ascending })`
   - zastosowanie kursora (np. `.range()` lub `.gt('id', cursor)`) i limit +1 do wykrycia `has_more`
6. Mapowanie wyników do `FillupDTO` i obliczenie `has_more`, `next_cursor`, `total_count`
7. Zwrócenie `PaginatedFillupsResponseDTO`

## 6. Względy bezpieczeństwa

- Autoryzacja RLS Supabase: tabelę `fillups` zabezpieczoną polityką `user_id = auth.uid()` (@db-plan.md)
- Weryfikacja `carId`: dodatkowe `.eq('car_id', carId)` w zapytaniu–and kontrola RLS–zapobiega dostępowi do cudzych danych
- Parametry sort/order białą listą (@backend.mdc)
- Obsługa elastycznego błędu bez wycieku wrażliwych informacji

## 7. Obsługa błędów

- Walidacja Zod → rzuca `400` z `ErrorResponseDTO` (@types)
- Błąd autoryzacji Supabase → `401`
- Brak rekordu (może 0 wierszy) → `404`
- Błędy Supabase (inny) → `500` + logowanie

## 8. Wydajność

- Użycie limit+1 lub kursora zamiast offset → szybkie stronicowanie
- Indeks na (`car_id`, `date`) i/lub (`car_id`, `odometer`) w DB (@db-plan.md)
- Minimalne polecenie SELECT (wybór tylko kolumn z `FillupDTO`)

## 9. Kroki implementacji

1. Utworzyć plik trasy: `src/pages/api/cars/[carId]/fillups.ts`
2. Zdefiniować Zod schema dla `ListFillupsQueryParams`
3. Utworzyć serwis: `src/lib/services/fillups.service.ts` z metodą `listFillupsByCar`
4. Dodać białe listy sort/order w serwisie (@backend.mdc)
5. Zaimplementować logikę stronicowania (cursor + limit+1)
6. Mapowanie wyników do `PaginatedFillupsResponseDTO`
7. Dodać testy jednostkowe dla serwisu i integracyjne dla endpointa
8. Zweryfikować polityki RLS i indeksy w DB
9. Zaktualizować dokumentację API w `docs/` lub Confluence
10. Przejść code review i wdrożyć
