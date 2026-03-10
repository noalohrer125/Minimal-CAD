import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  imports: [
    ReactiveFormsModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css'
})
export class Register {
  fb = inject(FormBuilder);
  authService = inject(AuthService)
  router = inject(Router);

  errorMessage: string | null = null;

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  goToLogin(event: MouseEvent): void {
    event.preventDefault();
    this.router.navigate(['/login']);
  }

  onSubmit(): void {
    this.errorMessage = null;

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.errorMessage = 'Please check your input.';
      return;
    }

    const rawForm = this.form.getRawValue();
    this.authService.register(
      rawForm.email,
      rawForm.username,
      rawForm.password
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error) => {
        console.error('Registration error:', error);
        const errorMessages: { [key: string]: string } = {
          'auth/email-already-in-use': 'This email address is already in use.',
          'auth/invalid-email': 'The email address is invalid.',
          'auth/weak-password': 'The password is too weak.',
          'auth/operation-not-allowed': 'Registration is currently not available.'
        };
        const authCode = error?.code as string | undefined;
        this.errorMessage = authCode ? (errorMessages[authCode] ?? 'Registration failed. Please try again.') : 'Registration failed. Please try again.';
      }
    });
  }
}
