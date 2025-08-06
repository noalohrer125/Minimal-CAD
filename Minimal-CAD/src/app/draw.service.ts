import { Injectable } from '@angular/core';
import { FormObject, FreeObject } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  loadObjects(): (FormObject | FreeObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as (FormObject | FreeObject)[] : [];
    const selectedObject = localStorage.getItem('selectedObject');
    if (selectedObject) {
      data.push(JSON.parse(selectedObject) as (FormObject | FreeObject));
      if (data) {
        return data;
      }
    }
    if (data) {
      return data;
    }
    return [];
  }

  saveObject(object: FormObject | FreeObject): void {
    const modelData = this.loadObjects();
    if (object) {
      modelData.push(object);
    }
    // Optional: Wenn selectedObject ein Array ist, wie bisher
    const objects = localStorage.getItem('selectedObject');
    if (objects) {
      try {
        const arr = JSON.parse(objects) as (FormObject | FreeObject)[];
        modelData.push(...arr);
      } catch {}
    }
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  line() {
    // Comming soon: Line objects will be implemented later
  }

  rectangle() {
    const newObject: FormObject = {
      name: 'New Rectangle',
      type: 'Square',
      size: [1, 1, 0],
      position: [0, 0, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
  }

  circle() {
    // Comming soon: Circle objects will be implemented later
  }

  extrusion() {
    // Coming soon: Extrusion objects will be implemented later
  }
}
