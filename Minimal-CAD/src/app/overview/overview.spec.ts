import { TestBed, ComponentFixture } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { Overview } from './overview';
import { FirebaseService } from '../shared/firebase.service';
import { GlobalService } from '../shared/global.service';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { testemail } from '../shared/testing/testuser-credentials';

describe('Overview', () => {
    let fixture: ComponentFixture<Overview> | null = null;
    let component: Overview | null = null;

    const mockAuth: any = { currentUser: { email: testemail } };

    const mockPublicProjects = [
        {
            id: 'pub1',
            name: 'Public Project',
            ownerEmail: testemail,
            createdAt: { toDate: () => new Date('2026-02-01') }
        }
    ] as any;

        const mockMyProjects = [
        {
            id: 'my1',
            name: 'My Project',
            ownerEmail: testemail,
            createdAt: { toDate: () => new Date('2026-01-15') }
        }
    ] as any;

    const firebaseServiceMock: Partial<FirebaseService> = {
        getCurrentUserEmail: jest.fn(),
        getPublicProjects: jest.fn(),
        getProjectsByOwner: jest.fn()
    };

    const globalServiceMock: Partial<GlobalService> = {
        openSaveProjectPopup: jest.fn()
    };

    const routerMock: Partial<Router> = {
        navigate: jest.fn()
    };

    beforeEach(() => {
        // ensure spies refer to the same jest.fn instances
        (firebaseServiceMock.getCurrentUserEmail as jest.Mock).mockReset?.();
        (firebaseServiceMock.getPublicProjects as jest.Mock).mockReset?.();
        (firebaseServiceMock.getProjectsByOwner as jest.Mock).mockReset?.();
        (globalServiceMock.openSaveProjectPopup as jest.Mock).mockReset?.();
        (routerMock.navigate as jest.Mock).mockReset?.();

        TestBed.configureTestingModule({
            imports: [Overview],
            providers: [
                { provide: Auth, useValue: mockAuth },
                { provide: FirebaseService, useValue: firebaseServiceMock },
                { provide: GlobalService, useValue: globalServiceMock },
                { provide: Router, useValue: routerMock }
            ]
        });

        // default mock behaviors
        (firebaseServiceMock.getCurrentUserEmail as jest.Mock).mockReturnValue(testemail);
        (firebaseServiceMock.getPublicProjects as jest.Mock).mockReturnValue(of(mockPublicProjects));
        (firebaseServiceMock.getProjectsByOwner as jest.Mock).mockReturnValue(of(mockMyProjects));

        // stub window methods
        jest.spyOn(window, 'prompt').mockImplementation(() => '');
        jest.spyOn(window, 'alert').mockImplementation(() => { });
    });

    afterEach(() => {
        fixture?.destroy();
        fixture = null;
        component = null;
        jest.restoreAllMocks();
    });

    function createComponent() {
        fixture = TestBed.createComponent(Overview);
        component = fixture.componentInstance;
        fixture.detectChanges();
    }

    it('TC-OV-001: should create component', () => {
        createComponent();
        expect(component).toBeTruthy();
    });

    describe('Project Management', () => {
        it('TC-OV-002: addProject should call globalService.openSaveProjectPopup(true)', () => {
            createComponent();
            component!.addProject();
            expect(globalServiceMock.openSaveProjectPopup).toHaveBeenCalledWith(true);
        });
        
        it('TC-OV-003: opening a public project navigates to editor', () => {
            createComponent();
            component!.openProject('pub1', 'Public Project', 'public');
            expect(routerMock.navigate).toHaveBeenCalledWith(['/editor', 'pub1']);
        });
        
        it('TC-OV-004: private project with correct licence key navigates to editor', () => {
            // prompt returns the correct key
            (window.prompt as jest.Mock).mockReturnValue('secret-key');
            createComponent();
            component!.openProject('priv1', 'Private', 'secret-key');
            expect(window.prompt).toHaveBeenCalled();
            expect(routerMock.navigate).toHaveBeenCalledWith(['/editor', 'priv1']);
        });
        
        it('TC-OV-005: wrong licence key shows alert and does not navigate', () => {
            (window.prompt as jest.Mock).mockReturnValue('wrong');
            createComponent();
            component!.openProject('priv1', 'Private', 'correct');
            expect(window.prompt).toHaveBeenCalled();
            expect(window.alert).toHaveBeenCalledWith('Please enter the correct license key to open this project.');
            expect(routerMock.navigate).not.toHaveBeenCalledWith(['/editor', 'priv1']);
        });
        
        it('TC-OV-006: prompt is called for private project', () => {
            (window.prompt as jest.Mock).mockReturnValue('some');
            createComponent();
            component!.openProject('p', 'n', 'not-public');
            expect(window.prompt).toHaveBeenCalled();
        });
    });

    it('TC-OV-007: ngOnInit calls firebaseService.getPublicProjects and getProjectsByOwner', () => {
        createComponent();
        expect(firebaseServiceMock.getPublicProjects).toHaveBeenCalled();
        expect(firebaseServiceMock.getProjectsByOwner).toHaveBeenCalledWith(testemail);
        // after subscriptions the publicProjects and myProjects should be populated
        expect(component!.publicProjects).toEqual(mockPublicProjects);
        expect(component!.myProjects).toEqual(mockMyProjects);
    });

    it('TC-OV-009: on error loading public projects sets projectsLoading false and alerts when auth present', () => {
        // make getPublicProjects throw
        (firebaseServiceMock.getPublicProjects as jest.Mock).mockReturnValue(throwError(() => new Error('fail')));
        (firebaseServiceMock.getProjectsByOwner as jest.Mock).mockReturnValue(of([]));
        createComponent();
        // projectsLoading should be set false after error handling
        expect(component!.projectsLoading).toBe(false);
        expect(window.alert).toHaveBeenCalledWith('Error loading public projects. Please try again.');
    });
});
