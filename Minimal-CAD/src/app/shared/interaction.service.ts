import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { Draw } from './draw.service';
import { FormObject, FreeObject } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class InteractionService {
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();
  private rightClick = false;
  private middleClick = false;

  constructor(private drawservice: Draw) { }

  setupEventListeners(
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    rootGroup: THREE.Group,
    getObjects: () => THREE.Object3D[],
    onRotationChange: (rotation: THREE.Euler) => void,
    onReload: () => void
  ): void {
    canvas.addEventListener('click', (event: MouseEvent) => {
      this.onClick(event, canvas, camera, getObjects(), onReload);
    });

    canvas.addEventListener('mousedown', (event: MouseEvent) => {
      if (event.button === 2) {
        event.preventDefault();
        this.rightClick = true;
      }
      if (event.button === 1) {
        this.middleClick = true;
      }
    });

    canvas.addEventListener('mouseup', (event: MouseEvent) => {
      if (event.button === 2) {
        this.rightClick = false;
      }
      if (event.button === 1) {
        this.middleClick = false;
      }
    });

    canvas.addEventListener('wheel', (event: WheelEvent) => {
      event.preventDefault();
      this.onMouseWheel(event, rootGroup);
    });

    canvas.addEventListener('mousemove', (event: MouseEvent) => {
      if (this.rightClick) {
        this.onMouseMove(event, rootGroup, 'right', onRotationChange);
      }
      if (this.middleClick) {
        this.onMouseMove(event, rootGroup, 'middle', onRotationChange);
      }
    });
  }

  private onClick(
    event: MouseEvent,
    canvas: HTMLCanvasElement,
    camera: THREE.PerspectiveCamera,
    objects: THREE.Object3D[],
    onReload: () => void
  ): void {
    const modelData = this.drawservice.loadObjects();
    const rect = canvas.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, camera);
    const intersects = this.raycaster.intersectObjects(objects);

    if (intersects.length > 0) {
      const selected = intersects[0].object;
      const originalData = selected.userData as FormObject | FreeObject;
      const selectedObject = modelData.find(obj => obj.selected && !obj.ghost);

      if (selectedObject && selectedObject.id === originalData.id) {
        return;
      }

      this.drawservice.removeGhostObjects();
      modelData.forEach(obj => obj.selected = false);
      const targetObject = modelData.find(obj => obj.id === originalData.id && !obj.ghost);
      if (targetObject) {
        targetObject.selected = true;
      }
      localStorage.setItem('model-data', JSON.stringify(modelData));
    } else {
      this.drawservice.removeGhostObjects();
      this.drawservice.deselectAllObjects();
    }

    onReload();
    this.drawservice.reload$.next();
  }

  private onMouseMove(
    event: MouseEvent,
    rootGroup: THREE.Group,
    button: string,
    onRotationChange: (rotation: THREE.Euler) => void
  ): void {
    const view = this.drawservice.getView();
    if (button === 'right') {
      rootGroup.rotateOnWorldAxis(new THREE.Vector3(0, 1, 0), event.movementX * 0.01);
      rootGroup.rotation.x += event.movementY * 0.01;
      onRotationChange(rootGroup.rotation.clone());
      view.rootGroup.rotation.x = rootGroup.rotation.x;
      view.rootGroup.rotation.y = rootGroup.rotation.y;
      view.rootGroup.rotation.z = rootGroup.rotation.z;
    } else if (button === 'middle') {
      rootGroup.position.y -= event.movementY * 0.01;
      rootGroup.position.x += event.movementX * 0.01;
      view.rootGroup.position.x = rootGroup.position.x;
      view.rootGroup.position.y = rootGroup.position.y;
      view.rootGroup.position.z = rootGroup.position.z;
    }
    this.drawservice.setView(view);
  }

  private onMouseWheel(event: WheelEvent, rootGroup: THREE.Group): void {
    const zoomFactor = 1.1;
    const view = this.drawservice.getView();
    if (event.deltaY < 0) {
      rootGroup.scale.multiplyScalar(zoomFactor);
    } else if (event.deltaY > 0) {
      rootGroup.scale.multiplyScalar(1 / zoomFactor);
    }
    this.drawservice.setView(view);
  }
}
