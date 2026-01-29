# Testfallliste - Minimal-CAD Unit Tests

## Übersicht
Diese Testfallliste dokumentiert alle Unit-Tests für die Minimal-CAD Applikation. Die Tests sind nach Komponenten, Services und Funktionalitäten gruppiert.

---

## 1. Authentication Module

### 1.1 AuthService (`auth.service.ts`)

#### Test Suite: User Registration
- **TC-AUTH-001**: Sollte einen neuen Benutzer erfolgreich registrieren
  - Input: gültige E-Mail, Username und Passwort
  - Erwartung: Observable wird emittiert, Firebase User wird erstellt
  
- **TC-AUTH-002**: Sollte bei der Registrierung Display Name setzen
  - Input: Username "TestUser"
  - Erwartung: Firebase User hat displayName "TestUser"

- **TC-AUTH-003**: Sollte Fehler bei ungültiger E-Mail zurückgeben
  - Input: ungültige E-Mail
  - Erwartung: Observable wirft Fehler

- **TC-AUTH-004**: Sollte currentUserSignal nach Registrierung aktualisieren
  - Erwartung: Signal wird mit neuem User-Objekt gesetzt

#### Test Suite: User Login
- **TC-AUTH-005**: Sollte einen Benutzer erfolgreich einloggen
  - Input: gültige E-Mail und Passwort
  - Erwartung: Observable wird emittiert, User ist authentifiziert

- **TC-AUTH-006**: Sollte Fehler bei falschen Credentials zurückgeben
  - Input: falsche E-Mail/Passwort Kombination
  - Erwartung: Observable wirft Fehler

- **TC-AUTH-007**: Sollte currentUserSignal nach Login aktualisieren
  - Erwartung: Signal wird mit User-Daten gesetzt

#### Test Suite: User Logout
- **TC-AUTH-008**: Sollte Benutzer erfolgreich ausloggen
  - Erwartung: Observable wird emittiert, User wird von Firebase abgemeldet

- **TC-AUTH-009**: Sollte currentUserSignal nach Logout auf null setzen
  - Erwartung: Signal wird auf null gesetzt

- **TC-AUTH-010**: Sollte Subscription von $user korrekt funktionieren
  - Erwartung: Signal synchronisiert mit Firebase Auth State

---

### 1.2 AuthGuard (`auth.guard.ts`)

#### Test Suite: Route Protection
- **TC-GUARD-001**: Sollte authentifizierten Benutzern Zugriff erlauben
  - Erwartung: guard gibt true zurück

- **TC-GUARD-002**: Sollte nicht-authentifizierte Benutzer zur Login-Seite umleiten
  - Erwartung: guard gibt false zurück, Router navigiert zu /login

- **TC-GUARD-003**: Sollte take(1) verwenden für einmalige Prüfung
  - Erwartung: Observable wird nach einer Emission abgeschlossen

---

### 1.3 Login Component (`login.ts`)

#### Test Suite: Component Creation
- **TC-LOGIN-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Form Validation
- **TC-LOGIN-002**: Sollte Form mit leeren Werten initialisieren
  - Erwartung: email und password sind leer

- **TC-LOGIN-003**: Sollte E-Mail als required validieren
  - Erwartung: Form ist invalid wenn E-Mail leer ist

- **TC-LOGIN-004**: Sollte Passwort als required validieren
  - Erwartung: Form ist invalid wenn Passwort leer ist

#### Test Suite: Login Submission
- **TC-LOGIN-005**: Sollte authService.login mit korrekten Daten aufrufen
  - Input: E-Mail und Passwort aus Form
  - Erwartung: authService.login wird mit getRawValue() Daten aufgerufen

- **TC-LOGIN-006**: Sollte nach erfolgreichem Login zur Overview navigieren
  - Erwartung: Router navigiert zu /overview

- **TC-LOGIN-007**: Sollte Fehlermeldung bei ungültiger E-Mail anzeigen
  - Error Code: 'auth/invalid-email'
  - Erwartung: errorMessage = 'Invalid email address.'

- **TC-LOGIN-008**: Sollte Fehlermeldung bei nicht gefundenem User anzeigen
  - Error Code: 'auth/user-not-found'
  - Erwartung: errorMessage = 'User not found.'

- **TC-LOGIN-009**: Sollte Fehlermeldung bei falschem Passwort anzeigen
  - Error Code: 'auth/wrong-password'
  - Erwartung: errorMessage = 'Incorrect password.'

- **TC-LOGIN-010**: Sollte generische Fehlermeldung bei unbekanntem Fehler anzeigen
  - Erwartung: errorMessage = 'Login error: Please try again.'

---

### 1.4 Register Component (`register.ts`)

#### Test Suite: Component Creation
- **TC-REG-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Form Validation
- **TC-REG-002**: Sollte Form mit leeren Werten initialisieren
  - Erwartung: username, email und password sind leer

