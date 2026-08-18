# 08 — Do obserwacji

Rzeczy, które **działają i zostają tak, jak są**, ale co do których nie mamy
pewności, czy obronią się później. To nie jest lista błędów ani backlog — na
błędy jest naprawa, na pomysły roadmapa. Tu trafia to, co wygląda dobrze
**dzisiaj**, przy dzisiejszej zawartości gry, i czego prawdziwy test dopiero
przyjdzie.

Wpis stąd znika na dwa sposoby: albo po sprawdzeniu w docelowych warunkach
uznajemy go za zamknięty, albo zamienia się w zadanie i idzie do roadmapy.

## Format wpisu

Data, faza projektu w chwili wpisu, czego dotyczy, dlaczego na razie jest OK,
**co konkretnie ma być sprawdzone** i **kiedy** — czyli po jakiej zmianie w grze
warto do tego wrócić.

---

## Praca kamery na ścianach — chowanie zasłon

**Data:** 2026-08-18
**Faza:** Faza I, Etap 1 („Świat") — krok 9 z 10. Zostaje cykl dnia i nocy.
Świat to jeden testowy dom na pustej działce. **Nie ma jeszcze przedmiotów,
mebli, mobów ani animacji postaci** — czyli nie ma niczego, co te ściany będą
naprawdę zasłaniać.

**Czego dotyczy:** ściany stojące między kamerą a graczem opadają do niskiego
progu (domyślnie 0,5 m) zamiast znikać. Jednostką jest **pomieszczenie**, w
którym stoi gracz — opadają dwie z czterech jego ścian, te od strony kamery.
Drzwi i okna opadają razem ze ścianą. Przejście widać jako przerwę w progu.

**Dlaczego na razie OK:** w pustym domu rzut pomieszczenia czyta się dobrze,
widać gdzie wolno przejść, nic nie miga. Wariant „znika całkowicie" został
odrzucony, bo dawał niewidzialne ściany i niewidoczne przejścia.

**Co obserwować, gdy pojawi się zawartość:**

- **Meble i przedmioty na podłodze** — czy próg 0,5 m nie zasłania tego, co
  leży tuż za nim. To jest najbardziej prawdopodobny powód do obniżenia progu.
  Suwak „Wysokość progu" w panelu strojenia jest właśnie do tego.
- **Przeciwnicy** — czy widać moba stojącego tuż za opadniętą ścianą i czy
  widać, że jest po drugiej stronie, a nie w tym samym pomieszczeniu. Od tego
  zależy, czy walka przy ścianie jest czytelna.
- **Sąsiednie pomieszczenia** — dziś opada tylko pokój gracza, więc pokój obok
  zostaje zasłonięty. Przy mobach może się okazać, że trzeba widzieć dalej niż
  własne cztery ściany. Zmiana jednostki chowania z pomieszczenia na całą
  kondygnację to podmiana funkcji `hidingGroupOf` w
  `packages/client/src/render/occlusion.ts` — oba warianty są tam opisane.
- **Schodek w linii muru** — gdy ściana biegnie przez dwa pomieszczenia, jedna
  jej połowa jest niska, a druga wysoka. Dziś czyta się to dobrze na gołych
  ścianach; z fakturami i meblami może wyglądać inaczej.
- **Balustrady przy schodach nie opadają** — rysuje je kod schodów, nie kod
  ścian. Mają 95 cm, więc dziś zasłaniają niewiele. Do sprawdzenia, gdy na
  schodach stanie mob albo gdy pojawią się balkony.
- **Płynność 200 ms** — czy przy szybkim przebieganiu między pomieszczeniami
  opadanie i podnoszenie nie miga.

**Kiedy wrócić:** najpóźniej po Etapie 2 (pierwszy mob) i po Etapie 3
(ekwipunek, przedmioty na podłodze). Wcześniej nie ma czego testować.
