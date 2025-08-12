import { Component, HostListener } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarLeftComponent } from './sidebar-left/sidebar-left.component';
import { SidebarRightComponent } from './sidebar-right/sidebar-right.component';
import { ViewcubeComponent } from './viewcube/viewcube.component';
import { CommonModule } from '@angular/common';
import { MainViewComponent } from './main-view/main-view.component';
import { FormObject, LineObject } from './interfaces';
import { OnInit } from '@angular/core';
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
  title = 'Minimal-CAD';
  sidebarRightPosition: [number, number, number] = [0, 0, 0];
  public selectedObject: FormObject | LineObject | null = null;
  public currentRotation = new THREE.Euler();

  ngOnInit(): void {
    this.selectedObject = localStorage.getItem('selectedObject') ? JSON.parse(localStorage.getItem('selectedObject')!) : null;
  }

  onRotationChanged(rot: THREE.Euler) {
    this.currentRotation = rot;
  }

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault(); // blockiert das Browser-Kontextmenü
  }
}
