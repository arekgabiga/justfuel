## Ten dokument zawiera liste znalezionych bledow, ktore musza zostac poprawione.

---

- ID: BUG-13
- Podczas edycji danych samochodu, jesli bez zmian klikne w "Zapisz", pojawia sie informacja "Nie wprowadzono żadnych zmian" i przycisk "Zapisz" zostaje zablokowany. Po tym, jakakolwiek zmiana nie jest mozliwa, poniewaz przycisk jest ciagle zablokowany, mimo, ze nazwa, czy preferencja wprowadzania przebiegu zostaje zmieniona. Przycisk powinien sie odblokowac, jesli cos sie zmieni.

---

- ID: BUG-14
- Opis: Kolorowanie tankowan powinno byc w zaleznosci od sredniej dla samochodu.

## 🎨 System Kolorowania Danych o Spalaniu (Metoda Progowa)

Niniejszy system kolorowania ma na celu wizualne zróżnicowanie wyników poszczególnych tankowań na tle ogólnej średniej spalania pojazdu. Kolory przechodzą płynnie od **Ciemnej Zieleni** (najlepszy wynik/najniższe spalanie) do **Bordowego** (najgorszy wynik/najwyższe spalanie).

### ⚙️ Logika i Progi Kolorystyczne

Do przypisania koloru używamy różnicy spalania danego tankowania w stosunku do **Średniej Samochodu (ŚS)**.

| Kolor (Wizualizacja) | Nazwa Progowa        | Kryterium Różnicy (Δ)                        | Opis                                                    |
| :------------------- | :------------------- | :------------------------------------------- | :------------------------------------------------------ |
| Ciemna Zieleń        | EKSTREMALNIE NISKIE  | Tankowanie < (ŚS - 1,0 l/100km)              | Znacząco lepsze niż średnia. Największa oszczędność.    |
| Jasna Zieleń         | BARDZO NISKIE        | (ŚS - 1,0) ≤ Tankowanie < (ŚS - 0,5 l/100km) | Wyraźnie lepsze niż średnia. Duża oszczędność.          |
| Jasna Żółto-Zieleń   | LEKKO NISKIE         | (ŚS - 0,5) ≤ Tankowanie < ŚS                 | Nieznacznie lepsze niż średnia. Delikatna oszczędność.  |
| Żółty                | NEUTRALNE            | ŚS ≤ Tankowanie < (ŚS + 0,2 l/100km)         | Wynik w granicach normy/blisko średniej.                |
| Pomarańczowy         | LEKKO WYSOKIE        | (ŚS + 0,2) ≤ Tankowanie < (ŚS + 0,5 l/100km) | Nieznacznie gorsze niż średnia. Wymaga uwagi.           |
| Średnia Czerwień     | BARDZO WYSOKIE       | (ŚS + 0,5) ≤ Tankowanie < (ŚS + 1,0 l/100km) | Wyraźnie gorsze niż średnia. Duże zużycie paliwa.       |
| Bordowy              | EKSTREMALNIE WYSOKIE | Tankowanie ≥ (ŚS + 1,0 l/100km)              | Znacząco gorsze niż średnia. Alarmujące zużycie paliwa. |

> **Uwaga:** Wartości progowe (1,0 l/100km, 0,5 l/100km, 0,2 l/100km) są przykładami i powinny zostać dostosowane do realnej zmienności zużycia paliwa w danym pojeździe.

---

- ID: BUG-15
- Opis: Zgodnie z historyjka US-009 z @prd.md, lista tankowan powinna byc siatka kafelkow. Wyswietlaj po 3 kafelki w rzedzie. Jesli na malym ekranie nie mieszcza sie 3, to responsywnie moze zmniejszac sie do 2

---
