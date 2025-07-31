import { Component, ElementRef, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas></canvas>`,
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent implements AfterViewInit {
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  // scene, camera, and renderer setup
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.z = 5;
    this.scene.background = new THREE.Color(0xd9d9d9);

    // add buildplate with custom number of lines
    const size = 10; // size of the grid
    const divisions = 10; // number of lines (divisions)
    const gridHelper = new THREE.GridHelper(size, divisions);
    // Position grid at origin and rotate so it's flat in XY plane
    gridHelper.position.set(0, 0, 0);
    gridHelper.rotation.x = Math.PI / 2;
    this.scene.add(gridHelper);

    // Position camera to look straight down at the grid from above
    this.camera.position.set(0, 0, 10); // 10 units above the grid
    this.camera.up.set(0, 1, 0); // Y axis is up
    this.camera.lookAt(0, 0, 0);

    // Add orbit controls
    const controls = new OrbitControls(this.camera, this.renderer.domElement);
    // Damping for smoother controls
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit(): void {
    this.init();
    this.animate();
  }

  @HostListener('window:resize')
  onResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }
}
