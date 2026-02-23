import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SidebarRightComponent } from './sidebar-right.component';
import { Draw } from '../../shared/draw.service';

describe('SidebarRightComponent (TC-SR-001..TC-SR-011)', () => {
    let fixture: ComponentFixture<SidebarRightComponent>;
    let component: SidebarRightComponent;
    let drawMock: Partial<Draw> & { reload$: BehaviorSubject<void> };

    beforeEach(() => {
        drawMock = {
            reload$: new BehaviorSubject<void>(undefined),
            loadObjects: jest.fn().mockReturnValue([
                { id: 'sel-1', name: 'Selected', selected: true, type: 'Square', position: [0, 0, 0] }
            ]),
            createGhostObject: jest.fn()
        } as any;

        TestBed.configureTestingModule({
            imports: [SidebarRightComponent],
            providers: [{ provide: Draw, useValue: drawMock }]
        }).compileComponents();
    });

    afterEach(() => {
        try { fixture?.destroy(); } catch (e) { /* ignore */ }
        jest.restoreAllMocks();
        jest.resetAllMocks();
    });

    describe('Component Creation', () => {
        it('TC-SR-001: should create component', () => {
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component).toBeTruthy();
        });
    });

    describe('Form Management', () => {
        it('TC-SR-002: should initialize form with all controls', () => {
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.form).toBeTruthy();
            expect(component.form.controls).toBeDefined();
            expect(Object.keys(component.form.controls).length).toBeGreaterThan(0);
        });

        it('TC-SR-003: should populate form with selectedObject data', () => {
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            const mock = { id: '1', name: 'Obj', selected: true, type: 'Square', position: [1, 2, 3] } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue([mock]);
            fixture.detectChanges();
            expect(component.selectedObject).toEqual(mock);
        });

        it('TC-SR-004: should process valueChanges with debounceTime and call updatePreview after 500ms', async () => {
            jest.useFakeTimers();
            const model = { id: 's1', name: 'S', selected: true, type: 'Square', l: 1, w: 1, h: 1, position: [0, 0, 0] } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue(model ? [model] : []);
            drawMock.reload$.next = jest.fn();

            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // change a form value to trigger valueChanges
            component.form.get('size')?.get('length')?.setValue(10);

            // advance timers for debounce
            jest.advanceTimersByTime(500);
            // allow pending microtasks
            await Promise.resolve();

            expect((drawMock.reload$.next as jest.Mock)).toHaveBeenCalled();
            jest.useRealTimers();
        });

        it('TC-SR-005: should emit positionChange event with correct position', () => {
            const model = { id: 's1', name: 'S', selected: true, type: 'Square', l: 1, w: 1, h: 1, position: [0, 0, 0] } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue([model]);
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            const emitSpy = jest.spyOn(component.positionChange, 'emit');
            fixture.detectChanges();

            component.form.get('position')?.get('x')?.setValue(5);
            component.form.get('position')?.get('y')?.setValue(6);
            component.form.get('position')?.get('z')?.setValue(7);

            expect(emitSpy).toHaveBeenCalledWith([5, 6, 7]);
        });
    });

    describe('Object Types', () => {
        it('TC-SR-006: should handle Square object and populate size controls', () => {
            const mock = { id: 'sq', selected: true, type: 'Square', l: 11, w: 22, h: 33, position: [1, 2, 3] } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue([mock]);
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.form.value.size.length).toBe(11);
            expect(component.form.value.size.width).toBe(22);
            expect(component.form.value.size.height).toBe(33);
        });

        it('TC-SR-007: should handle Circle object and populate radius/curveSegments', () => {
            const mock = { id: 'c1', selected: true, type: 'Circle', r: 7, h: 2, curveSegments: 32, position: [0, 0, 0] } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue([mock]);
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.form.value.size.radius).toBe(7);
            expect(component.form.value.size.curveSegments).toBe(32);
        });

        it('TC-SR-008: should handle Freeform object and populate commands FormArray', () => {
            const cmds = [{ type: 'moveTo', x: 1, y: 2 }, { type: 'lineTo', x: 3, y: 4 }];
            const mock = { id: 'f1', selected: true, type: 'Freeform', commands: cmds, position: [0, 0, 0], h: 5 } as any;
            (drawMock.loadObjects as jest.Mock).mockReturnValue([mock]);
            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();
            expect(component.commands.length).toBe(2);
            const first = component.commands.at(0).value;
            expect(first.type).toBe('moveTo');
            expect(first.x).toBe(1);
            expect(first.y).toBe(2);
        });
    });

    describe('Object Manipulation', () => {
        it('TC-SR-009: should update preview on changes (saveToLocalStorage + reload$.next called)', async () => {
            jest.useFakeTimers();
            const modelData: any[] = [{ id: 's2', selected: true, type: 'Square', l: 1, w: 1, h: 1, position: [0, 0, 0] }];
            (drawMock.loadObjects as jest.Mock).mockImplementation(() => modelData);
            drawMock.reload$.next = jest.fn();

            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            component.form.get('size')?.get('length')?.setValue(42);
            jest.advanceTimersByTime(500);
            await Promise.resolve();

            const persisted = JSON.parse(localStorage.getItem('model-data') || '[]');
            expect(persisted.find((o: any) => o.id === 's2').l).toBe(42);
            expect((drawMock.reload$.next as jest.Mock)).toHaveBeenCalled();
            jest.useRealTimers();
        });

        it('TC-SR-010: should save object via drawService.saveObject on submit', async () => {
            const modelData: any[] = [{ id: 's3', selected: true, type: 'Square', l: 1, w: 1, h: 1, position: [0, 0, 0] }];
            (drawMock.loadObjects as jest.Mock).mockImplementation(() => modelData);
            drawMock.saveObject = jest.fn().mockResolvedValue(undefined);
            drawMock.reload$.next = jest.fn();

            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // modify form before submit
            component.form.get('size')?.get('length')?.setValue(99);
            await component.onSubmit();

            expect(drawMock.saveObject).toHaveBeenCalled();
            expect((drawMock.reload$.next as jest.Mock)).toHaveBeenCalled();
        });

        it('TC-SR-011: should delete object and persist removal', async () => {
            const modelData: any[] = [
                { id: 'del1', selected: false, type: 'Square' },
                { id: 'del2', selected: true, type: 'Square' }
            ];
            (drawMock.loadObjects as jest.Mock).mockImplementation(() => modelData);
            drawMock.reload$.next = jest.fn();

            // stub confirm
            const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

            fixture = TestBed.createComponent(SidebarRightComponent);
            component = fixture.componentInstance;
            fixture.detectChanges();

            // ensure selectedObject is the one to delete
            component.selectedObject = { id: 'del2', name: 'ToDelete' } as any;
            await component.onDelete();

            const persisted = JSON.parse(localStorage.getItem('model-data') || '[]');
            expect(persisted.find((o: any) => o.id === 'del2')).toBeUndefined();
            expect((drawMock.reload$.next as jest.Mock)).toHaveBeenCalled();
            confirmSpy.mockRestore();
        });
    });
});
