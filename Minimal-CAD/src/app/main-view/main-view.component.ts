import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draw } from '../draw.service';
import { FormObject, FreeObject, LineObject } from '../interfaces';
import * as THREE from 'three';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas></canvas>`,
  styleUrl: './main-view.component.css'
})
export class MainViewComponent implements AfterViewInit {
  @Output() rotationChange = new EventEmitter<THREE.Euler>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  constructor(private drawservice: Draw) { }

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  private renderer = new THREE.WebGLRenderer({ antialias: true });
  private rootGroup = new THREE.Group();
  private objects: THREE.Object3D[] = [];

  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private rightClick = false;
  private middleClick = false;

  public setRotation(rot: THREE.Euler) {
    this.rootGroup.rotation.copy(rot);
    this.rotationChange.emit(this.rootGroup.rotation.clone());
  }

  init() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvasRef.nativeElement,
      antialias: true,
    });
    const withOffset = window.innerWidth * 0.1;
    const heightOffset = Math.max(window.innerHeight * 0.08, 80);
    this.renderer.setSize(window.innerWidth - withOffset, window.innerHeight - heightOffset);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const loader = new THREE.TextureLoader();
    loader.load('/bg-image.jpg', (texture) => {
      this.scene.background = texture;
    });

    const size = 10;
    const divisions = 10;
    const gridColor = 0xf5f8fa;
    const gridCenterLineColor = 0xb9cee4;
    const gridHelper = new THREE.GridHelper(size, divisions, gridCenterLineColor, gridColor);

    gridHelper.position.set(0, 0, 0);
    gridHelper.rotation.x = Math.PI / 2;
    (gridHelper as any).castShadow = true;
    (gridHelper as any).receiveShadow = true;
    this.rootGroup.add(gridHelper);

    const view = this.drawservice.getView();
    this.camera.position.set(view.camera.position.x, view.camera.position.y, view.camera.position.z);
    this.camera.rotation.set(view.camera.rotation.x, view.camera.rotation.y, view.camera.rotation.z);
    this.rootGroup.position.set(view.rootGroup.position.x, view.rootGroup.position.y, view.rootGroup.position.z);
    this.rootGroup.rotation.set(view.rootGroup.rotation.x, view.rootGroup.rotation.y, view.rootGroup.rotation.z);
    this.rootGroup.scale.set(view.rootGroup.scale.x, view.rootGroup.scale.y, view.rootGroup.scale.z);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 5);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;

    const fillLight = new THREE.PointLight(0xffffff, 100);
    fillLight.position.set(-10, -10, 5);

    this.scene.add(ambientLight);
    this.scene.add(directionalLight);
    this.scene.add(fillLight);

    this.scene.add(this.rootGroup);
  }

  loadModels() {
    const data = this.drawservice.loadObjects();
    const selectedObject = JSON.parse(
      localStorage.getItem('selectedObject') || '{}'
    ) as FormObject | LineObject;

    const objectColor = { color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true };
    const selectedObjectColor = { color: 0x7ec8e3, roughness: 0.5, metalness: 0.1, flatShading: true };
    const edgeColor = 0x253238;
    const selectedEdgeColor = 0xffb347;

    const renderFormObject = (element: FormObject, isSelected: boolean) => {
      if (element.type === 'Square') {
        const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
        let material: THREE.MeshStandardMaterial;
        if (isSelected) {
          material = new THREE.MeshStandardMaterial(selectedObjectColor);
        } else {
          material = new THREE.MeshStandardMaterial(objectColor);
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          element.position[0],
          element.position[1],
          (element.position[2] || 0) + element.h / 2
        );
        mesh.userData = element;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.rootGroup.add(mesh);
        this.objects.push(mesh);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor })
        );
        line.position.copy(mesh.position);
        this.rootGroup.add(line);
      } else if (element.type === 'Circle') {
        const geometry = new THREE.CylinderGeometry(
          element.r,
          element.r,
          element.h,
          64
        );
        let material: THREE.MeshStandardMaterial;
        if (isSelected) {
          material = new THREE.MeshStandardMaterial(selectedObjectColor);
        } else {
          material = new THREE.MeshStandardMaterial(objectColor);
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(
          element.position[0],
          element.position[1],
          (element.position[2] || 0) + element.h / 2
        );
        mesh.rotation.x = Math.PI / 2;
        mesh.userData = element;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        this.rootGroup.add(mesh);
        this.objects.push(mesh);

        const edges = new THREE.EdgesGeometry(geometry);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        this.rootGroup.add(line);
      }
    };
    const renderLineObject = (element: LineObject, isSelected: boolean) => {
      const geometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(element.start[0], element.start[1], element.start[2]),
        new THREE.Vector3(element.end[0], element.end[1], element.end[2])
      ]);
      const material = new THREE.LineBasicMaterial({ color: isSelected ? selectedObjectColor.color : edgeColor });
      const line = new THREE.Line(geometry, material);
      line.userData = element;
      this.rootGroup.add(line);
      this.objects.push(line);

      // Edgelines are just the line itself, but for consistency:
      const edgeMaterial = new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor });
      const edgeLine = new THREE.Line(geometry, edgeMaterial);
      edgeLine.position.copy(line.position);
      this.rootGroup.add(edgeLine);
    };
    const renderFreeFormObject = (element: FreeObject, isSelected: boolean) => {
      const shape = new THREE.Shape();

      element.commands.forEach(cmd => {
        switch (cmd.type) {
          case 'moveTo':
            shape.moveTo(cmd.x, cmd.y);
            break;
          case 'lineTo':
            shape.lineTo(cmd.x, cmd.y);
            break;
          case 'quadraticCurveTo':
            shape.quadraticCurveTo(cmd.cpX, cmd.cpY, cmd.x, cmd.y);
            break;
          case 'bezierCurveTo':
            shape.bezierCurveTo(cmd.cp1X, cmd.cp1Y, cmd.cp2X, cmd.cp2Y, cmd.x, cmd.y);
            break;
        }
      });

      // Optional: aus Shape ein Mesh bauen
      const geometry = new THREE.ShapeGeometry(shape);
      const material = new THREE.MeshStandardMaterial({
        color: isSelected ? selectedObjectColor.color : objectColor.color,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);

      // Position/Rotation setzen
      mesh.position.set(...element.position);
      if (element.rotation) {
        mesh.rotation.set(...element.rotation);
      }

      this.rootGroup.add(mesh);
    };

    data.forEach(el => {
      const isSelected = selectedObject && (selectedObject.id === el.id);
      if (el.type === 'Line') {
        renderLineObject(el, isSelected);
      } else if (el.type === 'Square') {
        renderFormObject(el, isSelected);
      } else if (el.type === 'Circle') {
        renderFormObject(el, isSelected);
      } else if (el.type === 'Freeform') {
        renderFreeFormObject(el, isSelected);
      }
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
    this.canvasRef.nativeElement.addEventListener(
      'click',
      this.onClick.bind(this)
    );
    this.canvasRef.nativeElement.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 2) { event.preventDefault(); this.rightClick = true; }
      if (event.button === 1) { this.middleClick = true; }
    });
    this.canvasRef.nativeElement.addEventListener('mouseup', (event: MouseEvent) => {
      if (event.button === 2) { this.rightClick = false; }
      if (event.button === 1) { this.middleClick = false; }
    });
    this.canvasRef.nativeElement.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      this.onMouseWheel(event);
    });
    this.canvasRef.nativeElement.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.rightClick) { this.onMouseMove(event, 'right'); }
      if (this.middleClick) { this.onMouseMove(event, 'middle'); }
    });
  }

  onMouseMove(event: MouseEvent, button: string) {
    const view = this.drawservice.getView();
    if (button === 'right') {
      this.rootGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), event.movementX * 0.01);
      this.rootGroup.rotation.x += event.movementY * 0.01;
      this.rotationChange.emit(this.rootGroup.rotation.clone());
      view.rootGroup.rotation.x = this.rootGroup.rotation.x;
      view.rootGroup.rotation.y = this.rootGroup.rotation.y;
      view.rootGroup.rotation.z = this.rootGroup.rotation.z;
    } else if (button === 'middle') {
      this.rootGroup.position.y -= event.movementY * 0.01;
      this.rootGroup.position.x += event.movementX * 0.01;
      view.rootGroup.position.x = this.rootGroup.position.x;
      view.rootGroup.position.y = this.rootGroup.position.y;
      view.rootGroup.position.z = this.rootGroup.position.z;
    }
    this.drawservice.setView(view);
  }

  onMouseWheel(event: WheelEvent) {
    const zoomFactor = 1.1;
    const view = this.drawservice.getView();
    if (event.deltaY < 0) {
      // Zoom in
      this.rootGroup.scale.multiplyScalar(zoomFactor);
    } else if (event.deltaY > 0) {
      // Zoom out
      this.rootGroup.scale.multiplyScalar(1 / zoomFactor);
    }
    view.rootGroup.scale = this.rootGroup.scale;
    this.drawservice.setView(view);
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
    this.objects.forEach(obj => this.scene.remove(obj));
    this.objects = [];
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
