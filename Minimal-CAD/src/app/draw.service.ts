import { Injectable, model } from '@angular/core';
import { FormObject, FreeObject } from './interfaces';
import modelData from './models/model-data.json' assert { type: "json" };

@Injectable({
  providedIn: 'root'
})
export class Draw {
  public showGrid = true;
  public showSideBar = true;
  public sideBarContent: FormObject | FreeObject | null = null;

  loadObjects(): FormObject[] {
    return modelData as FormObject[];
  }

  getShowGrid(): boolean {
    return this.showGrid;
  }

  setShowGrid(value: boolean): void {
    this.showGrid = value;
  }

  getShowSideBar(): { show: boolean; content: FormObject | FreeObject | null } {
    return { show: this.showSideBar, content: this.sideBarContent };
  }

  setShowSideBar(value: boolean, object: FormObject | FreeObject): void {
    this.showSideBar = value;
    this.sideBarContent = object;
  }

  line() {
    // Comming soon: Line objects will be implemented later
  }

  rectangle() {
    
  }

  circle() {
    
  }

  extrusion() {
    // Coming soon: Extrusion objects will be implemented later
  }
}
