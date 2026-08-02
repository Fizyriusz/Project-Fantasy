# GDD — indeks

Projekt: survival sandbox inspirowany Project Zomboid, w Three.js, w świecie współczesnym
dotkniętym falą mutacji.

**Status: faza projektowania. Zero kodu.**

## Dokumenty

| Plik | Zawartość |
|---|---|
| `01-wizja.md` | Fantazja gracza, filary, setting, perspektywa, ton |
| `02-architektura.md` | Stos, podział sim/client, sieć, wydajność, assety |
| `03-swiat-i-mobki.md` | Taksonomia zmutowanych, aggro, dźwięk, gniazda |
| `04-cialo-i-obrazenia.md` | Części ciała, rany, stany, mutacja, pancerz warstwowy |
| `05-ekwipunek-i-crafting.md` | Model przedmiotu, waga, kontenery, recepty, trwałość |
| `06-roadmapa.md` | Fazy I–IV, backlog, kryteria przejścia |
| `07-otwarte-kwestie.md` | Decyzje odłożone, parametry do wytestowania |

## Jak czytać

Dokumenty 01–02 to fundament — zmiana czegokolwiek tam pociąga za sobą resztę.
Dokumenty 03–05 to systemy, w dużej mierze niezależne od siebie.
Dokument 07 to jedyne miejsce, gdzie trzymamy niewiadome. Jeśli coś jest niejasne
w dokumencie systemowym, powinno być wypisane tam.

## Konwencje

- **[USTALONE]** — decyzja zapadła, nie wracamy bez dobrego powodu
- **[ROBOCZE]** — kierunek przyjęty, ale może się zmienić przy pierwszym kontakcie z kodem
- **[OTWARTE]** — świadomie nierozstrzygnięte, patrz dokument 07

Wartości liczbowe w tych dokumentach są **orientacyjne**. Wszystko, co można wyczuć
tylko grając, ma trafić do pliku konfiguracyjnego, nie do kodu.

## Jedna zasada nadrzędna

Pierwszym kamieniem milowym jest **vertical slice**, nie kompletna gra:
jeden kwartał miasta, dwa typy mobów, jedna pętla craftingu, jedna rana do wyleczenia.
Wszystko, co nie służy dowiezieniu tego, jest w roadmapie na później — i tam ma zostać.
