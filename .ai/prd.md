# Dokument wymagań produktu (PRD) - JustFuel

## 1. Przegląd produktu

JustFuel to minimalistyczna aplikacja internetowa zaprojektowana w celu uproszczenia procesu monitorowania zużycia paliwa i wydatków na samochód. Aplikacja jest odpowiedzią na złożoność istniejących rozwiązań, oferując intuicyjny interfejs skoncentrowany wyłącznie na kluczowych funkcjonalnościach. Głównym celem produktu jest dostarczenie użytkownikom szybkiego i łatwego sposobu na ręczne wprowadzanie danych o tankowaniach oraz analizę podstawowych statystyk za pomocą przejrzystych wykresów. Aplikacja kierowana jest do kierowców, którzy potrzebują prostego narzędzia do śledzenia kosztów paliwa bez zbędnych, rozpraszających funkcji.

## 2. Problem użytkownika

Współczesne aplikacje do zarządzania pojazdami często oferują szeroki wachlarz funkcji, takich jak monitorowanie przeglądów, ubezpieczeń, a nawet integracje z systemami GPS. Ta złożoność sprawia, że proste zadanie, jakim jest zanotowanie tankowania i sprawdzenie średniego spalania, staje się uciążliwe i czasochłonne. Użytkownicy są zmuszeni do poruszania się po skomplikowanych interfejsach i często płacą za funkcje, których nie potrzebują. Istnieje wyraźna potrzeba na rynku na aplikację, która wraca do podstaw i koncentruje się wyłącznie na monitorowaniu zużycia paliwa w sposób jak najbardziej efektywny i przyjazny dla użytkownika.

## 3. Wymagania funkcjonalne

### 3.1. Zarządzanie kontem użytkownika
- Użytkownik musi mieć możliwość założenia konta za pomocą adresu e-mail i hasła.
- Użytkownik musi mieć możliwość zalogowania się do aplikacji przy użyciu swoich danych uwierzytelniających.
- Użytkownik musi mieć możliwość wylogowania się ze swojego konta.

### 3.2. Zarządzanie samochodami (CRUD)
- Użytkownik może dodać nowy samochód, podając jego nazwę (pole obowiązkowe) oraz opcjonalnie początkowy stan licznika.
- Użytkownik widzi listę wszystkich swoich samochodów w formie kart, z podsumowaniem kluczowych metryk dla każdego z nich.
- Użytkownik może edytować nazwę istniejącego samochodu.
- Użytkownik może usunąć samochód, co wymaga dodatkowego potwierdzenia poprzez wpisanie nazwy usuwanego pojazdu.

### 3.3. Zarządzanie tankowaniami (CRUD)
- Użytkownik może dodać nowy wpis o tankowaniu, podając datę, ilość zatankowanego paliwa, łączną cenę oraz przebieg (jako aktualny stan licznika lub jako dystans od ostatniego tankowania).
- System zapamiętuje preferowaną metodę wprowadzania przebiegu (stan licznika vs. dystans) dla każdego samochodu osobno.
- Historia tankowań jest prezentowana jako responsywna siatka kafelków, ładowana dynamicznie podczas przewijania (infinite scroll).
- Każdy kafelek w historii wyświetla datę, obliczone spalanie i przejechany dystans.
- Kliknięcie w kafelek przenosi użytkownika bezpośrednio do formularza edycji danego wpisu.
- Użytkownik może usunąć wpis o tankowaniu.
- Po każdej edycji lub usunięciu wpisu, system automatycznie przelicza wszystkie powiązane statystyki.

### 3.4. Statystyki i Wizualizacje
- Aplikacja automatycznie oblicza kluczowe metryki: spalanie (L/100km), koszt za litr, dystans przejechany między tankowaniami.
- Wartość spalania na kafelkach jest dynamicznie kolorowana (zielony/żółty/czerwony) w zależności od odchylenia od średniego spalania dla danego pojazdu, z różną intensywnością koloru.
- W dedykowanej zakładce "Wykresy" dostępne są trzy wizualizacje:
    1. Wykres liniowy zmiany spalania w czasie.
    2. Wykres liniowy zmiany ceny za litr w czasie.
    3. Wykres słupkowy dystansu przejechanego między tankowaniami.
- W przypadku braku wystarczającej ilości danych do obliczeń (np. przy pierwszym tankowaniu), system wyświetla odpowiednie komunikaty informacyjne.

## 4. Granice produktu

Następujące funkcje i elementy są świadomie wyłączone z zakresu MVP (Minimum Viable Product), aby zapewnić szybkie dostarczenie kluczowej wartości i skupić się na podstawowym problemie użytkownika:
- Export danych do jakichkolwiek formatów (np. CSV, PDF).
- Funkcje społecznościowe, w tym współdzielenie informacji o samochodach lub tankowaniach między użytkownikami.
- Dedykowane aplikacje mobilne na platformy iOS i Android. Produkt będzie dostępny wyłącznie jako aplikacja internetowa, zaprojektowana w podejściu "mobile-first".
- Zintegrowany system do zbierania opinii i sugestii od użytkowników wewnątrz aplikacji.
- Automatyczne śledzenie lokalizacji czy integracja z systemami OBD-II. Wszystkie dane są wprowadzane manualnie.

