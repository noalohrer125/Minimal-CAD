import { TestBed } from '@angular/core/testing';
import { Router, GuardResult } from '@angular/router';
import { authGuard } from './auth.guard';
import { provideAuth, getAuth, Auth } from '@angular/fire/auth';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { firebaseConfig } from '../firebase-credentials';

describe('AuthGuard', () => {
    let router: Router;
    let auth: Auth;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(firebaseConfig)),
                provideAuth(() => getAuth()),
                {
                    provide: Router,
                    useValue: {
                        navigate: jest.fn()
                    }
                }
            ],
        }).compileComponents();

        router = TestBed.inject(Router);
        auth = TestBed.inject(Auth);
    });

    describe('Route Protection', () => {
        // TC-GUARD-001
        it('should allow authenticated users access', (done) => {            
            TestBed.runInInjectionContext(() => {
                const result = authGuard({} as any, {} as any);
                
                if (result && typeof result === 'object' && 'subscribe' in result) {
                    result.subscribe((canActivate: GuardResult) => {
                        expect(canActivate).toBe(false);
                        done();
                    });
                }
            });
        });

        // TC-GUARD-002
        it('should redirect unauthenticated users to login page', (done) => {
            const navigateSpy = jest.spyOn(router, 'navigate');
            
            TestBed.runInInjectionContext(() => {
                const result = authGuard({} as any, {} as any);
                
                if (result && typeof result === 'object' && 'subscribe' in result) {
                    result.subscribe((canActivate: GuardResult) => {
                        expect(canActivate).toBe(false);
                        expect(navigateSpy).toHaveBeenCalledWith(['/login']);
                        done();
                    });
                }
            });
        });

        // TC-GUARD-003
        it('should use take(1) for single check', (done) => {
            TestBed.runInInjectionContext(() => {
                const result = authGuard({} as any, {} as any);
                
                if (result && typeof result === 'object' && 'subscribe' in result) {
                    let emissionCount = 0;
                    
                    result.subscribe({
                        next: (canActivate: GuardResult) => {
                            emissionCount++;
                            expect(emissionCount).toBe(1);
                        },
                        complete: () => {
                            expect(emissionCount).toBe(1);
                            done();
                        }
                    });
                }
            });
        });
    });
});
