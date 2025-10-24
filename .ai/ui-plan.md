# Architektura UI dla JustFuel

## 1. Przegląd struktury UI

JustFuel implementuje minimalistyczną architekturę interfejsu użytkownika skupioną na podstawowych funkcjach monitorowania zużycia paliwa. Aplikacja wykorzystuje dwupoziomową strukturę nawigacji z głównym widokiem listy samochodów jako punktem wejścia i szczegółowymi widokami dla każdego samochodu. Interfejs jest zaprojektowany w podejściu mobile-first z responsywnym designem, zapewniając intuicyjne doświadczenie na wszystkich urządzeniach.

Architektura opiera się na kartach samochodów wyświetlających kluczowe metryki, kafelkach tankowań z dynamicznym kolorowaniem spalania oraz inteligentnych formularzach z przełącznikami trybów wprowadzania danych. System implementuje optymistyczne aktualizacje UI, infinite scroll dla historii tankowań i centralną obsługę błędów z przyjaznymi komunikatami dla użytkownika.

## 2. Lista widoków

### 2.1. Login/Register

- **Ścieżka:** `/login`, `/register`
- **Główny cel:** Bezpieczne uwierzytelnienie użytkownika
- **Kluczowe informacje:** Formularz logowania/rejestracji, komunikaty błędów, przekierowania
- **Kluczowe komponenty:** Formularz uwierzytelniania, przycisk przełączania między logowaniem a rejestracją, komunikaty walidacji
- **UX, dostępność i bezpieczeństwo:** Walidacja w czasie rzeczywistym, komunikaty błędów w języku polskim, odpowiednie etykiety dla screen readerów, zabezpieczenie przed atakami CSRF

### 2.2. Onboarding

- **Ścieżka:** `/onboarding`
- **Główny cel:** Wprowadzenie nowego użytkownika do aplikacji
- **Kluczowe informacje:** Powitanie, instrukcje dodania pierwszego samochodu i tankowania
- **Kluczowe komponenty:** Ekran powitalny, przewodnik krok po kroku, call-to-action do dodania samochodu
- **UX, dostępność i bezpieczeństwo:** Progresywny przepływ, możliwość pominięcia kroków, jasne instrukcje, przyjazne komunikaty

### 2.3. Lista samochodów

- **Ścieżka:** `/cars`
- **Główny cel:** Przegląd wszystkich samochodów użytkownika z kluczowymi metrykami
- **Kluczowe informacje:** Nazwa samochodu, średnie spalanie, całkowity koszt, całkowity dystans, liczba tankowań
- **Kluczowe komponenty:** Karty samochodów, przycisk "Dodaj samochód", breadcrumbs, menu nawigacyjne
- **UX, dostępność i bezpieczeństwo:** Karty z głównym obszarem klikalnym, hover states, loading states, komunikaty dla pustego stanu

### 2.4. Szczegóły samochodu

- **Ścieżka:** `/cars/{carId}`
- **Główny cel:** Zarządzanie konkretnym samochodem i przełączanie między tankowaniami a wykresami
- **Kluczowe informacje:** Nazwa samochodu, preferencje wprowadzania przebiegu, opcje edycji/usunięcia
- **Kluczowe komponenty:** Tab navigation (Tankowania/Wykresy), przycisk edycji, przycisk usuwania, breadcrumbs
- **UX, dostępność i bezpieczeństwo:** Domyślna zakładka "Tankowania", wyraźne oznaczenie aktywnej zakładki, potwierdzenia dla operacji usuwania

### 2.5. Lista tankowań

- **Ścieżka:** `/cars/{carId}/fillups`
- **Główny cel:** Historia tankowań z infinite scroll i możliwością dodawania/edycji
- **Kluczowe informacje:** Data, spalanie (kolorowane), dystans, cena za litr, przycisk dodawania
- **Kluczowe komponenty:** Kafelki tankowań, infinite scroll, przycisk "Dodaj tankowanie", skeleton loaders
- **UX, dostępność i bezpieczeństwo:** Kolorowanie spalania według odchylenia od średniej, pull-to-refresh na mobilnych, loading states, komunikaty dla pustego stanu

### 2.6. Formularz dodawania samochodu

- **Ścieżka:** `/cars/new`
- **Główny cel:** Dodanie nowego samochodu do konta użytkownika
- **Kluczowe informacje:** Nazwa samochodu (wymagana), początkowy stan licznika (opcjonalny), preferencja wprowadzania przebiegu
- **Kluczowe komponenty:** Formularz z walidacją, przycisk zapisu, przycisk anulowania
- **UX, dostępność i bezpieczeństwo:** Walidacja w czasie rzeczywistym, komunikaty błędów, focus management, walidacja unikalności nazwy

