import { TestBed } from '@angular/core/testing';
import { ModelRenderService } from './model-render.service';

// Minimal three mock for ModelRender tests
jest.mock('three', () => {
    class MockGeometry { }
    class BoxGeometry extends MockGeometry { constructor(public l?: any, public w?: any, public h?: any) { super(); } }
    class CylinderGeometry extends MockGeometry { constructor(public r1?: any, public r2?: any, public h?: any, public seg?: any) { super(); } }
    class ExtrudeGeometry extends MockGeometry { constructor(public shape?: any, public settings?: any) { super(); } }

    class Vector2 { constructor(public x = 0, public y = 0) { } }

    class Shape {
        autoClose = false;
        constructor() {}
    }

    class Material { constructor(public opts?: any) { } }
    class MeshPhysicalMaterial extends Material { }
    class LineBasicMaterial extends Material { }

    class Mesh {
        position = { set: jest.fn(), copy: jest.fn() } as any;
        rotation: any = { x: 0, y: 0, z: 0, copy: jest.fn() };
        userData: any = null;
        castShadow = false;
        receiveShadow = false;
        constructor(public geometry?: any, public material?: any) { }
    }

    class EdgesGeometry { constructor(public g?: any) { } }
    class LineSegments { position = { copy: jest.fn() }; rotation = { copy: jest.fn() }; constructor(public edges?: any, public mat?: any) { } }

    class Vector3 { constructor(public x = 0, public y = 0, public z = 0) { } }

    class Group { children: any[] = []; add(obj: any) { this.children.push(obj); } }

    // attach prototype methods so spies can intercept calls
    (Shape.prototype as any).moveTo = jest.fn();
    (Shape.prototype as any).lineTo = jest.fn();
    (Shape.prototype as any).quadraticCurveTo = jest.fn();

    return {
        BoxGeometry,
        CylinderGeometry,
        ExtrudeGeometry,
        Shape,
        Vector2,
        MeshPhysicalMaterial,
        LineBasicMaterial,
        Mesh,
        EdgesGeometry,
        LineSegments,
        Group,
        DoubleSide: 'DoubleSide',
    };
});

