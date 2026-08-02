# 03 — Świat i zmutowani

## Zasada taksonomii [USTALONE]

**Nie ma osobnych gatunków. Jest jeden organizm w różnych stadiach.**

Mutacja stopniowo trawi tkankę miękką. To, co gracze nazywają szkieletem, to ten sam
człowiek rok później — wysuszony, żylasty, minimalna masa, szybki i kruchy.

Dzięki temu **stadium jest jednocześnie licznikiem czasu w świecie**. Szkielet jest
naturalnie rzadki w dniu 10 i pospolity w dniu 200. Krzywa trudności wynika z fikcji,
nie z ręcznego skalowania.

## Ścieżka główna

| | Slang | Czym jest | Zachowanie | Pojawia się |
|---|---|---|---|---|
| **T0** | Świeżak | tydzień po zmianie, wciąż w ubraniu | wolny, ślepawy, groźny wyłącznie w tłumie | od dnia 0 |
| **T1** | Ghoul | miesiące, zaawansowana przemiana | szybszy, twardszy, działa pojedynczo, słyszy lepiej | od ~dnia 15 |
| **T2** | Ork | mutacja poszła w masę | duży, powolny, miażdżący, przebija barykady, używa narzędzi | od ~dnia 45 |
| **T3** | Szkielet | rok+, tkanka strawiona | bardzo szybki, mało HP, strefy skażone | późna gra |

**Na vertical slice wystarczą T0 i T1.** Różnią się jedyną rzeczą, którą gracz naprawdę
czuje w pierwszej godzinie: tłum kontra jednostka. T2 i T3 to zawartość Fazy II.

Wartości liczbowe (prędkości, HP, obrażenia) — patrz `07-otwarte-kwestie.md`.

## Ścieżka boczna: gobliny [ROBOCZE]

Osobna gałąź mutacji, w której **organizm zachował spryt kosztem masy**.

- małe, tchórzliwe pojedynczo, groźne w liczbie
- używają prymitywnych narzędzi
- **kopią, budują, kradną** — to jedyny typ, który zmienia świat
- uciekają, gdy tracą przewagę liczebną, i wracają

Gobliny są uzasadnieniem całego systemu gniazd. Bez nich gniazda są tylko lokacją
z lootem; z nimi są przeciwnikiem, który coś robi.

## Percepcja i aggro [ROBOCZE]

**Dźwięk jest głównym wektorem, wzrok drugorzędnym.**

- każde zdarzenie generuje dźwięk o promieniu i intensywności
- moby w promieniu ruszają w stronę **źródła**, nie gracza — można to wykorzystać
- wzrok: stożek, krótki dla T0, znacznie dłuższy dla T1+
- światło w nocy jest widoczne z dużej odległości i to ma być realny problem

Skala hałasu (orientacyjnie, od najcichszego): skradanie → chód → bieg →
rąbanie drzwi → młotek przy barykadzie → strzał → silnik → alarm samochodowy.

**Efekt kaskadowy:** mob, który kogoś zauważy, hałasuje. To ściąga kolejne.
Mała pomyłka ma się zamieniać w dużą sytuację bez żadnego skryptu.

## Zachowania grupowe [ROBOCZE]

- **Przepychanie się** — moby zajmują miejsce i blokują sobie drogę. Wąskie drzwi
  są taktycznie wartościowe, bo przepuszczają jednego naraz.
- **Migracja hord** — duże grupy wędrują przez mapę niezależnie od gracza.
  Baza w złym miejscu przestaje być bezpieczna bez jego udziału.
- **Meta-zdarzenia** — okresowe głośne wydarzenia w losowym punkcie mapy
  (odpowiednik helikoptera z PZ), ściągające wszystko w okolicy.

## Gniazda [FAZA IV — szkic]

**Kluczowa zasada: gniazdo to źródło presji, nie skrzynia z lootem.**

Dopóki stoi, generuje moby w regionie. Zaczyszczenie daje kilkanaście dni spokoju
w okolicy, potem gniazdo się odbudowuje. To jest pełna pętla roguelike'owa:
ryzykowna wyprawa w zamian za regionalną ulgę.

### Jama goblinów
Pod ziemią, wejście przez piwnicę albo zapadlisko. Kilka poziomów w głąb, ciasno,
całkowicie ciemno. **Wymusza wybór: latarka albo broń dwuręczna** (patrz `05`).
Przestrzeń pionowa, bez odwrotu na skróty.

### Obozowisko orków
Na powierzchni, ufortyfikowane złomem, widoczne z daleka — więc gracz może je
zaplanować, obserwować, przygotować się. Jeden duży osobnik jako oś.

### Haczyk spinający całość
**Gobliny okradają bazę gracza.** Zabierają konkretne przedmioty i zanoszą do jamy.
Nie abstrakcyjny loot — *tę* wiertarkę, po którą jechał pół mapy.

Wtedy gracz nie schodzi do jamy, bo tam jest zawartość. Schodzi, bo ma sprawę.

## Miasto [ROBOCZE]

Na start: **jeden ręcznie zbudowany kwartał**. Generowanie proceduralne to Faza II
i nie wolno go zaczynać wcześniej — bez wiedzy, co czyni wnętrze ciekawym,
generator wyprodukuje setki nudnych budynków.

Wnętrza mają być gęste i wielopiętrowe. Każde pomieszczenie powinno odpowiadać
na pytanie: po co gracz miałby tu wejść i czym ryzykuje.
