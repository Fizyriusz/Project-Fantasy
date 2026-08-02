# 05 — Ekwipunek i crafting

## Model przedmiotu [USTALONE]

**Instancje, nie liczniki.** Kusi, żeby trzymać ekwipunek jako `{konserwa: 3}`.
Nie zadziała: każda konserwa ma własną datę ważności, każdy młotek własne zużycie,
każdy bandaż własny stan zabrudzenia.

- domyślnie **każdy przedmiot to osobny obiekt ze stanem**
- **stosy tylko dla rzeczy bezstanowych**: gwoździe, amunicja, śrubki

Zaczynając od liczników, przy pierwszym psującym się jedzeniu przepisuje się cały system.

## Zarządzanie miejscem [USTALONE — waga, docelowo sloty]

Na start **waga**, jak w Project Zomboid. Docelowo **sloty na ciele**.

Żeby przejście nie bolało, jeden zabieg od pierwszego dnia:
**kontener nigdy nie „należy do gracza", tylko jest przyczepiony do punktu na ciele**
(plecy, pas, uda, klatka).

Na starcie wszystkie punkty wpadają do wspólnej puli wagowej, a UI pokazuje płaską
listę — czyli faktycznie PZ. Przy przejściu na sloty zmienia się widok i reguły
pojemności, **nie model danych**.

### Przeciążenie — miękkie kary, nie twardy limit
Im bliżej maksimum, tym wolniejszy ruch i szybsza utrata staminy. Przeciążony gracz
**może się przenieść, ale nie ucieknie**. To jest cała treść tej mechaniki.

Waga wymusza prawdziwe decyzje: apteczka czy trzecia konserwa. Siatka typu Tetris
tego nie robi — zamienia przetrwanie w układankę.

## Ręce [USTALONE]

Osobny, **dwuslotowy kontener**. Latarka zajmuje rękę. Broń dwuręczna zajmuje obie.

Konsekwencja: w jamie goblinów gracz wybiera **światło albo siekierę**.
Ta jedna zasada uzasadnia całą lokację podziemną (patrz `03`).

## Kontenery

- **zagnieżdżanie tylko o jeden poziom** — plecak może zawierać przedmioty,
  ale nie drugi plecak. Bez tej reguły gracze zrobią matrioszkę i obejdą wagę
- kontenery w świecie: szafki, lodówki, bagażniki, zwłoki
- **ubranie ma pojemność** — kurtka jednocześnie zakrywa tors i ramiona
  (warstwy pancerza, patrz `04`) i daje kilka kilogramów kieszeni.
  Jeden typ przedmiotu obsługuje obie mechaniki, więc kamizelka taktyczna jest
  cennym łupem z dwóch powodów naraz

## Interfejs ekwipunku

Najcięższy element UI w całym projekcie — warto zaplanować na niego realny czas.

- dwa panele: przy sobie / kontener w świecie
- przenoszenie zajmuje **czas w grze**, nie jest natychmiastowe
- „zabierz wszystko" jako osobny przycisk, bo bez tego szabrowanie jest mordęgą
- sortowanie po wadze, typie, świeżości

## Crafting

### Wiedza jako główne ograniczenie [USTALONE]

Postać zna kilkanaście podstaw. **Recepty nieznane są całkowicie niewidoczne.**
Reszta przychodzi z książek, notatek, instrukcji obsługi i rozbierania cudzych
konstrukcji.

Ryzyko tego rozwiązania: gracz nie wie, czego szukać, i uznaje, że craftingu nie ma.
Cztery rzeczy to neutralizują:

1. **Demontaż uczy budowania.** Rozbierasz cudzą barykadę — poznajesz recepturę.
   Świat staje się samouczkiem, bez ani jednego okienka tutorialowego.
   To najmocniejszy element całego układu.
2. **Książki mówią, czego uczą, zanim je przeczytasz.** „Podręcznik ciesielstwa cz. I"
   na półce to konkretny cel, nie loteria.
3. **Dziennik znanych receptur** z listą brakujących materiałów. Ukryte znaczy
   nieodkryte, nie zapomniane.
4. **Podpowiedzi w opisach przedmiotów** — „wygląda, jakby dało się to rozłożyć".

**Efekt uboczny wart odnotowania:** skoro wiedza siedzi w postaci, to w multiplayerze
gracze **naturalnie się specjalizują**. Ktoś jest od elektryki, ktoś od medycyny —
bez żadnego systemu klas. Warunek: wiedza per postać, nieprzenoszalna inaczej
niż przez uczenie drugiego gracza.

### Struktura receptury [USTALONE]

Dwie **osobne** listy:

```
Receptura {
  narzędziaWymagane[]   // muszą być obecne, tępieją, NIE znikają
  składnikiZużywane[]   // znikają
  stanowisko            // null | warsztat | kuchnia | ...
  czas
  hałas
  wymaganaWiedza
  wymaganaUmiejętność
}
```

To rozdzielenie musi być w danych od początku — dopisane później rozjeżdża wszystkie
istniejące recepty.

### Demontaż jako główne źródło surowców [USTALONE]

Nie rozsypujemy złomu po świecie. Gracz rozbiera **meble, drzwi, ogrodzenia, sprzęt AGD**.

Wtedy każde wnętrze jest zasobem, a gracz patrzy na szafę i widzi deski.
To także jedyny sensowny sposób na późniejsze pojazdy.

### Czas i hałas [USTALONE]

Crafting kosztuje czas w grze i **generuje hałas**. Skoro dźwięk jest głównym
wektorem aggro (patrz `03`), barykadowanie okna młotkiem musi ściągać ghouli.

To zamienia crafting z menu w decyzję taktyczną: cicha praca w dzień w bezpiecznym
miejscu albo ryzyko.

Czynność przerywalna, z utratą części materiałów.

## Trwałość [USTALONE — procent]

Pasek procentowy, ale **z podwójnym dnem**:

**Wyszarzona końcówka paska oznacza maksimum utracone przez naprawy.**
Nowa siekiera ma pełny pasek. Po trzeciej naprawie ostatnie 40% jest szare
i nigdy nie wróci.

Gracz widzi śmierć przedmiotu, zanim ona nastąpi, i sam decyduje, kiedy przestać go
ratować. Zero tekstu, cała informacja.

- **poniżej 30%** narzędzie może pęknąć w trakcie użycia — skoro dajemy liczbę,
  niech będzie na czym planować
- naprawa wymaga narzędzia, materiału i umiejętności; jakość naprawy zależy od
  umiejętności
- każda naprawa przywraca mniej niż poprzednia

Przedmioty mają skończone życie i to napędza całą pętlę szabrowania. Bez tego
gracz po dwóch tygodniach nie ma powodu wychodzić z bazy.

## Jedzenie i woda

- świeżość jako osobny timer na instancji przedmiotu
- etapy: świeże → nieświeże → zepsute → trujące
- gotowanie przedłuża i poprawia wartość, ale wymaga źródła ciepła
- woda z kranu działa, dopóki działa wodociąg [OTWARTE — po ilu dniach pada]