- **TC-REG-003**: Sollte Username als required validieren
  - Erwartung: Form ist invalid wenn Username leer ist

- **TC-REG-004**: Sollte E-Mail als required validieren
  - Erwartung: Form ist invalid wenn E-Mail leer ist

- **TC-REG-005**: Sollte Passwort als required validieren
  - Erwartung: Form ist invalid wenn Passwort leer ist

#### Test Suite: Registration Submission
- **TC-REG-006**: Sollte authService.register mit korrekten Daten aufrufen
  - Input: E-Mail, Username und Passwort aus Form
  - Erwartung: authService.register wird mit getRawValue() Daten aufgerufen

- **TC-REG-007**: Sollte nach erfolgreicher Registrierung zum Login navigieren
  - Erwartung: Router navigiert zu /login

- **TC-REG-008**: Sollte Fehlermeldung bei Registrierungsfehler anzeigen
  - Erwartung: errorMessage wird gesetzt mit Error-Details

---

## 2. Header Component

### 2.1 HeaderComponent (`header.component.ts`)

#### Test Suite: Component Creation
- **TC-HEADER-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Navigation Methods
- **TC-HEADER-002**: Sollte zur Login-Seite navigieren
  - Erwartung: router.navigate(['/login']) wird aufgerufen

- **TC-HEADER-003**: Sollte zur Register-Seite navigieren
  - Erwartung: router.navigate(['/register']) wird aufgerufen

- **TC-HEADER-004**: Sollte zur Overview-Seite navigieren
  - Erwartung: router.navigate(['/overview']) wird aufgerufen

- **TC-HEADER-005**: Sollte logout aufrufen und zur Login-Seite navigieren
  - Erwartung: authService.logout und router.navigate(['/login']) werden aufgerufen

#### Test Suite: File Operations
- **TC-HEADER-006**: Sollte saveProjectToFirebase aufrufen
  - Erwartung: globalService.openSaveProjectPopup wird aufgerufen

- **TC-HEADER-007**: Sollte saveToLocalFile aufrufen
  - Erwartung: fileService.save wird aufgerufen

- **TC-HEADER-008**: Sollte exportAsJSON aufrufen
  - Erwartung: fileService.save wird aufgerufen

- **TC-HEADER-009**: Sollte exportAsSTEP aufrufen
  - Erwartung: fileService.saveAsSTEP wird aufgerufen

- **TC-HEADER-010**: Sollte exportAsSTL aufrufen
  - Erwartung: fileService.saveAsSTL wird aufgerufen

- **TC-HEADER-011**: Sollte uploadFromLocalFile aufrufen
  - Erwartung: fileService.upload wird aufgerufen

#### Test Suite: Drawing Methods
- **TC-HEADER-012**: Sollte rectangle aufrufen
  - Erwartung: drawService.rectangle wird aufgerufen

- **TC-HEADER-013**: Sollte circle aufrufen
  - Erwartung: drawService.circle wird aufgerufen

- **TC-HEADER-014**: Sollte freeform aufrufen
  - Erwartung: drawService.freeform wird aufgerufen

#### Test Suite: Input Properties
- **TC-HEADER-015**: Sollte isAuthenticated Input korrekt verarbeiten
  - Input: isAuthenticated = true
  - Erwartung: Property wird gesetzt

---

## 3. Overview Component

### 3.1 Overview Component (`overview.ts`)

#### Test Suite: Component Creation
- **TC-OV-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Project Management
- **TC-OV-002**: Sollte addProject aufrufen
  - Erwartung: globalService.openSaveProjectPopup(true) wird aufgerufen

- **TC-OV-003**: Sollte öffentliches Projekt ohne Lizenzschlüssel öffnen
  - Input: projectId, projectName, licenceKey = 'public'
  - Erwartung: Router navigiert zu /editor/:projectId

- **TC-OV-004**: Sollte privates Projekt mit korrektem Lizenzschlüssel öffnen
  - Input: richtiger Lizenzschlüssel
  - Erwartung: Router navigiert zu /editor/:projectId

- **TC-OV-005**: Sollte Alert bei falschem Lizenzschlüssel zeigen
  - Input: falscher Lizenzschlüssel
  - Erwartung: Alert wird angezeigt, keine Navigation

- **TC-OV-006**: Sollte Prompt für Lizenzschlüssel bei privatem Projekt zeigen
  - Input: licenceKey !== 'public'
  - Erwartung: prompt() wird aufgerufen

#### Test Suite: Firebase Integration
- **TC-OV-007**: Sollte Projekte von Firebase laden
  - Erwartung: firebaseService.getProjects wird aufgerufen

- **TC-OV-008**: Sollte öffentliche Projekte filtern
  - Erwartung: firebaseService.getPublicProjects wird aufgerufen

- **TC-OV-009**: Sollte Benutzerprojekte filtern
  - Erwartung: firebaseService.getProjectsByOwner wird aufgerufen

---

## 4. Editor Module

### 4.1 Main-View Component (`main-view.component.ts`)

