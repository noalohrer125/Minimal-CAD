import Mesh
import Part

# STL laden
mesh = Mesh.Mesh('model.stl')
print(f"Mesh geladen: {mesh.CountFacets} Facetten")

# Mesh reparieren
print("Repariere Mesh...")
try:
    mesh.fillHoles()
    mesh.removeDuplicateFaces()
    mesh.removeDegenerateFaces()
    mesh.harmonizeNormals()
except AttributeError:
    print("Mesh-Reparatur übersprungen (Methode nicht verfügbar)")

# Mesh zu Shape konvertieren mit niedrigerer Toleranz
print("Konvertiere zu Shape...")
shape = Part.Shape()
shape.makeShapeFromMesh(mesh.Topology, 0.01)  # Niedrigere Toleranz für bessere Qualität

if not shape.isValid():
    print("WARNUNG: Shape ist nicht valide, versuche zu reparieren...")
    shape = shape.removeSplitter()

# Versuche Solid zu erstellen
print("Erstelle Solid...")
if shape.isClosed():
    try:
        solid = Part.Solid(shape)
        print("Solid erfolgreich erstellt")
    except:
        print("Solid-Erstellung fehlgeschlagen, exportiere als Shell")
        solid = shape
else:
    print("Shape ist nicht geschlossen, exportiere als Shell")
    solid = shape

# Als STEP exportieren
print("Exportiere STEP...")
# Alternative Methode: Compound erstellen
import Part
comp = Part.makeCompound([solid])
comp.exportStep('output.step')
print("STEP exportiert nach output.step")

# Validierung
print(f"Shape-Typ: {solid.ShapeType}")
print(f"Anzahl Faces: {len(solid.Faces)}")
print(f"Anzahl Edges: {len(solid.Edges)}")
print(f"Ist geschlossen: {solid.isClosed() if hasattr(solid, 'isClosed') else 'N/A'}")
