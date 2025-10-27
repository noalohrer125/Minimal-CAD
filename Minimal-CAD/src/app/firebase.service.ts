import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, deleteDoc, doc, getDoc, setDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
import { FormObject, FreeObject, Project } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
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

  saveObject(object: FormObject | FreeObject): Observable<string> {
    // Prüfe, ob das Objekt existiert, und speichere/aktualisiere entsprechend
    const objectDocRef = doc(this.objectsCollection, object.id);
    const checkAndSave = async () => {
      const snapshot = await getDoc(objectDocRef);
      if (snapshot.exists()) {
        await setDoc(objectDocRef, object);
        return object.id;
      } else {
        const response = await addDoc(this.objectsCollection, object);
        return response.id;
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
    });
    return from(promise);
  }

  getProjects(): Observable<Project[]> {
    return collectionData(this.projectsCollection, {
      idField: 'id'
    }) as Observable<Project[]>;
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

  saveProject(project: Project): Observable<string> {
    const objectsToSave: (FormObject | FreeObject)[] = JSON.parse(localStorage.getItem('model-data') || '[]').filter((obj: FormObject | FreeObject) => !obj.ghost);
    objectsToSave.forEach(obj => {
      this.saveObject(obj).subscribe();
    });
    const projectAlreadyExists = Boolean(this.getProjectById(project.id));
    if (projectAlreadyExists) {
      return this.updateProject(project);
    }
    const docRef = addDoc(this.projectsCollection, project).then(
      (response) => response.id
    );
    return from(docRef);
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
    };
    return from(deleteProjectAndObjects());
  }
}
