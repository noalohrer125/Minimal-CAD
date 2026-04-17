import { inject, Injectable, signal } from '@angular/core';
import {
  Auth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  user,
  User as FirebaseAuthUser,
} from '@angular/fire/auth';
import {
  doc,
  Firestore,
  getDoc,
  serverTimestamp,
  setDoc,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { User, UserRole } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  firestore = inject(Firestore);
  $user = user(this.firebaseAuth);
  currentUserSignal = signal<User | null>(null);

  constructor() {
    // Keep signal in sync with Firebase user
    this.$user.subscribe((firebaseUser) => {
      void this.syncCurrentUser(firebaseUser);
    });
  }

  private getUserDocRef(uid: string) {
    return doc(this.firestore, 'users', uid);
  }

  private parseRole(rawRole: unknown): UserRole {
    if (rawRole === 'admin' || rawRole === 'paid-user' || rawRole === 'user') {
      return rawRole;
    }
    return 'user';
  }

  private async getUserRole(uid: string): Promise<UserRole> {
    try {
      const userDoc = await getDoc(this.getUserDocRef(uid));
      return this.parseRole(userDoc.data()?.['role']);
    } catch {
      return 'user';
    }
  }

  private async syncCurrentUser(
    firebaseUser: FirebaseAuthUser | null,
  ): Promise<void> {
    if (!firebaseUser) {
      this.currentUserSignal.set(null);
      return;
    }

    const role = await this.getUserRole(firebaseUser.uid);
    this.currentUserSignal.set({
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      username: firebaseUser.displayName ?? '',
      role,
    });
  }

  private async ensureUserProfile(
    uid: string,
    email: string,
    username: string,
  ): Promise<void> {
    const userDocRef = this.getUserDocRef(uid);
    const existingUserDoc = await getDoc(userDocRef);
    const existingRole = this.parseRole(existingUserDoc.data()?.['role']);

    await setDoc(
      userDocRef,
      {
        uid,
        email,
        username,
        role: existingUserDoc.exists() ? existingRole : 'user',
        updatedAt: serverTimestamp(),
        createdAt: existingUserDoc.exists()
          ? (existingUserDoc.data()?.['createdAt'] ?? serverTimestamp())
          : serverTimestamp(),
      },
      { merge: true },
    );
  }

  register(
    email: string,
    username: string,
    password: string,
  ): Observable<void> {
    const promise = createUserWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(async (response) => {
      await updateProfile(response.user, { displayName: username });
      await this.ensureUserProfile(response.user.uid, email, username);
    });
    return from(promise);
  }

  login(email: string, password: string): Observable<void> {
    const promise = signInWithEmailAndPassword(
      this.firebaseAuth,
      email,
      password,
    ).then(() => {});
    return from(promise);
  }

  logout(): Observable<void> {
    const promise = this.firebaseAuth.signOut().then(() => {
      this.currentUserSignal.set(null);
    });
    return from(promise);
  }

  hasAnyRole(roles: UserRole[]): boolean {
    const currentUserRole = this.currentUserSignal()?.role ?? 'user';
    return roles.includes(currentUserRole);
  }

  isPaidOrAdmin(): boolean {
    return this.hasAnyRole(['paid-user', 'admin']);
  }
}
