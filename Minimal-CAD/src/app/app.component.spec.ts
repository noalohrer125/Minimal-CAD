import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';
import { AppComponent } from './app.component';
import { AuthService } from './auth/auth.service';
import { GlobalService } from './shared/global.service';
import { Draw } from './shared/draw.service';

describe('AppComponent', () => {
    let component: AppComponent;
    let authUser$: Subject<{ email: string | null; displayName: string | null } | null>;
    let authServiceMock: {
        $user: Subject<{ email: string | null; displayName: string | null } | null>;
        currentUserSignal: { set: jest.Mock };
    };
    let globalServiceMock: { getSaveProjectPopupOpen: jest.Mock };
    let drawServiceMock: { reload$: Subject<void> };

    beforeEach(() => {
        authUser$ = new Subject<{ email: string | null; displayName: string | null } | null>();

        authServiceMock = {
            $user: authUser$,
            currentUserSignal: {
                set: jest.fn()
            }
        };

        globalServiceMock = {
            getSaveProjectPopupOpen: jest.fn().mockReturnValue(false)
        };

        drawServiceMock = {
            reload$: new Subject<void>()
        };

        TestBed.configureTestingModule({
            providers: [
                { provide: AuthService, useValue: authServiceMock as unknown as AuthService },
                { provide: GlobalService, useValue: globalServiceMock as unknown as GlobalService },
                { provide: Draw, useValue: drawServiceMock as unknown as Draw }
            ]
        });

        component = TestBed.runInInjectionContext(() => new AppComponent());
        document.body.innerHTML = '<div id="app"></div>';
    });

    afterEach(() => {
        document.body.innerHTML = '';
        jest.clearAllMocks();
        authUser$.complete();
        drawServiceMock.reload$.complete();
    });

    describe('Component Creation', () => {
        it('TC-APP-001: should create component', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('Initialization', () => {
        it('TC-APP-002: should execute ngOnInit and check auth state', () => {
            const popupSpy = jest.spyOn(component, 'checkSaveProjectPopupState');

            component.ngOnInit();
            authUser$.next({ email: 'test@example.com', displayName: 'TestUser' });

            expect(popupSpy).toHaveBeenCalled();
            expect(authServiceMock.currentUserSignal.set).toHaveBeenCalledWith({
                email: 'test@example.com',
                username: 'TestUser'
            });
        });

        it('TC-APP-003: should set isAuthenticated based on authService', () => {
            component.ngOnInit();

            authUser$.next({ email: 'test@example.com', displayName: 'TestUser' });
            expect(component.isAuthenticated).toBe(true);

            authUser$.next(null);
            expect(component.isAuthenticated).toBe(false);
        });

        it('TC-APP-004: should keep isAuthLoading true until auth state arrives', () => {
            expect(component.isAuthLoading).toBe(true);

            component.ngOnInit();
            expect(component.isAuthLoading).toBe(true);

            authUser$.next(null);
            expect(component.isAuthLoading).toBe(false);
        });
    });

    describe('Popup State', () => {
        it('TC-APP-005: should monitor save project popup state via reload subscription', () => {
            const popupSpy = jest.spyOn(component, 'checkSaveProjectPopupState');

            component.ngOnInit();
            drawServiceMock.reload$.next();

            expect(popupSpy).toHaveBeenCalledTimes(2);
        });

        it('TC-APP-006: should update isSaveProjectPopupOpen from globalService', () => {
            globalServiceMock.getSaveProjectPopupOpen.mockReturnValue(true);
            component.checkSaveProjectPopupState();

            expect(component.isSaveProjectPopupOpen).toBe(true);
            expect(document.getElementById('app')!.style.userSelect).toBe('none');
            expect(document.getElementById('app')!.style.pointerEvents).toBe('none');

            globalServiceMock.getSaveProjectPopupOpen.mockReturnValue(false);
            component.checkSaveProjectPopupState();

            expect(component.isSaveProjectPopupOpen).toBe(false);
            expect(document.getElementById('app')!.style.userSelect).toBe('auto');
            expect(document.getElementById('app')!.style.pointerEvents).toBe('auto');
        });
    });

    describe('Service Injection', () => {
        it('TC-APP-007: should inject AuthService', () => {
            expect(component.authService).toBeTruthy();
        });

        it('TC-APP-008: should inject GlobalService', () => {
            expect(component.globalService).toBeTruthy();
        });

        it('TC-APP-009: should inject DrawService', () => {
            expect(component.drawService).toBeTruthy();
        });
    });
});
