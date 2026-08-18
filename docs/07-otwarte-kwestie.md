# 07 — Otwarte kwestie

Wszystko, co świadomie zostało nierozstrzygnięte. Nic z tego nie blokuje startu prac.

---

## Wymagające decyzji projektowej

### Długość timera mutacji
Godziny (panika, jedna sesja) czy dni (powolne pożegnanie, ostatnia wyprawa)?
Ustawia ton całej gry.

**Jedyne twarde wymaganie:** musi wystarczyć na zrobienie czegoś sensownego —
zabezpieczenie bazy, dotarcie do współgracza, ostatnia wyprawa. Jeśli po ugryzieniu
zostaje samo patrzenie na pasek, lepiej zabijać postać od razu.

Do ustalenia w testach, na chodzącej postaci i gryzącym mobie. Wartość w konfiguracji.

### Czy mutacja od początku ma lokalizację
Jeśli tak — amputacja z Fazy II wchodzi bez refaktoru.
Jeśli nie — trzeba będzie później przenieść timer z postaci na kończynę.
Koszt zrobienia tego od razu jest niewielki. Prawdopodobnie warto.

### Śmierć postaci a kontynuacja
Nowa postać w tym samym świecie, w losowym miejscu? Czy w bazie poprzedniej
(mechanika spuścizny)? Wpływa na to, jak bardzo gracz inwestuje w bazę.

### Skala mapy
Jeden kwartał na slice — ale docelowo miasto, aglomeracja czy region?
Wpływa na chunkowanie, zapisy i to, czy pojazdy są w ogóle potrzebne.

### Czy istnieje mechanizm wygrywania
Domyślnie nie. Ale warto świadomie zdecydować, czy da się np. opuścić region,
czy gra jest wyłącznie o przetrwaniu.

---

## Parametry balansu — wyłącznie z testów

Wszystkie do pliku konfiguracyjnego, nie do kodu.

| Parametr | Uwagi |
|---|---|
| Prędkości T0–T3 vs. prędkość gracza | T0 wolniejszy od chodu gracza — kluczowe dla „luzu" na starcie |
| Próg liczebności wymuszający ucieczkę | Wychodzi z etapu 2 |
| Obrażenia i HP wszystkich tierów | |
| Szansa zarażenia z zadrapania | Gracz nigdy nie zna tej liczby |
| Tempo głodu, pragnienia, zmęczenia | |
| Mnożnik czasu w grze | Ile realnych minut to doba? |
| Promienie i intensywność dźwięków | |
| Dzień pojawienia się T1, T2, T3 | |
| Krzywa przeciążenia | Od jakiego procentu wagi zaczynają się kary |
| Czas i tempo gojenia ran | |
| Trwałość przedmiotów i ubytek przy naprawie | |
| Po ilu dniach pada prąd i woda | |

---

## Techniczne, do rozstrzygnięcia przy pierwszym kontakcie z kodem

- **Ukrywanie zasłon** — bryły pomieszczeń czy raycast z przezroczystością.
  Podejście robocze: bryły. Do zweryfikowania na realnym budynku.
- **Format zapisu** — jeden plik czy chunki osobno. Zależy od docelowej skali mapy.
- **Zużycie pancerza lokalnie czy globalnie** — przetarty rękaw osobno od reszty
  kurtki może być zbyt drobiazgowe.
- **Transport sieciowy** — WebSocket na start; geckos.io (WebRTC/UDP) tylko jeśli
  testy pokażą, że TCP nie wystarcza.
- **Silnik dźwięku** — Web Audio bezpośrednio czy biblioteka.
- **Czy gracz widzi to, czego nie widzi jego postać** — dziś nie ma żadnego
  systemu widoczności: rysujemy wszystko, co stoi na rysowanej kondygnacji.
  Prawdziwy wymaga dwóch osobnych rzeczy: linii wzroku ze ścianami blokującymi
  widok (kolumna `blocksSight` w danych krawędzi istnieje i czeka nieużywana)
  oraz przyciemnienia albo ukrycia tego, czego postać nie widzi.
  Uwaga: `03-swiat-i-mobki.md` opisuje wzrok **mobów**, a to jest osobne
  pytanie — o wzrok gracza. Nie do rozstrzygnięcia, dopóki nie ma walki, którą
  da się przegrać: mgła wojny zmieni próg liczebności z Etapu 2, więc najpierw
  ten próg trzeba poznać bez niej.

---

## Zasada

Jeśli czegoś nie da się rozstrzygnąć bez zagrania — nie rozstrzygamy tego przy biurku.
Wpisujemy tutaj, wystawiamy jako parametr i wracamy, gdy będzie w co grać.
