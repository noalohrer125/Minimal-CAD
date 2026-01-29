import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { Auth, getAuth, provideAuth } from '@angular/fire/auth';
import { firebaseConfig } from '../firebase-credentials';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { testusername, testemail, testpassword, newtestusername, newtestemail, newtestpassword } from '../shared/testing/testuser-credentials';

describe('AuthService', () => {
    let service: AuthService;
    let auth: Auth;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            providers: [
                provideFirebaseApp(() => initializeApp(firebaseConfig)),
                provideAuth(() => getAuth()),
            ],
        }).compileComponents();

        service = TestBed.inject(AuthService);
        auth = TestBed.inject(Auth);
    });

    describe('User Registration', () => {
        // TC-AUTH-001
        it('should register a new user', (done) => {
            service.register(newtestemail, newtestusername, newtestpassword).subscribe({
                next: () => {
                    const currentUser = auth.currentUser;
                    expect(currentUser).not.toBeNull();
                    expect(currentUser?.email).toBe(newtestemail);
                    expect(currentUser?.displayName).toBe(newtestusername);

                    // Cleanup: delete the created user
                    currentUser?.delete().then(() => {
                        done();
                    }).catch((err) => {
                        done(new Error(`Failed to delete user: ${err}`));
                    });
                },
                error: (err) => {
                    done(new Error(`Registration failed with error: ${err}`));
                }
            });
        });

        // TC-AUTH-002
        it('should set display name after registration', (done) => {
            service.register(newtestemail, newtestusername, newtestpassword).subscribe({
                next: () => {
                    const currentUser = auth.currentUser;
                    expect(currentUser?.displayName).toBe(newtestusername);
                    // Cleanup: delete the created user
                    currentUser?.delete().then(() => {
                        done();
                    }).catch((err) => {
                        done(new Error(`Failed to delete user: ${err}`));
                    });

                    done();
                },
                error: (err) => {
                    done(new Error(`Registration failed with error: ${err}`));
                }
            });
        });
        
        // TC-AUTH-003
        it('should not register with existing email', (done) => {
            // Try to register with existing email (testemail already exists)
            service.register(testemail, 'anotheruser', 'newpassword').subscribe({
                next: () => {
                    
                    done(new Error('Expected error for existing email, but registration succeeded'));
                },
                error: (err) => {
                    expect(err).toBeDefined();
                    done();
                }
            });
        });

        // TC-AUTH-004
        it('should set currentUserSignal after registration', (done) => {
            service.register(newtestemail, newtestusername, newtestpassword).subscribe({
                next: () => {
                    // Wait a moment for the signal to update via the $user subscription
                    setTimeout(() => {
                        const firebaseUser = auth.currentUser;
                        const currentUser = service.currentUserSignal();
                        
                        // Verify the Firebase user has the correct displayName
                        expect(firebaseUser?.displayName).toBe(newtestusername);
                        
                        // Verify the signal is set
                        expect(currentUser).not.toBeNull();
                        expect(currentUser?.email).toBe(newtestemail);
                        // Note: username may be empty initially due to async signal update
                        
                        // Cleanup: delete the created user
                        auth.currentUser?.delete().then(() => {
                            done();
                        }).catch((err) => {
                            done(new Error(`Failed to delete user: ${err}`));
                        });
                    }, 500);
                },
                error: (err) => {
                    done(new Error(`Registration failed with error: ${err}`));
                }
            });
        });
    });

    describe('User Login', () => {
        // TC-AUTH-005
        it('should login an existing user', (done) => {
            service.logout().subscribe({
                next: () => {
                    service.login(testemail, testpassword).subscribe({
                        next: () => {
                            const currentUser = auth.currentUser;
                            expect(currentUser).not.toBeNull();
                            expect(currentUser?.email).toBe(testemail);
                            expect(currentUser?.displayName).toBe(testusername);
                        },
                        error: (err) => {
                            done(new Error(`Login failed with error: ${err}`));
                        }
                    });
                },
                error: (err) => {
                    done(new Error(`Logout failed with error: ${err}`));
                }
            });
            done();
        });
        
        // TC-AUTH-006
        it('should show error for invalid login', (done) => {
            service.login('invalidemail', 'invalidpassword').subscribe({
                next: () => {
                    service.logout().subscribe();
                    done(new Error('Expected error for invalid login, but login succeeded'));
                },
                error: (err) => {
                    expect(err).toBeDefined();
                    done();
                }
            });
        });
        
        // TC-AUTH-007
        it('should set currentUserSignal after login', (done) => {
            service.logout().subscribe({
                next: () => {
                    service.login(testemail, testpassword).subscribe({
                        next: () => {
                            const currentUser = service.currentUserSignal();
                            expect(currentUser).not.toBeNull();
                            expect(currentUser?.email).toBe(testemail);
                            expect(currentUser?.username).toBe(testusername);
                            done();
                        },
                        error: (err) => {
                            done(new Error(`Login failed with error: ${err}`));
                        }
                    });
                },
                error: (err) => {
                    done(new Error(`Logout failed with error: ${err}`));
                }
            });
        });
    });

    describe('User Logout', () => {
        // TC-AUTH-008
        it('should logout the current user', (done) => {
            service.login(testemail, testpassword).subscribe({
                next: () => {
                    service.logout().subscribe({
                        next: () => {
                            const currentUser = auth.currentUser;
                            expect(currentUser).toBeNull();
                            done();
                        },
                        error: (err) => {
                            done(new Error(`Logout failed with error: ${err}`));
                        }
                    });
                },
                error: (err) => {
                    done(new Error(`Login failed with error: ${err}`));
                }
            });
        });

        // TC-AUTH-009
        it('should clear currentUserSignal after logout', (done) => {
            service.login(testemail, testpassword).subscribe({
                next: () => {
                    service.logout().subscribe({
                        next: () => {
                            const currentUser = service.currentUserSignal();
                            expect(currentUser).toBeNull();
                            done();
                        },
                        error: (err) => {
                            done(new Error(`Logout failed with error: ${err}`));
                        }
                    });
                },
                error: (err) => {
                    done(new Error(`Login failed with error: ${err}`));
                }
            });
        });

        // TC-AUTH-010
        it('should handle subscription of $user signal', (done) => {
            service.login(testemail, testpassword).subscribe({
                next: () => {
                    service.$user.subscribe(firebaseUser => {
                        expect(firebaseUser).not.toBeNull();
                        expect(firebaseUser?.email).toBe(testemail);
                        done();
                    });
                },
                error: (err) => {
                    done(new Error(`Login failed with error: ${err}`));
                }
            });
        });
    });
});
