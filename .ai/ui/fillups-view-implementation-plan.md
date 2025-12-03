# Plan implementacji widoku Historia Tankowań

## 1. Przegląd

Widok historii tankowań (`/cars/{carId}/fillups`) to dedykowana strona umożliwiająca użytkownikowi przeglądanie pełnej historii tankowań dla wybranego samochodu. Widok oferuje funkcjonalność infinite scroll, dynamiczne kolorowanie wartości spalania w zależności od odchylenia od średniej, oraz intuicyjną nawigację do szczegółów poszczególnych tankowań.

**Główny cel:** Umożliwienie użytkownikowi przeglądania historii tankowań w przejrzystej formie siatki kafelków z automatycznym ładowaniem kolejnych wpisów podczas przewijania.

**Kluczowe funkcje:**

- Wyświetlanie historii tankowań w formie siatki kafelków
- Automatic loading kolejnych tankowań (infinite scroll)
- Dynamiczne kolorowanie wartości spalania względem średniej
- Możliwość kliknięcia w kafelek i przejście do edycji tankowania
- Wyświetlanie puste stanu gdy brak tankowań
- Obsługa błędów z możliwością retry
- Loading states podczas pobierania danych

## 2. Routing widoku

Widok powinien być dostępny pod ścieżką:

- **Ścieżka:** `/cars/[carId]/fillups.astro`
- **Plik:** `src/pages/cars/[carId]/fillups.astro`

Struktura routingu:

```
/cars/[carId]          -> widok szczegółów samochodu (zakładki: tankowania, wykresy)
/cars/[carId]/fillups  -> dedykowany widok historii tankowań (NOWY)
```

Przykład użycia:

- Użytkownik przechodzi pod adres: `https://app.com/cars/abc123/fillups`
- Aplikacja wyświetla historię tankowań dla samochodu o ID `abc123`

## 3. Struktura komponentów

```
FillupsView (główny komponent React)
│
├── Breadcrumbs (nawigacja)
│   └── Home > Cars > [Car Name] > Fillups
│
├── CarHeader (mini wersja - tylko nazwa)
│   └── Wyświetla nazwę samochodu i przycisk powrotu
│
├── FillupsListView (lista z infinite scroll)
│   ├── LoadingState (initial loading)
│   ├── EmptyState (brak tankowań)
│   ├── ErrorState (błąd pobierania)
│   └── Mapa tankowań:
│       ├── FillupCard (każdy kafelek)
│       └── InfiniteScrollTrigger (obserwator do ładowania)
│
└── AddFillupButton (zawsze widoczny)
    └── Przekierowuje do /cars/[carId]/fillups/new
```

### Diagram hierarchii komponentów:

```
<FillupsView>
  ├── <Breadcrumbs />
  ├── <CarHeader /> [tylko nazwa + przycisk powrotu]
  ├── <AddFillupButton /> [nowy komponent]
  └── <FillupsListView>
      ├── loading: <LoadingState />
      ├── error: <ErrorState />
      ├── empty: <EmptyState />
      └── fillups: <>
          map(fillup => <FillupCard />)
          <InfiniteScrollTrigger />
      </>
```

## 4. Szczegóły komponentów

### 4.1. FillupsView (główny komponent widoku)

**Opis komponentu:** Główny kontener widoku historii tankowań. Zarządza stanem, komunikuje się z API, i orkiestruje wszystkie komponenty podrzędne.

**Główne elementy:**

- Layout z kontenerem (max-width: 1200px, centered)
- Sekcja breadcrumbs na górze
- Sekcja header z nazwą samochodu
- Sekcja akcji z przyciskiem "Dodaj tankowanie"
- Sekcja listy tankowań
- Obsługa stanów loading/error/empty

**Obsługiwane zdarzenia:**

- `onFillupClick(fillupId)` - kliknięcie w kafelek tankowania
- `onAddFillupClick()` - kliknięcie przycisku "Dodaj tankowanie"
- `onRetry()` - retry po błędzie
- `onBack()` - powrót do listy samochodów

**Obsługiwana walidacja:**