### 2.7. Formularz edycji samochodu

- **Ścieżka:** `/cars/{carId}/edit`
- **Główny cel:** Modyfikacja danych istniejącego samochodu
- **Kluczowe informacje:** Nazwa samochodu, preferencja wprowadzania przebiegu
- **Kluczowe komponenty:** Formularz z pre-wypełnionymi danymi, przycisk zapisu, przycisk anulowania
- **UX, dostępność i bezpieczeństwo:** Spójny interfejs z formularzem dodawania, walidacja zmian, komunikaty sukcesu

### 2.8. Formularz dodawania tankowania

- **Ścieżka:** `/cars/{carId}/fillups/new`
- **Główny cel:** Dodanie nowego wpisu o tankowaniu
- **Kluczowe informacje:** Data, ilość paliwa, łączna cena, przebieg (odometer/distance), ostrzeżenia walidacji
- **Kluczowe komponenty:** Inteligentny formularz z przełącznikiem trybu, walidacja, system ostrzeżeń
- **UX, dostępność i bezpieczeństwo:** Przełącznik między trybami wprowadzania, soft validation warnings, automatyczne obliczenia, focus management

### 2.9. Formularz edycji tankowania

- **Ścieżka:** `/cars/{carId}/fillups/{fillupId}/edit`
- **Główny cel:** Modyfikacja istniejącego wpisu o tankowaniu
- **Kluczowe informacje:** Wszystkie dane tankowania, opcja usunięcia, informacja o przeliczeniu statystyk
- **Kluczowe komponenty:** Formularz z pre-wypełnionymi danymi, przycisk usuwania, komunikaty o aktualizacji
- **UX, dostępność i bezpieczeństwo:** Identyczny interfejs z formularzem dodawania, optymistyczne aktualizacje, komunikaty o wpływie zmian

### 2.10. Wykresy

- **Ścieżka:** `/cars/{carId}/charts`
- **Główny cel:** Wizualizacja statystyk samochodu w czasie
- **Kluczowe informacje:** Wykres spalania, wykres ceny za litr, wykres dystansu, metadane statystyk
- **Kluczowe komponenty:** Responsywne wykresy, przełącznik typów wykresów, komunikaty dla niewystarczających danych
- **UX, dostępność i bezpieczeństwo:** Interaktywne wykresy z tooltipami, responsywność na wszystkich urządzeniach, alternatywne teksty dla wykresów

### 2.11. Modal potwierdzenia usuwania samochodu

- **Ścieżka:** Overlay modal
- **Główny cel:** Bezpieczne potwierdzenie usunięcia samochodu z całą historią
- **Kluczowe informacje:** Ostrzeżenie o usunięciu, pole wymagające wpisania nazwy samochodu
- **Kluczowe komponenty:** Modal z polem tekstowym, przycisk potwierdzenia, przycisk anulowania
- **UX, dostępność i bezpieczeństwo:** Wymaganie dokładnego wpisania nazwy, focus trap w modalu, klawiatura ESC do zamknięcia

### 2.12. Modal potwierdzenia usuwania tankowania

- **Ścieżka:** Overlay modal
- **Główny cel:** Potwierdzenie usunięcia pojedynczego wpisu o tankowaniu
- **Kluczowe informacje:** Ostrzeżenie o wpływie na statystyki, informacja o przeliczeniu
- **Kluczowe komponenty:** Modal z komunikatem, przycisk potwierdzenia, przycisk anulowania
- **UX, dostępność i bezpieczeństwo:** Mniej restrykcyjne niż usuwanie samochodu, jasne komunikaty o konsekwencjach

## 3. Mapa podróży użytkownika

### 3.1. Przepływ dla nowego użytkownika

1. **Rejestracja** → Formularz rejestracji z walidacją e-maila i hasła
2. **Onboarding** → Powitanie i przewodnik po aplikacji
3. **Dodanie pierwszego samochodu** → Formularz z nazwą i opcjonalnym stanem licznika
4. **Dodanie pierwszego tankowania** → Inteligentny formularz z przełącznikiem trybu
5. **Lista samochodów** → Widok główny z kartą nowego samochodu

### 3.2. Przepływ dla istniejącego użytkownika

