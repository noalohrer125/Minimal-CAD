import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draw } from '../draw.service';
import { FormObject, FreeObject, FreeObjectCommand, LineObject } from '../interfaces';
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
  // Add cameraReset input for viewcube
  private _cameraReset: any;
  @Input()
  set cameraReset(val: { position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }, scale: { x: number, y: number, z: number }, rootGroupPosition?: { x: number, y: number, z: number } }) {
    this._cameraReset = val;
    if (val) {
      this.camera.position.set(val.position.x, val.position.y, val.position.z);
      this.camera.rotation.set(val.rotation.x, val.rotation.y, val.rotation.z);
      this.rootGroup.scale.set(val.scale.x, val.scale.y, val.scale.z);
      if (val.rootGroupPosition) {
        this.rootGroup.position.set(val.rootGroupPosition.x, val.rootGroupPosition.y, val.rootGroupPosition.z);
      }
      // Optionally update view in drawservice if needed
      const view = this.drawservice.getView();
      view.camera.position = { ...val.position };
      view.camera.rotation = { ...val.rotation };
      view.rootGroup.scale = { ...val.scale };
      if (val.rootGroupPosition) {
        view.rootGroup.position = { ...val.rootGroupPosition };
      }
      this.drawservice.setView(view);
    }
  }

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
    loader.load('/bg.jpg', (texture) => {
      // Create a darkening material using a canvas
      const canvas = document.createElement('canvas');
      canvas.width = texture.image.width;
      canvas.height = texture.image.height;
      const ctx = canvas.getContext('2d');
      ctx!.drawImage(texture.image, 0, 0);
      ctx!.globalAlpha = 0.6; // Adjust alpha for darkness (0.5 = 50% darker)
      ctx!.fillStyle = '#000';
      ctx!.fillRect(0, 0, canvas.width, canvas.height);
      const darkTexture = new THREE.Texture(canvas);
      darkTexture.needsUpdate = true;
      this.scene.background = darkTexture;
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
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 2);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;

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
        let material: THREE.MeshPhysicalMaterial;
        if (isSelected) {
          material = new THREE.MeshPhysicalMaterial(selectedObjectColor);
        } else {
          material = new THREE.MeshPhysicalMaterial(objectColor);
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
        let material: THREE.MeshPhysicalMaterial;
        if (isSelected) {
          material = new THREE.MeshPhysicalMaterial(selectedObjectColor);
        } else {
          material = new THREE.MeshPhysicalMaterial(objectColor);
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
      let lastX = 0, lastY = 0;

      const renderCommand = (cmd: FreeObjectCommand) => {
        switch (cmd.type) {
          case 'moveTo':
            shape.moveTo(cmd.x, cmd.y);
            lastX = cmd.x; lastY = cmd.y;
            break;
          case 'lineTo':
            shape.lineTo(cmd.x, cmd.y);
            lastX = cmd.x; lastY = cmd.y;
            break;
          case 'quadraticCurveTo':
            let P0 = new THREE.Vector2(lastX, lastY);
            let P1 = new THREE.Vector2(cmd.cpX, cmd.cpY);
            let P2 = new THREE.Vector2(cmd.x, cmd.y);

            const C = new THREE.Vector2(
              2 * P1.x - 0.5 * (P0.x + P2.x),
              2 * P1.y - 0.5 * (P0.y + P2.y)
            );
            shape.quadraticCurveTo(C.x, C.y, P2.x, P2.y);
            lastX = cmd.x; lastY = cmd.y;
            break;
        }
      };

      element.commands.forEach((cmd) => renderCommand(cmd));

      const geometry = new THREE.ShapeGeometry(shape, 1000);
      const material = new THREE.MeshPhysicalMaterial({
        ...(isSelected ? selectedObjectColor : objectColor),
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...element.position);
      if (element.rotation) mesh.rotation.set(...element.rotation);
      this.rootGroup.add(mesh);

      const edgeLineMaterial = new THREE.LineBasicMaterial({ color: isSelected ? selectedEdgeColor : edgeColor });
      // Get outline points from shape
      const outlinePoints = shape.getPoints(1000);
      if (outlinePoints.length > 1) {
        const edgeLinePoints = outlinePoints.map(pt => new THREE.Vector3(pt.x, pt.y, 0));
        // Close the loop if needed
        if (!outlinePoints[0].equals(outlinePoints[outlinePoints.length - 1])) {
          edgeLinePoints.push(new THREE.Vector3(outlinePoints[0].x, outlinePoints[0].y, 0));
        }
        const edgeGeom = new THREE.BufferGeometry().setFromPoints(edgeLinePoints);
        const edgeLine = new THREE.Line(edgeGeom, edgeLineMaterial);
        edgeLine.position.set(...element.position);
        if (element.rotation) edgeLine.rotation.set(...element.rotation);
        this.rootGroup.add(edgeLine);
      }
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
