import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  errorMesssage: string | null = null;

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authService.login(
      rawForm.email,
      rawForm.password
    ).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (error) => {
        console.error('Login error:', error);
        const errorMessages: { [key: string]: string } = {
          'auth/invalid-email': 'Invalid email address.',
          'auth/user-disabled': 'This user has been disabled.',
          'auth/user-not-found': 'User not found.',
          'auth/wrong-password': 'Incorrect password.',
          'auth/invalid-credential': 'Invalid credentials.'
        };
        this.errorMesssage = errorMessages[error.code] || 'Login error: Please try again.';
      }
    });
  }
}
