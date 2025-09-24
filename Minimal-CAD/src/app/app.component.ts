import { Component, HostListener, ViewChild } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarLeftComponent } from './sidebar-left/sidebar-left.component';
import { SidebarRightComponent } from './sidebar-right/sidebar-right.component';
import { ViewcubeComponent } from './viewcube/viewcube.component';
import { CommonModule } from '@angular/common';
import { MainViewComponent } from './main-view/main-view.component';
import { FormObject, FreeObject } from './interfaces';
import { OnInit } from '@angular/core';
import { Draw } from './draw.service';
import * as THREE from 'three';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    MainViewComponent,
    SidebarLeftComponent,
    SidebarRightComponent,
    ViewcubeComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  @ViewChild(MainViewComponent) mainView!: MainViewComponent;
  cameraResetValue: any = null;

  constructor(private drawservice: Draw) { }

  title = 'Minimal-CAD';
  sidebarRightPosition: [number, number, number] = [0, 0, 0];
  public selectedObject: FormObject | FreeObject | null = null;
  public currentRotation = new THREE.Euler();

  ngOnInit(): void {
    const modelData = this.drawservice.loadObjects();
    this.selectedObject = modelData.find(obj => obj.selected) || null;
  }

  onRotationChanged(rot: THREE.Euler) {
    this.currentRotation = rot;
    const view = this.drawservice.getView();
    view.rootGroup.rotation.x = rot.x;
    view.rootGroup.rotation.y = rot.y;
    view.rootGroup.rotation.z = rot.z;
    this.drawservice.setView(view);
  }

  onViewcubeRotation(rot: THREE.Euler) {
    if (this.mainView) {
      this.mainView.setRotation(rot);
    }
    const view = this.drawservice.getView();
    view.rootGroup.rotation.x = rot.x;
    view.rootGroup.rotation.y = rot.y;
    view.rootGroup.rotation.z = rot.z;
    this.drawservice.setView(view);
  }

  onViewcubeCameraReset(val: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }, scale: { x: number, y: number, z: number } }) {
    this.cameraResetValue = val;
    // Optionally, reset after a tick to allow for repeated events
    setTimeout(() => { this.cameraResetValue = null; }, 100);
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }
}
