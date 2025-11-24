import Mesh
import Part

# Load STL
mesh = Mesh.Mesh('model.stl')
print(f"Mesh loaded: {mesh.CountFacets} facets")

# Repair mesh
print("Repairing mesh...")
try:
    mesh.fillHoles()
    mesh.removeDuplicateFaces()
    mesh.removeDegenerateFaces()
    mesh.harmonizeNormals()
except AttributeError:
    print("Mesh repair skipped (method not available)")

# Convert mesh to shape with lower tolerance
print("Converting to shape...")
shape = Part.Shape()
shape.makeShapeFromMesh(mesh.Topology, 0.01)  # Lower tolerance for better quality

if not shape.isValid():
    print("WARNING: Shape is not valid, attempting to repair...")
    shape = shape.removeSplitter()

# Try to create solid
print("Creating solid...")
if shape.isClosed():
    try:
        solid = Part.Solid(shape)
        print("Solid created successfully")
    except:
        print("Solid creation failed, exporting as shell")
        solid = shape
else:
    print("Shape is not closed, exporting as shell")
    solid = shape

# Export as STEP
print("Exporting STEP...")
# Alternative method: Create compound
import Part
comp = Part.makeCompound([solid])
comp.exportStep('output.step')
print("STEP exported to output.step")

# Validation
print(f"Shape type: {solid.ShapeType}")
print(f"Number of faces: {len(solid.Faces)}")
print(f"Number of edges: {len(solid.Edges)}")
print(f"Is closed: {solid.isClosed() if hasattr(solid, 'isClosed') else 'N/A'}")
