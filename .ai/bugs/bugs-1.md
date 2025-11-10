## Ten dokument zawiera liste znalezionych bledow, ktore musza zostac poprawione.

---

- ID: BUG-1
- Opis: Obecna strona glowna nie ma sensu, jest to demo strona. Po wejsciu do aplikacji, glowna strona powinna byc lista samochodow.

---

- ID: BUG-2
- Opis: Tankowania powinny istniec tylko pod zakladka "tankowania". Obecnie, po dodaniu tankowania, powrot jest na /cars/{carId}/fillups - jest to bledne zachowanie, uzotkownik powininen powrocic na strone /cars/{carId} z zaznaczona zakladka fillups. Sprawdzic, czy edycja tankowania wraca do zakladki.

---

- ID: BUG-3
- Opis: Breadcrumbs nie mieszcza sie na ekranach mobilnych. Jedyne bradcrumbs to powinny byc /Auta, /Auta/{nazwa_auta}, ew dodatkowe z tankowaniem, czyli /Auta/{nazwa_auta}/Tankowanie

---

- ID: BUG-4
- Opis: Breadcrumbs nie mieszcza sie na ekranach mobilnych. Jedyne bradcrumbs to powinny byc /Auta, /Auta/{nazwa_auta}, ew dodatkowe z tankowaniem, czyli /Auta/{nazwa_auta}/Tankowanie

---

- ID: BUG-5
- Opis: Dystans przejechany "distance_travelled", ktory jest w bazie jako numeric, musi dac sie podac na stronie z tankowaniem jako liczbe z dokladnoscia do 2 miejsc po przecinku

---

- ID: BUG-6
- Opis: Przy edycji tankowania, tryb wprowadzania przebiegu powinien byc ustawiony taki, jak jest domyslnie w konfiguracji auta

---

- ID: BUG-7
- Opis: Kafelek z listy tankowan powinien zawierac Data, Spalanie, Dystans, Cena za litr. Jesli podczas tankowania zostal wprowadzony stan licznika, to rowniez powinien zostac wyliczony Dystans od poprzedniego tankowania i zaprezentowany pod Dystans na kafelku. Statystyke "Licznik" mozna usunac.

---

- ID: BUG-8
- Opis: Kafelek z samochodem na liscie samochodow nie powininen posiadadac przycisku "Zobacz szczegoly" poniewaz dubluje akcje, ktora dzieje sie po nacisnieciu kafelka.

---

- ID: BUG-9
- Opis: Srednie spalanie na kafelku samochodu nie powinno miec czerwonego koloru, poniewaz wskazuje to na jakis problem. Zrob kolor bardziej pasujacy to kolorystki i akcentow w aplikacji.

---

- ID: BUG-10
- Opis: Sortowanie przez uzytkownika na liscie samochodow nie ma sensu. Ustaw domyslne sortowanie po nazwie, bez mozliwosci zmiany przez uzytkownika

---

- ID: BUG-11
- Opis: Lista tankowan powinna byc zawsze sortowana po dacie tankowania, czyli po polu "date" w bazie, a nie po polu utworzenia wpisu "created_at"

---

- ID: BUG-12
- Opis: W fillups.service.ts wszelkie operacje na tankowaniach wymagajacych szukania poprzedniego tankowania lub historii tankowan powinny opierac sie na polu "date" a nie odometer, aby miec pewnosc, ze znajdujemy poprzednie tankowanie w czasie. Dotyczy to rowniez przeliczania statystyk po aktualizacji tankowania - zawsze trzeba wziac pod uwage "date" i szukac tankowan na tej podstawie.