#### Test Suite: Component Lifecycle
- **TC-MAIN-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

- **TC-MAIN-002**: Sollte ngOnInit korrekt ausführen
  - Erwartung: Initialisierung ohne Fehler

- **TC-MAIN-003**: Sollte ngAfterViewInit korrekt ausführen
  - Erwartung: Scene wird initialisiert, Models werden geladen

- **TC-MAIN-004**: Sollte ngOnDestroy korrekt ausführen
  - Erwartung: Animation wird gestoppt, localStorage wird aufgeräumt

#### Test Suite: Scene Management
- **TC-MAIN-005**: Sollte Scene initialisieren
  - Erwartung: sceneService.initScene wird mit Canvas aufgerufen

- **TC-MAIN-006**: Sollte Models laden
  - Erwartung: drawService.loadObjectsByProjectId wird aufgerufen

- **TC-MAIN-007**: Sollte Scene clearen
  - Erwartung: sceneService.clearScene wird aufgerufen

- **TC-MAIN-008**: Sollte Reload durchführen
  - Erwartung: clearScene und loadModels werden aufgerufen

#### Test Suite: Input/Output
- **TC-MAIN-009**: Sollte rotationChange Event emittieren
  - Erwartung: EventEmitter gibt Rotation aus

- **TC-MAIN-010**: Sollte cameraReset Input verarbeiten
  - Input: Kamera Position/Rotation/Scale
  - Erwartung: Kamera wird zurückgesetzt

- **TC-MAIN-011**: Sollte projectId Input verarbeiten
  - Input: projectId String
  - Erwartung: Korrekte Projekte werden geladen

#### Test Suite: Window Events
- **TC-MAIN-012**: Sollte auf Window Resize reagieren
  - Erwartung: sceneService.onResize wird aufgerufen

---

### 4.2 Sidebar Left Component (`sidebar-left.component.ts`)

#### Test Suite: Component Creation
- **TC-SL-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Object List
- **TC-SL-002**: Sollte Objekte aus DrawService laden
  - Erwartung: drawService.loadObjects wird aufgerufen

- **TC-SL-003**: Sollte selektiertes Objekt finden
  - Erwartung: selectedObject wird korrekt gesetzt

- **TC-SL-004**: Sollte bei onClick Objekt selektieren
  - Input: FormObject oder FreeObject
  - Erwartung: Objekt wird als selected markiert

- **TC-SL-005**: Sollte reload$ Subscription korrekt verarbeiten
  - Erwartung: onReload wird bei reload$ Event aufgerufen

- **TC-SL-006**: Sollte nach Reload Objektliste aktualisieren
  - Erwartung: objects Array wird neu geladen

---

### 4.3 Sidebar Right Component (`sidebar-right.component.ts`)

#### Test Suite: Component Creation
- **TC-SR-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Form Management
- **TC-SR-002**: Sollte Form initialisieren
  - Erwartung: FormGroup mit allen Controls wird erstellt

- **TC-SR-003**: Sollte Form mit selectedObject Daten füllen
  - Input: FormObject oder FreeObject
  - Erwartung: Form wird mit Objektdaten gepopuliert

- **TC-SR-004**: Sollte valueChanges mit debounceTime verarbeiten
  - Erwartung: updatePreview wird nach 500ms aufgerufen

- **TC-SR-005**: Sollte positionChange Event emittieren
  - Input: Position x, y, z
  - Erwartung: EventEmitter gibt Position aus

#### Test Suite: Object Types
- **TC-SR-006**: Sollte Square Objekt korrekt verarbeiten
  - Input: FormObject type 'Square'
  - Erwartung: length, width, height Controls sind sichtbar

- **TC-SR-007**: Sollte Circle Objekt korrekt verarbeiten
  - Input: FormObject type 'Circle'
  - Erwartung: radius, curveSegments Controls sind sichtbar

- **TC-SR-008**: Sollte Freeform Objekt korrekt verarbeiten
  - Input: FreeObject type 'Freeform'
  - Erwartung: commands FormArray wird befüllt

#### Test Suite: Object Manipulation
- **TC-SR-009**: Sollte Preview bei Änderungen aktualisieren
  - Erwartung: drawService.createGhostObject wird aufgerufen

- **TC-SR-010**: Sollte Objekt speichern
  - Erwartung: drawService.saveObject wird aufgerufen

- **TC-SR-011**: Sollte Objekt löschen
  - Erwartung: drawService.deleteObject wird aufgerufen

---

### 4.4 ViewCube Component (`viewcube.component.ts`)

#### Test Suite: Component Creation
- **TC-VC-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Camera Control
- **TC-VC-002**: Sollte Kamera zu verschiedenen Views bewegen
  - Input: Front, Back, Left, Right, Top, Bottom
  - Erwartung: cameraReset Event wird mit korrekten Koordinaten emittiert

- **TC-VC-003**: Sollte auf Klick Events reagieren
  - Erwartung: Entsprechende View-Methode wird aufgerufen

