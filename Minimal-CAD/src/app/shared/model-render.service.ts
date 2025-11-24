import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { FormObject, FreeObject, FreeObjectCommand } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ModelRenderService {
  private readonly objectColor = { color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true };
  private readonly selectedObjectColor = { color: 0x7ec8e3, roughness: 0.5, metalness: 0.1, flatShading: true };
  private readonly ghostObjectColor = { color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true, transparent: true, opacity: 0.5 };
  private readonly edgeColor = 0x253238;
  private readonly selectedEdgeColor = 0xffb347;
  private readonly ghostEdgeColor = 0x888888;

  private objects: THREE.Object3D[] = [];

  renderFormObject(element: FormObject, rootGroup: THREE.Group, isSelected: boolean, isGhost: boolean = false): void {
    if (element.type === 'Square') {
      this.renderSquare(element, rootGroup, isSelected, isGhost);
    } else if (element.type === 'Circle') {
      this.renderCircle(element, rootGroup, isSelected, isGhost);
    }
  }

  renderFreeFormObject(element: FreeObject, rootGroup: THREE.Group, isSelected: boolean, isGhost: boolean = false): void {
    const shape = new THREE.Shape();
    shape.autoClose = true;
    let lastX = 0, lastY = 0;

    element.commands.forEach((cmd) => {
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
          const P0 = new THREE.Vector2(lastX, lastY);
          const P1 = new THREE.Vector2(cmd.cpX, cmd.cpY);
          const P2 = new THREE.Vector2(cmd.x, cmd.y);

          const C = new THREE.Vector2(
            2 * P1.x - 0.5 * (P0.x + P2.x),
            2 * P1.y - 0.5 * (P0.y + P2.y)
          );
          shape.quadraticCurveTo(C.x, C.y, P2.x, P2.y);
          lastX = cmd.x; lastY = cmd.y;
          break;
      }
    });

    const extrudeSettings = {
      curveSegments: 10000,
      depth: element.h,
      bevelEnabled: false
    };
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const material = new THREE.MeshPhysicalMaterial({
      ...(isGhost ? this.ghostObjectColor : (isSelected ? this.selectedObjectColor : this.objectColor)),
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...element.position);
    mesh.rotation.x = element.rotation[0] * Math.PI / 180;
    mesh.rotation.y = element.rotation[1] * Math.PI / 180;
    mesh.rotation.z = element.rotation[2] * Math.PI / 180;
    mesh.userData = element;
    mesh.castShadow = !isGhost;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    if (!isGhost) {
      this.objects.push(mesh);
    }

    const edgeColorToUse = isGhost ? this.ghostEdgeColor : (isSelected ? this.selectedEdgeColor : this.edgeColor);
    const edges = new THREE.EdgesGeometry(geometry);
    const edgeLines = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: edgeColorToUse })
    );
    edgeLines.position.copy(mesh.position);
    edgeLines.rotation.copy(mesh.rotation);
    rootGroup.add(edgeLines);
  }

  private renderSquare(element: FormObject, rootGroup: THREE.Group, isSelected: boolean, isGhost: boolean): void {
    const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
    const material = new THREE.MeshPhysicalMaterial(
      isGhost ? this.ghostObjectColor : (isSelected ? this.selectedObjectColor : this.objectColor)
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      element.position[0],
      element.position[1],
      (element.position[2] || 0) + element.h / 2
    );
    mesh.rotation.x = element.rotation ? element.rotation[0] * Math.PI / 180 : 0;
    mesh.rotation.y = element.rotation ? element.rotation[1] * Math.PI / 180 : 0;
    mesh.rotation.z = element.rotation ? element.rotation[2] * Math.PI / 180 : 0;
    mesh.userData = element;
    mesh.castShadow = !isGhost;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    if (!isGhost) {
      this.objects.push(mesh);
    }

    this.addEdges(geometry, mesh, rootGroup, isSelected, isGhost);
  }

  private renderCircle(element: FormObject, rootGroup: THREE.Group, isSelected: boolean, isGhost: boolean): void {
    const geometry = new THREE.CylinderGeometry(
      element.r,
      element.r,
      element.h,
      element.curveSegments! <= 10000 && element.curveSegments! > 2 ? element.curveSegments : 10000,
    );
    const material = new THREE.MeshPhysicalMaterial(
      isGhost ? this.ghostObjectColor : (isSelected ? this.selectedObjectColor : this.objectColor)
    );
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(
      element.position[0],
      element.position[1],
      (element.position[2] || 0) + element.h / 2
    );
    mesh.rotation.x = element.rotation ? (element.rotation[0] - 90) * Math.PI / 180 : Math.PI / 2;
    mesh.rotation.y = element.rotation ? element.rotation[1] * Math.PI / 180 : 0;
    mesh.rotation.z = element.rotation ? element.rotation[2] * Math.PI / 180 : 0;
    mesh.userData = element;
    mesh.castShadow = !isGhost;
    mesh.receiveShadow = true;
    rootGroup.add(mesh);
    if (!isGhost) {
      this.objects.push(mesh);
    }

    this.addEdges(geometry, mesh, rootGroup, isSelected, isGhost);
  }

  private addEdges(geometry: THREE.BufferGeometry, mesh: THREE.Mesh, rootGroup: THREE.Group, isSelected: boolean, isGhost: boolean): void {
    const edgeColorToUse = isGhost ? this.ghostEdgeColor : (isSelected ? this.selectedEdgeColor : this.edgeColor);
    const edges = new THREE.EdgesGeometry(geometry);
    const line = new THREE.LineSegments(
      edges,
      new THREE.LineBasicMaterial({ color: edgeColorToUse })
    );
    line.position.copy(mesh.position);
    line.rotation.copy(mesh.rotation);
    rootGroup.add(line);
  }

  getObjects(): THREE.Object3D[] {
    return this.objects;
  }

  clearObjects(): void {
    this.objects = [];
  }
}
