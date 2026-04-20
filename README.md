# Minimal CAD

## Produktive Version - Vollständige CAD-Anwendung

Minimal CAD ist eine webbasierte 3D-CAD-Anwendung zum Erstellen, Bearbeiten und Verwalten von geometrischen 3D-Modellen. Die produktive Version bietet Benutzerverwaltung, Cloud-Speicherung und Projekt-Sharing.

### 🔐 Authentifizierung & Benutzerverwaltung

Die Anwendung nutzt **Firebase Authentication** für sichere Benutzerverwaltung:
- **Registrierung** mit E-Mail und Benutzername
- **Login/Logout** mit E-Mail und Passwort
- Geschützte Routen - nur authentifizierte Benutzer haben Zugriff auf Editor und Projekte

### 💾 Cloud-Speicherung & Projekt-Management

Alle Projekte werden in **Firebase Firestore** gespeichert:

#### Projekt-Features
- **Mehrere Projekte** pro Benutzer verwalten
- **Projekt-Übersicht** mit allen eigenen und öffentlichen Projekten
- **Projekt-Metadaten**: Name, Erstellungsdatum, Besitzer
- **Lizenzschlüssel** für private Projekte
- **Öffentliche und private Projekte**
  - Öffentliche Projekte für alle sichtbar (mit Lizenzschlüssel-Schutz)
  - Private Projekte nur für den Besitzer zugänglich

#### Speicher-Funktionen
- **Automatische Cloud-Synchronisation** aller Objekte
- **Projekt erstellen** und in Firestore speichern
- **Projekt öffnen** aus der Cloud
- **Projekt-Filterung** nach Name und Datum
- **Echtzeit-Datensynchronisation** zwischen lokalem Speicher und Cloud

### 🎨 3D-Modellierung

#### Verfügbare Objekt-Typen
1. **Rechteck (Square)**
   - Quader mit variabler Länge, Breite und Höhe
   - Standardmaße: 1×1×0

2. **Kreis (Circle)**
   - Zylinder mit Radius und Höhe
   - Einstellbare Kurvensegmente für Auflösung
   - Standardmaße: r=1, h=0, 100 Segmente

3. **Freiform (Freeform)**
   - Extrudierte 2D-Formen
   - Verschiedene Befehle:
     - `moveTo`: Bewegt den Zeichenstift
     - `lineTo`: Zeichnet gerade Linie
     - `quadraticCurveTo`: Zeichnet quadratische Bézierkurve
   - Extrusion in Z-Richtung

### 🖥️ Benutzeroberfläche

#### Hauptbereiche
- **Header-Leiste** (oben): Navigation, Werkzeuge, Datei-Operationen
- **Objektliste** (links): Hierarchische Ansicht aller Objekte im Projekt
- **3D-Arbeitsbereich** (Mitte): Interaktive 3D-Ansicht mit Raster
- **Eigenschaftenpanel** (rechts): Detaillierte Objektbearbeitung
- **ViewCube** (rechts oben): Schnelle Kamera-Orientierung

#### Header-Funktionen
- **Werkzeuge**: Rechteck, Kreis, Freiform erstellen
- **Datei-Menü**:
  - In Cloud speichern (Firebase)
  - Als JSON exportieren
  - Als STL exportieren
  - Als STEP exportieren (erfordert lokalen Python-Server)
  - JSON-Datei hochladen
- **Benutzer-Menü**: Logout, zur Projekt-Übersicht

### ⚙️ Objekteigenschaften bearbeiten

Im Eigenschaftenpanel (rechts) können Sie folgende Parameter anpassen:

#### Allgemeine Eigenschaften
- **Name**: Bezeichnung des Objekts

#### Geometrie
**Für Rechtecke:**
- **Länge (Length)**: Y-Dimension
- **Breite (Width)**: X-Dimension
- **Höhe (Height)**: Z-Dimension (Extrusion)

**Für Kreise:**
- **Radius**: Zylinderradius
- **Höhe (Height)**: Z-Dimension (Extrusion)
- **Kurvensegmente**: Auflösung des Kreises

**Für Freiformen:**
- **Befehle**: Liste der Zeichenbefehle (erweiterbar)
- **Höhe (Height)**: Extrusionshöhe

#### Transformation
- **Position** (X, Y, Z): Positionierung im 3D-Raum
- **Rotation** (X, Y, Z): Drehung in Grad um jede Achse

#### Aktionen
- **Apply**: Änderungen übernehmen und Objekt speichern
- **Delete**: Objekt löschen

