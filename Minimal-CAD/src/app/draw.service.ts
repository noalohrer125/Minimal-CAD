import { Injectable } from '@angular/core';
import { FormObject } from './interfaces';


@Injectable({
  providedIn: 'root'
})
export class Draw {
  loadObjects(): (FormObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString ? JSON.parse(modelDataString) as FormObject[] : [];
    const selectedObject = localStorage.getItem('selectedObject');
    if (selectedObject) {
      data.push(JSON.parse(selectedObject) as FormObject);
      if (data) {
        return data;
      }
    }
    if (data) {
      return data;
    }
    return [];
  }

  saveObject(object: FormObject): void {
    const modelData = this.loadObjects();
    if (object) {
      modelData.push(object);
    }
    // Optional: Wenn selectedObject ein Array ist, wie bisher
    const objects = localStorage.getItem('selectedObject');
    if (objects) {
      try {
        const arr = JSON.parse(objects) as FormObject[];
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
      l: 1,
      w: 1,
      h: 0,
      position: [0, 0, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
  }

  circle() {
    const newObject: FormObject = {
      name: 'New Circle',
      type: 'Circle',
      r: 1,
      h: 0,
      position: [0, 0, 0]
    };
    localStorage.setItem('selectedObject', JSON.stringify(newObject));
  }

  extrusion() {
    // Coming soon: Extrusion objects will be implemented later
  }
}
