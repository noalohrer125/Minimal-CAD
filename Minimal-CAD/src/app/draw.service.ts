import { Injectable } from '@angular/core';
import { FormObject, LineObject } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  loadObjects(): (FormObject | LineObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as (FormObject | LineObject)[] : [];
    const selectedObject = localStorage.getItem('selectedObject');
    if (selectedObject) {
      data.push(JSON.parse(selectedObject) as FormObject | LineObject);
      if (data) {
        return data;
      }
    }
    if (data) {
      return data;
    }
    return [];
  }

  saveObject(object: FormObject | LineObject): void {
    const modelData = JSON.parse(localStorage.getItem('model-data') || '[]');
    const isNewObject = modelData.findIndex((obj: FormObject | LineObject) => obj.id === object.id);
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

  line() {
    const newObject: LineObject = {
      id: this.generateId(),
      name: 'New Line',
      type: 'Line',
      start: [0, 0, 0],
      end: [1, 1, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
    location.reload();
  }

  rectangle() {
    const newObject: FormObject = {
      id: this.generateId(),
      name: 'New Rectangle',
      type: 'Square',
      l: 1,
      w: 1,
      h: 0,
      position: [0, 0, 0]
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
      position: [0, 0, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
    location.reload();
  }

  extrusion() {
    // Coming soon: Extrusion objects will be implemented later
  }
}
