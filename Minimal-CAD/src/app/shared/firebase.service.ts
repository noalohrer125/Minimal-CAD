import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, setDoc, where } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { FormObject, FreeObject, Project } from '../interfaces';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  
  getCurrentUserEmail(): string | null {
    return this.auth.currentUser?.email ?? null;
  }

  // Getter instead of property to ensure it's called within injection context
  private get projectsCollection() {
    return collection(this.firestore, 'projects');
  }

  // Helper to get objects subcollection for a project
  private getObjectsCollection(projectId: string) {
    return collection(this.firestore, 'projects', projectId, 'objects');
  }

  getObjectsByProjectId(projectId: string): Observable<(FormObject | FreeObject)[]> {
    const projectObjectsCollection = this.getObjectsCollection(projectId);
    return from(getDocs(projectObjectsCollection).then(snapshot => {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as FormObject | FreeObject));
    }));
  }

  saveObject(projectId: string, object: FormObject | FreeObject): Observable<string> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const objectDocRef = doc(objectsCollection, object.id);
    const checkAndSave = async () => {
      try {
        const snapshot = await getDoc(objectDocRef);
        if (snapshot.exists()) {
          await setDoc(objectDocRef, object as any);
          return object.id;
        } else {
          const response = await addDoc(objectsCollection, object as any);
          return response.id;
        }
      } catch (error) {
        console.error('Error saving object to Firebase:', error);
        throw new Error('Error saving object. Please try again.');
      }
    };
    return from(checkAndSave());
  }

  updateObject(projectId: string, object: FormObject | FreeObject): Observable<string> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const docRef = setDoc(doc(objectsCollection, object.id), object as any).then(
      () => object.id
    );
    return from(docRef);
  }

  deleteObject(projectId: string, objectId: string): Observable<void> {
    const objectsCollection = this.getObjectsCollection(projectId);
    const docRef = doc(objectsCollection, objectId);
    const promise = deleteDoc(docRef);
    return from(promise);
  }

  getProjects(): Observable<Project[]> {
    return from(getDocs(this.projectsCollection).then(snapshot => {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }));
  }

  getPublicProjects(): Observable<Project[]> {
    const publicProjectsQuery = query(this.projectsCollection, where('licenceKey', '==', 'public'));
    return from(getDocs(publicProjectsQuery).then(snapshot => {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }));
  }

  getProjectsByOwner(ownerEmail: string): Observable<Project[]> {
    const ownerProjectsQuery = query(this.projectsCollection, where('ownerEmail', '==', ownerEmail));
    return from(getDocs(ownerProjectsQuery).then(snapshot => {
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
    }));
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
    const docRef = setDoc(doc(this.projectsCollection, project.id), project).then(
      () => project.id
    );
    return from(docRef);
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
            deleteDoc(doc(objectsCollection, docSnapshot.id))
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