## 5. Historyjki użytkowników

### Zarządzanie kontem
---
- ID: US-001
- Tytuł: Rejestracja nowego użytkownika
- Opis: Jako nowy użytkownik, chcę móc założyć konto w aplikacji używając mojego adresu e-mail i hasła, abym mógł bezpiecznie przechowywać dane o moich samochodach i tankowaniach.
- Kryteria akceptacji:
    - Formularz rejestracji zawiera pola na adres e-mail i hasło.
    - System waliduje poprawność formatu adresu e-mail.
    - System wymaga hasła o określonej minimalnej długości.
    - Po pomyślnej rejestracji, jestem automatycznie zalogowany i przekierowany do ekranu onboardingu.
    - W przypadku, gdy e-mail jest już zajęty, wyświetlany jest stosowny komunikat błędu.

---
- ID: US-002
- Tytuł: Logowanie użytkownika
- Opis: Jako zarejestrowany użytkownik, chcę móc zalogować się do aplikacji przy użyciu mojego e-maila i hasła, abym mógł uzyskać dostęp do moich danych.
- Kryteria akceptacji:
    - Strona logowania zawiera pola na adres e-mail i hasło.
    - Po poprawnym wprowadzeniu danych, jestem przekierowany do głównego widoku aplikacji (listy samochodów).
    - W przypadku wprowadzenia błędnych danych, wyświetlany jest stosowny komunikat błędu.

---
- ID: US-003
- Tytuł: Wylogowanie użytkownika
- Opis: Jako zalogowany użytkownik, chcę móc się wylogować z aplikacji, aby zapewnić prywatność moich danych na współdzielonym urządzeniu.
- Kryteria akceptacji:
    - W interfejsie aplikacji znajduje się wyraźnie oznaczony przycisk "Wyloguj".
    - Po kliknięciu przycisku, moja sesja zostaje zakończona i jestem przekierowany na stronę logowania.

### Zarządzanie samochodami
---
- ID: US-004
- Tytuł: Dodawanie nowego samochodu
- Opis: Jako użytkownik, chcę móc dodać nowy samochód do mojego konta, podając jego nazwę, abym mógł zacząć śledzić jego tankowania.
- Kryteria akceptacji:
    - Formularz dodawania samochodu zawiera pole na jego nazwę (wymagane) i pole na początkowy stan licznika (opcjonalne).
    - Po zapisaniu, nowy samochód pojawia się na mojej liście samochodów.
    - Nie mogę zapisać formularza bez podania nazwy samochodu.

---
- ID: US-005
- Tytuł: Przeglądanie listy samochodów
- Opis: Jako użytkownik, chcę widzieć listę wszystkich moich samochodów wraz z podstawowymi statystykami, abym mógł szybko ocenić ogólną sytuację.
- Kryteria akceptacji:
    - Główny ekran po zalogowaniu wyświetla listę moich samochodów.
    - Każdy samochód jest reprezentowany przez kartę, która wyświetla jego nazwę oraz kluczowe metryki (np. średnie spalanie, całkowity koszt).
    - Kliknięcie na kartę samochodu przenosi mnie do widoku szczegółowego tego samochodu.

---
- ID: US-006
- Tytuł: Edycja danych samochodu
- Opis: Jako użytkownik, chcę mieć możliwość edycji nazwy mojego samochodu, na wypadek gdybym popełnił błąd lub chciał ją zmienić.
- Kryteria akceptacji:
    - W widoku samochodu znajduje się opcja edycji.
    - Mogę zmienić nazwę samochodu i zapisać zmiany.
    - Zaktualizowana nazwa jest widoczna na liście samochodów i w widoku szczegółowym.

---
- ID: US-007
- Tytuł: Usuwanie samochodu
- Opis: Jako użytkownik, chcę móc usunąć samochód z mojego konta, wraz z całą jego historią tankowań, jeśli już go nie posiadam.
- Kryteria akceptacji:
    - W widoku samochodu znajduje się opcja usunięcia.
    - Aby zapobiec przypadkowemu usunięciu, system prosi mnie o potwierdzenie operacji poprzez wpisanie nazwy usuwanego samochodu.
    - Po poprawnym potwierdzeniu, samochód i wszystkie powiązane z nim dane o tankowaniach są trwale usuwane z mojego konta.
    - Po usunięciu jestem przekierowywany do listy samochodów.

### Zarządzanie tankowaniami
---
- ID: US-008
- Tytuł: Dodawanie nowego tankowania
- Opis: Jako użytkownik, chcę móc szybko dodać nowy wpis o tankowaniu dla wybranego samochodu, abym mógł utrzymywać aktualną historię.
- Kryteria akceptacji:
    - Formularz dodawania tankowania zawiera pola: data, ilość paliwa, łączna cena.
    - Formularz pozwala mi wprowadzić przebieg na dwa sposoby: jako aktualny stan licznika lub jako dystans od ostatniego tankowania.
    - Po zapisaniu, nowy wpis pojawia się na górze historii tankowań.
    - System waliduje, czy wprowadzone wartości są numeryczne i większe od zera.
    - W przypadku wprowadzenia stanu licznika niższego niż poprzedni, system wyświetla miękką walidację (ostrzeżenie), ale pozwala zapisać wpis.