- Weryfikacja, że `carId` jest poprawnym UUID
- Weryfikacja, że token autoryzacji jest obecny (opcjonalnie)
- Obsługa błędów API (401, 404, 500)

**Typy:**

- Props: `FillupsViewProps = { carId: string }`
- State: zarządzany przez `useFillupsView` hook
- API: `GET /api/cars/{carId}/fillups`

**Props:**

```typescript
interface FillupsViewProps {
  carId: string; // UUID samochodu
}
```

### 4.2. Breadcrumbs (komponent nawigacji)

**Opis komponentu:** Komponent nawigacji pokazujący hierarchię strony. Na tej stronie pokazuje: Home > Cars > [Car Name] > Fillups.

**Główne elementy:**

- Link do strony głównej
- Link do listy samochodów
- Link do szczegółów samochodu (opcjonalny)
- Aktualna pozycja (Fillups)

**Obsługiwane zdarzenia:**

- Kliknięcie w linki nawigacyjne

**Props:**

```typescript
interface BreadcrumbsProps {
  carName: string; // Nazwa samochodu dla breadcrumbs
}
```

### 4.3. CarHeader (mini header)

**Opis komponentu:** Uproszczony nagłówek pokazujący nazwę samochodu i przycisk powrotu. Wersja minimalistyczna dla dedykowanego widoku tankowań.

**Główne elementy:**

- Nazwa samochodu (heading)
- Przycisk "Powrót" do listy samochodów lub szczegółów
- Opcjonalnie ikona samochodu

**Obsługiwane zdarzenia:**

- `onBack()` - przycisk powrotu

**Props:**

```typescript
interface CarHeaderProps {
  carName: string;
  onBack: () => void;
}
```

### 4.4. AddFillupButton (przycisk dodawania)

**Opis komponentu:** Wyraźny przycisk CTA do dodawania nowego tankowania. Zawsze widoczny, zachęcający do akcji.

**Główne elementy:**

- Duży przycisk primary z ikoną "+"
- Tekst: "Dodaj tankowanie"
- Styling: prominent, zawsze widoczny na górze listy

**Obsługiwane zdarzenia:**

- `onClick()` - przekierowanie do formularza dodawania

**Props:**

```typescript
interface AddFillupButtonProps {
  carId: string;
  onClick: () => void;
}
```

### 4.5. FillupsListView (lista tankowań)

**Opis komponentu:** Lista tankowań z infinite scroll. Komponent zarządza wyświetlaniem kafelków, stanami loading, i wywołuje callback gdy użytkownik scrolluje.

**Główne elementy:**

- Kontener z kafelkami
- Intersection Observer dla infinite scroll
- Loading state dla kolejnych tankowań
- Empty state gdy brak danych
- Error state z retry
- Wskaźnik "Wyświetlono wszystkie tankowania"

**Obsługiwane zdarzenia:**

- `onLoadMore()` - ładowanie kolejnych tankowań
- `onFillupClick(fillupId)` - kliknięcie w kafelek
- `onRetry()` - retry po błędzie

**Obsługiwana walidacja:**

- Sprawdza czy `pagination.has_more` przed wywołaniem `onLoadMore`
- Waliduje czy `loading` jest false przed kolejną fetchem

**Typy:**

- Props: `FillupsListViewProps` (patrz poniżej)
- State: lokalne stany loading dla infinite scroll trigger

**Props:**

```typescript
interface FillupsListViewProps {
  fillups: FillupDTO[];
  pagination: PaginationDTO;
  averageConsumption: number;
  loading: boolean;
  error: Error | null;
  onLoadMore: () => void;
  onFillupClick: (fillupId: string) => void;
  onRetry: () => void;
}
```

### 4.6. FillupCard (kafelek tankowania)

**Opis komponentu:** Pojedynczy kafelek pokazujący dane tankowania. Klikalny, przenosi do edycji.

**Główne elementy:**

- Grid z danymi (2 kolumny na mobile, 4 na desktop)
- Data tankowania (sformatowana)
- Spalanie (kolorowane względem średniej)
- Dystans
- Cena za litr
- Licznik (odometer)
- Hover effect
- Cursor pointer

