import { Routes } from '@angular/router';
import { Login } from './auth/login/login';
import { Register } from './auth/register/register';
import { Overview } from './overview/overview';
import { Editor } from './edit/editor/editor';
import { authGuard, roleGuard } from './auth/auth.guard';
import { UserRole } from './interfaces';

const premiumRoles: UserRole[] = ['paid-user', 'admin'];

export const appRoutes: Routes = [
  { path: '', redirectTo: '/overview', pathMatch: 'full' },
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'overview', component: Overview, canActivate: [authGuard] },
  { path: 'editor/:id', component: Editor, canActivate: [authGuard] },
  {
    path: 'premium-editor/:id',
    component: Editor,
    canActivate: [authGuard, roleGuard],
    data: { roles: premiumRoles },
  },
  { path: '**', redirectTo: '/login' },
];
