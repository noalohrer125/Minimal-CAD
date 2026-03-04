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
      this.errorMessage = 'Bitte prüfe deine Eingaben.';
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
          'auth/email-already-in-use': 'Diese E-Mail-Adresse wird bereits verwendet.',
          'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
          'auth/weak-password': 'Das Passwort ist zu schwach.',
          'auth/operation-not-allowed': 'Registrierung ist aktuell nicht möglich.'
        };
        const authCode = error?.code as string | undefined;
        this.errorMessage = authCode ? (errorMessages[authCode] ?? 'Registrierung fehlgeschlagen. Bitte versuche es erneut.') : 'Registrierung fehlgeschlagen. Bitte versuche es erneut.';
      }
    });
  }
}