1. **Logowanie** → Formularz logowania z przekierowaniem do listy samochodów
2. **Lista samochodów** → Przegląd wszystkich samochodów z metrykami
3. **Wybór samochodu** → Przejście do listy tankowań (domyślny widok)
4. **Lista tankowań** → Historia z infinite scroll i możliwością dodawania
5. **Dodawanie tankowania** → Formularz z zapamiętaniem ostatnio wybranego samochodu
6. **Edycja tankowania** → Kliknięcie kafelka → formularz edycji
7. **Wykresy** → Przełączenie na zakładkę wykresów w widoku samochodu
8. **Zarządzanie samochodem** → Szczegóły samochodu → edycja/usunięcie

### 3.3. Kluczowe interakcje

- **Kliknięcie kafelka tankowania** → Bezpośrednie przejście do edycji
- **Infinite scroll** → Automatyczne ładowanie kolejnych tankowań
- **Przełącznik trybu** → Zmiana między odometer a distance w formularzu
- **Potwierdzenie usuwania** → Modal z wymaganiem wpisania nazwy
- **Optymistyczne aktualizacje** → Natychmiastowe odświeżenie UI po operacjach

## 4. Układ i struktura nawigacji

### 4.1. Struktura główna

- **Poziom 1:** Lista samochodów (`/cars`) - główny punkt wejścia
- **Poziom 2:** Widoki samochodu (`/cars/{carId}`) - szczegóły, tankowania, wykresy
- **Poziom 3:** Formularze i modale - dodawanie, edycja, potwierdzenia

### 4.2. Nawigacja pozioma

- **Header:** Logo aplikacji, menu użytkownika, przycisk wylogowania
- **Breadcrumbs:** Orientacja w hierarchii (Samochody > Nazwa samochodu > Tankowania)
- **Tab navigation:** W widoku samochodu (Tankowania/Wykresy)

### 4.3. Nawigacja mobilna

- **Hamburger menu:** Na mniejszych ekranach z głównymi opcjami
- **Bottom navigation:** Szybki dostęp do listy samochodów i ostatnio wybranego samochodu
- **Swipe gestures:** Przełączanie między zakładkami, pull-to-refresh

### 4.4. Kontekstowa nawigacja

- **Floating Action Button:** Dodawanie tankowania z listy tankowań
- **Quick actions:** Edycja samochodu z karty, usuwanie z formularza edycji
- **Deep linking:** Bezpośrednie linki do konkretnych tankowań i wykresów

## 5. Kluczowe komponenty

### 5.1. Karty samochodów

Komponenty wyświetlające podstawowe informacje o samochodzie z kluczowymi metrykami. Zawierają główny obszar klikalny prowadzący do listy tankowań oraz przycisk "Szczegóły" dla rzadko używanej funkcji zarządzania samochodem.

### 5.2. Kafelki tankowań

Responsywne kafelki wyświetlające historię tankowań z dynamicznym kolorowaniem spalania. Kolor zielony/żółty/czerwony odzwierciedla odchylenie od średniego spalania, zapewniając szybką ocenę efektywności jazdy.

### 5.3. Inteligentny formularz tankowania

Formularz z przełącznikiem między trybami wprowadzania przebiegu (odometer/distance). Automatycznie oblicza brakujące wartości i wyświetla ostrzeżenia walidacji bez blokowania zapisu.

### 5.4. System infinite scroll

Implementacja cursor-based pagination dla listy tankowań z skeleton loaders podczas ładowania. Obsługuje pull-to-refresh na urządzeniach mobilnych.

### 5.5. Modal potwierdzenia

Bezpieczne modale potwierdzenia z różnymi poziomami zabezpieczeń. Usuwanie samochodu wymaga wpisania dokładnej nazwy, podczas gdy usuwanie tankowania ma mniej restrykcyjne potwierdzenie.

### 5.6. Responsywne wykresy

Interaktywne wykresy dostosowujące się do rozmiaru ekranu z tooltipami i alternatywnymi tekstami dla dostępności. Obsługują trzy typy wizualizacji: spalanie, cena za litr i dystans.

### 5.7. System powiadomień

Centralna obsługa błędów i ostrzeżeń z mapowaniem kodów API na przyjazne komunikaty w języku polskim. Wyświetla soft validation warnings bez przerywania przepływu użytkownika.

### 5.8. Breadcrumbs nawigacji

Elementy nawigacyjne zapewniające orientację w hierarchii aplikacji, szczególnie ważne w widokach szczegółowych samochodu i formularzach.

### 5.9. Loading states i skeleton loaders

Wizualne wskaźniki ładowania zapewniające płynność przejść między widokami. Skeleton loaders symulują strukturę ładowanej zawartości.

### 5.10. Optymistyczne aktualizacje

System natychmiastowego odświeżania UI po operacjach modyfikujących z automatycznym przeliczaniem statystyk. Zapewnia responsywne doświadczenie użytkownika bez oczekiwania na odpowiedź serwera.
