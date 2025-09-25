import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draw } from '../draw.service';
import { FormObject, FreeObject, FreeObjectCommand } from '../interfaces';
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

  // Smooth rotation animation
  private targetRotation: THREE.Euler | null = null;
  private rotationLerpAlpha = 0.1; // Adjust for speed (0.1-0.2 is smooth)
  private isRotating = false;

  public setRotation(rot: THREE.Euler) {
    this.targetRotation = rot.clone();
    this.isRotating = true;
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
    loader.load('/bg-gray.png', (texture) => {
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
    const modelData = this.drawservice.loadObjects();
    const selectedObject = modelData.find(obj => obj.selected);

    const objectColor = { color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true };
    const selectedObjectColor = { color: 0x7ec8e3, roughness: 0.5, metalness: 0.1, flatShading: true };
    const ghostObjectColor = { color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true, transparent: true, opacity: 0.5 };
    const edgeColor = 0x253238;
    const selectedEdgeColor = 0xffb347;
    const ghostEdgeColor = 0x888888;

    const renderFormObject = (element: FormObject, isSelected: boolean, isGhost: boolean = false) => {
      if (element.type === 'Square') {
        const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
        let material: THREE.MeshPhysicalMaterial;
        if (isGhost) {
          material = new THREE.MeshPhysicalMaterial(ghostObjectColor);
        } else if (isSelected) {
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
        // Convert degrees to radians for rotation
        mesh.rotation.x = element.rotation ? element.rotation[0] * Math.PI / 180 : 0;
        mesh.rotation.y = element.rotation ? element.rotation[1] * Math.PI / 180 : 0;
        mesh.rotation.z = element.rotation ? element.rotation[2] * Math.PI / 180 : 0;
        mesh.userData = element;
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = true;
        this.rootGroup.add(mesh);
        if (!isGhost) {
          this.objects.push(mesh);
        }

        const edges = new THREE.EdgesGeometry(geometry);
        const edgeColorToUse = isGhost ? ghostEdgeColor : (isSelected ? selectedEdgeColor : edgeColor);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: edgeColorToUse })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        this.rootGroup.add(line);
      } else if (element.type === 'Circle') {
        const geometry = new THREE.CylinderGeometry(
          element.r,
          element.r,
          element.h,
          element.curveSegments! <= 10000 && element.curveSegments! > 2 ? element.curveSegments : 10000,
        );
        let material: THREE.MeshPhysicalMaterial;
        if (isGhost) {
          material = new THREE.MeshPhysicalMaterial(ghostObjectColor);
        } else if (isSelected) {
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
        // Convert degrees to radians for rotation, and subtract 90deg for x as before
        mesh.rotation.x = element.rotation ? (element.rotation[0] - 90) * Math.PI / 180 : Math.PI / 2;
        mesh.rotation.y = element.rotation ? element.rotation[1] * Math.PI / 180 : 0;
        mesh.rotation.z = element.rotation ? element.rotation[2] * Math.PI / 180 : 0;
        mesh.userData = element;
        mesh.castShadow = !isGhost;
        mesh.receiveShadow = true;
        this.rootGroup.add(mesh);
        if (!isGhost) {
          this.objects.push(mesh);
        }

        const edges = new THREE.EdgesGeometry(geometry);
        const edgeColorToUse = isGhost ? ghostEdgeColor : (isSelected ? selectedEdgeColor : edgeColor);
        const line = new THREE.LineSegments(
          edges,
          new THREE.LineBasicMaterial({ color: edgeColorToUse })
        );
        line.position.copy(mesh.position);
        line.rotation.copy(mesh.rotation);
        this.rootGroup.add(line);
      }
    };
    const renderFreeFormObject = (element: FreeObject, isSelected: boolean, isGhost: boolean = false) => {
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

      const extrudeSettings = {
        curveSegments: 10000,
        depth: element.h, // Use element.h as height, default to 1 if not set
        bevelEnabled: false
      };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      let material: THREE.MeshPhysicalMaterial;
      if (isGhost) {
        material = new THREE.MeshPhysicalMaterial({
          ...ghostObjectColor,
          side: THREE.DoubleSide
        });
      } else {
        material = new THREE.MeshPhysicalMaterial({
          ...(isSelected ? selectedObjectColor : objectColor),
          side: THREE.DoubleSide
        });
      }
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(...element.position);
      mesh.rotation.x = element.rotation[0] * Math.PI / 180;
      mesh.rotation.y = element.rotation[1] * Math.PI / 180;
      mesh.rotation.z = element.rotation[2] * Math.PI / 180;
      mesh.userData = element;
      mesh.castShadow = !isGhost;
      mesh.receiveShadow = true;
      this.rootGroup.add(mesh);

      const edgeColorToUse = isGhost ? ghostEdgeColor : (isSelected ? selectedEdgeColor : edgeColor);
      const edgeLineMaterial = new THREE.LineBasicMaterial({ color: edgeColorToUse });
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
        edgeLine.rotation.x = element.rotation[0] * Math.PI / 180;
        edgeLine.rotation.y = element.rotation[1] * Math.PI / 180;
        edgeLine.rotation.z = element.rotation[2] * Math.PI / 180;
        this.rootGroup.add(edgeLine);
      }
    };

    modelData.forEach(el => {
      el.type === 'Freeform' ? renderFreeFormObject(el, el.selected, el.ghost || false) : renderFormObject(el, el.selected, el.ghost || false);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    // Smooth rotation animation
    if (this.isRotating && this.targetRotation) {
      // Slerp each axis separately (Euler angles)
      const current = this.rootGroup.rotation;
      const target = this.targetRotation;
      // Lerp each axis
      current.x += (target.x - current.x) * this.rotationLerpAlpha;
      current.y += (target.y - current.y) * this.rotationLerpAlpha;
      current.z += (target.z - current.z) * this.rotationLerpAlpha;

      // If close enough, snap to target and stop animating
      if (
        Math.abs(current.x - target.x) < 0.001 &&
        Math.abs(current.y - target.y) < 0.001 &&
        Math.abs(current.z - target.z) < 0.001
      ) {
        this.rootGroup.rotation.copy(target);
        this.isRotating = false;
        this.targetRotation = null;
      }
      this.rotationChange.emit(this.rootGroup.rotation.clone());
    }

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
    const modelData = this.drawservice.loadObjects();
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.objects);
    
    if (intersects.length > 0) {
      const selected = intersects[0].object;
      const originalData = selected.userData as FormObject | FreeObject;
      const selectedObject = modelData.find(obj => obj.selected && !obj.ghost);
      
      if (selectedObject && selectedObject.id === originalData.id) {
        return; // Same object already selected
      }
      
      // Clean up any existing ghost objects
      this.drawservice.removeGhostObjects();
      
      // Deselect all objects and select the clicked one
      modelData.forEach(obj => obj.selected = false);
      const targetObject = modelData.find(obj => obj.id === originalData.id && !obj.ghost);
      if (targetObject) {
        targetObject.selected = true;
      }
      localStorage.setItem('model-data', JSON.stringify(modelData));
    } else {
      // Clicked on empty space - deselect all and clean up ghosts
      this.drawservice.removeGhostObjects();
      modelData.forEach(obj => obj.selected = false);
      localStorage.setItem('model-data', JSON.stringify(modelData));
    }
    
    this.clearScene();
    this.loadModels();
    location.reload();
  }

  clearScene() {
    // Remove all objects from the rootGroup, not just from this.objects array
    const objectsToRemove = [...this.rootGroup.children];
    objectsToRemove.forEach(child => {
      if (child !== this.rootGroup.children.find(c => (c as any).isGridHelper)) {
        this.rootGroup.remove(child);
      }
    });
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
