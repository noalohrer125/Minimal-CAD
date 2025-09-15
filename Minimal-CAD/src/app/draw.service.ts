import { Injectable } from '@angular/core';
import { DEFAULT_VIEW, FormObject, FreeObject, view } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  loadObjects(): (FormObject | FreeObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as (FormObject | FreeObject)[] : [];
    const selectedObject = localStorage.getItem('selectedObject');
    if (selectedObject) {
      data.push(JSON.parse(selectedObject) as FormObject | FreeObject);
      if (data) {
        return data;
      }
    }
    if (data) {
      return data;
    }
    return [];
  }

  setView(position: view): void {
    localStorage.setItem('view', position ? JSON.stringify(position) : '');
  }

  getView(): view {
    const viewString = localStorage.getItem('view');
    return viewString ? JSON.parse(viewString) as view : DEFAULT_VIEW;
  }

  saveObject(object: FormObject | FreeObject): void {
    const modelData = JSON.parse(localStorage.getItem('model-data') || '[]');
    const isNewObject = modelData.findIndex((obj: FormObject | FreeObject) => obj.id === object.id);
    if (isNewObject === -1) {
      modelData.push(object);
    } else {
      modelData[isNewObject] = object;
    }
    localStorage.setItem('model-data', JSON.stringify(modelData));
    localStorage.removeItem('selectedObject');
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
      rotation: [0, 0, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
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
      curveSegments: 100
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
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
      h: 2
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
    location.reload();
  }
}