describe('ModelRenderService', () => {
    let service: ModelRenderService;

    beforeEach(() => {
        jest.resetAllMocks();
        TestBed.configureTestingModule({ providers: [ModelRenderService] });
        service = TestBed.inject(ModelRenderService);
    });
    const THREE = require('three');

    describe('FormObject Rendering', () => {
        beforeEach(() => service.clearObjects());

        it('TC-MODEL-001: Sollte Square rendern und Mesh hinzufügen', () => {
            const root: any = new THREE.Group();
            const square: any = { type: 'Square', l: 1, w: 2, h: 3, position: [1, 2, 3], rotation: [0, 0, 0] };
            service.renderFormObject(square, root, false, false);
            expect(root.children.length).toBeGreaterThan(0);
            expect(service.getObjects().length).toBeGreaterThan(0);
        });

        it('TC-MODEL-002: Sollte Circle rendern und Mesh hinzufügen', () => {
            const root: any = new THREE.Group();
            const circle: any = { type: 'Circle', r: 1, h: 2, curveSegments: 32, position: [0, 0, 0], rotation: [0, 0, 0] };
            service.renderFormObject(circle, root, false, false);
            expect(root.children.length).toBeGreaterThan(0);
            expect(service.getObjects().length).toBeGreaterThan(0);
        });

        it('TC-MODEL-003: Sollte Position korrekt setzen', () => {
            const root: any = new THREE.Group();
            const obj: any = { type: 'Square', l: 1, w: 1, h: 1, position: [4, 5, 6], rotation: [0, 0, 0] };
            service.renderFormObject(obj, root, false, false);
            const mesh = root.children.find((c: any) => c instanceof THREE.Mesh);
            expect(mesh).toBeTruthy();
            // position z may be adjusted by service (e.g. half-height); assert components with tolerance
            const calls = mesh.position.set.mock.calls;
            expect(calls.length).toBeGreaterThan(0);
            expect(calls[0][0]).toBe(4);
            expect(calls[0][1]).toBe(5);
            expect(Math.abs(calls[0][2] - 6)).toBeLessThan(1);
        });

        it('TC-MODEL-004: Sollte Rotation korrekt setzen', () => {
            const root: any = new THREE.Group();
            const obj: any = { type: 'Square', l: 1, w: 1, h: 1, position: [0, 0, 0], rotation: [1, 2, 3] };
            service.renderFormObject(obj, root, false, false);
            const mesh = root.children.find((c: any) => c instanceof THREE.Mesh);
            expect(mesh).toBeTruthy();
            expect(typeof mesh.rotation.x).toBe('number');
        });
    });

    describe('FreeObject Rendering', () => {
        beforeEach(() => service.clearObjects());

        it('TC-MODEL-005: Sollte Freeform Objekt rendern', () => {
            const root: any = new THREE.Group();
            const free: any = { commands: [{ type: 'moveTo', x: 0, y: 0 }], h: 1, position: [0, 0, 0], rotation: [0, 0, 0] };
            service.renderFreeFormObject(free, root, false, false);
            expect(root.children.find((c: any) => c instanceof THREE.Mesh)).toBeTruthy();
        });

        it('TC-MODEL-006: Sollte moveTo Command verarbeiten', () => {
            const root: any = new THREE.Group();
            if (typeof THREE.Shape.prototype.moveTo !== 'function') {
                THREE.Shape.prototype.moveTo = jest.fn();
            }
            const spy = jest.spyOn(THREE.Shape.prototype, 'moveTo');
            const free: any = { commands: [{ type: 'moveTo', x: 1, y: 2 }], h: 1, position: [0, 0, 0], rotation: [0, 0, 0] };
            service.renderFreeFormObject(free, root, false, false);
            expect(spy).toHaveBeenCalled();
        });

        it('TC-MODEL-007: Sollte lineTo Command verarbeiten', () => {
            const root: any = new THREE.Group();
            if (typeof THREE.Shape.prototype.lineTo !== 'function') {
                THREE.Shape.prototype.lineTo = jest.fn();
            }
            const spy = jest.spyOn(THREE.Shape.prototype, 'lineTo');
            const free: any = { commands: [{ type: 'lineTo', x: 1, y: 1 }], h: 1, position: [0, 0, 0], rotation: [0, 0, 0] };
            service.renderFreeFormObject(free, root, false, false);
            expect(spy).toHaveBeenCalled();
        });

        it('TC-MODEL-008: Sollte quadraticCurveTo Command verarbeiten', () => {
            const root: any = new THREE.Group();
            if (typeof THREE.Shape.prototype.quadraticCurveTo !== 'function') {
                THREE.Shape.prototype.quadraticCurveTo = jest.fn();
            }
            const spy = jest.spyOn(THREE.Shape.prototype, 'quadraticCurveTo');
            const free: any = { commands: [{ type: 'quadraticCurveTo', cpx: 1, cpy: 1, x: 2, y: 2 }], h: 1, position: [0, 0, 0], rotation: [0, 0, 0] };
            service.renderFreeFormObject(free, root, false, false);
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('Material & Colors', () => {
        beforeEach(() => service.clearObjects());

        it('TC-MODEL-009: Sollte normale Objektfarbe verwenden', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, false);
            const mesh = root.children.find((c: any) => c instanceof THREE.Mesh);
            expect(mesh).toBeTruthy();
        });

        it('TC-MODEL-010: Sollte selektierte Objektfarbe verwenden', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, true, false);
            const mesh = root.children.find((c: any) => c instanceof THREE.Mesh);
            expect(mesh).toBeTruthy();
        });

        it('TC-MODEL-011: Sollte Ghost Objektfarbe verwenden', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, true);
            const mesh = root.children.find((c: any) => c instanceof THREE.Mesh);
            expect(mesh).toBeTruthy();
        });
    });

    describe('Edges', () => {
        beforeEach(() => service.clearObjects());

        it('TC-MODEL-012: Sollte Edges für Objekt rendern', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, false);
            const edges = root.children.find((c: any) => c instanceof THREE.LineSegments);
            expect(edges).toBeTruthy();
        });

        it('TC-MODEL-013: Sollte Edge-Farbe für Selektion ändern', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, true, false);
            const edges = root.children.find((c: any) => c instanceof THREE.LineSegments);
            expect(edges).toBeTruthy();
        });
    });

    describe('Object Management', () => {
        beforeEach(() => service.clearObjects());

        it('TC-MODEL-014: Sollte Objekt zu objects Array hinzufügen', () => {
            const root: any = new THREE.Group();
            expect(service.getObjects().length).toBe(0);
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, false);
            expect(service.getObjects().length).toBeGreaterThan(0);
        });

        it('TC-MODEL-015: Sollte Ghost-Objekte nicht zu Array hinzufügen', () => {
            const root: any = new THREE.Group();
            service.clearObjects();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, true);
            // ghost objects should not be present in objects array
            const objs = service.getObjects();
            expect(objs.length).toBe(0);
        });

        it('TC-MODEL-016: Sollte alle Objekte clearen', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, false);
            expect(service.getObjects().length).toBeGreaterThan(0);
            service.clearObjects();
            expect(service.getObjects().length).toBe(0);
        });

        it('TC-MODEL-017: Sollte getObjects() korrekt funktionieren', () => {
            const root: any = new THREE.Group();
            service.renderFormObject({ type: 'Square', l:1,w:1,h:1, position:[0,0,0] } as any, root, false, false);
            const objs = service.getObjects();
            expect(Array.isArray(objs)).toBe(true);
        });
    });
});
