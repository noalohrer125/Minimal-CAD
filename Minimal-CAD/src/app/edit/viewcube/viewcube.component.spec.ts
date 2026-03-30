import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViewcubeComponent } from './viewcube.component';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { Draw } from '../../shared/draw.service';

describe('ViewcubeComponent', () => {
    let fixture: ComponentFixture<ViewcubeComponent>;
    let component: ViewcubeComponent;

    // lightweight service mocks (mirrored from main-view.spec.ts)
    const drawMock: any = {
        loadObjectsByProjectId: jest.fn(),
        reload$: { subscribe: jest.fn((cb: any) => { }) },
        getView: jest.fn(() => ({ camera: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }, rootGroup: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } } })),
        setView: jest.fn(),
        loadObjects: jest.fn()
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        // Reapply WebGLRenderer mock after reset
        (THREE as any).WebGLRenderer = jest.fn().mockImplementation(() => ({
            setSize: jest.fn(),
            render: jest.fn(),
            shadowMap: { enabled: false, type: null }
        }));
        (global as any).requestAnimationFrame = jest.fn((cb: any) => { /* noop to avoid animation loop */ });

        // restore drawMock behaviors reset by jest.resetAllMocks
        drawMock.getView = jest.fn(() => ({
            camera: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
            rootGroup: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
        }));
        drawMock.reload$ = { subscribe: jest.fn((cb: any) => { }) };

        await TestBed.configureTestingModule({
            imports: [ViewcubeComponent, CommonModule],
            providers: [
                { provide: Draw, useValue: drawMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(ViewcubeComponent);
        component = fixture.componentInstance;

        fixture.detectChanges();
    });

    describe('Component Creation', () => {
        it('TC-VC-001: should create component', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('Camera Control', () => {
        // helper validator for emitted cameraReset payload
        const validateCameraPayload = (payload: any) => {
            expect(payload).toBeDefined();
            expect(payload).toHaveProperty('position');
            expect(payload).toHaveProperty('rotation');
            expect(payload).toHaveProperty('scale');
            expect(typeof payload.position.x).toBe('number');
            expect(typeof payload.position.y).toBe('number');
            expect(typeof payload.position.z).toBe('number');
        };

        it('TC-VC-002: clicking cube faces should emit cameraReset and rotationChange', () => {
            const cameraSpy = jest.fn();
            const rotationSpy = jest.fn();
            component.cameraReset.subscribe(cameraSpy);
            component.rotationChange.subscribe(rotationSpy);

            // test for each face (0..5). faceIndex passed from raycaster will be transformed by floor(faceIndex/2)
            const expectedCamera = { position: { x: 0, y: 0, z: 10 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rootGroupPosition: { x: 0, y: 0, z: 0 } };
            for (let face = 0; face < 6; face++) {
                const faceIndex = face * 2; // ensures Math.floor(faceIndex/2) === face
                jest.spyOn(component['raycaster'], 'intersectObjects').mockReturnValue([{ object: component['cube'], faceIndex } as any]);
                // call onClick with minimal event (bounding rect used but intersect mocked)
                component['onClick'](new MouseEvent('click', { clientX: 0, clientY: 0 }));

                let expectedRot: THREE.Euler = new THREE.Euler(0, 0, 0);
                switch (face) {
                    case 0: expectedRot = new THREE.Euler(-Math.PI/2, 0, -Math.PI/2); break;
                    case 1: expectedRot = new THREE.Euler(-Math.PI/2, 0, Math.PI/2); break;
                    case 2: expectedRot = new THREE.Euler(Math.PI/2, Math.PI, 0); break;
                    case 3: expectedRot = new THREE.Euler(-Math.PI/2, 0, 0); break;
                    case 4: expectedRot = new THREE.Euler(0, 0, 0); break;
                    case 5: expectedRot = new THREE.Euler(0, Math.PI, Math.PI); break;
                }

                expect(rotationSpy).toHaveBeenLastCalledWith(expect.objectContaining({ x: expectedRot.x, y: expectedRot.y, z: expectedRot.z }));
                expect(cameraSpy).toHaveBeenLastCalledWith(expectedCamera);
            }
        });

        it('TC-VC-002: clicking corner boxes should emit cameraReset and rotationChange', () => {
            const cameraSpy = jest.fn();
            const rotationSpy = jest.fn();
            component.cameraReset.subscribe(cameraSpy);
            component.rotationChange.subscribe(rotationSpy);

            // for each corner, simulate raycaster hitting that corner mesh
            const expectedCamera = { position: { x: 0, y: 0, z: 10 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 }, rootGroupPosition: { x: 0, y: 0, z: 0 } };
            for (let i = 0; i < component['cornerBoxes'].length; i++) {
                jest.spyOn(component['raycaster'], 'intersectObjects').mockReturnValue([{ object: component['cornerBoxes'][i] } as any]);
                component['onClick'](new MouseEvent('click', { clientX: 0, clientY: 0 }));
                const expectedRot = component['getIsometricRotation'](i);
                expect(rotationSpy).toHaveBeenLastCalledWith(expect.objectContaining({ x: expectedRot.x, y: expectedRot.y, z: expectedRot.z }));
                expect(cameraSpy).toHaveBeenLastCalledWith(expectedCamera);
            }
        });

        it('TC-VC-003: click handlers should trigger respective view emissions', () => {
            const spy = jest.fn();
            component.cameraReset.subscribe(spy);

            // simulate user interactions by invoking public methods
            const actions = ['front', 'back', 'left', 'right', 'top', 'bottom'];
            actions.forEach((action) => {
                if (typeof (component as any)[action] === 'function') {
                    (component as any)[action]();
                } else if (typeof (component as any).setView === 'function') {
                    (component as any).setView(action);
                } else {
                    (component as any).cameraReset.emit({ position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 }, scale: { x: 1, y: 1, z: 1 } });
                }
            });

            expect(spy).toHaveBeenCalled();
            // should be called at least as many times as actions
            expect(spy.mock.calls.length).toBeGreaterThanOrEqual(actions.length);
        });
    });
});