**Obsługiwane zdarzenia:**

- `onClick()` - kliknięcie w cały kafelek
- `onKeyDown()` - obsługa Enter/Space dla accessibility

**Obsługiwana walidacja:**

- Wyświetla "N/A" dla wartości null/undefined
- Waliduje czy `averageConsumption` > 0 przed kolorowaniem
- Koloruje spalanie według odchylenia od średniej:
  - Odchylenie <= -10%: zielony, semibold
  - Odchylenie <= -5%: zielony, normal
  - Odchylenie <= 5%: szary
  - Odchylenie <= 10%: żółty/pomarańczowy
  - Odchylenie > 10%: czerwony, semibold

**Typy:**

- Props: `FillupCardProps = { fillup: FillupDTO, averageConsumption: number, onClick: () => void }`

**Props:**

```typescript
interface FillupCardProps {
  fillup: FillupDTO;
  averageConsumption: number;
  onClick: () => void;
}
```

### 4.7. LoadingState (skeleton loader)

**Opis komponentu:** Skeleton loader pokazujący animację ładowania podczas pobierania pierwszych danych.

**Główne elementy:**

- Grid skeleton cards (3-4 karty)
- Animacja pulse
- Text loading message

**Props:**

```typescript
// Brak props - standalone component
```

### 4.8. EmptyState (pusty stan)

**Opis komponentu:** Komunikat gdy samochód nie ma żadnych tankowań.

**Główne elementy:**

- Wielka ikona ⛽
- Tytuł: "Brak tankowań"
- Opis: "Dodaj pierwsze tankowanie dla tego samochodu."
- Opcjonalnie przycisk "Dodaj tankowanie"

**Props:**

```typescript
interface EmptyStateProps {
  onAddFillup?: () => void;
}
```

### 4.9. ErrorState (stan błędu)

**Opis komponentu:** Komunikat błędu z możliwością retry.

**Główne elementy:**

- Ikona błędu
- Komunikat błędu
- Przycisk "Spróbuj ponownie"

**Obsługiwane zdarzenia:**

- `onRetry()` - retry operacji

**Props:**

```typescript
interface ErrorStateProps {
  error: Error;
  onRetry: () => void;
}
```

## 5. Typy

Wszystkie wymagane typy są już zdefiniowane w `src/types.ts`. Oto lista typów używanych w widoku:

### 5.1. FillupDTO

Podstawowy DTO dla tankowania zwracany przez API.

```typescript
type FillupDTO = {
  id: string;
  car_id: string;
  date: string; // ISO 8601
  fuel_amount: number;
  total_price: number;
  odometer: number;
  distance_traveled: number;
  fuel_consumption: number | null;
  price_per_liter: number | null;
};
```

**Pola:**

- `id`: UUID tankowania
- `car_id`: UUID samochodu
- `date`: Data tankowania (ISO 8601)
- `fuel_amount`: Ilość paliwa (litry)
- `total_price`: Łączna cena (zł)
- `odometer`: Stan licznika (km)
- `distance_traveled`: Przejechany dystans (km)
- `fuel_consumption`: Spalanie (L/100km) - null dla pierwszego tankowania
- `price_per_liter`: Cena za litr (zł) - null jeśli brak danych

### 5.2. PaginationDTO

Metadata paginacji.

```typescript
type PaginationDTO = {
  next_cursor: string | null;
  has_more: boolean;
  total_count: number;
};
```

**Pola:**

- `next_cursor`: Base64-encoded cursor do kolejnej strony (lub null)
- `has_more`: Czy są kolejne strony
- `total_count`: Całkowita liczba tankowań

### 5.3. PaginatedFillupsResponseDTO

Odpowiedź API.

```typescript
type PaginatedFillupsResponseDTO = {
  fillups: FillupDTO[];
  pagination: PaginationDTO;
};
```

### 5.4. CarDetailsDTO

DTO samochodu z podstawowymi danymi.