---

## 5. Shared Services

### 5.1 DrawService (`draw.service.ts`)

#### Test Suite: Object Loading
- **TC-DRAW-001**: Sollte Objekte aus localStorage laden
  - Erwartung: JSON.parse wird aufgerufen, Array wird zurückgegeben

- **TC-DRAW-002**: Sollte leeres Array bei fehlendem localStorage zurückgeben
  - Erwartung: [] wird zurückgegeben

- **TC-DRAW-003**: Sollte Objekte von Firebase laden
  - Input: projectId
  - Erwartung: firebaseService.getObjectsByProjectId wird aufgerufen

- **TC-DRAW-004**: Sollte geladene Objekte normalisieren
  - Erwartung: selected = false, ghost = false für alle Objekte

#### Test Suite: Object Saving
- **TC-DRAW-005**: Sollte neues Objekt speichern
  - Input: FormObject oder FreeObject
  - Erwartung: Objekt wird zu modelData hinzugefügt

- **TC-DRAW-006**: Sollte existierendes Objekt aktualisieren
  - Input: Objekt mit existierender ID
  - Erwartung: Objekt wird in modelData aktualisiert

- **TC-DRAW-007**: Sollte Ghost-Objekte beim Speichern entfernen
  - Erwartung: Objekte mit ghost = true werden gefiltert

- **TC-DRAW-008**: Sollte alle Objekte deselektieren beim Speichern
  - Erwartung: selected = false für alle Objekte

#### Test Suite: Firebase Integration
- **TC-DRAW-009**: Sollte Projekt zu Firebase speichern
  - Input: projectName, isPrivate, newProject
  - Erwartung: firebaseService.saveProject wird aufgerufen

- **TC-DRAW-010**: Sollte Lizenzschlüssel für private Projekte generieren
  - Input: isPrivate = true
  - Erwartung: licenceKey !== 'public'

- **TC-DRAW-011**: Sollte 'public' für öffentliche Projekte setzen
  - Input: isPrivate = false
  - Erwartung: licenceKey = 'public'

- **TC-DRAW-012**: Sollte alle Objekte zu Firebase speichern
  - Erwartung: firebaseService.saveObject für jedes Objekt

- **TC-DRAW-013**: Sollte project-id in localStorage speichern
  - Erwartung: localStorage.setItem('project-id', ...) wird aufgerufen

#### Test Suite: View Management
- **TC-DRAW-014**: Sollte View in localStorage speichern
  - Input: view Objekt
  - Erwartung: localStorage.setItem('view', ...) wird aufgerufen

- **TC-DRAW-015**: Sollte View aus localStorage laden
  - Erwartung: Gespeicherte View wird zurückgegeben

- **TC-DRAW-016**: Sollte DEFAULT_VIEW bei fehlender View zurückgeben
  - Erwartung: DEFAULT_VIEW wird zurückgegeben

#### Test Suite: Drawing Methods
- **TC-DRAW-017**: Sollte rectangle() aufrufen
  - Erwartung: Rechteck-Zeichenmodus wird aktiviert

- **TC-DRAW-018**: Sollte circle() aufrufen
  - Erwartung: Kreis-Zeichenmodus wird aktiviert

- **TC-DRAW-019**: Sollte freeform() aufrufen
  - Erwartung: Freiform-Zeichenmodus wird aktiviert

#### Test Suite: Helper Methods
- **TC-DRAW-020**: Sollte eindeutige ID generieren
  - Erwartung: generateId() gibt eindeutigen String zurück

- **TC-DRAW-021**: Sollte Hash generieren
  - Input: String
  - Erwartung: Hash-String wird zurückgegeben

- **TC-DRAW-022**: Sollte alle Objekte deselektieren
  - Erwartung: deselectAllObjects setzt selected = false

#### Test Suite: Observable
- **TC-DRAW-023**: Sollte reload$ BehaviorSubject bereitstellen
  - Erwartung: reload$ kann subscribed werden

---

### 5.2 FileService (`file.service.ts`)

#### Test Suite: File Operations
- **TC-FILE-001**: Sollte save() aufrufen
  - Erwartung: Datei wird als JSON gespeichert

- **TC-FILE-002**: Sollte saveAsSTEP() aufrufen
  - Erwartung: stepService.convertAndDownload wird aufgerufen

- **TC-FILE-003**: Sollte saveAsSTL() aufrufen
  - Erwartung: stlService.downloadStlFromJsonString wird aufgerufen

- **TC-FILE-004**: Sollte upload() aufrufen
  - Erwartung: File Input wird getriggert, Datei wird geladen

#### Test Suite: Service Integration
- **TC-FILE-005**: Sollte DrawService korrekt injizieren
  - Erwartung: drawService ist verfügbar

- **TC-FILE-006**: Sollte StlService korrekt injizieren
  - Erwartung: stlService ist verfügbar

