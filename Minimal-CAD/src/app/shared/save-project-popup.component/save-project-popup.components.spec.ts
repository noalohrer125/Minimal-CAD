import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject, of, throwError } from 'rxjs';
import { SaveProjectPopupComponent } from './save-project-popup.component';
import { GlobalService } from '../global.service';
import { Draw } from '../draw.service';
import { FirebaseService } from '../firebase.service';
import { projectSavingResult } from '../../interfaces';

describe('SaveProjectPopupComponent', () => {
	let component: SaveProjectPopupComponent;
	let fixture: ComponentFixture<SaveProjectPopupComponent>;

	let requestProjectData$: Subject<void>;
	let popupOpenState$: BehaviorSubject<boolean>;

	let globalServiceMock: {
		requestProjectData: Subject<void>;
		isSaveProjectPopupOpen: BehaviorSubject<boolean>;
		getIsNewProject: jest.Mock;
		closeSaveProjectPopup: jest.Mock;
	};

	let drawServiceMock: {
		saveProjectToFirebase: jest.Mock;
		reload$: { next: jest.Mock };
	};

	let firebaseServiceMock: {
		getProjectById: jest.Mock;
	};

	beforeEach(async () => {
		requestProjectData$ = new Subject<void>();
		popupOpenState$ = new BehaviorSubject<boolean>(false);

		globalServiceMock = {
			requestProjectData: requestProjectData$,
			isSaveProjectPopupOpen: popupOpenState$,
			getIsNewProject: jest.fn().mockReturnValue(false),
			closeSaveProjectPopup: jest.fn()
		};

		drawServiceMock = {
			saveProjectToFirebase: jest.fn(),
			reload$: { next: jest.fn() }
		};

		firebaseServiceMock = {
			getProjectById: jest.fn().mockReturnValue(of(null))
		};

		await TestBed.configureTestingModule({
			imports: [SaveProjectPopupComponent],
			providers: [
				{ provide: GlobalService, useValue: globalServiceMock as unknown as GlobalService },
				{ provide: Draw, useValue: drawServiceMock as unknown as Draw },
				{ provide: FirebaseService, useValue: firebaseServiceMock as unknown as FirebaseService }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(SaveProjectPopupComponent);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	afterEach(() => {
		jest.restoreAllMocks();
		jest.useRealTimers();
		requestProjectData$.complete();
		popupOpenState$.complete();
		localStorage.removeItem('project-id');
	});

	describe('Component Creation', () => {
		it('TC-POPUP-001: should create component', () => {
			expect(component).toBeTruthy();
		});
	});

	describe('Form Management', () => {
		it('TC-POPUP-002: should initialize form', () => {
			expect(component.form).toBeTruthy();
			expect(component.form.get('projectName')?.value).toBe('New Project');
			expect(component.form.get('isPrivate')?.value).toBe(false);
		});

		it('TC-POPUP-003: should reset form for new project', () => {
			component.form.patchValue({ projectName: 'Existing Name', isPrivate: true });
			globalServiceMock.getIsNewProject.mockReturnValue(true);

			popupOpenState$.next(true);

			expect(component.form.get('projectName')?.value).toBe('New Project');
			expect(component.form.get('isPrivate')?.value).toBe(false);
		});

		it('TC-POPUP-004: should prefill form with existing project data', () => {
			localStorage.setItem('project-id', 'existing-project-id');
			globalServiceMock.getIsNewProject.mockReturnValue(false);
			firebaseServiceMock.getProjectById.mockReturnValue(
				of({ id: 'existing-project-id', name: 'Existing Project', licenceKey: 'private-key' })
			);

			popupOpenState$.next(true);

			expect(firebaseServiceMock.getProjectById).toHaveBeenCalledWith('existing-project-id');
			expect(component.form.get('projectName')?.value).toBe('Existing Project');
			expect(component.form.get('isPrivate')?.value).toBe(true);
		});
	});

	describe('Project Saving', () => {
		it('TC-POPUP-005: should save project', async () => {
			const result: projectSavingResult = {
				success: true,
				projectName: 'My Project',
				licenceKey: 'public',
				projectId: 'project-1',
				error: ''
			};
			drawServiceMock.saveProjectToFirebase.mockResolvedValue(result);
			component.form.patchValue({ projectName: 'My Project', isPrivate: false });

			component.onSubmit();
			await Promise.resolve();

			expect(drawServiceMock.saveProjectToFirebase).toHaveBeenCalledWith('My Project', false, false);
		});

		it('TC-POPUP-006: should set saved flag after saving', async () => {
			const result: projectSavingResult = {
				success: true,
				projectName: 'Saved Project',
				licenceKey: 'public',
				projectId: 'project-2',
				error: ''
			};
			drawServiceMock.saveProjectToFirebase.mockResolvedValue(result);

			component.onSubmit();
			await Promise.resolve();

			expect(component.saved).toBe(true);
		});

		it('TC-POPUP-007: should update projectSavingResult', async () => {
			const result: projectSavingResult = {
				success: true,
				projectName: 'Result Project',
				licenceKey: 'license-123',
				projectId: 'project-3',
				error: ''
			};
			drawServiceMock.saveProjectToFirebase.mockResolvedValue(result);

			component.onSubmit();
			await Promise.resolve();

			expect(component.projectSavingResult.projectName).toBe('Result Project');
			expect(component.projectSavingResult.licenceKey).toBe('license-123');
			expect(component.projectSavingResult.projectId).toBe('project-3');
		});

		it('TC-POPUP-008: should handle save errors', async () => {
			const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
			const errorResult: projectSavingResult = {
				success: false,
				projectName: 'Failed Project',
				licenceKey: '',
				projectId: '',
				error: 'Save failed'
			};
			drawServiceMock.saveProjectToFirebase.mockResolvedValue(errorResult);

			component.onSubmit();
			await Promise.resolve();

			expect(component.projectSavingResult.error).toBe('Save failed');
			expect(alertSpy).toHaveBeenCalledWith('Save failed');
		});
	});

	describe('License Management', () => {
		it('TC-POPUP-009: should copy license key', async () => {
			jest.useFakeTimers();
			const writeTextMock = jest.fn().mockResolvedValue(undefined);
			Object.defineProperty(navigator, 'clipboard', {
				value: { writeText: writeTextMock },
				configurable: true
			});
			component.projectSavingResult.licenceKey = 'license-copy-key';

			component.copyLicenceKey();
			await Promise.resolve();

			expect(writeTextMock).toHaveBeenCalledWith('license-copy-key');
			expect(component.licenceCopied).toBe(true);

			jest.advanceTimersByTime(2000);
			expect(component.licenceCopied).toBe(false);
		});

		it('TC-POPUP-010: should show private license key in UI', () => {
			fixture = TestBed.createComponent(SaveProjectPopupComponent);
			component = fixture.componentInstance;

			component.saved = true;
			component.projectSavingResult = {
				success: true,
				projectName: 'Private Project',
				licenceKey: 'private-abc',
				projectId: 'project-private',
				error: ''
			};

			fixture.detectChanges();
			const html = fixture.nativeElement as HTMLElement;

			expect(html.textContent).toContain('private-abc');
		});

		it("TC-POPUP-011: should show 'public' for public project", () => {
			fixture = TestBed.createComponent(SaveProjectPopupComponent);
			component = fixture.componentInstance;

			component.saved = true;
			component.projectSavingResult = {
				success: true,
				projectName: 'Public Project',
				licenceKey: 'public',
				projectId: 'project-public',
				error: ''
			};

			fixture.detectChanges();
			const html = fixture.nativeElement as HTMLElement;

			expect(html.textContent).toContain('public');
		});
	});

	describe('Lifecycle', () => {
		it('TC-POPUP-012: should react to popup open state', () => {
			const loadSpy = jest
				.spyOn(component as any, 'loadCurrentProjectData')
				.mockImplementation(() => {});
			globalServiceMock.getIsNewProject.mockReturnValue(false);

			popupOpenState$.next(true);

			expect(loadSpy).toHaveBeenCalled();
		});

		it('TC-POPUP-013: should clean subscriptions on destroy', () => {
			const unsubscribeSpy = jest.spyOn((component as any).subscription, 'unsubscribe');

			component.ngOnDestroy();

			expect(unsubscribeSpy).toHaveBeenCalled();
		});
	});
});
