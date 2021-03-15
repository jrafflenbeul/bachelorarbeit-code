# Verkaufssteigerung im E-Commerce- durch algorithmengestützte Optimierung - Codebasis
In diesem Repo befindet sich der im Verlaufe der Bachelorarbeit "Verkaufssteigerung im E-Commerce- durch algorithmengestützte Optimierung" entwickelte Code. Die für den Webscraper und das Backend verwendete lauffähige Python-Version ist Python 3.7.

### Webscraper
Der Webscraper läuft auf Basis von Pyppeteer. Mit Hilfe des Webscrapers lassen sich eBay-Artikelnummern bereits abgeschlossener Inserate zu einem Suchbegriff sammeln. Diese dienen als Grundlage, die für den weiteren Verlauf erforderlichen Datenmengen über die offizielle eBay API zu erlangen.
Das Programm kann wie ein ganz normales Python Programm ausgeführt werden, um den Suchbegriff nach Artikelnummern zu ändern, kann folgender Code in `main.py` angepasst werden:

```python
def main():
    asyncio.run(search('<SUCHBEGRIFF>', True, 1))
    print("Finished writing items to JSON")
```

### Frontend
Für das Frontend wird React und Next.js benötigt, welche wiederum Node.js benötigen. Node.js kann [hier](https://nodejs.org/en/download/) heruntergeladen werden.
Sobald Node.js installiert ist, muss im Verzeichnis `frontend` einfach der Befehl `npm i` ausgeführt werden, dieser installiert automatisch alle benötigten Module und Dependencies.
Sobald alles installiert wurde, kann mit dem Befehl `npm run dev` das Frontend auf einem lokalen Server ausgeführt werden. Die Website ist dann unter `http://localhost:3000` erreichbar.

### Backend
Das Backend basiert auf Python und dem Webframework Flask. Der Flask-Server wird wie ein normales Python-Programm gestartet.

---

Sobald Front- und Backend lokal gestartet wurden, kann die entwickelte Software vollständig genutzt werden. Das Programm ist auch [hier](https://ebay-analysis-tool.vercel.app/) abrufbar, kann auf Grund von Einschränkung im Threading bei [pythonanywhere.com](https://pythonanywhere.com) nur den Estimated Time to Sell und den damit verbundenen Estimated Price to Sell berechnen.

Bei Fragen stehe ich gerne zur Verfügung.