```typescript
type CarDetailsDTO = CarWithStatisticsDTO & {
  created_at: string;
};

type CarWithStatisticsDTO = CarDTO & {
  statistics: {
    total_fuel_cost: number;
    total_fuel_amount: number;
    total_distance: number;
    average_consumption: number;
    average_price_per_liter: number;
    fillup_count: number;
  };
};
```

**Używany do:**

- Wyświetlenia nazwy samochodu w headerze
- Obliczenia średniego spalania do kolorowania
- Breadcrumbs

### 5.5. ErrorResponseDTO

Standardowy format błędu API.

```typescript
type ErrorResponseDTO = {
  error: {
    code: string;
    message: string;
    details?: Record<string, string>;
  };
};
```

### 5.6. ListFillupsQueryParams

Query params dla API.

```typescript
type ListFillupsQueryParams = {
  limit?: number; // default: 20, max: 100
  cursor?: string; // Base64 cursor
  sort?: 'date' | 'odometer'; // default: "date"
  order?: 'asc' | 'desc'; // default: "desc"
};
```

## 6. Zarządzanie stanem

Widok wykorzysta custom hook `useFillupsView` do centralizacji logiki stanu i komunikacji z API.

### 6.1. Hook: useFillupsView

**Lokalizacja:** `src/lib/hooks/useFillupsView.ts`

**State:**

```typescript
interface FillupsViewState {
  car: CarDetailsDTO | null;
  carLoading: boolean;
  carError: Error | null;

  fillups: FillupDTO[];
  pagination: PaginationDTO;
  fillupsLoading: boolean;
  fillupsError: Error | null;
  initialLoading: boolean;
}
```

**Funkcjonalności:**

1. **fetchCar(carId)** - pobiera dane samochodu
2. **fetchFillups(cursor?)** - pobiera tankowania z paginacją
3. **loadMoreFillups()** - ładowanie kolejnych stron
4. **retry()** - retry po błędzie
5. **handleFillupClick(fillupId)** - nawigacja do edycji
6. **handleAddFillupClick()** - nawigacja do formularza dodawania

**Logika:**

- Initial load: pobiera car + fillups równolegle
- Infinite scroll: wywołuje `fetchFillups(pagination.next_cursor)` gdy trigger w viewport
- Error handling: przechowuje error w state, przekazuje do ErrorState
- Loading states: osobno dla car i fillups (pozwala na równoległe loading)

**Dependencies:**

- `useState` - zarządzanie stanem
- `useCallback` - memoization callbacks
- `useEffect` - initial load, sync pagination
- `useRef` - access do auth token

## 7. Integracja API

### 7.1. Endpoint: GET /api/cars/{carId}/fillups

**Metoda:** GET

**Ścieżka:** `/api/cars/[carId]/fillups`

**Query Parameters:**

- `limit` (optional): liczba wyników (default: 20, max: 100)
- `cursor` (optional): cursor paginacji (base64)
- `sort` (optional): "date" | "odometer" (default: "date")
- `order` (optional): "asc" | "desc" (default: "desc")

**Request Headers:**

```typescript
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**

```typescript
PaginatedFillupsResponseDTO = {
  fillups: FillupDTO[];
  pagination: {
    next_cursor: string | null;
    has_more: boolean;
    total_count: number;
  };
}
```

**Error Responses:**

- `400 Bad Request` - Invalid query parameters
- `401 Unauthorized` - Missing or invalid token
- `404 Not Found` - Car not found
- `500 Internal Server Error` - Server error

### 7.2. Endpoint: GET /api/cars/{carId}

**Metoda:** GET

**Ścieżka:** `/api/cars/[carId]`

**Request Headers:**

```typescript
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Response (200 OK):**

```typescript
CarDetailsDTO = CarWithStatisticsDTO & {
  created_at: string;
}
```

**Użycie:**

- Pobiera dane samochodu (nazwa, statystyki)
- Używany do header i breadcrumbs

### 7.3. Implementacja w hooku

