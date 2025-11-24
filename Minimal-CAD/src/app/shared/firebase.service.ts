import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, query, setDoc, where } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { FormObject, FreeObject, Project } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  getCurrentUserEmail() {
    const currentUser = (this as any).firestore._authCredentials.auth.auth.currentUser.email ?
    (this as any).firestore._authCredentials.auth.auth.currentUser.email :
    null;
    return currentUser;
  }
  firestore = inject(Firestore);
  objectsCollection = collection(this.firestore, 'objects');
  projectsCollection = collection(this.firestore, 'projects');

  getObjects(): Observable<FormObject[] | FreeObject[]> {
    return collectionData(this.objectsCollection, {
      idField: 'id'
    }) as Observable<FormObject[] | FreeObject[]>;
  }

  getObjectsByProject(projectId: string): Observable<FormObject[] | FreeObject[]> {
    const projectObjectsCollection = collection(this.projectsCollection, projectId, 'objects');
    return collectionData(projectObjectsCollection, {
      idField: 'id'
    }) as Observable<FormObject[] | FreeObject[]>;
  }

  getObjectsByProjectId(projectId: string): Observable<(FormObject | FreeObject)[]> {
    return new Observable<(FormObject | FreeObject)[]>((observer) => {
      this.getProjectById(projectId).subscribe({
        next: (project) => {
          if (!project || !project.objectIds || project.objectIds.length === 0) {
            observer.next([]);
            observer.complete();
            return;
          }
          // Get all objects and filter by project's objectIds
          this.getObjects().subscribe({
            next: (allObjects) => {
              const projectObjects = allObjects.filter(obj => 
                project.objectIds.includes(obj.id as string)
              ) as (FormObject | FreeObject)[];
              observer.next(projectObjects);
              observer.complete();
            },
            error: (err) => {
              console.error('Error loading objects:', err);
              observer.error(err);
            }
          });
        },
        error: (err) => {
          console.error('Error loading project:', err);
          observer.error(err);
        }
      });
    });
  }

  saveObject(object: FormObject | FreeObject): Observable<string> {
    const objectDocRef = doc(this.objectsCollection, object.id);
    const checkAndSave = async () => {
      try {
        const snapshot = await getDoc(objectDocRef);
        if (snapshot.exists()) {
          await setDoc(objectDocRef, object);
          return object.id;
        } else {
          const response = await addDoc(this.objectsCollection, object);
          return response.id;
        }
      } catch (error) {
        console.error('Error saving object to Firebase:', error);
        throw new Error('Error saving object. Please try again.');
      }
    };
    return from(checkAndSave());
  }

  updateObject(object: FormObject | FreeObject): Observable<string> {
    const docRef = setDoc(doc(this.objectsCollection, object.id), object).then(
      () => object.id
    );
    return from(docRef);
  }

  deleteObject(objectId: string): Observable<void> {
    // Hard delete: remove object from 'objects' and from any project referencing it
    const docRef = doc(this.objectsCollection, objectId);
    const promise = deleteDoc(docRef).then(async () => {
      try {
        // Remove objectId from all projects' objectIds arrays
        const projectsSnap = await collectionData(this.projectsCollection, { idField: 'id' }).toPromise();
        if (projectsSnap) {
          for (const project of projectsSnap) {
            if (project['objectIds'] && Array.isArray(project['objectIds']) && project['objectIds'].includes(objectId)) {
              const updatedObjectIds = project['objectIds'].filter((id: string) => id !== objectId);
              await setDoc(doc(this.projectsCollection, project.id), { ...project, objectIds: updatedObjectIds });
            }
          }
        }
      } catch (error) {
        console.error('Error deleting object from Firebase:', error);
        throw new Error('Error deleting object. Please try again.');
      }
    });
    return from(promise);
  }

  getProjects(): Observable<Project[]> {
    return collectionData(this.projectsCollection, {
      idField: 'id'
    }) as Observable<Project[]>;
  }

  getPublicProjects(): Observable<Project[]> {
    const publicProjectsQuery = query(this.projectsCollection, where('licenceKey', '==', 'public'));
    return collectionData(publicProjectsQuery, { idField: 'id' }) as Observable<Project[]>;
  }

  getProjectsByOwner(ownerEmail: string): Observable<Project[]> {
    const ownerProjectsQuery = query(this.projectsCollection, where('ownerEmail', '==', ownerEmail));
    return collectionData(ownerProjectsQuery, { idField: 'id' }) as Observable<Project[]>;
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
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        await setDoc(docRef, project);
        return from(Promise.resolve(project.id));
      } else {
        const response = await addDoc(this.projectsCollection, project);
        return from(Promise.resolve(response.id));
      }
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
        const projectData = await getDoc(docRef);
        if (projectData.exists()) {
          const project = projectData.data();
          if (project['objectIds'] && Array.isArray(project['objectIds'])) {
            const deletePromises = project['objectIds'].map((objectId: string) =>
              deleteDoc(doc(this.objectsCollection, objectId))
            );
            await Promise.all(deletePromises);
          }
        }
        await deleteDoc(docRef);
      } catch (error) {
        console.error('Error deleting project from Firebase:', error);
        throw new Error('Error deleting project. Please try again.');
      }
    };
    return from(deleteProjectAndObjects());
  }
}