- **TC-FILE-007**: Sollte StepService korrekt injizieren
  - Erwartung: stepService ist verfügbar

---

### 5.3 FirebaseService (`firebase.service.ts`)

#### Test Suite: Authentication
- **TC-FB-001**: Sollte aktuelle User Email abrufen
  - Erwartung: getCurrentUserEmail gibt E-Mail zurück

- **TC-FB-002**: Sollte null zurückgeben wenn kein User eingeloggt
  - Erwartung: getCurrentUserEmail gibt null zurück

#### Test Suite: Project Operations
- **TC-FB-003**: Sollte alle Projekte abrufen
  - Erwartung: getProjects gibt Observable<Project[]> zurück

- **TC-FB-004**: Sollte öffentliche Projekte abrufen
  - Erwartung: getPublicProjects filtert nach licenceKey = 'public'

- **TC-FB-005**: Sollte Projekte nach Owner filtern
  - Input: ownerEmail
  - Erwartung: getProjectsByOwner filtert korrekt

- **TC-FB-006**: Sollte Projekt nach ID abrufen
  - Input: projectId
  - Erwartung: getProjectById gibt Observable<Project | null> zurück

- **TC-FB-007**: Sollte Projekt speichern
  - Input: Project Objekt
  - Erwartung: saveProject erstellt/aktualisiert Firestore Dokument

#### Test Suite: Object Operations
- **TC-FB-008**: Sollte Objekte eines Projekts abrufen
  - Input: projectId
  - Erwartung: getObjectsByProjectId gibt Observable<(FormObject | FreeObject)[]> zurück

- **TC-FB-009**: Sollte Objekt speichern
  - Input: projectId, object
  - Erwartung: saveObject erstellt Firestore Dokument in Subcollection

- **TC-FB-010**: Sollte existierendes Objekt aktualisieren
  - Input: projectId, existierendes object
  - Erwartung: updateObject aktualisiert Firestore Dokument

- **TC-FB-011**: Sollte Objekt löschen
  - Input: projectId, objectId
  - Erwartung: deleteObject löscht Firestore Dokument

#### Test Suite: Error Handling
- **TC-FB-012**: Sollte Fehler beim Speichern behandeln
  - Erwartung: Error wird geworfen und geloggt

- **TC-FB-013**: Sollte Fehler beim Laden behandeln
  - Erwartung: Observable wirft Fehler

---

### 5.4 GlobalService (`global.service.ts`)

#### Test Suite: Popup Management
- **TC-GLOBAL-001**: Sollte Save Project Popup öffnen
  - Erwartung: isSaveProjectPopupOpen$ emittiert true

- **TC-GLOBAL-002**: Sollte Save Project Popup schließen
  - Erwartung: isSaveProjectPopupOpen$ emittiert false

- **TC-GLOBAL-003**: Sollte isNewProject Flag setzen
  - Input: isNewProject = true
  - Erwartung: getIsNewProject() gibt true zurück

- **TC-GLOBAL-004**: Sollte reload$ triggern beim Popup öffnen
  - Erwartung: drawService.reload$.next() wird aufgerufen

- **TC-GLOBAL-005**: Sollte reload$ triggern beim Popup schließen
  - Erwartung: drawService.reload$.next() wird aufgerufen

#### Test Suite: Observables
- **TC-GLOBAL-006**: Sollte isSaveProjectPopupOpen Observable bereitstellen
  - Erwartung: Observable kann subscribed werden

- **TC-GLOBAL-007**: Sollte requestProjectData Subject bereitstellen
  - Erwartung: Subject kann subscribed werden

---

### 5.5 ThreeSceneService (`three-scene.service.ts`)

#### Test Suite: Scene Initialization
- **TC-3D-001**: Sollte Scene initialisieren
  - Input: HTMLCanvasElement
  - Erwartung: Scene, Camera, Renderer werden erstellt

- **TC-3D-002**: Sollte Renderer konfigurieren
  - Erwartung: Antialias, Shadow Maps werden aktiviert

- **TC-3D-003**: Sollte Camera erstellen
  - Erwartung: PerspectiveCamera mit korrekten Parametern

- **TC-3D-004**: Sollte RootGroup zur Scene hinzufügen
  - Erwartung: rootGroup ist child von scene

#### Test Suite: Scene Elements
- **TC-3D-005**: Sollte Grid Helper hinzufügen
  - Erwartung: GridHelper wird zu rootGroup hinzugefügt

- **TC-3D-006**: Sollte Lichter hinzufügen
  - Erwartung: AmbientLight und DirectionalLight werden hinzugefügt

- **TC-3D-007**: Sollte Hintergrund laden
  - Erwartung: Scene.background wird gesetzt

#### Test Suite: Getters
- **TC-3D-008**: Sollte Scene getter bereitstellen
  - Erwartung: getScene() gibt Scene zurück

- **TC-3D-009**: Sollte Camera getter bereitstellen
  - Erwartung: getCamera() gibt Camera zurück