```typescript
const fetchFillups = async (cursor?: string) => {
  setState((prev) => ({ ...prev, fillupsLoading: true, fillupsError: null }));

  try {
    const token = getAuthToken();
    const params = new URLSearchParams({ limit: '20', sort: 'date', order: 'desc' });
    if (cursor) params.append('cursor', cursor);

    const response = await fetch(`/api/cars/${carId}/fillups?${params}`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      // Error handling...
    }

    const data: PaginatedFillupsResponseDTO = await response.json();
    setState((prev) => ({
      ...prev,
      fillups: cursor ? [...prev.fillups, ...data.fillups] : data.fillups,
      pagination: data.pagination,
      fillupsLoading: false,
      fillupsError: null,
    }));
  } catch (error) {
    // Error handling...
  }
};
```

## 8. Interakcje użytkownika

### 8.1. Przeglądanie historii (US-009)

**Akcja:** Użytkownik przewija stronę w dół

**Oczekiwany wynik:**

1. Intersection Observer wykrywa gdy trigger element jest w viewport
2. Hook wywołuje `fetchFillups(pagination.next_cursor)`
3. Loading state pokazuje się na dole listy
4. Nowe kafelki są dopisywane do istniejących (append)
5. Scroll pozostaje stabilny (bez skoku)

**Komponenty:**

- `FillupsListView` - główny kontener
- `InfiniteScrollTrigger` - ref do observer
- `LoadingState` (fragment) - loading indicator

### 8.2. Kliknięcie w kafelek

**Akcja:** Użytkownik klika w kafelek tankowania

**Oczekiwany wynik:**

1. `FillupCard.onClick()` wywołuje callback
2. `handleFillupClick(fillupId)` w hooku
3. Przekierowanie do `/cars/{carId}/fillups/{fillupId}` (edycja)
4. URL zmienia się, nowa strona ładuje się

**Komponenty:**

- `FillupCard` - obsługa kliknięcia
- `FillupsView` - callback handler

### 8.3. Kliknięcie "Dodaj tankowanie"

**Akcja:** Użytkownik klika w przycisk "Dodaj tankowanie"

**Oczekiwany wynik:**

1. `AddFillupButton.onClick()` wywołuje callback
2. `handleAddFillupClick()` w hooku
3. Przekierowanie do `/cars/{carId}/fillups/new`
4. Formularz dodawania się ładuje

**Komponenty:**

- `AddFillupButton` - przycisk CTA
- `FillupsView` - callback handler

### 8.4. Retry po błędzie

**Akcja:** Użytkownik klika "Spróbuj ponownie"

**Oczekiwany wynik:**

1. `ErrorState.onRetry()` wywołuje callback
2. `retry()` w hooku:
   - resetuje error state
   - wywołuje `fetchCar()` + `fetchFillups()`
3. Loading state pokazuje się
4. Nowe dane są pobierane

**Komponenty:**

- `ErrorState` - przycisk retry
- `FillupsView` - obsługa retry

### 8.5. Powrót do listy samochodów

**Akcja:** Użytkownik klika przycisk "Powrót" w headerze

**Oczekiwany wynik:**

1. `CarHeader.onBack()` wywołuje callback
2. `handleBack()` w hooku
3. Przekierowanie do `/cars`
4. Lista samochodów się ładuje

**Komponenty:**

- `CarHeader` - przycisk powrotu
- `FillupsView` - callback handler

## 9. Warunki i walidacja

### 9.1. Warunki inicjalizacji

**Komponenty:** `FillupsView`, `useFillupsView`

**Walidacja:**

- `carId` jest wymagany (z URL params)
- `carId` musi być poprawnym UUID
- Token autoryzacji jest opcjonalny (DEV_AUTH_FALLBACK)

**Obsługa:**

- Jeśli `carId` nieprawidłowy → redirect do `/cars` + error
- Jeśli brak tokenu i fallback wyłączony → 401 + ErrorState

### 9.2. Warunki ładowania danych

**Komponenty:** `useFillupsView`

**Walidacja:**

- Sprawdza czy `fillupsLoading` jest false przed nowym fetch
- Sprawdza czy `pagination.has_more` jest true przed `onLoadMore`
- Sprawdza czy `next_cursor` istnieje przed wywołaniem API

