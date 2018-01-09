# eng-thesis-node

Aplikacja reprezentująca pojedynczy węzeł sieci dHTTP. Automatycznie wykrywa inne węzły w sieci i przechowuje dane na dysku; w przypadku napotkania treści niepokrytej przez sieć, pobiera ją automatycznie na dysk i propaguje informację o tym klastrowi.

## Struktura projektu
```
├── README.md                   // ten plik
├── package.json                // definicja modułu w systemie npm; opis zależności i skryptów uruchamiających
├── public
│   ├── bundle.js               // plik generowany dla przeglądarki
└── src
    ├── browser-bundle.js       // plik definiujący moduły libp2p użyte dla węzła
    ├── create-node.js          // skrypt konfigurujący js-libp2p-webrtc-star
    ├── dhttp.js                // serce dHTTP -- implementacja protokołu
    ├── files                   // utrzymywane przez węzeł pliki
    │   ├── http:++aws.dom3k.pl:8080+citadel.jpg
    ...
    ├── index.js                // główny plik programu, importujący niezbędne klasy i uruchamający serwer
    └── node-setup.js           // skrypt rejestrujący wydarzenia niezbędne do działania dHTTP z perspektywy js-libp2p
```

## Instrukcja użycia
Aby uruchomić projekt, należy zapewnić spełnienie zależności:
```
   npm install
```

A następnie, w zależności od potrzeb testowych, uruchomić jedno z poleceń:
```
    npm run start                 // uruchomi węzeł 
    npm run bundle                // wygeneruje plik public/bundle.js, uruchamialny z poziomu przeglądarki
```

W przypadku chęci testowania zawartości pamięci czy ręcznego uruchamiania funkcji, wartościowe może być uruchomienie w interaktywnym środowisku node:
```
    cd src
    node
    require('./index.js')
    dhttpClient
```

## Środowisko testowe
Projekt uruchamiano w środowisku `node v8.9.1`, przy użyciu `npm 5.5.1`.