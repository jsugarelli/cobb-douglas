# Cobb-Douglas: Nutzenfläche und Indifferenzkurve

Interaktive, statische Lehranwendung für Tourismusökonomie 1. Keine Installation von npm-Paketen, kein Backend, keine Benutzerkonten. Berechnung und Grafik laufen im Browser. Plotly ist lokal mitgeliefert; im Betrieb werden keine Bibliotheken von Drittservern geladen.

## Lokal starten

In diesem Ordner ausführen:

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Danach http://127.0.0.1:8080 im Browser öffnen. Die JSON-Datei wird geladen; deshalb bitte einen Webserver verwenden, nicht `index.html` doppelklicken. Nach dem Download funktioniert die Anwendung auch ohne Internet über diesen lokalen Server.

## GitHub Pages

1. Ein öffentliches Repository auf GitHub anlegen.
2. Den **Inhalt dieses Ordners** in dessen Hauptverzeichnis hochladen, einschließlich `vendor/`, `translations.json` und `.nojekyll`.
3. Unter **Settings → Pages → Build and deployment** die Quelle **Deploy from a branch** wählen, dann den Branch `main` und den Ordner `/ (root)` speichern.
4. GitHub zeigt nach dem Deployment die öffentliche Adresse an, üblicherweise `https://BENUTZER.github.io/REPOSITORY/`.

Alle Ressourcen nutzen relative Pfade und funktionieren auch im Unterpfad eines Projekt-Repositories. Keine eigene Domain nötig. `math.test.js`, `package.json` und diese README sind für den Betrieb nicht erforderlich, können aber im Repository verbleiben.

## Bedienung und Fachliches

- Feste Nutzenfunktion: U(x₁,x₂) = x₁^0,7 · x₂^0,3.
- Ein Regler verändert das Nutzenniveau ū zwischen 0,5 und 8.
- Rot: Schnitt mit der horizontalen Ebene U = ū.
- Grau: senkrechte Projektion dieser Schnittkurve auf U = 0, zusätzlich als zweidimensionale Indifferenzkurve rechts.
- Gepunktete Verbindungslinien verdeutlichen die Projektion.
- Die Kurve folgt exakt x₂ = (ū / x₁^0,7)^(1/0,3). Sie wird nur innerhalb des sichtbaren Mengenbereichs [0,10]² dargestellt.
- Ansicht durch Ziehen drehen, durch Scrollen zoomen; die Schaltfläche setzt die Kamera zurück. Die Kamera bleibt beim Verändern des Nutzenniveaus erhalten.
- Sprache oben rechts wechseln; die Auswahl wird, wenn möglich, lokal gespeichert. Alle übersetzbaren Erklärungstexte stehen gemeinsam in `translations.json`.

Nutzenwerte stellen eine ordinale Rangfolge dar. Indifferenz zwischen Bündeln bedeutet gleichen Nutzen innerhalb dieser Präferenzen, keine Gleichheit von Ausgaben. Eine Budgetrestriktion ist in dieser ersten Version nicht enthalten.

## Sprachen erweitern

Ein weiteres Sprachobjekt mit denselben Schlüsseln in `translations.json` ergänzen und eine entsprechende `<option>` im Sprachmenü in `index.html` hinzufügen. `{level}` ist der Platzhalter für das gewählte Nutzenniveau. Formeln und Variablennamen bleiben sprachunabhängig; Dezimalzahlen werden passend zur Sprache formatiert.

## Prüfung

```powershell
node --test
```

Prüft sämtliche 76 Reglerwerte auf korrekte Nutzenwerte, Randpunkte, fallenden Kurvenverlauf und den sichtbaren Mengenbereich sowie die Vollständigkeit beider Sprachobjekte.

## Drittanbieter

`vendor/plotly-gl3d-3.1.0.min.js`: Plotly.js GL3D v3.1.0, MIT-Lizenz. Quelle: https://cdn.plot.ly/plotly-gl3d-3.1.0.min.js. Der GL3D-Build enthält auch die benötigten zweidimensionalen Scatter-Diagramme. Lizenzhinweis im Bibliothekskopf; vollständige Lizenz in `vendor/LICENSE-plotly.txt`.

## Kamera und Gestaltung

CI-Primärfarbe: #DA002A; Sekundärfarben: Grau. Waagerecht ausrichten stellt eine aufrechte Ansicht mit 30° Blickhöhe her; horizontale Blickrichtung, Mittelpunkt und Kameraabstand bleiben erhalten. Die Nutzenfläche ist in #4A7EBB mit voreingestellten 20 % Transparenz, mit plastischer Lichtschattierung. Die Pfeile drehen die Kamera um jeweils 15° um die vertikale z-Achse; Höhe und Abstand bleiben erhalten. Die Maus nutzt den Turntable-Modus, damit die Vertikale beim Drehen stabil bleibt. Ansicht zurücksetzen stellt die ursprüngliche Perspektive wieder her.

Die Transparenz der Nutzenfläche kann separat von 0 % (deckend) bis 100 % (unsichtbar), voreingestellt sind 20 % eingestellt werden. Schnittkurve, Schnittebene und Projektion bleiben dabei erhalten.

