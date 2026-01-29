import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { testemail, testpassword } from '../../shared/testing/testuser-credentials';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockRouter: jest.Mocked<Router>;

    beforeEach(async () => {
        mockAuthService = {
            login: jest.fn(),
        } as any;

        mockRouter = {
            navigate: jest.fn(),
        } as any;

        await TestBed.configureTestingModule({
            imports: [Login, ReactiveFormsModule],
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();
        
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Component Creation', () => {
        // TC-LOGIN-001
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('Form Validation', () => {
        // TC-LOGIN-002
        it('should initialize form with empty values', () => {
            expect(component.form.value.email).toBe('');
            expect(component.form.value.password).toBe('');
        });

        // TC-LOGIN-003
        it('should validate email as required', () => {
            component.form.setValue({ email: '', password: 'test123' });
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.email.hasError('required')).toBe(true);
        });

        // TC-LOGIN-004
        it('should validate password as required', () => {
            component.form.setValue({ email: testemail, password: '' });
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.password.hasError('required')).toBe(true);
        });
    });

    describe('Login Submission', () => {
        // TC-LOGIN-005
        it('should call authService.login with correct data', () => {
            component.form.setValue({ email: testemail, password: testpassword });
            mockAuthService.login.mockReturnValue(of(void 0));
            
            component.onSubmit();
            
            expect(mockAuthService.login).toHaveBeenCalledWith(testemail, testpassword);
        });

        // TC-LOGIN-006
        it('should navigate to overview after successful login', () => {
            component.form.setValue({ email: testemail, password: testpassword });
            mockAuthService.login.mockReturnValue(of(void 0));
            
            component.onSubmit();
            
            expect(mockRouter.navigate).toHaveBeenCalledWith(['/overview']);
            expect(component.errorMesssage).toBeNull();
        });

        describe('Error Handling', () => {
            // TC-LOGIN-007
            it('should display error message for invalid email', () => {
                component.form.setValue({ email: 'invalid', password: testpassword });
                mockAuthService.login.mockReturnValue(throwError(() => ({ code: 'auth/invalid-email' })));
                
                component.onSubmit();
                
                expect(component.errorMesssage).toBe('Invalid email address.');
            });

            // TC-LOGIN-008
            it('should display error message for user not found', () => {
                component.form.setValue({ email: testemail, password: testpassword });
                mockAuthService.login.mockReturnValue(throwError(() => ({ code: 'auth/user-not-found' })));
                
                component.onSubmit();
                
                expect(component.errorMesssage).toBe('User not found.');
            });

            // TC-LOGIN-009
            it('should display error message for wrong password', () => {
                component.form.setValue({ email: testemail, password: 'wrongpassword' });
                mockAuthService.login.mockReturnValue(throwError(() => ({ code: 'auth/wrong-password' })));
                
                component.onSubmit();
                
                expect(component.errorMesssage).toBe('Incorrect password.');
                expect(mockRouter.navigate).not.toHaveBeenCalled();
            });

            // TC-LOGIN-010
            it('should display generic error message for unknown error', () => {
                component.form.setValue({ email: testemail, password: testpassword });
                mockAuthService.login.mockReturnValue(throwError(() => ({ code: 'auth/unknown-error' })));
                
                component.onSubmit();
                
                expect(component.errorMesssage).toBe('Login error: Please try again.');
            });
        });
    });
});
