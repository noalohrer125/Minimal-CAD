import { Component, HostListener, ViewChild, OnInit } from '@angular/core';
import { SidebarLeftComponent } from '../edit/sidebar-left/sidebar-left.component';
import { SidebarRightComponent } from '../edit/sidebar-right/sidebar-right.component';
import { ViewcubeComponent } from '../edit/viewcube/viewcube.component';
import { CommonModule } from '@angular/common';
import { MainViewComponent } from '../edit/main-view/main-view.component';
import { FormObject, FreeObject } from '../interfaces';
import { Draw } from '../draw.service';
import * as THREE from 'three';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    MainViewComponent,
    SidebarLeftComponent,
    SidebarRightComponent,
    ViewcubeComponent,
    CommonModule,
  ],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home implements OnInit {
  @ViewChild(MainViewComponent) mainView!: MainViewComponent;
  cameraResetValue: any = null;

  constructor(
    private drawservice: Draw,
    private authService: AuthService
  ) { }

  sidebarRightPosition: [number, number, number] = [0, 0, 0];
  public selectedObject: FormObject | FreeObject | null = null;
  public currentRotation = new THREE.Euler();
  public isAuthenticated: boolean = false;
  public isAuthLoading: boolean = true;

  ngOnInit(): void {
    const modelData = this.drawservice.loadObjects();
    this.selectedObject = modelData.find(obj => obj.selected) || null;
    // Reactively update isAuthenticated when auth state changes
    this.authService.$user.subscribe(user => {
      this.isAuthenticated = user !== null;
      this.isAuthLoading = false;
    });
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
    setTimeout(() => { this.cameraResetValue = null; }, 100);
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault();
  }
}
