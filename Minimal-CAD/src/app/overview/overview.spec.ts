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

    describe('Firebase Integration', () => {
        it('TC-OV-007: should load public and my projects on init', () => {
            (firebaseServiceMock.getPublicProjects as jest.Mock).mockReturnValue(of(mockPublicProjects));
            (firebaseServiceMock.getProjectsByOwner as jest.Mock).mockReturnValue(of(mockMyProjects));
            createComponent();
            expect(firebaseServiceMock.getPublicProjects).toHaveBeenCalled();
            expect(firebaseServiceMock.getProjectsByOwner).toHaveBeenCalledWith(testemail);
            expect(component!.publicProjects).toEqual(mockPublicProjects);
            expect(component!.myProjects).toEqual(mockMyProjects);
        });

        it('TC-OV-008: should filter public projects and call getPublicProjects', () => {
            const mixed = [
                { id: 'p1', name: 'A', licenceKey: 'public' } as any,
                { id: 'p2', name: 'B', licenceKey: 'private' } as any
            ];
            (firebaseServiceMock.getPublicProjects as jest.Mock).mockReturnValue(of(mixed));
            createComponent();
            expect(firebaseServiceMock.getPublicProjects).toHaveBeenCalled();
            expect(component!.publicProjects).toEqual(mixed.filter(p => p.licenceKey === 'public'));
        });

        it('TC-OV-009: should load my projects on init', () => {
            createComponent();
            expect(firebaseServiceMock.getProjectsByOwner).toHaveBeenCalledWith(testemail);
            expect(component!.myProjects).toEqual(mockMyProjects);
        });
    });
});
