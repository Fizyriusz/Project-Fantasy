# Projekt

Survival sandbox w Three.js, inspirowany Project Zomboid. Świat współczesny dotknięty
falą mutacji. Kamera ortograficzna ~45°, obracana co 90°.

Pełna dokumentacja projektowa jest w `docs/`. Zacznij od `docs/00-INDEKS.md`.
Nie duplikuj tam zawartości — jeśli coś jest w GDD, odsyłaj do GDD.

Autor projektu **nie jest programistą**. Zasady komunikacji poniżej są tak samo ważne
jak zasady techniczne.

# Komunikacja

- Odpowiadaj **po polsku**. Kod, nazwy zmiennych, commity i komentarze — po angielsku.
- Po każdej zmianie napisz **prostym językiem**, co się zmieniło i dlaczego.
  Bez żargonu bez wyjaśnienia. Jeśli używasz terminu pierwszy raz, wytłumacz go w nawiasie.
- Zawsze podaj **jak sprawdzić, czy działa** — konkretna komenda i co ma się pokazać.
- Jeśli coś w moim poleceniu jest złym pomysłem, powiedz to wprost, zanim to zrobisz.
  Nie wykonuj polecenia, o którym wiesz, że zaszkodzi projektowi, tylko dlatego, że
  o nie poprosiłem.
- Jeśli nie rozumiem czegoś i pytam „po co to" — wytłumacz, nie zmieniaj kodu.

# Sposób pracy

- **Zanim napiszesz kod, przedstaw plan** i poczekaj na moją zgodę. Dotyczy wszystkiego
  poza drobnymi poprawkami.
- **Małe kroki.** Jedna rzecz naraz, do działającego stanu, potem następna.
  Nie realizuj całego etapu z roadmapy w jednej sesji.
- **Rób tylko to, o co proszę.** Żadnych bonusowych funkcji, refaktorów przy okazji,
  „poprawiania" rzeczy, o których nie było mowy.
- **Nie zostawiaj projektu w stanie, który się nie uruchamia.** Jeśli zmiana jest za duża,
  żeby ją skończyć, powiedz o tym i podziel ją.
- Nie dodawaj nowych zależności bez pytania. Uzasadnij każdą.
- Nie twórz plików `.md` z podsumowaniami swojej pracy. Podsumowanie ma być w odpowiedzi.

# Architektura — zasady twarde

Uzasadnienie w `docs/02-architektura.md`. Te reguły nie podlegają negocjacji bez
wyraźnej decyzji z mojej strony.

1. **`packages/sim` nie importuje niczego z `three`.** Ani jednego importu, nigdy.
   Symulacja musi dać się uruchomić w Node bez przeglądarki.
2. **Żadnego `Math.random()` w `packages/sim`.** Wyłącznie seedowany generator
   przekazywany jawnie.
3. **Logika nie zależy od `deltaTime`.** Stały tick, 20/s. Interpolacja tylko w kliencie.
4. **Klient wysyła intencje, nie stany.** „Chcę iść tam", nigdy „moja pozycja to X".
5. **Dane w plikach danych, nie w kodzie.** Przedmioty, recepty, statystyki mobów,
   typy ran, wartości balansu — wszystko w JSON/TS-as-data.
6. **Rany i stany to obiekty w tablicach, nie pola i ify.** Patrz `docs/04`.
7. **Przedmioty to instancje, nie liczniki.** Patrz `docs/05`.

Jeśli któraś z tych reguł stoi na drodze zadaniu — zatrzymaj się i powiedz mi,
zamiast ją obchodzić.

# Struktura

```
packages/shared/   typy, dane, protokół wiadomości
packages/sim/      logika gry, czysty TypeScript
packages/client/   Three.js, input, UI
docs/              GDD
```

# Konwencje kodu

- TypeScript, tryb `strict`. Bez `any` — jeśli nie da się otypować, zapytaj.
- Nazwy po angielsku, opisowe. `mutationTimer`, nie `mt`.
- Bez skrótowych jednoliterowych zmiennych poza licznikami pętli.
- Komentarz wyjaśnia **dlaczego**, nigdy **co**. Kod ma sam mówić, co robi.
- Funkcje krótkie. Jeśli funkcja nie mieści się na ekranie, prawdopodobnie robi za dużo.

# Git

- Commituj po każdym działającym kroku, nie na koniec sesji.
- Komunikat commita po angielsku, tryb rozkazujący: `add player collision`.
- Nigdy nie rób `git push --force`, `git reset --hard` ani nie usuwaj gałęzi
  bez mojej wyraźnej zgody w tej samej wiadomości.

# Czego teraz NIE robimy

Multiplayer, pojazdy, NPC, generowanie proceduralne, moby T2/T3, gniazda, elektryka.
Wszystko to jest w `docs/06-roadmapa.md` na później. Jeśli uznasz, że warto coś z tego
przyspieszyć — zaproponuj, ale nie zaczynaj.

Priorytetem jest **vertical slice** opisany w `docs/06-roadmapa.md`.
