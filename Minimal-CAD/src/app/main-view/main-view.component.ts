import { Component, ElementRef, AfterViewInit, ViewChild, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Draw } from '../draw.service';
import { FormObject, LineObject } from '../interfaces';
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

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });

  private controls!: OrbitControls;

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private objects: THREE.Object3D[] = [];

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.camera.position.z = 10;
    this.scene.background = new THREE.Color(0xd9d9d9);

    const size = 10;
    const divisions = 10;
    const gridColor = 0xf5f8fa;
    const gridCenterLineColor = 0xb9cee4;
    const gridHelper = new THREE.GridHelper(
      size,
      divisions,
      gridCenterLineColor,
      gridColor
    );
    gridHelper.position.set(0, 0, 0);
    gridHelper.rotation.x = Math.PI / 2;
    this.scene.add(gridHelper);

    this.camera.position.set(0, 0, 10);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 1;
  }

  loadModels() {
    const data = this.drawservice.loadObjects();
    const selectedObject = JSON.parse(
      localStorage.getItem('selectedObject') || '{}'
    ) as FormObject | LineObject;

    const objectColor = 0x8cb9d4;
    const selectedObjectColor = 0x7ec8e3;
    const edgeColor = 0x253238;
    const selectedEdgeColor = 0xffb347;

    const renderFormObject = (element: FormObject, isSelected: boolean) => {
      if (element.type === 'Square') {
        const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
        const material = new THREE.MeshBasicMaterial({ color: isSelected ? selectedObjectColor : objectColor });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          element.position[0],
          element.position[1],
          (element.position[2] || 0) + element.h / 2
        );
        mesh.userData = element;
        this.scene.add(mesh);
        this.objects.push(mesh);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor })
        );
        line.position.copy(mesh.position);
        this.scene.add(line);
      } else if (element.type === 'Circle') {
        const geometry = new THREE.CylinderGeometry(
          element.r,
          element.r,
          element.h,
          64
        );
        const material = new THREE.MeshBasicMaterial({ color: isSelected ? selectedObjectColor : objectColor });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          element.position[0],
          element.position[1],
          (element.position[2] || 0) + element.h / 2
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.userData = element;
        this.scene.add(mesh);
        this.objects.push(mesh);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        this.scene.add(line);
      }
    };
    const renderLineObject = (element: LineObject, isSelected: boolean) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(element.start[0], element.start[1], element.start[2]),
      new THREE.Vector3(element.end[0], element.end[1], element.end[2])
      ]);
      const material = new THREE.LineBasicMaterial({ color: isSelected ? selectedObjectColor : objectColor });
      const line = new THREE.Line(geometry, material);
      line.userData = element;
      this.scene.add(line);
      this.objects.push(line);

      // Edgelines are just the line itself, but for consistency:
      const edgeMaterial = new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor });
      const edgeLine = new THREE.Line(geometry, edgeMaterial);
      edgeLine.position.copy(line.position);
      this.scene.add(edgeLine);
    };

    data.forEach(el => {
      const isSelected = selectedObject && selectedObject.id === el.id;
      if (el.type === 'Line') {
        renderLineObject(el, isSelected);
      } else {
        renderFormObject(el, isSelected);
      }
    });

    // Freeform
    // else if (element.type === 'Freeform') {
      // Comming soon: Freeform objects will be implemented later
    // }
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  ngAfterViewInit(): void {
    this.init();
    this.loadModels();
    this.animate();
    this.canvasRef.nativeElement.addEventListener(
      'click',
      this.onClick.bind(this)
    );
  }

onClick(event: MouseEvent) {
  const rect = this.canvasRef.nativeElement.getBoundingClientRect();
  this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

  this.raycaster.setFromCamera(this.mouse, this.camera);
  const intersects = this.raycaster.intersectObjects(this.objects);
  if (intersects.length > 0) {
    const selected = intersects[0].object;
    const originalData = selected.userData as FormObject | LineObject;
    const selectedObject = JSON.parse(localStorage.getItem('selectedObject') || '{}') as FormObject | LineObject;
    if (selectedObject && selectedObject.id === originalData.id) {
      return;
    }
    localStorage.setItem('selectedObject', JSON.stringify(originalData));
  } else {
    localStorage.removeItem('selectedObject');
  }
  this.clearScene();
  this.loadModels();
  location.reload();
}

clearScene() {
  // Remove all objects from the scene except gridHelper
  this.objects.forEach(obj => this.scene.remove(obj));
  this.objects = [];
  // Optionally remove edge lines if you store them
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
