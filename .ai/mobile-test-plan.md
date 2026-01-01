# Plan Testów Mobilnych - JustFuel (Android)

## 1. Wstęp

Ten dokument definiuje strategię testowania aplikacji mobilnej JustFuel. Ze względu na architekturę "Local-First" (Offline), testy skupiają się na stabilności lokalnej bazy danych SQLite, poprawności obliczeń oraz interakcji użytkownika bez udziału backendu (w Fazie 1).

## 2. Zakres Testów (Faza 1 - Offline)

### 2.1. Funkcjonalności w Zakresie

1.  **Lokalna Baza Danych (SQLite)**
    - Inicjalizacja i migracje bazy.
    - Operacje CRUD na tabelach `Cars` i `Fillups`.
    - Spójność danych (Relacje, Cascade Delete).
2.  **Logika Biznesowa (Współdzielona z Web)**
    - Walidacja formularzy (Zod Schemas).
    - Obliczenia spalania, dystansu i kosztów.
3.  **Interfejs Użytkownika (UI)**
    - Nawigacja (Stack Navigation).
    - Formularze (Dodawanie auta, tankowania).
    - Wykresy i statystyki.
    - Obsługa błędów walidacji.

### 2.2. Funkcjonalności poza Zakresem (Faza 1)

- Integracja z API / Synchronizacja (zaplanowane na Fazę 2).
- Logowanie i Rejestracja.
- Powiadomienia Push.

## 3. Strategia i Narzędzia

W projekcie brakuje obecnie skonfigurowanych narzędzi do testowania. Rekomendowane wdrożenie:

### 3.1. Testy Jednostkowe i Integracyjne (Unit/Integration)

- **Narzędzie:** `jest-expo` + `@testing-library/react-native`.
- **Cel:** Testowanie komponentów, hooków i logiki biznesowej.
- **Mockowanie:**
  - `expo-sqlite`: Należy zamockować moduł bazy danych dla testów UI, lub użyć bazy in-memory dla testów repozytoriów.
  - `@react-navigation`: Mockowanie nawigacji do testowania przejść.

### 3.2. Testy Manualne

Do momentu wdrożenia pełnego frameworka E2E (np. Detox/Maestro), podstawą weryfikacji będą ustrukturyzowane testy manualne na emulatorze/urządzeniu.

## 4. Scenariusze Testowe

### 4.1. Zarządzanie Samochodami (Cars)

#### TC-MOB-CAR-001: Dodanie pierwszego samochodu

- **Cel:** Weryfikacja "Empty State" i tworzenia rekordu.
- **Kroki:**
  1. Uruchom aplikację (czysta baza).
  2. Sprawdź, czy wyświetla się komunikat o braku aut.
  3. Kliknij "Dodaj samochód".
  4. Wpisz nazwę "Toyota Yaris".
  5. Wybierz preferencję licznika "Odometer".
  6. Zapisz.
- **Oczekiwany rezultat:** Auto pojawia się na liście głównej. Dane zapisane w SQLite.

#### TC-MOB-CAR-002: Walidacja nazwy samochodu

- **Cel:** Sprawdzenie walidacji inputów.
- **Kroki:**
  1. Przejdź do dodawania auta.
  2. Spróbuj zapisać pusty formularz.
  3. Wpisz nazwę krótszą niż 2 znaki (jeśli dotyczy).
- **Oczekiwany rezultat:** Komunikaty błędów pod polami (zgodne z Zod). Formularz nie jest wysyłany.

#### TC-MOB-CAR-003: Usunięcie samochodu

- **Cel:** Weryfikacja usuwania kaskadowego.
- **Kroki:**
  1. Wejdź w szczegóły samochodu, który ma tankowania.
  2. Wybierz opcję usuwania.
  3. Potwierdź w dialogu.
- **Oczekiwany rezultat:** Auto znika z listy. Wszystkie powiązane tankowania są usuwane z bazy (sprawdzenie spójności).

### 4.2. Zarządzanie Tankowaniami (Fillups)

#### TC-MOB-FILL-001: Dodanie pierwszego tankowania

- **Warunki:** Istnieje auto "Toyota".
- **Kroki:**
  1. Wejdź w "Toyota".
  2. Kliknij "Dodaj tankowanie".
  3. Wypełnij: Data (Teraz), Paliwo (40L), Cena (200PLN), Licznik (150000).
  4. Zapisz.
- **Oczekiwany rezultat:**
  - Tankowanie dodane do listy.
  - Spalanie: "---" (pierwsze tankowanie).
  - Ostatnie spalanie w nagłówku auta: "---".

#### TC-MOB-FILL-002: Dodanie drugiego tankowania (Obliczenia)

- **Warunki:** Istnieje tankowanie przy 150000 km.
- **Kroki:**
  1. Dodaj kolejne tankowanie.
  2. Paliwo (35L), Cena (180PLN), Licznik (150600).
  3. Zapisz.
- **Oczekiwany rezultat:**
  - Dystans obliczony: 600 km.
  - Spalanie obliczone: (35 / 600) \* 100 = 5.83 L/100km.
  - Lista odświeża się automatycznie.

#### TC-MOB-FILL-003: Tryb "Distance" (Dystans zamiast Licznika)

- **Cel:** Weryfikacja alternatywnego trybu wprowadzania.
- **Kroki:**
  1. W formularzu przełącz na "Dystans".
  2. Wpisz dystans: 500 km (zamiast stanu licznika).
  3. Zapisz.
- **Oczekiwany rezultat:** Aplikacja wewnętrznie oblicza nowy stan licznika (Poprzedni + 500) i zapisuje go w bazie.

#### TC-MOB-FILL-004: Blokada "Licznik cofnięty"

- **Kroki:**
  1. Próba dodania tankowania z licznikiem mniejszym niż ostatni (np. 149000 przy ostatnim 150000).
- **Oczekiwany rezultat:** Walidacja blokuje zapis lub wyświetla ostrzeżenie (zgodnie z logiką biznesową web).

### 4.3. Wykresy i Statystyki

#### TC-MOB-STAT-001: Generowanie wykresów

- **Warunki:** Min. 3 tankowania w bazie.
- **Kroki:**
  1. Przejdź do zakładki "Wykresy" w szczegółach auta.
  2. Sprawdź czy wykresy się renderują (nie są puste).
  3. Sprawdź czy statystyki (Średnie spalanie, Całkowity koszt) są zgodne z sumą tankowań.

## 5. Plan Wdrożenia Testów Automatycznych

1.  **Instalacja zależności developerskich:**
    ```bash
    npm install --save-dev jest jest-expo @testing-library/react-native @types/jest
    ```
2.  **Konfiguracja `jest.config.js`:**
    Ustawienie presetu `jest-expo`.
3.  **Utworzenie struktury katalogów:**
    `apps/mobile/src/__tests__` lub pliki `*.test.tsx` obok komponentów.
4.  **Priorytetyzacja:**
    - P1: Unit testy kalkulacji (współdzielone z web - upewnić się, że działają).
    - P2: Testy repozytoriów SQLite (Repository Pattern).
    - P3: Snapshot testy głównych ekranów.
