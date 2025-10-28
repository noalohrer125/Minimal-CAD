import { Routes } from "@angular/router";
import { Login } from "./auth/login/login";
import { Register } from "./auth/register/register";
import { Overview } from "./overview/overview";
import { Editor } from "./edit/editor/editor";

export const appRoutes: Routes = [
    { path: 'login', component: Login },
    { path: 'register', component: Register },
    { path: 'overview', component: Overview },
    { path: 'editor/:id', component: Editor },
];
