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

---

## Noc jest jaśniejsza, niż powinna

**Data:** 2026-08-18
**Faza:** Faza I, Etap 1 („Świat") — krok 10 z 10, czyli koniec etapu. Nadal
jeden testowy dom, bez przedmiotów, mebli i mobów. **Nie ma latarki ani
żadnego innego światła, które gracz mógłby nieść** — pierwsze takie źródło
przewiduje `06-roadmapa.md` dopiero w Etapie 3.

**Czego dotyczy:** noc świeci mocniej, niż powinna. Trawa o 02:00 ma około 40%
jasności południowej i wyraźnie niebieski odcień. Prawdziwa noc byłaby dużo
ciemniejsza.

**Dlaczego na razie OK:** przy obecnej zawartości gry uczciwa noc znaczy kilka
minut na godzinę, przez które nie da się grać w ogóle — nie ma czym poświecić.
Kolor robi tu robotę, której nie może zrobić ciemność: niebieski odcień mówi
„noc", a jasność zostaje na poziomie pozwalającym chodzić.

**Osobna sprawa:** wewnątrz budynku jest **dokładnie tak samo jasno jak na
zewnątrz**, bo światło rozproszone jest jedno na cały świat. To będzie wyglądać
źle w dzień (wnętrze powinno być ciemniejsze) i bezsensownie w nocy.

**Co obserwować:**

- **Gdy pojawi się latarka** (Etap 3) — o ile da się przyciemnić noc, żeby
  latarka miała sens, a gra nadal dała się prowadzić. To jest właściwy moment
  na przepisanie tabeli w `packages/client/src/render/daylight.ts`.
- **Wnętrza kontra dwór** — czy wystarczy przyciemnić pomieszczenia bez okien,
  czy trzeba prawdziwego światła wpadającego przez okna. To drugie jest dużo
  droższe.
- **Widoczność mobów w nocy.** `03-swiat-i-mobki.md` mówi, że „światło w nocy
  jest widoczne z dużej odległości i to ma być realny problem" — przy jasnej
  nocy ta zasada nie ma jak zadziałać.
- **Długość doby.** Ustalona na 60 realnych minut, zgodnie z decyzją autora dla
  wersji wypuszczanej do szerszych testów. Do sprawdzenia, czy w codziennej
  pracy nad grą nie jest to męczące — od tego jest suwak.

**Kiedy wrócić:** przy Etapie 3, razem z pierwszym przenośnym źródłem światła.
Wcześniej nie ma czym tego zastąpić.