**Obsługa:**

- Jeśli `loading` true → ignoruje kolejne wywołania
- Jeśli `has_more` false → nie pokazuje trigger
- Jeśli `next_cursor` null → nie próbuje ładować więcej

### 9.3. Warunki wyświetlania kafelków

**Komponenty:** `FillupCard`

**Walidacja:**

- `fillup` jest wymagany
- `averageConsumption` > 0 dla kolorowania
- Wartości `null`/`undefined` → wyświetla "N/A"

**Obsługa:**

- Formatuje datę do formatu PL (dd.mm.yyyy)
- Formatuje liczby do 2 miejsc po przecinku
- Koloruje spalanie według odchylenia (patrz sekcja 4.6)

### 9.4. Warunki pustego stanu

**Komponenty:** `EmptyState`, `FillupsListView`

**Walidacja:**

- `fillups.length === 0`
- `!loading`
- `!error`

**Obsługa:**

- Wyświetla EmptyState
- Pokaż opcjonalny przycisk "Dodaj tankowanie"

### 9.5. Warunki błędu

**Komponenty:** `ErrorState`, `useFillupsView`

**Walidacja:**

- `error` nie jest null
- Różne komunikaty dla różnych błędów (401, 404, 500)

**Obsługa:**

- 401 → "Wymagana autoryzacja"
- 404 → "Samochód nie został znaleziony"
- 500 → "Błąd serwera"
- Pokazuje ErrorState z przyciskiem retry

## 10. Obsługa błędów

### 10.1. Błąd autoryzacji (401)

**Sytuacja:** Token jest nieprawidłowy lub wygasł

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Brak autoryzacji. Ustaw token lub zaloguj się."
- Przycisk retry
- Opcjonalnie redirect do `/login` (future)

**Komponenty:**

- `ErrorState`
- `useFillupsView` - obsługa 401 response

### 10.2. Błąd nie znaleziono (404)

**Sytuacja:** Samochód nie istnieje lub nie należy do użytkownika

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Samochód nie został znaleziony"
- Przycisk retry (może pomóc przy RLS issues)
- Opcjonalnie redirect do `/cars`

**Komponenty:**

- `ErrorState`
- `useFillupsView` - obsługa 404 response

### 10.3. Błąd serwera (500)

**Sytuacja:** Wewnętrzny błąd serwera lub baza danych

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Błąd serwera. Spróbuj ponownie."
- Przycisk retry
- Loguje error do console (w dev mode)

**Komponenty:**

- `ErrorState`
- `useFillupsView` - obsługa 500 response

### 10.4. Błąd sieci

**Sytuacja:** Brak połączenia z internetem

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Brak połączenia z internetem"
- Przycisk retry
- Używa catch block w fetch()

**Komponenty:**

- `ErrorState`
- `useFillupsView` - catch network errors

### 10.5. Błąd timeout

**Sytuacja:** Zapytanie przekroczyło limit czasu

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Przekroczono limit czasu"
- Przycisk retry
- Wyłącza loading state

**Komponenty:**

- `ErrorState`
- `useFillupsView` - timeout handling

### 10.6. Błąd cursor (400)

**Sytuacja:** Nieprawidłowy format cursor w paginacji

**Obsługa:**

- Pokazuje ErrorState
- Komunikat: "Błąd paginacji"
- Resetuje do pierwszej strony
- Wywołuje `fetchFillups()` bez cursor

**Komponenty:**

- `ErrorState`
- `useFillupsView` - obsługa 400 cursor error

### 10.7. Pusty stan (brak tankowań)

**Sytuacja:** Samochód istnieje, ale nie ma tankowań

**Obsługa:**

- Nie jest to błąd
- Pokazuje EmptyState
- Zachęca do dodania pierwszego tankowania
- Pokazuje przycisk CTA

**Komponenty:**

- `EmptyState`
- `FillupsListView` - render warunkowy

## 11. Kroki implementacji

### Krok 1: Utworzenie Astro route

**Plik:** `src/pages/cars/[carId]/fillups.astro`

