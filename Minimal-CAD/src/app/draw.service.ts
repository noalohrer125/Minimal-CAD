import { Injectable, model } from '@angular/core';
import { FormObject } from './interfaces';
import modelData from './models/model-data.json' assert { type: "json" };

@Injectable({
  providedIn: 'root'
})
export class Draw {
  loadObjects(): FormObject[] {
    return modelData as FormObject[];
  }

  line() {
    // Logic to create a line
  }

  rectangle() {
    // Logic to create a rectangle
  }

  triangle() {
    // Logic to create a triangle
  }

  circle() {
    // Logic to create a circle
  }

  extrusion() {
    // Logic to create an extrusion
  }
}
