import { Component, ElementRef, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Draw } from '../draw.service';
import { FormObject } from '../interfaces';
import * as THREE from 'three';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas></canvas>`,
  styleUrls: ['./main-view.component.css']
})
export class MainViewComponent implements AfterViewInit {
  constructor(private drawservice: Draw) { }

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  // scene, camera, and renderer setup
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  init() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.z = 10;
    this.scene.background = new THREE.Color(0xd9d9d9);
    // add buildplate with custom number of lines and color
    const size = 10; // size of the grid
    const divisions = 10; // number of lines (divisions)
    const gridColor = 0xf5f8fa;
    const gridCenterLineColor = 0xb9cee4;
    const gridHelper = new THREE.GridHelper(size, divisions, gridCenterLineColor, gridColor);
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
    controls.dampingFactor = 1;
  }

  loadModels() {
    const data = this.drawservice.loadObjects();
    const objectColor = 0x8cb9d4; // Color for the objects
    const edgeColor = 0x253238;
    data.forEach((element: FormObject) => {
      // Square
      if (element.type === 'Square') {
        const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
        const material = new THREE.MeshBasicMaterial({ color: objectColor });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(element.position[0], element.position[1], ((element.position[2] || 0) + element.h / 2));
        this.scene.add(mesh);
        // Add edge lines (only outer edges)
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
        line.position.copy(mesh.position);
        this.scene.add(line);
      }
      // Circle
      else if (element.type === 'Circle') {
        const geometry = new THREE.CylinderGeometry(element.r, element.r, element.h, 64);
        const material = new THREE.MeshBasicMaterial({ color: objectColor });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(element.position[0], element.position[1], (element.position[2] || 0 + element.h / 2));
        mesh.rotation.x = Math.PI / 2;
        this.scene.add(mesh);
        // Add edge lines (only outer edges)
        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: edgeColor }));
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        this.scene.add(line);
      }
      // Freeform
      // else if (element.type === 'Freeform') {
        // Comming soon: Freeform objects will be implemented later
      // }
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit(): void {
    this.init();
    this.loadModels();
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
