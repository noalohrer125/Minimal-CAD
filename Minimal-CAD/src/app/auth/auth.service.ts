import { inject, Injectable, signal } from "@angular/core";
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile, user } from "@angular/fire/auth";
import { from, Observable } from "rxjs";
import { User } from "../interfaces";

@Injectable({
    providedIn: 'root'
})

export class AuthService {
    firebaseAuth = inject(Auth);
    $user = user(this.firebaseAuth);
    currentUserSignal = signal<User | null>(null);

    constructor() {
        // Keep signal in sync with Firebase user
        this.$user.subscribe(firebaseUser => {
            if (firebaseUser) {
                this.currentUserSignal.set({
                    email: firebaseUser.email ?? "",
                    username: firebaseUser.displayName ?? ""
                });
            } else {
                this.currentUserSignal.set(null);
            }
        });
    }

    register(email: string, username: string, password: string): Observable<void> {
        const promise = createUserWithEmailAndPassword(
            this.firebaseAuth,
            email,
            password
        ).then(response => updateProfile(response.user, { displayName: username }));
        return from(promise);
    }

    login(email: string, password: string): Observable<void> {
        const promise = signInWithEmailAndPassword(
            this.firebaseAuth,
            email,
            password
        ).then(() => {});
        return from(promise);
    }

    logout(): Observable<void> {
        const promise = this.firebaseAuth.signOut().then(() => {
            this.currentUserSignal.set(null);
        });
        return from(promise);
    }
}
