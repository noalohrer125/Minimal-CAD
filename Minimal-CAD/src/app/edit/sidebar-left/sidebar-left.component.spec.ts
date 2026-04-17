import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { SidebarLeftComponent } from './sidebar-left.component';
import { Draw } from '../../shared/draw.service';

describe('SidebarLeftComponent (TC-SL-001..TC-SL-006)', () => {
	let fixture: ComponentFixture<SidebarLeftComponent>;
	let component: SidebarLeftComponent;
	let drawMock: Partial<Draw> & { reload$: BehaviorSubject<void> };

	beforeEach(() => {
		drawMock = {
			reload$: new BehaviorSubject<void>(undefined),
			loadObjects: jest.fn().mockReturnValue([])
		} as any;

		TestBed.configureTestingModule({
			imports: [SidebarLeftComponent],
			providers: [{ provide: Draw, useValue: drawMock }]
		}).compileComponents();
	});

		afterEach(() => {
		jest.restoreAllMocks();
		jest.resetAllMocks();
		try { fixture?.destroy(); } catch (e) { /* ignore */ }
		localStorage.removeItem('model-data');
	});

		describe('Component Creation', () => {
			it('TC-SL-001: should create component', () => {
				fixture = TestBed.createComponent(SidebarLeftComponent);
				component = fixture.componentInstance;
				fixture.detectChanges();
				expect(component).toBeTruthy();
			});
		});

	describe('Object List', () => {
		it('TC-SL-002: should call drawService.loadObjects on init and set objects', () => {
			fixture = TestBed.createComponent(SidebarLeftComponent);
			component = fixture.componentInstance;
			const mockObjects = [{ id: 'a', name: 'A', selected: false }];
			(drawMock.loadObjects as jest.Mock).mockReturnValue(mockObjects);
			fixture.detectChanges();
			expect(drawMock.loadObjects).toHaveBeenCalled();
			expect(component.objects).toEqual(mockObjects);
		});

		it('TC-SL-003: should set selectedObject from loaded objects when one is selected', () => {
			fixture = TestBed.createComponent(SidebarLeftComponent);
			component = fixture.componentInstance;
			const mockObjects = [
				{ id: 'a', name: 'A', selected: false },
				{ id: 'b', name: 'B', selected: true }
			];
			(drawMock.loadObjects as jest.Mock).mockReturnValue(mockObjects);
			fixture.detectChanges();
			expect(component.selectedObject).toEqual(mockObjects.find(o => o.selected));
		});

		it('TC-SL-004: onClick should mark object selected, persist model-data and call reload$.next', () => {
			fixture = TestBed.createComponent(SidebarLeftComponent);
			component = fixture.componentInstance;
			const initial = [
				{ id: 'a', name: 'A', selected: false },
				{ id: 'b', name: 'B', selected: false }
			];
			(drawMock.loadObjects as jest.Mock).mockReturnValue(initial);
			fixture.detectChanges();

			const nextSpy = jest.spyOn(drawMock.reload$, 'next');
			const target = initial[1];
			component.onClick(target as any);

			expect(component.selectedObject).toBe(target);
			expect(drawMock.loadObjects).toHaveBeenCalled();
			const persisted = JSON.parse(localStorage.getItem('model-data') || '[]');
			expect(persisted.find((o: any) => o.id === target.id).selected).toBeTruthy();
			expect(nextSpy).toHaveBeenCalled();
		});

		it('TC-SL-005: reload$ subscription should trigger onReload', () => {
			fixture = TestBed.createComponent(SidebarLeftComponent);
			component = fixture.componentInstance;
			const first = [{ id: 'a', name: 'A', selected: false }];
			const updated = [{ id: 'a', name: 'A', selected: true }];
			const loadMock = drawMock.loadObjects as jest.Mock;
			// stable initial return
			loadMock.mockReturnValue(first);
			fixture.detectChanges();

			// initial state
			expect(component.objects).toEqual(first);

			// change mock to updated data before emitting reload
			loadMock.mockReturnValue(updated);
			(drawMock.reload$ as BehaviorSubject<void>).next();

			expect(component.objects).toEqual(updated);
			expect(component.selectedObject).toEqual(updated.find((o: any) => o.selected) || {});
		});

		it('TC-SL-006: onReload updates objects array when loadObjects returns different data', () => {
			fixture = TestBed.createComponent(SidebarLeftComponent);
			component = fixture.componentInstance;
			const initial = [{ id: 'x', selected: false }];
			const updated = [{ id: 'y', selected: false }];
			const loadMock = drawMock.loadObjects as jest.Mock;
			loadMock.mockReturnValue(initial);
			fixture.detectChanges();
			// change mock to updated before calling onReload
			loadMock.mockReturnValue(updated);
			// trigger reload directly
			component.onReload();
			expect(component.objects).toEqual(updated);
		});
	});
});
