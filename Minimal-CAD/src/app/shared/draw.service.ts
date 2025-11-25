import { Injectable } from '@angular/core';
import { DEFAULT_VIEW, FormObject, FreeObject, Project, projectSavingResult, view } from '../interfaces';
import { FirebaseService } from './firebase.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  constructor(private firebaseService: FirebaseService) {}

  public reload$: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  loadObjects(): (FormObject | FreeObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as (FormObject | FreeObject)[] : [];
    if (data) {
      return data;
    }
    return [];
  }

  async loadObjectsByProjectId(projectId: string): Promise<(FormObject | FreeObject)[]> {
    if (!projectId) {
      return [];
    }
    
    try {
      return new Promise((resolve, reject) => {
        this.loadObjectsFirebase(projectId).subscribe({
          next: (firebaseData) => {
            localStorage.setItem('model-data', JSON.stringify(firebaseData as (FormObject | FreeObject)[]));
            resolve(firebaseData as (FormObject | FreeObject)[]);
          },
          error: (err) => {
            console.error('Error loading objects from Firebase:', err);
            reject(new Error('Error loading objects. Please try again.'));
          }
        });
      });
    } catch (error) {
      console.error('Error loading objects by project ID:', error);
      throw new Error('Error loading objects. Please try again.');
    }
  }

  loadObjectsFirebase(projectId: string): Observable<(FormObject | FreeObject)[]> {
    return new Observable<(FormObject | FreeObject)[]>((observer) => {
      this.firebaseService.getObjectsByProjectId(projectId).subscribe({
        next: (firebaseObjects: (FormObject | FreeObject)[]) => {
          const normalized = firebaseObjects.map(obj => ({
            ...obj,
            selected: false,
            ghost: false
          }));
          localStorage.setItem('model-data', JSON.stringify(normalized));
          observer.next(normalized);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to load Firebase objects', err);
          observer.error(err);
        }
      });
    });
  }

  setView(position: view): void {
    localStorage.setItem('view', position ? JSON.stringify(position) : '');
  }

  getView(): view {
    const viewString = localStorage.getItem('view');
    return viewString ? JSON.parse(viewString) as view : DEFAULT_VIEW;
  }

  saveObject(object: FormObject | FreeObject, newId: string = object.id): void {
    let modelData = this.loadObjects();
    const existingIndex = modelData.findIndex((obj: FormObject | FreeObject) => obj.id === object.id && !obj.ghost);
    
    if (existingIndex === -1) {
      // New object
      modelData.push({...object, id: newId});
    } else {
      // Update existing object
      modelData[existingIndex] = {...object, id: newId};
    }
    
    // Remove all ghost objects and deselect all objects
    modelData = modelData.filter(obj => !obj.ghost);
    modelData.forEach(obj => obj.selected = false);
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  async saveProjectToFirebase(projectName: string, isPrivate: boolean, newProject: boolean = false): Promise<projectSavingResult> {
    try {
      // Determine project ID first
      const isExistingProject = localStorage.getItem('project-id') || 'notExisting';
      let projectId: string | null = null;
      if (isExistingProject !== 'notExisting' && !newProject) {
        projectId = isExistingProject;
      } else {
        projectId = this.generateId();
      }
      
      const currentUserEmail = this.firebaseService.getCurrentUserEmail();
      if (!currentUserEmail) {
        throw new Error('User not authenticated');
      }
      const project: Project = {
        id: projectId,
        name: projectName,
        licenceKey: isPrivate ? this.generateHash(this.generateId()) : 'public',
        ownerEmail: currentUserEmail,
        createdAt: Timestamp.now()
      };
      
      // Save project first to create the document
      await new Promise<void>((resolve, reject) => {
        this.firebaseService.saveProject(project).then(obs => {
          obs.subscribe({
            next: () => resolve(),
            error: (err) => reject(err)
          });
        });
      });
      
      // Then save all objects to the project's subcollection
      let modelData = this.loadObjects().filter(obj => !obj.ghost);
      modelData.forEach(obj => obj.selected = false);
      await Promise.all(modelData.map(obj => {
        return new Promise((resolve, reject) => {
          this.firebaseService.saveObject(projectId!, obj).subscribe({
            next: () => resolve(true),
            error: (err) => {
              console.error('Failed to save object to Firebase: ', err);
              reject(err);
            }
          });
        });
      }));
      
      localStorage.setItem('project-id', projectId);
      return {
        success: true,
        projectName: project.name,
        licenceKey: project.licenceKey,
        projectId: project.id,
        error: ''
      };
    } catch (error) {
      console.error('Error saving project to Firebase:', error);
      return {
        success: false,
        projectName: projectName,
        licenceKey: '',
        projectId: '',
        error: 'Error saving project. Please try again.'
      };
    }
  }

  createGhostObject(objectId: string): void {
    let modelData = this.loadObjects();
    const originalObject = modelData.find(obj => obj.id === objectId && !obj.ghost);
    
    if (originalObject && !modelData.some(obj => obj.id === objectId && obj.ghost)) {
      // Create ghost copy of the original object
      const ghostObject = { ...originalObject, ghost: true, selected: false };
      modelData.push(ghostObject);
      localStorage.setItem('model-data', JSON.stringify(modelData));
    }
  }

  removeGhostObjects(): void {
    let modelData = this.loadObjects();
    modelData = modelData.filter(obj => !obj.ghost);
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  deselectAllObjects(): void {
    let modelData = this.loadObjects();
    modelData.forEach(obj => obj.selected = false);
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36);
  }

  generateHash(string: string): string {
    let hash = 0;
    for (const char of string) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0; // Constrain to 32bit integer
    }
    return hash.toString() ;
  }

  rectangle() {
    const newObject: FormObject = {
      id: this.generateId(),
      name: 'New Rectangle',
      type: 'Square',
      l: 1,
      w: 1,
      h: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      selected: true
    };
    localStorage.setItem('model-data', JSON.stringify([...this.loadObjects(), newObject]));
    this.reload$.next();
  }

  circle() {
    const newObject: FormObject = {
      id: this.generateId(),
      name: 'New Circle',
      type: 'Circle',
      r: 1,
      h: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      curveSegments: 100,
      selected: true
    };
    localStorage.setItem('model-data', JSON.stringify([...this.loadObjects(), newObject]));
    this.reload$.next();
  }

  freeform() {
    const newObject: FreeObject = {
      id: this.generateId(),
      name: 'New Freeform',
      type: 'Freeform',
      commands: [
        {
          type: 'moveTo',
          x: 0,
          y: 0,
          new: false
        },
        {
          type: 'lineTo',
          x: 1,
          y: 0,
          new: false
        },
        {
          type: 'lineTo',
          x: 1,
          y: 1,
          new: false
        }
      ],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      h: 2,
      selected: true
    };
    localStorage.setItem('model-data', JSON.stringify([...this.loadObjects(), newObject]));
    this.reload$.next();
  }
}
