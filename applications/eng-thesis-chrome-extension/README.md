# eng-thesis-chrome-extension

Wtyczka do aplikacji Google Chrome, pozwalająca na podpięcie się do węzła dHTTP, umożliwiając pobieranie plików, zmiany konfiguracji i statystyki zużycia.

## Struktura projektu
```
├── README.md
├── background.js
├── eng-thesis-chrome-extension.crx
├── eng-thesis-chrome-extension.pem
├── icon.png
├── jquery-3.2.1.min.js
├── manifest.json
├── popup.html
└── popup.js
```

## Instrukcja użycia
* W przeglądarce Google Chrome należy otworzyć `chrome://extensions/` ([link](chrome://extensions/)). 
* Następnie, należy przeciągnąć plik `eng-thesis-chrome-extension.crx` na okno rozszerzeń.
* Po zaakceptowaniu, za paskiem adresu Google Chrome powinien zostać udostępniony interfejs oznaczony ikoną `dH`. 

Domyślnie podmienia on statyczne obrazki na stronach `http`, używając węzła udostępnianego pod adresem `http://localhost:34887/`. W celu zmiany ustawień, należy kliknąć na ikonę, wprowadzić poprawne informacje i zatwierdzić przyciskiem `Change node/filter`.

Możliwa jest również instalacja rozszerzenia poza pakietem. W tym celu należy uruchomić tryb programisty i wykorzystać przycisk `Wczytaj rozszerzenie bez pakietu...`

## Środowisko testowe
Projekt uruchamiano na przeglądarce Google Chrome w wersji `63.0.3239.132`, na platformie macOS 10.13.2.