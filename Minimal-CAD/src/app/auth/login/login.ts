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
      this.errorMessage = 'Bitte prüfe deine Eingaben.';
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
          'auth/invalid-email': 'Die E-Mail-Adresse ist ungültig.',
          'auth/user-disabled': 'Dieses Benutzerkonto wurde deaktiviert.',
          'auth/user-not-found': 'E-Mail oder Passwort ist falsch.',
          'auth/wrong-password': 'E-Mail oder Passwort ist falsch.',
          'auth/invalid-credential': 'E-Mail oder Passwort ist falsch.',
          'auth/too-many-requests': 'Zu viele Versuche. Bitte warte kurz und probiere es erneut.'
        };
        const authCode = error?.code as string | undefined;
        this.errorMessage = authCode ? (errorMessages[authCode] ?? 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.') : 'Anmeldung fehlgeschlagen. Bitte versuche es erneut.';
      }
    });
  }
}
