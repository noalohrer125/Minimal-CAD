import { inject, Injectable } from '@angular/core';
import {
  Firestore,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import {
  FormObject,
  FreeObject,
  Project,
  ProjectVersionSnapshot,
  Settings,
  User,
} from '../interfaces';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  getCurrentUserEmail(): string | null {
    return this.auth.currentUser?.email ?? null;
  }

  getCurrentUserId(): string | null {
    return this.auth.currentUser?.uid ?? null;
  }

  getOwnerEmailForCurrentProject(): Observable<string | null> {
    const projectId = localStorage.getItem('project-id');
    if (!projectId || projectId === 'notExisting') {
      return from(Promise.resolve(null));
    }
    return from(
      getDoc(doc(this.projectsCollection, projectId)).then((docSnapshot) => {
        if (docSnapshot.exists()) {
          const projectData = docSnapshot.data() as Project;
          return projectData.ownerEmail ?? null;
        }
        return null;
      }),
    );
  }

  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  private get usersCollection() {
    return collection(this.firestore, 'users');
  }

  private getUserDocRef(uid: string) {
    return doc(this.usersCollection, uid);
  }

  // Helper to get objects subcollection for a project
  private getObjectsCollection(projectId: string) {
    return collection(this.firestore, 'projects', projectId, 'objects');
  }

  private getProjectVersionsCollection(projectId: string) {
    return collection(this.firestore, 'projects', projectId, 'versions');
  }

  getObjectsByProjectId(
    projectId: string,
  ): Observable<(FormObject | FreeObject)[]> {
    const projectObjectsCollection = this.getObjectsCollection(projectId);
    return from(
      getDocs(projectObjectsCollection).then((snapshot) => {
        return snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as FormObject | FreeObject,
        );
      }),
    );
  }

  saveObject(
    projectId: string,
    object: FormObject | FreeObject,
  ): Observable<string> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const objectDocRef = doc(objectsCollection, object.id);
    const saveWithStableId = async () => {
      try {
        // Keep Firestore doc id in sync with object.id to prevent duplicates on re-save.
        await setDoc(objectDocRef, object as any);
        return object.id;
      } catch (error) {
        console.error('Error saving object to Firebase:', error);
        throw new Error('Error saving object. Please try again.');
      }
    };
    return from(saveWithStableId());
  }

  async cleanupObjects(
    projectId: string,
    validObjectIds: string[],
  ): Promise<void> {
    try {
      const objectsCollection = this.getObjectsCollection(projectId);
      const objectsSnapshot = await getDocs(objectsCollection);
      const validIds = new Set(validObjectIds);

      const deletePromises = objectsSnapshot.docs
        .filter((docSnapshot) => !validIds.has(docSnapshot.id))
        .map((docSnapshot) =>
          deleteDoc(doc(objectsCollection, docSnapshot.id)),
        );

      await Promise.all(deletePromises);
    } catch (error) {
      console.error('Error cleaning up project objects in Firebase:', error);
      throw new Error('Error cleaning up project objects. Please try again.');
    }
  }

  updateObject(
    projectId: string,
    object: FormObject | FreeObject,
  ): Observable<string> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const docRef = setDoc(
      doc(objectsCollection, object.id),
      object as FormObject | FreeObject,
    ).then(() => object.id);
    return from(docRef);
  }

  deleteObject(projectId: string, objectId: string): Observable<void> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const docRef = doc(objectsCollection, objectId);
    const promise = deleteDoc(docRef);
    return from(promise);
  }

  getProjects(): Observable<Project[]> {
    return from(
      getDocs(this.projectsCollection).then((snapshot) => {
        return snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );
      }),
    );
  }

  getPublicProjects(): Observable<Project[]> {
    const publicProjectsQuery = query(
      this.projectsCollection,
      where('licenceKey', '==', 'public'),
    );
    return from(
      getDocs(publicProjectsQuery).then((snapshot) => {
        return snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );
      }),
    );
  }

  getProjectsByOwner(ownerEmail: string): Observable<Project[]> {
    const ownerProjectsQuery = query(
      this.projectsCollection,
      where('ownerEmail', '==', ownerEmail),
    );
    return from(
      getDocs(ownerProjectsQuery).then((snapshot) => {
        return snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() }) as Project,
        );
      }),
    );
  }

  getProjectById(projectId: string): Observable<Project | null> {
    const docRef = doc(this.projectsCollection, projectId);
    const projectData = getDoc(docRef).then((snapshot) => {
      if (snapshot.exists()) {
        return snapshot.data() as Project;
      } else {
        return null;
      }
    });
    return from(projectData);
  }

  getUserById(uid: string): Observable<User | null> {
    const userData = getDoc(this.getUserDocRef(uid)).then((snapshot) => {
      if (!snapshot.exists()) {
        return null;
      }

      return snapshot.data() as User;
    });

    return from(userData);
  }

  saveUser(user: User): Observable<string> {
    const uid = user.uid;
    if (!uid) {
      throw new Error('User uid is required to save user data.');
    }

    const savePromise = setDoc(this.getUserDocRef(uid), user, {
      merge: true,
    }).then(() => uid);
    return from(savePromise);
  }

  updateUserSettings(uid: string, settings: Settings): Observable<string> {
    const savePromise = setDoc(
      this.getUserDocRef(uid),
      { settings },
      { merge: true },
    ).then(() => uid);

    return from(savePromise);
  }

  async saveProject(project: Project): Promise<Observable<string>> {
    try {
      const docRef = doc(this.projectsCollection, project.id);
      // Always use setDoc to preserve the project.id
      await setDoc(docRef, project);
      return from(Promise.resolve(project.id));
    } catch (error) {
      console.error('Error saving project to Firebase:', error);
      throw new Error('Error saving project. Please try again.');
    }
  }

  updateProject(project: Project): Observable<string> {
    const docRef = setDoc(
      doc(this.projectsCollection, project.id),
      project,
    ).then(() => project.id);
    return from(docRef);
  }

  saveProjectVersionSnapshot(
    projectId: string,
    snapshot: ProjectVersionSnapshot,
  ): Observable<string> {
    const versionsCollection = this.getProjectVersionsCollection(projectId);
    const snapshotDocRef = doc(versionsCollection, snapshot.id);
    return from(setDoc(snapshotDocRef, snapshot).then(() => snapshot.id));
  }

  getProjectVersionSnapshots(
    projectId: string,
  ): Observable<ProjectVersionSnapshot[]> {
    const versionsCollection = this.getProjectVersionsCollection(projectId);
    return from(
      getDocs(versionsCollection).then((snapshot) => {
        return snapshot.docs.map(
          (docSnapshot) =>
            ({
              id: docSnapshot.id,
              ...docSnapshot.data(),
            }) as ProjectVersionSnapshot,
        );
      }),
    );
  }

  async deleteProjectVersionSnapshots(
    projectId: string,
    snapshotIds: string[],
  ): Promise<void> {
    if (!snapshotIds.length) {
      return;
    }

    const versionsCollection = this.getProjectVersionsCollection(projectId);
    await Promise.all(
      snapshotIds.map((snapshotId) =>
        deleteDoc(doc(versionsCollection, snapshotId)),
      ),
    );
  }

  updateProjectVersionState(
    projectId: string,
    currentVersionId: string,
    versionCount: number,
  ): Observable<string> {
    const projectDocRef = doc(this.projectsCollection, projectId);
    return from(
      setDoc(
        projectDocRef,
        {
          currentVersionId,
          versionCount,
        },
        { merge: true },
      ).then(() => projectId),
    );
  }

  async deleteProject(projectId: string): Promise<Observable<void>> {
    const docRef = doc(this.projectsCollection, projectId);
    const deleteProjectAndObjects = async () => {
      try {
        // Delete all objects in the subcollection
        const objectsCollection = this.getObjectsCollection(projectId);
        const objectsSnapshot = await getDocs(objectsCollection);

        if (objectsSnapshot && !objectsSnapshot.empty) {
          const deletePromises = objectsSnapshot.docs.map((docSnapshot) =>
            deleteDoc(doc(objectsCollection, docSnapshot.id)),
          );
          await Promise.all(deletePromises);
        }

        // Delete the project itself
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting project from Firebase:', error);
        throw new Error('Error deleting project. Please try again.');
      }
    };
    return from(deleteProjectAndObjects());
  }
}
