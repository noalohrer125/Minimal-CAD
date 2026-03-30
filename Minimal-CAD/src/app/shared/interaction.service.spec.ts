import { TestBed } from '@angular/core/testing';
import { InteractionService } from './interaction.service';
import { Draw } from './draw.service';

class MockDraw {
    reload$ = { next: jest.fn() } as any;
    loadObjects = jest.fn((): any[] => []);
    removeGhostObjects = jest.fn();
    deselectAllObjects = jest.fn();
    getView = jest.fn(() => ({ rootGroup: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } } }));
    setView = jest.fn();
}

describe('InteractionService', () => {
    let service: InteractionService;
    let mockDraw: MockDraw;

    beforeEach(() => {
        mockDraw = new MockDraw();
        TestBed.configureTestingModule({ providers: [InteractionService, { provide: Draw, useValue: mockDraw } as any] });
        service = TestBed.inject(InteractionService);
    });

    describe('Event Listeners', () => {
        it('TC-INT-001: should register event listeners on the canvas', () => {
            const canvas: any = { addEventListener: jest.fn(), getBoundingClientRect: jest.fn() };
            const camera: any = {};
            const root: any = { };
            service.setupEventListeners(canvas as HTMLCanvasElement, camera, root, () => [], () => {}, () => {});
            // Expect addEventListener called for click, mousedown, mouseup, wheel, mousemove
            const events = canvas.addEventListener.mock.calls.map((c: any[]) => c[0]);
            expect(events).toEqual(expect.arrayContaining(['click','mousedown','mouseup','wheel','mousemove']));
        });

        it('TC-INT-002: should handle click selecting an object (intersect)', () => {
            const canvas: any = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as any;
            const camera: any = {};
            const root: any = {};

            // prepare objects and intersect result
            const selectedObject: any = { userData: { id: 'obj1' } };
            const objects = [selectedObject];
            // mock draw loadObjects to return model data
            mockDraw.loadObjects.mockReturnValue([{ id: 'obj1', selected: false, ghost: false } as any]);

            // spy on internal raycaster intersectObjects
            const raycaster = (service as any).raycaster;
            jest.spyOn(raycaster, 'intersectObjects' as any).mockReturnValue([{ object: selectedObject }]);

            // call private onClick
            (service as any).onClick({ clientX: 10, clientY: 10 } as MouseEvent, canvas, camera, objects, jest.fn());

            expect(mockDraw.removeGhostObjects).toHaveBeenCalled();
            expect(mockDraw.reload$.next).toHaveBeenCalled();
        });

        it('TC-INT-003: should process mousemove for rotation and panning', () => {
            const root: any = {
                rotateOnWorldAxis: jest.fn(),
                rotation: { x: 0, y: 0, z: 0, clone() { return { x: this.x, y: this.y, z: this.z, clone: () => ({ x: this.x, y: this.y, z: this.z }) }; } },
                position: { x: 0, y: 0, z: 0 }
            };
            const onRotation = jest.fn();
            // simulate right-button movement
            (service as any).onMouseMove({ movementX: 10, movementY: 5 } as MouseEvent, root, 'right', onRotation);
            expect(onRotation).toHaveBeenCalled();
            expect(mockDraw.setView).toHaveBeenCalled();

            // simulate middle-button movement
            mockDraw.setView.mockClear();
            (service as any).onMouseMove({ movementX: 3, movementY: 4 } as MouseEvent, root, 'middle', jest.fn());
            expect(mockDraw.setView).toHaveBeenCalled();
        });

        // this functionality is not implemented yet, so nothing to test currently
        it.todo('TC-INT-004: should handle keydown shortcuts');
    });

    describe('Object Interaction', () => {
        it('TC-INT-005: should deselect when clicking empty space', () => {
            const canvas: any = { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) } as any;
            const camera: any = {};
            const objects: any[] = [];
            // make raycaster return no intersects
            const raycaster = (service as any).raycaster;
            jest.spyOn(raycaster, 'intersectObjects' as any).mockReturnValue([]);

            mockDraw.loadObjects.mockReturnValue([]);
            (service as any).onClick({ clientX: 1, clientY: 1 } as MouseEvent, canvas, camera, objects, jest.fn());

            expect(mockDraw.removeGhostObjects).toHaveBeenCalled();
            expect(mockDraw.deselectAllObjects).toHaveBeenCalled();
        });

        it('TC-INT-006: should use Raycaster for object picking', () => {
            const raycaster = (service as any).raycaster;
            const spy = jest.spyOn(raycaster, 'intersectObjects' as any);
            (service as any).onClick({ clientX: 0, clientY: 0 } as MouseEvent, { getBoundingClientRect: () => ({ left:0, top:0, width:100, height:100 }) } as any, {} as any, [], jest.fn());
            expect(spy).toHaveBeenCalled();
        });

        it('TC-INT-007: should trigger rotation callback on right drag', () => {
            const root: any = {
                rotateOnWorldAxis: jest.fn(),
                rotation: { x: 0, y: 0, z: 0, clone() { return { x: this.x, y: this.y, z: this.z, clone: () => ({ x: this.x, y: this.y, z: this.z }) }; } },
                position: { x: 0, y: 0, z: 0 }
            };
            const onRotation = jest.fn();
            (service as any).onMouseMove({ movementX: 2, movementY: 1 } as MouseEvent, root, 'right', onRotation);
            expect(onRotation).toHaveBeenCalled();
        });
    });
});
