# eng-thesis-test-server

Krótki moduł pozwalający zasymulować serwer. Udostępnia stronę `performance.html`, zawierającą 5 wysokiej jakości obrazów, i możliwość symulacji ograniczenia przepustowości serwera.

## Struktura projektu
```
├── README.md        // ten plik
├── hosted           // pliki udostępniane przez serwer
│   ├── citadel.jpg
│   ├── osm.jpg
│   ├── otmuchow.jpg
│   ├── performance.html
│   ├── singapur.jpg
│   └── train1.jpg
├── index.js          // definicja logiki serwera
└── package.json      // definicja modułu w systemie npm; opis zależności i skryptów uruchamiających
```

## Instrukcja użycia
Aby uruchomić projekt, należy zapewnić spełnienie zależności:
```
   npm install
```

A następnie, w zależności od potrzeb testowych, uruchomić jedno z poleceń:
```
    npm run start               // uruchomi serwer z pełną przepustowością
    npm run throttled-for-one   // uruchomi serwer z przepustowością ograniczoną do 1Mbps dla pojedynczego zapytania
    npm run throttled-for-five  // uruchomi serwer z przepustowością ograniczoną do 1Mbps dla pięciu zapytań (efektywnie symuluje podział łącza 1Mbps na 5 plików)
```

## Środowisko testowe
Projekt uruchamiano w środowisku `node v8.9.1`, przy użyciu `npm 5.5.1`.