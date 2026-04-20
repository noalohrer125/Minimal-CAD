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
import { DEFAULT_SETTINGS, Settings, User, UserRole } from '../interfaces';
import { SettingsService } from '../shared/settings.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  firebaseAuth = inject(Auth);
  firestore = inject(Firestore);
  settingsService = inject(SettingsService);
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

  private parseSettings(rawSettings: unknown): Settings {
    if (
      rawSettings &&
      typeof rawSettings === 'object' &&
      'theme' in rawSettings &&
      'units' in rawSettings &&
      'autosave' in rawSettings
    ) {
      const theme = rawSettings['theme'];
      const units = rawSettings['units'];
      const autosave = rawSettings['autosave'];

      if (
        (theme === 'light' || theme === 'dark') &&
        (units === 'metric' || units === 'imperial') &&
        typeof autosave === 'boolean'
      ) {
        return { theme, units, autosave };
      }
    }

    return { ...DEFAULT_SETTINGS };
  }

  private async syncCurrentUser(
    firebaseUser: FirebaseAuthUser | null,
  ): Promise<void> {
    if (!firebaseUser) {
      this.currentUserSignal.set(null);
      return;
    }

    const baseUser: User = {
      uid: firebaseUser.uid,
      email: firebaseUser.email ?? '',
      username: firebaseUser.displayName ?? '',
      role: 'user',
      settings: { ...DEFAULT_SETTINGS },
    };

    // Update UI/auth state immediately; role is refined asynchronously below.
    this.currentUserSignal.set(baseUser);

    // Best-effort backfill for legacy users; auth flow must not fail if this is denied.
    try {
      await this.ensureUserProfile(
        firebaseUser.uid,
        firebaseUser.email ?? '',
        firebaseUser.displayName ?? '',
      );
    } catch {
      // Ignore profile-sync failures here and continue with auth state.
    }

    const userDoc = await getDoc(this.getUserDocRef(firebaseUser.uid)).catch(
      () => null,
    );
    const role = userDoc ? this.parseRole(userDoc.data()?.['role']) : 'user';
    const settings = userDoc
      ? this.parseSettings(userDoc.data()?.['settings'])
      : { ...DEFAULT_SETTINGS };

    const resolvedUser = { ...baseUser, role, settings };
    this.currentUserSignal.set(resolvedUser);
    this.settingsService.hydrateSettingsFromUser(resolvedUser);
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
        settings: this.parseSettings(existingUserDoc.data()?.['settings']),
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

      // Keep registration successful even if profile persistence is temporarily blocked.
      try {
        await this.ensureUserProfile(response.user.uid, email, username);
      } catch {
        // Ignore and allow the user to continue; role falls back to 'user'.
      }
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
