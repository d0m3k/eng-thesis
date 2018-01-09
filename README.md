# eng-thesis

Praca inżynierska na temat rozproszonego systemu wsparcia serwerów sieci web.

## Budowanie pracy inżynierskiej
Aby wygenerować plik `paper.pdf`, przy poprawnie skonfigurowanym środowisku LaTeX wystarczy zawołać polecenie z poziomu katalogu `paper`:
```
   pdflatex paper
```

## Struktura
Szczegóły na temat budowania i użytkowania poszczególnych elementów systemu znajdują się w plikach `README.md` w ich katalogach.
```
├── README.md
├── applications
│   ├── eng-thesis-chrome-extension // dHTTP dla Google Chrome
│   ├── eng-thesis-node             // aplikacja węzła dHTTP
│   └── eng-thesis-test-server      // serwer testowy
└── paper   // praca w formacie LaTeX; zawiera plik paper.pdf z obecną wersją.
```