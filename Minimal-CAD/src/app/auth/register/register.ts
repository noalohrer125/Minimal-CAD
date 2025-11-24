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

  errorMesssage: string | null = null;

  form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    email: ['', Validators.required],
    password: ['', Validators.required],
  });

  onSubmit(): void {
    const rawForm = this.form.getRawValue();
    this.authService.register(
      rawForm.email,
      rawForm.username,
      rawForm.password
    ).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (error) => {
        console.error('Registration error:', error);
        this.errorMesssage = 'Registrierungsfehler: ' + (error.message || 'Bitte überprüfen Sie Ihre Eingaben.');
      }
    });
  }
}
