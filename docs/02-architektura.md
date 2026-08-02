# 02 — Architektura

## Zasada nadrzędna [USTALONE]

**Symulacja jest całkowicie oddzielona od renderowania.** To jedyna decyzja w całym
projekcie, której naprawa w późniejszym etapie oznacza przepisanie gry.

## Struktura repozytorium

Monorepo, pnpm workspaces.

```
packages/
  shared/   typy, definicje przedmiotów, recepty, protokół wiadomości
  sim/      cała logika gry — ZERO importów Three.js
  client/   Three.js, input, UI, dźwięk
  server/   (Faza III) hosting sim w Node
```

**Twarda reguła:** w `packages/sim` nie może pojawić się ani jeden import z `three`.
Warto to wymusić lintem od pierwszego dnia, bo naruszenie jest łatwe i niewidoczne.

## Pętla symulacji [USTALONE]

- **Fixed timestep, 20 tick/s.** Renderowanie osobno, z interpolacją między tickami.
- **Seedowany RNG.** Żadnego `Math.random()` w `sim`. Jedno źródło losowości,
  przekazywane jawnie. Bez tego nie ma powtarzalnych bugów ani multiplayera.
- **Brak zależności logiki od `deltaTime`.** Tick jest tickiem.
- Czas gry płynie szybciej niż rzeczywisty, ze zmiennym mnożnikiem [OTWARTE].

## Transport [USTALONE]

W singleplayerze `sim` chodzi **w Web Workerze** i komunikuje się z klientem
przez ten sam protokół wiadomości, którego później użyje WebSocket.

Konsekwencja: multiplayer to „podmień transport i odpal sim w Node", a nie
„przepisz grę". Nawet grając solo, gracz gra w architekturze klient-serwer.

Wiadomości: klient wysyła **intencje** (chcę iść tam, chcę uderzyć), nigdy stany.
Sim odsyła snapshoty i zdarzenia.

## Świat i kolizje [ROBOCZE]

Bez pełnej fizyki 3D. Project Zomboid jest w istocie grą 2D na piętro — kopiujemy to.

- Świat to **siatka kafli**, piętra jako dyskretne poziomy całkowite
- Kolizje w płaszczyźnie **XZ**: okręgi (postacie) i AABB (ściany, meble)
- Brak grawitacji, brak ragdolli, brak pochyłości
- Przejścia między piętrami tylko przez zdefiniowane punkty (schody, dziury, drabiny)

To pozwala trzymać setki aktorów przy stałym budżecie CPU.

## Pathfinding [ROBOCZE]

- **A\* na siatce** dla pojedynczych mobów z własnym celem
- **Flow field** dla hordy zbiegającej się do jednego punktu — jedno przeliczenie
  obsługuje 200 mobów zamiast 200 osobnych ścieżek
- Przeliczanie regionami, nie całą mapą
- Ścieżki liczone poza tickiem krytycznym, wynik odbierany asynchronicznie

## Renderowanie [ROBOCZE]

- **Instancing** dla mobów i powtarzalnej geometrii — to jest różnica między
  30 a 300 przeciwnikami na ekranie
- Chunkowanie świata, ładowanie i zwalnianie wokół gracza
- **Ukrywanie zasłon:** ściany i dachy między kamerą a graczem. Do rozwiązania
  na etapie 1 i zaplanowania na to realnego czasu — to nie jest jednodniowe zadanie.
  Podejście robocze: pomieszczenia jako zdefiniowane bryły, gracz „jest w pomieszczeniu",
  dach i ściany od strony kamery znikają dla całego pomieszczenia naraz.
  Alternatywa (przezroczystość na podstawie raycastu) daje gorszą czytelność.
- Cykl dnia i nocy jako oświetlenie kierunkowe + ambient, plus punktowe źródła
  (latarka, ognisko, generator)

## Wydajność — budżety orientacyjne [OTWARTE]

| Metryka | Cel roboczy |
|---|---|
| Aktorzy w symulacji | ~500 aktywnych, reszta w uproszczonym trybie |
| Aktorzy renderowani | ~150 na ekranie |
| Tick symulacji | < 15 ms |
| Klatki | 60 fps na średnim sprzęcie |

Moby poza zasięgiem gracza przechodzą w **tryb uproszczony**: nie mają pełnego
pathfindingu ani animacji, tylko pozycję i przybliżony ruch w stronę celu.

## Assety

- **Quaternius**, **Kenney** — CC0, low-poly, spójne stylistycznie
- **Synty** — jeśli pojawi się budżet
- **Mixamo** — animacje humanoidalne

Wszystkie modele trzymamy w jednej skali i jednej konwencji osi od początku.
Poprawianie tego przy 200 modelach to strata tygodnia.

## Dane, nie kod [USTALONE]

W plikach JSON/TS-as-data, nie w logice:
- definicje przedmiotów
- recepty craftingu
- typy ran i stanów
- definicje mobów i ich statystyki
- wszystkie wartości balansu

Powód praktyczny: balans wymaga setek iteracji, a każda rekompilacja to zmarnowana
minuta. Powód dalekosiężny: to jest fundament pod moddowanie (Faza IV).

## Zapis stanu [ROBOCZE]

Serializacja stanu `sim`, nie sceny renderera. Chunki zapisywane osobno,
z czasem ostatniej wizyty — potrzebne do symulowania tego, co się działo
pod nieobecność gracza (rozkład jedzenia, wędrówka mobów).
