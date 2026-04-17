import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { Auth, user } from '@angular/fire/auth';
import { doc, Firestore, getDoc } from '@angular/fire/firestore';
import { from, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';
import { UserRole } from '../interfaces';

export const authGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);

  return user(auth).pipe(
    take(1),
    map((currentUser) => {
      if (currentUser) {
        return true;
      } else {
        router.navigate(['/login']);
        return false;
      }
    }),
  );
};

const parseRole = (rawRole: unknown): UserRole => {
  if (rawRole === 'admin' || rawRole === 'paid-user' || rawRole === 'user') {
    return rawRole;
  }
  return 'user';
};

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(Auth);
  const router = inject(Router);
  const firestore = inject(Firestore);
  const requiredRoles = (route.data?.['roles'] ?? []) as UserRole[];

  return user(auth).pipe(
    take(1),
    switchMap((currentUser) => {
      if (!currentUser) {
        router.navigate(['/login']);
        return of(false);
      }

      if (requiredRoles.length === 0) {
        return of(true);
      }

      const userDocRef = doc(firestore, 'users', currentUser.uid);
      return from(getDoc(userDocRef)).pipe(
        map((userDoc) => {
          const currentRole = parseRole(userDoc.data()?.['role']);
          if (requiredRoles.includes(currentRole)) {
            return true;
          }

          router.navigate(['/overview']);
          return false;
        }),
      );
    }),
  );
};
