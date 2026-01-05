import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Login } from './login';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { testemail, testpassword } from './testuser-credentials';

describe('Login Component', () => {
    let component: Login;
    let fixture: ComponentFixture<Login>;
    let mockAuthService: jest.Mocked<AuthService>;
    let mockRouter: jest.Mocked<Router>;

    beforeEach(async () => {
        // Create mock services
        mockAuthService = {
            login: jest.fn(),
        } as any;

        mockRouter = {
            navigate: jest.fn(),
        } as any;

        await TestBed.configureTestingModule({
            imports: [Login, ReactiveFormsModule], // Standalone Component
            providers: [
                { provide: AuthService, useValue: mockAuthService },
                { provide: Router, useValue: mockRouter },
            ],
        }).compileComponents();
        fixture = TestBed.createComponent(Login);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should login successfully and navigate to overview', () => {
        // Arrange
        component.form.setValue({ email: testemail, password: testpassword });
        mockAuthService.login.mockReturnValue(of(void 0));
        // Act
        component.onSubmit();
        // Assert
        expect(mockAuthService.login).toHaveBeenCalledWith(testemail, testpassword);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/overview']);
        expect(component.errorMesssage).toBeNull();
    });

    it('should handle login error and set appropriate error message', () => {
        // Arrange
        const errorResponse = { code: 'auth/wrong-password' };
        component.form.setValue({ email: testemail, password: 'wrongpassword' });
        mockAuthService.login.mockReturnValue(throwError(() => errorResponse));
        // Act
        component.onSubmit();
        // Assert
        expect(mockAuthService.login).toHaveBeenCalledWith(testemail, 'wrongpassword');
        expect(component.errorMesssage).toBe('Incorrect password.');
        expect(mockRouter.navigate).not.toHaveBeenCalled();
    });
});
