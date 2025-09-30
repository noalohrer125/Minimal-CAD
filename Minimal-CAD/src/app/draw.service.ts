import { Injectable } from '@angular/core';
import { DEFAULT_VIEW, FormObject, FreeObject, view } from './interfaces';
import { FirebaseService } from './firebase.service';


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

  loadObjectsFirebase(): void {
    this.firebaseService.getObjects().subscribe({
      next: (firebaseObjects) => {
        // Ensure each object has selected & ghost flags normalized
        const normalized = (firebaseObjects as (FormObject | FreeObject)[]).map(obj => ({
          ...obj,
          selected: false,
          ghost: obj.ghost ?? false
        }));
        localStorage.setItem('model-data', JSON.stringify(normalized));
      },
      error: (err) => {
        console.error('Failed to load Firebase objects', err);
      }
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

  saveObjectFirebase(object: FormObject | FreeObject): void {
    this.firebaseService.saveObject(object).subscribe((savedObjectId) => {
      this.saveObject(object, savedObjectId);
      this.loadObjectsFirebase();
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