- **TC-3D-010**: Sollte Renderer getter bereitstellen
  - Erwartung: getRenderer() gibt Renderer zurück

- **TC-3D-011**: Sollte RootGroup getter bereitstellen
  - Erwartung: getRootGroup() gibt Group zurück

#### Test Suite: Resize
- **TC-3D-012**: Sollte auf Window Resize reagieren
  - Erwartung: onResize aktualisiert Renderer und Camera Aspect

- **TC-3D-013**: Sollte Scene clearen
  - Erwartung: clearScene entfernt alle Objekte außer Grid/Lights

---

### 5.6 ModelRenderService (`model-render.service.ts`)

#### Test Suite: FormObject Rendering
- **TC-MODEL-001**: Sollte Square rendern
  - Input: FormObject type 'Square'
  - Erwartung: BoxGeometry wird erstellt und zur Scene hinzugefügt

- **TC-MODEL-002**: Sollte Circle rendern
  - Input: FormObject type 'Circle'
  - Erwartung: CylinderGeometry wird erstellt und zur Scene hinzugefügt

- **TC-MODEL-003**: Sollte Position korrekt setzen
  - Input: position [x, y, z]
  - Erwartung: Mesh.position ist korrekt gesetzt

- **TC-MODEL-004**: Sollte Rotation korrekt setzen
  - Input: rotation [x, y, z]
  - Erwartung: Mesh.rotation ist korrekt gesetzt (in Radiant)

#### Test Suite: FreeObject Rendering
- **TC-MODEL-005**: Sollte Freeform Objekt rendern
  - Input: FreeObject mit commands
  - Erwartung: ExtrudeGeometry wird erstellt

- **TC-MODEL-006**: Sollte moveTo Command verarbeiten
  - Input: command type 'moveTo'
  - Erwartung: Shape.moveTo wird aufgerufen

- **TC-MODEL-007**: Sollte lineTo Command verarbeiten
  - Input: command type 'lineTo'
  - Erwartung: Shape.lineTo wird aufgerufen

- **TC-MODEL-008**: Sollte quadraticCurveTo Command verarbeiten
  - Input: command type 'quadraticCurveTo'
  - Erwartung: Shape.quadraticCurveTo mit berechneten Kontrollpunkten

#### Test Suite: Material & Colors
- **TC-MODEL-009**: Sollte normale Objektfarbe verwenden
  - Input: isSelected = false, isGhost = false
  - Erwartung: objectColor wird verwendet

- **TC-MODEL-010**: Sollte selektierte Objektfarbe verwenden
  - Input: isSelected = true
  - Erwartung: selectedObjectColor wird verwendet

- **TC-MODEL-011**: Sollte Ghost Objektfarbe verwenden
  - Input: isGhost = true
  - Erwartung: ghostObjectColor mit Transparenz wird verwendet

#### Test Suite: Edges
- **TC-MODEL-012**: Sollte Edges für Objekt rendern
  - Erwartung: EdgesGeometry und LineSegments werden erstellt

- **TC-MODEL-013**: Sollte Edge-Farbe für Selektion ändern
  - Input: isSelected = true
  - Erwartung: selectedEdgeColor wird verwendet

#### Test Suite: Object Management
- **TC-MODEL-014**: Sollte Objekt zu objects Array hinzufügen
  - Erwartung: getObjects() enthält gerendertes Objekt

- **TC-MODEL-015**: Sollte Ghost-Objekte nicht zu Array hinzufügen
  - Input: isGhost = true
  - Erwartung: Objekt ist nicht in objects Array

- **TC-MODEL-016**: Sollte alle Objekte clearen
  - Erwartung: clearObjects() leert objects Array

- **TC-MODEL-017**: Sollte getObjects() korrekt funktionieren
  - Erwartung: Array von THREE.Object3D wird zurückgegeben

---

### 5.7 InteractionService (`interaction.service.ts`)

#### Test Suite: Event Listeners
- **TC-INT-001**: Sollte Event Listeners einrichten
  - Input: canvas, camera, rootGroup, callbacks
  - Erwartung: setupEventListeners registriert alle Events

- **TC-INT-002**: Sollte onClick Event verarbeiten
  - Erwartung: Objekt-Selektion funktioniert

- **TC-INT-003**: Sollte onMouseMove Event verarbeiten
  - Erwartung: Hover-Effekte funktionieren

- **TC-INT-004**: Sollte onKeyDown Event verarbeiten
  - Erwartung: Keyboard Shortcuts funktionieren

#### Test Suite: Object Interaction
- **TC-INT-005**: Sollte Objekt selektieren bei Klick
  - Erwartung: drawService.selectObject wird aufgerufen

- **TC-INT-006**: Sollte Raycasting für Objekt-Picking verwenden
  - Erwartung: THREE.Raycaster findet geklickte Objekte

- **TC-INT-007**: Sollte Rotation Callback triggern
  - Erwartung: rotationCallback wird mit THREE.Euler aufgerufen

