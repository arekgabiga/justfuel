# Plan Aplikacji Mobilnej JustFuel (Android)

## 1. Przegląd Wykonawczy

Ten dokument definiuje strategię budowy aplikacji mobilnej JustFuel na system Android. Zgodnie z decyzjami podjętymi podczas fazy discovery, aplikacja zostanie zbudowana w modelu **"Local-First"** (Offline). Priorytetem jest stworzenie błyskawicznej, w pełni funkcjonalnej aplikacji działającej bez internetu (baza SQLite), która w drugiej fazie zostanie wzbogacona o opcjonalną synchronizację z istniejącym systemem webowym.

## 2. Stos Technologiczny

| Kategoria          | Wybór                               | Uzasadnienie                                                                                |
| :----------------- | :---------------------------------- | :------------------------------------------------------------------------------------------ |
| **Framework**      | **React Native (via Expo)**         | Współdzielenie języka (TypeScript) i wiedzy z zespołem webowym (React). Szybki development. |
| **Język**          | **TypeScript**                      | Bezpieczeństwo typów, spójność z projektem webowym.                                         |
| **Baza Danych**    | **SQLite (Expo SQLite)**            | Pełne wsparcie dla relacyjnych danych offline. Niezbędne dla modelu "Local-First".          |
| **UI Library**     | **NativeBase / React Native Paper** | Komponenty Material Design, łatwe dostosowanie do stylu JustFuel.                           |
| **Nawigacja**      | **React Navigation (Stack)**        | Prosta, przewidywalna nawigacja w dół hierarchii (Lista -> Szczegóły).                      |
| **Build & Deploy** | **EAS Build (APK)**                 | Generowanie plików `.apk` do ręcznej dystrybucji (z pominięciem Google Play w fazie 1).     |

## 3. Strategia Produktowa "Local-First"

### Faza 1: Solidny Offline (MVP Mobile)

- **Cel:** Dostarczenie w pełni użytecznej aplikacji, która nie wymaga internetu do działania.
- **Brak Logowania:** Aplikacja uruchamia się od razu do głównego ekranu. Nie ma ekranu logowania/rejestracji.
- **Dane:** Przechowywane wyłącznie w lokalnej bazie SQLite na telefonie.
- **Backup:** Wykorzystanie systemowego mechanizmu "Auto Backup" Androida (kopia na Google Drive użytkownika).
- **Funkcje:**
  - CRUD Samochodów (Dodaj, Edytuj, Usuń).
  - CRUD Tankowań (z obliczaniem spalania).
  - Statystyki i Wykresy (generowane lokalnie z SQLite).

### Faza 2: Synchronizacja (Integracja Web)

- **Cel:** Połączenie "samotnej wyspy" mobile z chmurą JustFuel.
- **Logowanie Opcjonalne:** W ustawieniach pojawi się przycisk "Połącz z kontem / Zaloguj".
- **Strategia Sync:**
  - **Pełne Scalanie (Merge):** Dane z telefonu i serwera są sumowane.
  - **Last Write Wins:** W przypadku konfliktu edycji (ten sam rekord zmieniony tu i tu), nowsza zmiana nadpisuje starszą bez pytań.
  - **Zasada:** Synchronizacja ręczna (przycisk) lub przy starcie aplikacji (jeśli jest sieć).
- **Technologia:** Wykorzystanie istniejącego REST API.

## 4. UX i UI Design (Mobile Adaptation)

### Nawigacja

- **Model:** Stack Navigation (Stos).
- **Główny Ekran:** Lista Kart Samochodów (tak jak w Web).
- **Interakcja:** Kliknięcie w auto -> Ekran Szczegółów (Lista Tankowań + Zakładka Wykresy).
- **Brak Dolnego Paska:** Maksymalizacja przestrzeni roboczej.

### Wprowadzanie Danych

- **Formularze:** Standardowe kontrolki Input (React Native TextInput).
- **Klawiatura:** Numeryczna dla pól liczbowych.
- **Ułatwienia:** Duże pola dotykowe (min. 48dp wysokości).

### Wykluczenia (Co NIE będzie robione)

- Brak powiadomień (Push/Local).
- Brak Widgetów na pulpit.
- Brak skanowania paragonów (OCR).
- Brak dedykowanego endpointu `/sync` (używamy REST).

## 5. Plan Implementacji

### Krok 1: Setup Projektu (Expo)

- [x] Inicjalizacja projektu Expo + TypeScript.
- [x] Konfiguracja Lintera/Prettiera.
- [x] Setup nawigacji (React Navigation).

### Krok 2: Warstwa Danych (SQLite)

- [x] Projekt schematu bazy danych SQL (tabela `Cars`, tabela `Fillups`).
- [x] Implementacja warstwy Repository (dla przyszłej łatwej zamiany na Sync).
- [x] Migracje bazy danych.

### Krok 3: Implementacja UI (Faza 1 Offline)

- [x] Ekran Listy Samochodów.
- [x] Ekran Dodawania/Edycji Samochodu.
- [x] Ekran Listy Tankowań (Infinite Scroll local).
- [x] Formularz Tankowania (Logika obliczeń spalania w JS).
- [x] Wykresy (biblioteka `react-native-chart-kit` lub podobna).

### Krok 4: Testy i Build

- [x] Manualne testy funkcjonalne na emulatorze Androida.
- [x] Konfiguracja `eas.json` do budowania APK.
- [x] Wygenerowanie pierwszego wydania `.apk` (EAS Build).

### Krok 5: Faza Sync (Później)

- [ ] Dodanie ekranu logowania (Supabase Auth).
- [ ] Implementacja logiki synchronizacji (Merge Logic).
- [ ] Testy konfliktów i edge-case'ów.

## 6. Decyzje Administracyjne

- **Sklep:** Brak publikacji w Google Play w fazie 1. Dystrybucja pliku APK.
- **Sklep:** Brak publikacji w Google Play w fazie 1. Dystrybucja pliku APK.
- **Bezpieczeństwo:** Klucze podpisujące zarządzane przez Expo (EAS Credentials).