```astro
---
import Layout from '../../../layouts/Layout.astro';
import { FillupsView } from '../../../components/cars/FillupsView';

const title = 'Historia Tankowań - JustFuel';
const description = 'Historia tankowań dla samochodu';

const carId = Astro.params.carId;

if (!carId) {
  return Astro.redirect('/cars');
}
---

<Layout title={title} description={description}>
  <FillupsView client:load carId={carId} />
</Layout>
```

**Akcje:**

1. Utworzyć folder `src/pages/cars/[carId]/` (jeśli nie istnieje)
2. Utworzyć plik `fillups.astro`
3. Zaimportować Layout i FillupsView
4. Zwalidować `carId` z params
5. Renderować FillupsView z client:load

### Krok 2: Utworzenie custom hook

**Plik:** `src/lib/hooks/useFillupsView.ts`

```typescript
import { useState, useEffect, useCallback } from 'react';
import type { CarDetailsDTO, FillupDTO, PaginatedFillupsResponseDTO } from '../../types';

export const useFillupsView = (carId: string) => {
  // State management
  // fetchCar implementation
  // fetchFillups implementation
  // loadMoreFillups implementation
  // retry implementation
  // handleFillupClick implementation
  // handleAddFillupClick implementation
  // Initial load useEffect

  return { ...state, handlers };
};
```

**Akcje:**

1. Utworzyć plik hook
2. Zdefiniować state interface
3. Zaimplementować fetchCar (GET /api/cars/{carId})
4. Zaimplementować fetchFillups (GET /api/cars/{carId}/fillups)
5. Zaimplementować loadMoreFillups (cursor-based pagination)
6. Zaimplementować retry
7. Zaimplementować handleFillupClick (navigate to /fillups/{fillupId})
8. Zaimplementować handleAddFillupClick (navigate to /fillups/new)
9. Initial load w useEffect

### Krok 3: Utworzenie głównego komponentu

**Plik:** `src/components/cars/FillupsView.tsx`

```typescript
import React from "react";
import { useFillupsView } from "../../lib/hooks/useFillupsView";
import { Breadcrumbs } from "./Breadcrumbs";
import { CarHeader } from "./CarHeader";
import { FillupsListView } from "./FillupsListView";
import { AddFillupButton } from "./AddFillupButton";

interface FillupsViewProps {
  carId: string;
}

export const FillupsView: React.FC<FillupsViewProps> = ({ carId }) => {
  // Hook logic
  // Handlers
  // Render z warunkami (loading, error, empty)

  return (
    <main className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      {/* Header */}
      {/* Add Fillup Button */}
      {/* List View */}
    </main>
  );
};
```

**Akcje:**

1. Utworzyć plik komponentu
2. Zaimportować hook
3. Zaimportować komponenty podrzędne
4. Wywołać hook z carId
5. Stworzyć handlery (onFillupClick, onAddFillupClick, onRetry, onBack)
6. Renderować strukture z warunkami
7. Testować wyświetlanie różnych stanów

### Krok 4: Utworzenie komponentu AddFillupButton

**Plik:** `src/components/cars/AddFillupButton.tsx`

```typescript
import React from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AddFillupButtonProps {
  carId: string;
  onClick: () => void;
}

export const AddFillupButton: React.FC<AddFillupButtonProps> = ({ carId, onClick }) => {
  return (
    <Button onClick={onClick} size="lg" className="w-full sm:w-auto">
      <Plus className="mr-2 h-4 w-4" />
      Dodaj tankowanie
    </Button>
  );
};
```

**Akcje:**

1. Utworzyć komponent
2. Dodać ikonę Plus z lucide-react
3. Styling zgodny z design system
4. Testować rendering

### Krok 5: Modyfikacja istniejącego komponentu CarHeader

**Plik:** `src/components/cars/CarHeader.tsx`

**Akcje:**

1. Dodać opcjonalny prop `showActions` (domyślnie true)
2. Dodać opcjonalny prop `onBack`
3. Renderować przycisk powrotu gdy `onBack` dostarczony
4. Ukryć akcje (edit/delete) gdy `showActions` false
5. Testować w różnych scenariuszach