### 🖱️ 3D-Navigation & Interaktion

#### Maussteuerung
- **Linke Maustaste**: Objekt auswählen
- **Rechte Maustaste (gedrückt halten)**: Ansicht rotieren
- **Mittlere Maustaste / Mausrad (gedrückt)**: Ansicht verschieben
- **Mausrad scrollen**: Zoom in/out

#### Ghost-Objekte
Während der Bearbeitung wird eine halbtransparente Vorschau ("Ghost") angezeigt, die in Echtzeit die Änderungen visualisiert.

#### ViewCube
Klicken Sie auf eine Seite des ViewCube für vordefinierte Kamerawinkel (Vorne, Hinten, Links, Rechts, Oben, Unten).

### 📤 Export-Funktionen

#### 1. JSON Export
- Exportiert alle Objekte als strukturierte JSON-Datei
- Format: Array von FormObject und FreeObject
- Kann wieder importiert werden

#### 2. STL Export
- Konvertiert 3D-Geometrie zu STL-Format
- Geeignet für 3D-Druck
- Automatische Geometrie-Konvertierung
- Korrekte Z-Offset-Berechnung für alle Objekttypen

#### 3. STEP Export
- Konvertiert STL zu STEP-Format (CAD-Austauschformat)
- Erfordert lokalen Python-Server (`stl-to-step_api`)
- Ablauf:
  1. Generiert STL-Datei
  2. Sendet an Python-API (`localhost:5000`)
  3. Konvertiert mit OCP (Open Cascade)
  4. Lädt STEP-Datei herunter

### 🗂️ Datenstruktur

#### Projekt-Struktur (Firestore)
```
projects/{projectId}
  ├── id: string
  ├── name: string
  ├── licenceKey: string
  ├── ownerEmail: string
  ├── createdAt: Timestamp
  └── objects (Subcollection)
      ├── {objectId}
      │   ├── id: string
      │   ├── name: string
      │   ├── type: 'Square' | 'Circle' | 'Freeform'
      │   ├── position: [x, y, z]
      │   ├── rotation: [x, y, z]
      │   └── ... (type-specific properties)
```

#### Lokaler Speicher
- `model-data`: Aktuelle Objekte des geöffneten Projekts
- `project-id`: ID des aktuell geöffneten Projekts
- `view`: Kameraposition und Rotation

### 🔧 Technologie-Stack

- **Frontend**: Angular 20 (Standalone Components)
- **3D-Rendering**: Three.js
- **Backend**: Firebase
  - Firebase Authentication
  - Cloud Firestore
- **UI-Framework**: Angular Material
- **Export-API**: Python (Flask) mit OCP (für STEP-Konvertierung)

### 🚀 Installation & Entwicklung

```bash
# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
ng serve

# Auf http://localhost:4200/ öffnen
```

**Python STEP-Konvertierungs-Server** (optional):
```bash
cd src/app/shared/stl-to-step_api
pip install -r requirements.txt
python api.py
```

### 📋 Workflow-Beispiel

1. **Registrieren/Einloggen**
2. **Neues Projekt erstellen** in der Übersicht
3. **Objekte erstellen** im Editor (Rechteck, Kreis, Freiform)
4. **Eigenschaften anpassen** über das rechte Panel
5. **Projekt in Cloud speichern** über Header-Menü
6. **Export** als STL/STEP für externe CAD-Programme oder 3D-Druck

---

## GitHub Pages Version (Legacy)

Die auf GitHub Pages gehostete Version ist eine **statische Demo** der Anwendung ohne Backend-Funktionen:

### Eingeschränkte Funktionen
- ❌ Keine Benutzer-Authentifizierung
- ❌ Keine Cloud-Speicherung
- ❌ Kein Projekt-Management
- ✅ Alle 3D-Modellierungs-Features verfügbar
- ✅ Lokaler Speicher im Browser (LocalStorage)
- ✅ JSON Export/Import
- ✅ STL Export

### Verwendung
Die GitHub Pages Version eignet sich für:
- Schnelle Demos
- Offline-Nutzung
- Testing ohne Account
- Einmalige 3D-Modelle

**Hinweis:** Alle Daten bleiben lokal im Browser. Bei Cache-Leerung gehen ungesicherte Daten verloren.

---

## 📝 Lizenz & Support

Weitere Informationen und Updates finden Sie im [GitHub Repository](https://github.com/noalohrer125/Minimal-CAD).
