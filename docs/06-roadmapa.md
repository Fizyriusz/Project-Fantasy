# 06 — Roadmapa

Ramy czasowe są orientacyjne i zakładają pracę w pojedynkę, nieregularną.
Kolejność ma znacznie większe znaczenie niż daty.

---

## FAZA I — Rdzeń (0–6 mies.)

Cel: **vertical slice**. Nie gra, nie demo dla ludzi. Dowód, że pętla działa.

### Etap 0 — Feel
Płaska plansza, jedna postać, kamera ortograficzna z obrotem, sterowanie,
kolizje ze ścianami. Nic więcej.

> **Kryterium przejścia:** chodzenie po pustej mapie jest przyjemne samo w sobie.
> Jeśli nie jest — popraw, zanim dołożysz cokolwiek. Wszystko późniejsze stoi na tym.

### Etap 1 — Świat
Siatka kafli, ściany, podłogi, drzwi, okna. Budynki wielopiętrowe.
**Ukrywanie ścian i dachów** zasłaniających gracza. Cykl dnia i nocy, oświetlenie.

> Zaplanuj realny czas na ukrywanie zasłon. To nie jest jednodniowe zadanie.

### Etap 2 — Pierwszy mob i walka wręcz
Tylko T0. Aggro na wzrok i dźwięk, atak, HP, odepchnięcie, przepychanie się mobów.

> **Kryterium:** znaleziony jest próg liczebności, przy którym gracz musi uciekać.
> Walka z 1, z 3 i z 10 to trzy różne gry — wszystkie trzy mają działać.

### Etap 3 — Przetrwanie i ekwipunek
Głód, pragnienie, zmęczenie, temperatura. Kontenery, loot, waga, przenoszenie, torby.

> Najbardziej pracochłonne UI w projekcie. Nie doceń tego, a utkniesz na miesiąc.

### Etap 4 — Crafting i budowanie
Recepty jako dane. Barykady na okna, naprawa ścian, warsztat, demontaż mebli.

### Etap 5 — Obrażenia i leczenie
Rany lokalizowane, krwawienie, złamania, bandaże, dezynfekcja.
Licznik mutacji po ugryzieniu.

### Etap 6 — Domknięcie slice'a
Jeden kwartał miasta. T0 + T1. Zapis i wczytywanie gry.

> **Kryterium wyjścia z Fazy I:** da się przeżyć dwa tygodnie w grze i mieć z tego
> historię do opowiedzenia.

---

## FAZA II — Świat żyje (6–12 mies.)

7. **Dźwięk jako pełny system** — propagacja, kaskada aggro, migracja hord, meta-zdarzenia
8. **Progresja mutacji w czasie** → wejście T2 i T3
9. **Umiejętności** — nauka przez używanie, książki, degradacja przy braku praktyki
10. **Broń dystansowa** — amunicja, celowanie, hałas jako realny koszt
11. **Głębia medyczna** — szycie, ciała obce, antybiotyki, amputacja
12. **Generowanie miasta proceduralne** (dopiero teraz — wcześniej nie wiadomo,
    co czyni wnętrze ciekawym)
13. **Pogoda i pory roku**

---

## FAZA III — Multiplayer (12–18 mies.)

14. Serwer autorytatywny w Node, 2–4 graczy w LAN
15. Reconciliation, interpolacja, kompensacja opóźnień
16. Serwery publiczne, podstawowy anty-cheat
17. Bazy współdzielone, uprawnienia, persystencja świata między sesjami

> Architektura z Fazy I ma sprawić, że to jest podmiana transportu, nie przepisanie gry.
> Jeśli okaże się inaczej — coś poszło źle w etapie 0–2.

---

## FAZA IV — Głębia (18+ mies.)

18. **Gniazda** — jama goblinów, obozowisko orków, kradzieże z bazy gracza
19. **Pojazdy** — paliwo, awarie, kolizje, transport ciężarów, hałas
20. **NPC ocalali** — frakcje, handel, wrogość
21. **Elektryka i infrastruktura** — generatory, instalacje, uprawy, hodowla
22. **Wsparcie dla modów**

---

## Backlog — do rozważenia kiedyś

- pory roku wpływające na mutację (zimą wolniejsi, latem agresywniejsi)
- radio i papierowa mapa **zamiast** elementów UI
- tryb hardcore: jedno życie na serwer
- **spuścizna** — nowa postać startuje w bazie poprzedniej, z jej zapasami i zwłokami
- moby zachowujące ślady dawnego zachowania (wracają do domu, tłoczą się przy kasach)
- system reputacji zapachowej — mob pamięta trop
- rozbudowane budowanie: instalacje, pułapki, systemy alarmowe

---

## Czego świadomie nie robimy w Fazie I

Pojazdy, proceduralne miasto, drzewka umiejętności, dialogi, NPC, T2/T3, gniazda,
multiplayer, generowanie dźwięku 3D, elektryka.

Project Zomboid ma za sobą kilkanaście lat pracy zespołu. Każda z tych rzeczy
dorzucona przed domknięciem slice'a to miesiąc, po którym pętla nadal nie działa.