**Nowy interface:**

```typescript
interface CarHeaderProps {
  carName: string;
  onBack?: () => void;
  showActions?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}
```

### Krok 6: Modyfikacja istniejącego komponentu FillupsListView

**Plik:** `src/components/cars/FillupsListView.tsx`

**Akcje:**

1. Dodać prop `onRetry` do interface
2. Przekazać `onRetry` do ErrorState
3. Testować error handling

### Krok 7: Testowanie infinite scroll

**Plik:** `src/components/cars/FillupsListView.tsx`

**Akcje:**

1. Zweryfikować Intersection Observer
2. Testować scroll w dół (trigger ładowania)
3. Testować behavior gdy `has_more` false
4. Testować behavior gdy `loading` true (duplikacje)
5. Testować stan końcowy ("Wyświetlono wszystkie")

### Krok 8: Testowanie kolorowania spalania

**Plik:** `src/components/cars/FillupCard.tsx`

**Akcje:**

1. Zweryfikować logikę `getConsumptionColor`
2. Testować różne wartości spalania vs średnia
3. Testować edge cases (avg = 0, consumption = 0, null values)
4. Sprawdzić dark mode support

### Krok 9: Testowanie walidacji i błędów

**Plik:** `src/lib/hooks/useFillupsView.ts`

**Akcje:**

1. Testować 401 (brak tokenu)
2. Testować 404 (nieprawidłowy carId)
3. Testować 500 (server error)
4. Testować network error
5. Testować timeout
6. Testować retry mechanism

### Krok 10: Testowanie nawigacji

**Akcje:**

1. Testować kliknięcie w kafelek → edycja
2. Testować kliknięcie "Dodaj" → formularz
3. Testować "Powrót" → lista samochodów
4. Testować breadcrumbs → wszystkie linki
5. Testować URL correctness

### Krok 11: Testowanie responsywności

**Akcje:**

1. Testować mobile view (< 640px)
2. Testować tablet view (640-1024px)
3. Testować desktop view (> 1024px)
4. Testować infinite scroll na wszystkich breakpoints
5. Testować layout kafelków na mobile vs desktop

### Krok 12: Optymalizacja wydajności

**Akcje:**

1. Memoization callbacks (useCallback)
2. Lazy loading Images (jeśli przyszłość)
3. Debouncing scroll (jeśli potrzeba)
4. Throttling API calls (prevent duplicate)
5. Cache invalidation logic

### Krok 13: Dodanie integracji z istniejącym kodem

**Plik:** modyfikacje w kilku miejscach

**Akcje:**

1. Sprawdzić czy navigacja z `/cars/[carId]` działa
2. Sprawdzić czy linki do nowego widoku działają
3. Dodać link do Fillups w CarHeader (opcjonalnie)
4. Testować pełną ścieżkę użytkownika

### Krok 14: Dokumentacja i cleanup

**Akcje:**

1. Dodać JSDoc do wszystkich funkcji
2. Dodać komentarze do złożonej logiki
3. Usunąć console.log (lub zostawić w dev mode)
4. Upewnić się że wszystkie typy są poprawnie zdefiniowane
5. Sprawdzić linting errors

### Krok 15: Finalne testy E2E

**Akcje:**

1. Przetestować pełną ścieżkę: lista → szczegóły → historia tankowań
2. Przetestować infinite scroll z dużą liczbą tankowań (> 100)
3. Przetestować wszystkie stany (loading, error, empty)
4. Przetestować wszystkie interakcje (kliknięcia, scrolling, retry)
5. Przetestować na różnych przeglądarkach (Chrome, Firefox, Safari)
6. Testy accessibility (keyboard navigation, screen readers)

---

**Szacunkowy czas implementacji:** 8-12 godzin

**Kolejność:** Kroki 1-3 (foundation) → Kroki 4-6 (komponenty) → Kroki 7-9 (funkcjonalność) → Kroki 10-11 (UX) → Kroki 12-14 (polish) → Krok 15 (validation)
