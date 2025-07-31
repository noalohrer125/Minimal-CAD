import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class Draw {
  constructor() { }

  save() {
    // Logic to save the drawing
    console.log('Drawing saved');
  }

  upload() {
    // Logic to upload the drawing
    console.log('Drawing uploaded');
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
