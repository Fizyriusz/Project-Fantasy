# 04 — Ciało, obrażenia, leczenie

## Zasada podziału [USTALONE]

**Część ciała istnieje tylko wtedy, gdy ma własną konsekwencję.**
Jeśli uszkodzenie dwóch miejsc robi to samo — to jedno miejsce.

## Lokalizacje (13)

| Część | Konsekwencja uszkodzenia |
|---|---|
| Głowa | utrata przytomności, zamglony obraz, wysoka śmiertelność |
| **Szyja** | najszybsze wykrwawienie, prawie niemożliwa do opancerzenia |
| Tułów | główna pula HP, duszność → spadek staminy |
| Ramię L / P | mniejsze obrażenia w zwarciu, drżenie celownika |
| Dłoń L / P | wypuszczanie broni, wolniejsze przeładowanie i crafting |
| Udo L / P | prędkość |
| Łydka L / P | prędkość, kulawość |
| Stopa L / P | prędkość, ból przy każdym kroku |

**Podział na lewą i prawą ma sens wyłącznie dzięki ręce dominującej.** Rana prawej
dłoni u praworęcznego to inna sytuacja niż lewej. Gdyby dominującej nie było,
należałoby zrobić jedną „rękę" i oszczędzić połowę interfejsu.

## Model danych [USTALONE]

Część ciała to **nie liczba HP**. To HP **plus lista ran**, gdzie rana jest osobnym
obiektem ze stanem:

```
Rana {
  typ           // ugryzienie | cięcie | zadrapanie | stłuczenie | złamanie | oparzenie | przekłucie
  głębokość
  zabrudzona    // bool — decyduje o ryzyku infekcji bakteryjnej
  ciałoObce     // np. odłamek szkła — blokuje gojenie do usunięcia
  zszyta        // bool
  opatrunek     // null | { czystość, wiek }
  wiek          // w tickach
}
```

Jedno przedramię może **jednocześnie** krwawić, być złamane i mieć w środku szkło.
To jest sedno systemu — rany się kumulują, nie zastępują.

## Stany [USTALONE]

Warstwa nad ranami. Krwawienie, złamanie, infekcja bakteryjna, gorączka, ból,
wstrząs, przeziębienie i **mutacja** to ten sam typ danych:

```
Stan {
  id
  przyczepionyDo    // część ciała | cała postać
  tick()            // co robi w każdym ticku
  leczonyPrzez[]    // lista przedmiotów/zabiegów
  uleczalny: bool
  timer
}
```

**To jest odpowiedź na pytanie o mutację.** Mutacja to po prostu stan z pustą listą
`leczonyPrzez` i `uleczalny: false`. Jeśli kiedyś zapadnie decyzja, że da się ją
zatrzymać — dopisuje się jeden przedmiot do tablicy. Zero refaktoru.

Warunek: stany muszą być **danymi od pierwszego dnia**, nigdy ifami w kodzie.

## Zakażenie [USTALONE]

- **Ugryzienie zaraża zawsze.** Gracz to widzi i wie.
- **Zadrapanie ma szansę** — i gracz **nie wie, którą**.

Przez kilka dni siedzi z gorączką i nie ma pojęcia, czy to zwykła infekcja
bakteryjna, czy koniec. To jest cała groza tej mechaniki i kosztuje jednego boola.

Zarażenie jest nieodwracalne. Postać ginie i **zostaje w świecie jako mob** —
w swoim ekwipunku, w miejscu, gdzie padła.

Długość timera mutacji: **[OTWARTE]**, patrz dokument 07. Jedyne twarde wymaganie:
musi wystarczyć na ostatnią wyprawę. Jeśli po ugryzieniu zostaje wyłącznie patrzenie
na pasek, równie dobrze można by zabijać postać od razu.

### Multiplayer
Zarażony wie. Grupa nie wie. Czy powie — to najciekawsza decyzja, jaką ta gra
może postawić przed graczem, i nie wymaga ani jednej linijki dodatkowego kodu.

## Amputacja [FAZA II/III]

Mutacja **startuje w konkretnej kończynie i pełznie w górę**. Ugryzienie w dłoń
daje okno czasowe, zanim przejdzie wyżej. W tym oknie można odciąć kończynę.

Bez znieczulenia. Z ryzykiem wykrwawienia. Z trwałą utratą do końca gry.

To **nie jest lekarstwo** — zasada „zaraziłeś się, koniec" pozostaje nienaruszona.
Ale zamiast „ugryzienie = zrób nową postać" gra generuje najlepszą scenę, na jaką
ją stać. Automatycznie tłumaczy też, dlaczego ugryzienie w szyję lub tors jest
bezapelacyjne: nie ma czego odciąć.

Wymaga wcześniejszego ustalenia, gdzie fizycznie siedzi timer mutacji — dlatego
warto o tym wiedzieć już teraz, mimo że implementacja jest odległa.

## Głębia medyczna [FAZA II]

Kolejność wprowadzania: **bandaż → dezynfekcja → usuwanie ciał obcych → szycie →
szyny na złamania → antybiotyki → amputacja**.

- opatrunek się brudzi i wymaga wymiany
- brudny opatrunek jest gorszy niż żaden
- szycie zamyka ranę, ale zabrudzoną ranę zaszywa się razem z infekcją
- każdy zabieg wymaga narzędzia i wolnych rąk

## Pancerz jako warstwy [USTALONE]

**Nie ma mapowania 1:1 „kurtka → tors".** Każdy element odzieży ma procentowe
pokrycie wielu części:

```
Kurtka skórzana:   tors 100%, ramiona 85%, szyja 15%
Rękawice robocze:  dłonie 100%, przedramię 20%
Buty robocze:      stopy 100%, łydki 30%
```

Trafienie losuje część ciała, po czym system idzie warstwa po warstwie i sprawdza,
czy dana warstwa **akurat to miejsce zakrywa**.

Efekt: **szyja jest naturalnie odsłonięta**, bez wpisywania tego jako osobnej reguły.
To najlepszy lewar napięcia w grze — szalik, wysoki kołnierz, prowizoryczny obojczyk
ze skóry stają się przedmiotami, na które gracze polują, bo ugryzienie w szyję
to wyrok bez możliwości amputacji.

### Typy obrażeń i odporności
Osobne wartości dla: **ugryzienie / cięcie / zadrapanie / obuch**.
Kurtka skórzana świetnie trzyma zęby i kompletnie nie trzyma pałki.

### Koszt warstw
Każda warstwa kosztuje: **waga, przegrzanie, hałas, spowolnienie**.
Pełne opancerzenie w lipcu ma zabijać udarem. To jest jedyne, co powstrzymuje
gracza przed noszeniem wszystkiego naraz.

### Zużycie
Warstwa przyjmująca trafienie traci trwałość lokalnie. Przetarty rękaw przestaje
chronić przedramię, choć reszta kurtki jest cała [ROBOCZE — do zweryfikowania,
czy nie jest to zbyt drobiazgowe].
