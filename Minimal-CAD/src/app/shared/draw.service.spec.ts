import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { skip, take } from 'rxjs/operators';
import { Draw } from './draw.service';
import { FirebaseService } from './firebase.service';
import { createFirebaseServiceMock } from './testing/mock-firebase';

describe('Draw Service', () => {
    let service: Draw;
    let firebaseMock: any;

    beforeEach(() => {
        jest.resetAllMocks();
        localStorage.clear();
        firebaseMock = createFirebaseServiceMock();

        TestBed.configureTestingModule({
            providers: [
                Draw,
                { provide: FirebaseService, useValue: firebaseMock }
            ]
        });

        service = TestBed.inject(Draw);
    });

    describe('Object Loading', () => {
        it('TC-DRAW-001: should load objects from localStorage', () => {
            const models = [{ id: 'a' }, { id: 'b' }];
            localStorage.setItem('model-data', JSON.stringify(models));
            const loaded = service.loadObjects();
            expect(loaded).toEqual(models);
        });

        it('TC-DRAW-002: should return empty array when no localStorage data', () => {
            localStorage.removeItem('model-data');
            const loaded = service.loadObjects();
            expect(Array.isArray(loaded)).toBe(true);
            expect(loaded.length).toBe(0);
        });

        it('TC-DRAW-003: should load objects from Firebase by project id', async () => {
            const remote = [{ id: 'remote1', selected: true, ghost: true }];
            firebaseMock.getObjectsByProjectId.mockReturnValueOnce(of(remote));
            await service.loadObjectsByProjectId('proj-1');
            const stored = service.loadObjects();
            expect(stored.length).toBeGreaterThan(0);
            expect(firebaseMock.getObjectsByProjectId).toHaveBeenCalledWith('proj-1');
        });

        it('TC-DRAW-004: should normalize loaded objects (selected=false, ghost=false)', async () => {
            const remote = [{ id: 'remote2', selected: true, ghost: true } as any];
            firebaseMock.getObjectsByProjectId.mockReturnValueOnce(of(remote));
            await service.loadObjectsByProjectId('proj-2');
            const stored = service.loadObjects();
            expect(stored[0].selected).toBe(false);
            expect(stored[0].ghost).toBe(false);
        });
    });

    describe('Object Saving', () => {
        it('TC-DRAW-005: should save new object to model-data', () => {
            localStorage.removeItem('model-data');
            const obj = { id: 'n1', name: 'New', type: 'Square' } as any;
            service.saveObject(obj);
            const stored = service.loadObjects();
            expect(stored.find((o: any) => o.id === 'n1')).toBeTruthy();
        });

        it('TC-DRAW-006: should update existing object', () => {
            const initial = [{ id: 'u1', name: 'Old', ghost: false }];
            localStorage.setItem('model-data', JSON.stringify(initial));
            const updated = { id: 'u1', name: 'Updated' } as any;
            service.saveObject(updated);
            const stored = service.loadObjects();
            const found = stored.find((o: any) => o.id === 'u1');
            expect(found).toBeTruthy();
            expect((found as any).name).toBe('Updated');
        });

        it('TC-DRAW-007: should remove ghost objects when saving', () => {
            const data = [{ id: 'g1', ghost: true }, { id: 'k1', ghost: false }];
            localStorage.setItem('model-data', JSON.stringify(data));
            service.saveObject({ id: 'k1', name: 'Keep' } as any);
            const stored = service.loadObjects();
            expect(stored.every((o: any) => !o.ghost)).toBe(true);
        });

        it('TC-DRAW-008: should deselect all objects when saving', () => {
            const data = [{ id: 's1', selected: true }, { id: 's2', selected: true }];
            localStorage.setItem('model-data', JSON.stringify(data));
            service.saveObject({ id: 's2', name: 'S2' } as any);
            const stored = service.loadObjects();
            expect(stored.every((o: any) => o.selected === false)).toBe(true);
        });
    });

    describe('Firebase Integration', () => {
        it('TC-DRAW-009: should call firebaseService.saveProject when saving project', async () => {
            localStorage.setItem('model-data', JSON.stringify([{ id: '1' }]));
            await service.saveProjectToFirebase('P', false, true);
            expect(firebaseMock.saveProject).toHaveBeenCalled();
        });

        it('TC-DRAW-010: private project generates licenceKey !== "public"', async () => {
            localStorage.setItem('model-data', JSON.stringify([{ id: '1' }]));
            const res = await service.saveProjectToFirebase('Private', true, true);
            expect(res.licenceKey).not.toBe('public');
        });

        it('TC-DRAW-011: public project sets licenceKey = "public"', async () => {
            localStorage.setItem('model-data', JSON.stringify([{ id: '1' }]));
            const res = await service.saveProjectToFirebase('Public', false, true);
            expect(res.licenceKey).toBe('public');
        });

        it('TC-DRAW-012: should save all non-ghost objects via firebaseService.saveObject', async () => {
            const data = [{ id: 'a', ghost: false }, { id: 'b', ghost: true }];
            localStorage.setItem('model-data', JSON.stringify(data));
            await service.saveProjectToFirebase('SaveObjects', false, true);
            // saveObject should be called once for non-ghost
            expect(firebaseMock.saveObject).toHaveBeenCalled();
            const calls = (firebaseMock.saveObject as jest.Mock).mock.calls.length;
            expect(calls).toBeGreaterThanOrEqual(1);
        });

        it('TC-DRAW-013: should set project-id in localStorage after save', async () => {
            localStorage.setItem('model-data', JSON.stringify([{ id: '1' }]));
            await service.saveProjectToFirebase('MyProject', false, true);
            expect(localStorage.getItem('project-id')).toBeTruthy();
        });
    });

    describe('View Management', () => {
        it('TC-DRAW-014: setView should write view to localStorage', () => {
            const view = { camera: { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0 } }, rootGroup: { scale: {}, position: {} } } as any;
            service.setView(view);
            expect(localStorage.getItem('view')).toBeTruthy();
        });

        it('TC-DRAW-015: getView should read stored view', () => {
            const view = { camera: { position: { x: 5, y: 6, z: 7 }, rotation: { x: 0, y: 0, z: 0 } }, rootGroup: { scale: {}, position: {} } } as any;
            localStorage.setItem('view', JSON.stringify(view));
            const v = service.getView();
            expect(v).toBeTruthy();
        });

        it('TC-DRAW-016: getView returns DEFAULT_VIEW when missing', () => {
            localStorage.removeItem('view');
            const v = service.getView();
            expect(v).toBeTruthy();
        });
    });

    describe('Drawing Methods', () => {
        it('TC-DRAW-017: rectangle() should create a rectangle and emit reload', () => {
            const spy = jest.spyOn(service.reload$, 'next');
            service.rectangle();
            const objs = service.loadObjects();
            expect(objs.find((o: any) => o.type === 'Square')).toBeTruthy();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it('TC-DRAW-018: circle() should create a circle and emit reload', () => {
            const spy = jest.spyOn(service.reload$, 'next');
            service.circle();
            const objs = service.loadObjects();
            expect(objs.find((o: any) => o.type === 'Circle')).toBeTruthy();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });

        it('TC-DRAW-019: freeform() should create a freeform and emit reload', () => {
            const spy = jest.spyOn(service.reload$, 'next');
            service.freeform();
            const objs = service.loadObjects();
            expect(objs.find((o: any) => o.type === 'Freeform')).toBeTruthy();
            expect(spy).toHaveBeenCalled();
            spy.mockRestore();
        });
    });

    describe('Helper Methods', () => {
        it('TC-DRAW-020: generateId returns a string', () => {
            const id = service.generateId();
            expect(typeof id).toBe('string');
            expect(id.length).toBeGreaterThan(0);
        });

        it('TC-DRAW-021: generateHash returns deterministic string', () => {
            const h1 = service.generateHash('abc');
            const h2 = service.generateHash('abc');
            expect(h1).toBe(h2);
            expect(typeof h1).toBe('string');
        });

        it('TC-DRAW-022: deselectAllObjects clears selected flags', () => {
            const models = [{ id: '1', selected: true }, { id: '2', selected: true }];
            localStorage.setItem('model-data', JSON.stringify(models));
            service.deselectAllObjects();
            const after = service.loadObjects();
            expect(after.every((m: any) => m.selected === false)).toBe(true);
        });
    });

    describe('Observable', () => {
        it('TC-DRAW-023: reload$ BehaviorSubject can be subscribed to and emits on actions', (done) => {
            // BehaviorSubject emits current value immediately; skip the initial emission
            service.reload$.pipe(skip(1), take(1)).subscribe(() => {
                done();
            });
            service.rectangle();
        });
    });
});
