import { Routes } from "@angular/router";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";
import { Overview } from "./overview/overview";
import { Editor } from "./edit/editor/editor";
import { redirectUnauthorizedTo, AngularFireAuthGuard } from '@angular/fire/compat/auth-guard';

const redirectUnauthorizedToLogin = () => redirectUnauthorizedTo(['login']);

export const appRoutes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'overview', component: Overview, canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin } },
    { path: 'editor/:id', component: Editor, canActivate: [AngularFireAuthGuard], data: { authGuardPipe: redirectUnauthorizedToLogin } },
];
