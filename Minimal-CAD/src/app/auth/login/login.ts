import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [
    ReactiveFormsModule,
    RouterLink,
  ],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  fb = inject(FormBuilder);
  router = inject(Router);
  authService = inject(AuthService);

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  errorMessage: string | null = null;

  onSubmit(): void {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please check your input.';
      return;
    }

    const rawForm = this.form.getRawValue();
    this.authService.login(
      rawForm.email,
      rawForm.password
    ).subscribe({
      next: () => this.router.navigate(['/overview']),
      error: (error) => {
        console.error('Login error:', error);
        const errorMessages: { [key: string]: string } = {
          'auth/invalid-email': 'The email address is invalid.',
          'auth/user-disabled': 'This user account has been disabled.',
          'auth/user-not-found': 'Email or password is incorrect.',
          'auth/wrong-password': 'Email or password is incorrect.',
          'auth/invalid-credential': 'Email or password is incorrect.',
          'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.'
        };
        const authCode = error?.code as string | undefined;
        this.errorMessage = authCode ? (errorMessages[authCode] ?? 'Login failed. Please try again.') : 'Login failed. Please try again.';
      }
    });
  }
}