---

### 5.8 AnimationService (`animation.service.ts`)

#### Test Suite: Animation Loop
- **TC-ANIM-001**: Sollte Animation starten
  - Erwartung: startAnimation initialisiert Animation Loop

- **TC-ANIM-002**: Sollte Animation stoppen
  - Erwartung: stopAnimation beendet Animation Loop

- **TC-ANIM-003**: Sollte Renderer in jedem Frame aufrufen
  - Erwartung: renderer.render wird kontinuierlich aufgerufen

- **TC-ANIM-004**: Sollte requestAnimationFrame verwenden
  - Erwartung: requestAnimationFrame wird für smooth Animation verwendet

---

### 5.9 StlService (`stl.service.ts`)

#### Test Suite: Geometry Conversion
- **TC-STL-001**: Sollte Geometry zu ASCII STL konvertieren
  - Input: THREE.BufferGeometry
  - Erwartung: ASCII STL String wird zurückgegeben

- **TC-STL-002**: Sollte Nummer korrekt formatieren
  - Input: Number
  - Erwartung: fmt() gibt String mit korrekter Präzision zurück

#### Test Suite: File Download
- **TC-STL-003**: Sollte STL Download von JSON String triggern
  - Input: JSON String, filename
  - Erwartung: Download wird initiiert

- **TC-STL-004**: Sollte Square zu STL konvertieren
  - Input: FormObject type 'Square'
  - Erwartung: Box Geometry wird zu STL konvertiert

- **TC-STL-005**: Sollte Circle zu STL konvertieren
  - Input: FormObject type 'Circle'
  - Erwartung: Cylinder Geometry wird zu STL konvertiert

- **TC-STL-006**: Sollte Freeform zu STL konvertieren
  - Input: FreeObject
  - Erwartung: Extruded Shape wird zu STL konvertiert

#### Test Suite: Unit Conversion
- **TC-STL-007**: Sollte cm zu mm konvertieren
  - Erwartung: Positionen/Größen werden mit 10 multipliziert

- **TC-STL-008**: Sollte saveToServer Parameter verarbeiten
  - Input: saveToServer = true
  - Erwartung: STL wird auch zum Server gesendet

---

### 5.10 StepService (`step.service.ts`)

#### Test Suite: API Communication
- **TC-STEP-001**: Sollte convertAndDownload aufrufen
  - Erwartung: HTTP POST zu API wird gesendet

- **TC-STEP-002**: Sollte STEP Datei herunterladen
  - Erwartung: downloadStepFile wird nach Konvertierung aufgerufen

- **TC-STEP-003**: Sollte Fehler bei API-Ausfall behandeln
  - Erwartung: Error wird geworfen und geloggt

#### Test Suite: Service Integration
- **TC-STEP-004**: Sollte StlService für STL-Generierung verwenden
  - Erwartung: stlService.downloadStlFromJsonString wird aufgerufen

- **TC-STEP-005**: Sollte DrawService für Daten verwenden
  - Erwartung: drawService wird für model-data verwendet

---

## 6. App Component

### 6.1 AppComponent (`app.component.ts`)

#### Test Suite: Component Creation
- **TC-APP-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Initialization
- **TC-APP-002**: Sollte ngOnInit korrekt ausführen
  - Erwartung: Auth State wird überprüft

- **TC-APP-003**: Sollte isAuthenticated korrekt setzen
  - Erwartung: isAuthenticated basiert auf authService

- **TC-APP-004**: Sollte isAuthLoading initial auf true setzen
  - Erwartung: Loading State während Auth-Check

#### Test Suite: Popup State
- **TC-APP-005**: Sollte Save Project Popup State überwachen
  - Erwartung: checkSaveProjectPopupState subscribed zu globalService

- **TC-APP-006**: Sollte isSaveProjectPopupOpen korrekt aktualisieren
  - Erwartung: Property synchronisiert mit globalService

#### Test Suite: Service Injection
- **TC-APP-007**: Sollte AuthService injizieren
  - Erwartung: authService ist verfügbar

- **TC-APP-008**: Sollte GlobalService injizieren
  - Erwartung: globalService ist verfügbar

- **TC-APP-009**: Sollte DrawService injizieren
  - Erwartung: drawService ist verfügbar

---

## 7. Save Project Popup Component

### 7.1 SaveProjectPopupComponent (`save-project-popup.component.ts`)

#### Test Suite: Component Creation
- **TC-POPUP-001**: Sollte Component erstellen
  - Erwartung: Component Instanz ist truthy

#### Test Suite: Form Management
- **TC-POPUP-002**: Sollte Form initialisieren
  - Erwartung: FormGroup mit projectName und isPrivate

- **TC-POPUP-003**: Sollte Form für neues Projekt zurücksetzen
  - Input: isNewProject = true
  - Erwartung: Form hat Default-Werte 'New Project', false

