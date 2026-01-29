import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Register } from './register';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { firebaseConfig } from '../../firebase-credentials';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

describe('Register', () => {
    let component: Register;
    let fixture: ComponentFixture<Register>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [
                Register,
                // CommonModule, ReactiveFormsModule, etc.
            ],
            providers: [
                provideFirebaseApp(() => initializeApp(firebaseConfig)),
                provideAuth(() => getAuth()),
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(Register);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    describe('Component Creation', () => {
        // TC-REGISTER-001
        it('should create', () => {
            expect(component).toBeTruthy();
        });
    });

    describe('Form Validation', () => {
        // TC-REGISTER-002
        it('should initialize form with empty values', () => {
            expect(component.form.value.username).toBe('');
            expect(component.form.value.email).toBe('');
            expect(component.form.value.password).toBe('');
        });

        // TC-REGISTER-003
        it('should validate email as required', () => {
            component.form.setValue({ username: '', email: 'test@example.com', password: 'test123' });
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.username.hasError('required')).toBe(true);
        });

        // TC-REGISTER-004
        it('should validate password as required', () => {
            component.form.setValue({ username: 'testuser', email: 'test@example.com', password: '' });
            expect(component.form.valid).toBe(false);
            expect(component.form.controls.password.hasError('required')).toBe(true);
        });
    });

    describe('Registration Submission', () => {
        // TC-REGISTER-005
        it('should call authService.register with correct data', () => {
            const authService = TestBed.inject(AuthService);
            const registerSpy = jest.spyOn(authService, 'register').mockReturnValue(of(undefined));
            component.form.setValue({ username: 'testuser', email: 'test@example.com', password: 'test123' });
            component.onSubmit();
            expect(registerSpy).toHaveBeenCalledWith('test@example.com', 'testuser', 'test123');

            // Cleanup: Delete the created user
            const auth = getAuth();
            if (auth.currentUser) {
                auth.currentUser.delete();
            }
        });

        // TC-REGISTER-006
        it('should navigate to login on successful registration', () => {
            const authService = TestBed.inject(AuthService);
            const router = TestBed.inject(Router);
            jest.spyOn(authService, 'register').mockReturnValue(of(undefined));
            const navigateSpy = jest.spyOn(router, 'navigate');
            component.form.setValue({ username: 'testuser', email: 'test@example.com', password: 'test123' });
            component.onSubmit();
            expect(navigateSpy).toHaveBeenCalledWith(['/login']);

            // Cleanup: Delete the created user
            const auth = getAuth();
            if (auth.currentUser) {
                auth.currentUser.delete();
            }
        });

        // TC-REGISTER-007
        it('should display error message on registration failure', () => {
            const authService = TestBed.inject(AuthService);
            const errorMessage = 'Registration failed';
            jest.spyOn(authService, 'register').mockReturnValue(throwError(() => new Error(errorMessage)));
            component.form.setValue({ username: 'testuser', email: '', password: 'test123' });
            component.onSubmit();
            expect(component.errorMessage).toBe('Registration error: ' + errorMessage || 'Please check your input.');
        });
    });
});