---
- ID: US-009
- Tytuł: Przeglądanie historii tankowań
- Opis: Jako użytkownik, chcę przeglądać historię tankowań dla konkretnego samochodu w formie czytelnej siatki, abym mógł łatwo analizować poszczególne wpisy.
- Kryteria akceptacji:
    - Historia tankowań jest wyświetlana jako siatka kafelków.
    - Każdy kafelek pokazuje datę, obliczone spalanie dla danego odcinka oraz przejechany dystans.
    - Lista tankowań ładuje się dynamicznie w miarę przewijania strony w dół (infinite scroll).
    - Jeśli dla danego tankowania nie można obliczyć spalania (np. jest to pierwszy wpis), na kafelku wyświetlany jest odpowiedni komunikat.

---
- ID: US-010
- Tytuł: Edycja wpisu o tankowaniu
- Opis: Jako użytkownik, chcę mieć możliwość poprawienia danych w historycznym wpisie o tankowaniu, jeśli zauważę, że popełniłem błąd.
- Kryteria akceptacji:
    - Kliknięcie na kafelek tankowania w historii przenosi mnie bezpośrednio do formularza edycji tego wpisu.
    - W formularzu mogę zmodyfikować wszystkie dane dotyczące tankowania.
    - Po zapisaniu zmian, jestem przenoszony z powrotem do historii tankowań, a wszystkie statystyki (dla tego i kolejnych wpisów) są automatycznie przeliczane.

---
- ID: US-011
- Tytuł: Usuwanie wpisu o tankowaniu
- Opis: Jako użytkownik, chcę móc usunąć pojedynczy wpis o tankowaniu, jeśli został on dodany przez pomyłkę.
- Kryteria akceptacji:
    - W interfejsie edycji tankowania znajduje się opcja usunięcia wpisu.
    - System prosi o potwierdzenie usunięcia.
    - Po usunięciu wpisu, wszystkie powiązane statystyki są automatycznie przeliczane.

### Statystyki i Onboarding
---
- ID: US-012
- Tytuł: Wizualizacja statystyk na wykresach
- Opis: Jako użytkownik, chcę zobaczyć graficzną prezentację moich danych o spalaniu i kosztach w czasie, abym mógł łatwiej zidentyfikować trendy.
- Kryteria akceptacji:
    - W widoku szczegółów samochodu znajduje się zakładka "Wykresy".
    - W zakładce dostępne są trzy wykresy: spalanie w czasie, cena za litr w czasie, dystans między tankowaniami.
    - Wykresy są czytelne i poprawnie skalują się na różnych urządzeniach.
    - Jeśli nie ma wystarczającej ilości danych do narysowania wykresu, wyświetlany jest komunikat informacyjny.

---
- ID: US-013
- Tytuł: Dynamiczne kolorowanie spalania
- Opis: Jako użytkownik, chcę, aby wartości spalania na kafelkach były kolorowane w zależności od tego, jak bardzo odbiegają od średniej, co pozwoli mi na szybką ocenę efektywności jazdy.
- Kryteria akceptacji:
    - Wartość spalania jest zielona, jeśli jest znacznie niższa od średniej.
    - Wartość spalania jest żółta/pomarańczowa, jeśli jest bliska średniej.
    - Wartość spalania jest czerwona, jeśli jest znacznie wyższa od średniej.
    - Intensywność koloru odzwierciedla stopień odchylenia od średniej, zgodnie z predefiniowanymi progami procentowymi.

---
- ID: US-014
- Tytuł: Onboarding nowego użytkownika
- Opis: Jako nowy użytkownik, po pierwszym zalogowaniu chcę być poprowadzony przez proces dodania pierwszego samochodu i pierwszego tankowania, aby szybko zrozumieć kluczową funkcjonalność aplikacji.
- Kryteria akceptacji:
    - Po rejestracji i pierwszym logowaniu, wyświetlany jest ekran powitalny.
    - Interfejs w jasny sposób kieruje mnie do formularza dodawania nowego samochodu.
    - Po dodaniu samochodu, jestem zachęcany do dodania pierwszego wpisu o tankowaniu.

## 6. Metryki sukcesu

Sukces wersji MVP będzie mierzony na podstawie osiągnięcia następujących, kluczowych wskaźników aktywacji i zaangażowania użytkowników. Metryki te potwierdzą, że produkt rozwiązuje realny problem i dostarcza wartość.
1.  Aktywacja użytkownika: Użytkownik pomyślnie dodał co najmniej jeden samochód do swojego konta.
2.  Zaangażowanie początkowe: Użytkownik wprowadził co najmniej dwa wpisy o tankowaniu dla dowolnego ze swoich samochodów. Oznacza to, że możliwe jest obliczenie pierwszego wskaźnika spalania, co stanowi kluczową wartość aplikacji.