- **TC-POPUP-004**: Sollte Form mit existierenden Projektdaten füllen
  - Input: existierende project-id
  - Erwartung: Form wird mit Firebase-Daten gefüllt

#### Test Suite: Project Saving
- **TC-POPUP-005**: Sollte Projekt speichern
  - Input: projectName, isPrivate
  - Erwartung: drawService.saveProjectToFirebase wird aufgerufen

- **TC-POPUP-006**: Sollte saved Flag nach Speichern setzen
  - Erwartung: saved = true nach erfolgreichem Speichern

- **TC-POPUP-007**: Sollte projectSavingResult aktualisieren
  - Erwartung: Result enthält projectName, licenceKey, projectId

- **TC-POPUP-008**: Sollte Fehler beim Speichern behandeln
  - Erwartung: Error wird in projectSavingResult.error gesetzt

#### Test Suite: License Management
- **TC-POPUP-009**: Sollte Lizenzschlüssel kopieren
  - Erwartung: licenceCopied Flag wird gesetzt

- **TC-POPUP-010**: Sollte privaten Lizenzschlüssel anzeigen
  - Input: isPrivate = true
  - Erwartung: Lizenzschlüssel wird in UI angezeigt

- **TC-POPUP-011**: Sollte für öffentliches Projekt 'public' anzeigen
  - Input: isPrivate = false
  - Erwartung: licenceKey = 'public'

#### Test Suite: Lifecycle
- **TC-POPUP-012**: Sollte auf Popup Open State reagieren
  - Erwartung: ngOnInit subscribed zu isSaveProjectPopupOpen

- **TC-POPUP-013**: Sollte ngOnDestroy Subscriptions cleanen
  - Erwartung: subscription.unsubscribe wird aufgerufen

---

## 8. Interfaces & Types

### 8.1 Interfaces (`interfaces.ts`)

#### Test Suite: Type Definitions
- **TC-TYPE-001**: Sollte User Interface korrekt definieren
  - Properties: email, username

- **TC-TYPE-002**: Sollte Project Interface korrekt definieren
  - Properties: id, name, licenceKey, ownerEmail, createdAt, updatedAt

- **TC-TYPE-003**: Sollte FormObject Interface korrekt definieren
  - Properties: id, name, type, l, w, h, r, position, rotation, curveSegments, selected, ghost

- **TC-TYPE-004**: Sollte FreeObject Interface korrekt definieren
  - Properties: id, name, type, commands, h, position, rotation, selected, ghost

- **TC-TYPE-005**: Sollte FreeObjectCommand Type korrekt definieren
  - Types: moveTo, lineTo, quadraticCurveTo

- **TC-TYPE-006**: Sollte view Interface korrekt definieren
  - Properties: camera, rootGroup mit position, rotation, scale

- **TC-TYPE-007**: Sollte projectSavingResult Interface korrekt definieren
  - Properties: success, projectName, licenceKey, projectId, error

---

## 9. Integration Tests

### 9.1 Complete User Flows
- **TC-INT-FLOW-001**: Kompletter Registrierungs-Flow
  - Schritte: Register -> Login -> Overview
  - Erwartung: User wird erstellt und eingeloggt

- **TC-INT-FLOW-002**: Kompletter Projekt-Erstellungs-Flow
  - Schritte: Login -> Overview -> Add Project -> Editor -> Save
  - Erwartung: Projekt wird in Firebase gespeichert

- **TC-INT-FLOW-003**: Kompletter Objekt-Erstellungs-Flow
  - Schritte: Editor öffnen -> Objekt zeichnen -> Objekt speichern
  - Erwartung: Objekt erscheint in Scene und localStorage

- **TC-INT-FLOW-004**: Export-Flow
  - Schritte: Projekt laden -> Export als STL/STEP
  - Erwartung: Datei wird heruntergeladen

---

## 10. Test-Ausführung

### Befehle
```bash
# Alle Tests ausführen
npm test

# Tests im Watch-Mode
npm run test:watch

# Coverage Report
npm run test:coverage
```

### Test-Konfiguration
- Framework: Jest
- Konfiguration: `jest.config.js`
- Setup: `setup-jest.ts`

---

## 11. Testabdeckung Ziele

| Modul | Ziel-Abdeckung |
|-------|----------------|
| Components | ≥ 80% |
| Services | ≥ 90% |
| Guards | 100% |
| Interfaces | 100% |
| Gesamtprojekt | ≥ 85% |

---

## Notizen

- Alle Tests sollten isoliert und unabhängig voneinander sein
- Mocks für Firebase, HTTP und externe Services verwenden
- Test-Fixtures für wiederverwendbare Test-Daten erstellen
- Async/Await korrekt für asynchrone Tests verwenden
- Edge Cases und Fehlerszenarien testen
- Performance-kritische Bereiche (3D Rendering) mit Timeouts testen

---

**Erstellt am:** 27. Januar 2026  
**Version:** 1.0  
**Projekt:** Minimal-CAD
