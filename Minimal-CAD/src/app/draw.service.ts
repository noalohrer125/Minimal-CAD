import { Injectable } from '@angular/core';
import { DEFAULT_VIEW, FormObject, FreeObject, view } from './interfaces';
import { FirebaseService } from './firebase.service';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  constructor(private firebaseService: FirebaseService) {}
  loadObjects(): (FormObject | FreeObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as (FormObject | FreeObject)[] : [];
    if (data) {
      return data;
    }
    return [];
  }

  loadObjectsFirebase(): Observable<(FormObject | FreeObject)[]> {
    return new Observable<(FormObject | FreeObject)[]>((observer) => {
      this.firebaseService.getObjects().subscribe({
        next: (firebaseObjects) => {
          const normalized = (firebaseObjects as (FormObject | FreeObject)[]).map(obj => ({
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

  saveProjectToFirebase(): void {
    const isExistingProject = localStorage.getItem('project-id') || 'notExisting';
    const modelData = this.loadObjects().filter(obj => !obj.ghost);
    modelData.forEach(obj => obj.selected = false);
    let projectId: string | null = null;
    if (isExistingProject !== 'notExisting') {
      projectId = isExistingProject;
    }
    const projectName = window.prompt('Enter a (new) name for your project:', 'Unnamed Project') || 'Unnamed Project';
    const project = {
      id: projectId ? projectId : this.generateId(),
      name: projectName,
      licenceKey: this.generateHash(this.generateId()),
      createdAt: new Date(),
      objectIds: modelData.map(obj => obj.id)
    };
    this.firebaseService.saveProject(project).subscribe({
      next: (projectId) => {
        modelData.forEach(obj => {
          this.firebaseService.saveObject(obj).subscribe();
        });
        window.alert(`Project saved with ID: ${projectId}.\n\nYour Licence Key to this project is: ${project.licenceKey}.\nMake sure to save it! Or else you won't be able to access your project later again.`);
      },
      error: (err) => {
        console.error('Failed to save project to Firebase', err);
      }
    });
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
    location.reload();
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
    location.reload();
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
    location.reload();
  }
}
