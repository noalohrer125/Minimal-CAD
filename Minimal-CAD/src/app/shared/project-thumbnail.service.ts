import { Injectable } from '@angular/core';
import * as THREE from 'three';
import { FormObject, FreeObject, FreeObjectCommand } from '../interfaces';

@Injectable({
  providedIn: 'root'
})
export class ProjectThumbnailService {
  private readonly thumbnailWidth = 600;
  private readonly thumbnailHeight = 240;
  private readonly topRightFrontRotation = new THREE.Euler(-Math.PI / 3, 0, -Math.PI / 4, 'XYZ');

  createProjectThumbnail(modelData: (FormObject | FreeObject)[]): string {
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa8a8a8);

    const camera = new THREE.PerspectiveCamera(
      75,
      this.thumbnailWidth / this.thumbnailHeight,
      0.1,
      5000
    );

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false,
      preserveDrawingBuffer: true
    });

    renderer.setSize(this.thumbnailWidth, this.thumbnailHeight, false);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.8);
    directionalLight.position.set(10, 12, 8);
    const fillLight = new THREE.PointLight(0xffffff, 30);
    fillLight.position.set(-8, -8, 6);
    scene.add(ambientLight, directionalLight, fillLight);

    const rootGroup = new THREE.Group();
  rootGroup.rotation.copy(this.topRightFrontRotation);
    scene.add(rootGroup);

    const grid = new THREE.GridHelper(12, 12, 0xb9cee4, 0xf5f8fa);
    grid.rotation.x = Math.PI / 2;
    rootGroup.add(grid);

    const meshes: THREE.Object3D[] = [];
    for (const element of modelData) {
      if (element.type === 'Freeform') {
        const created = this.createFreeformMesh(element);
        if (created) {
          rootGroup.add(created);
          meshes.push(created);
        }
      } else {
        const created = this.createFormMesh(element);
        if (created) {
          rootGroup.add(created);
          meshes.push(created);
        }
      }
    }

    if (meshes.length > 0) {
      const bbox = new THREE.Box3();
      meshes.forEach(mesh => bbox.expandByObject(mesh));
      const sphere = new THREE.Sphere();
      bbox.getBoundingSphere(sphere);

      const fovRadians = THREE.MathUtils.degToRad(camera.fov);
      const distance = Math.max(8, (sphere.radius / Math.sin(fovRadians / 2)) * 1.2);

      camera.position.set(sphere.center.x, sphere.center.y, sphere.center.z + distance);
      camera.lookAt(sphere.center);
      camera.near = Math.max(0.1, distance / 500);
      camera.far = Math.max(1000, distance * 20);
      camera.updateProjectionMatrix();
    } else {
      camera.position.set(0, 0, 12);
      camera.lookAt(0, 0, 0);
    }

    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/jpeg', 0.78);
    renderer.dispose();

    rootGroup.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.geometry) {
        mesh.geometry.dispose();
      }
      const material = mesh.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(material)) {
        material.forEach(m => m.dispose());
      } else if (material) {
        material.dispose();
      }
    });

    return dataUrl;
  }

  private createFormMesh(element: FormObject): THREE.Object3D | null {
    if (element.type === 'Square') {
      const geometry = new THREE.BoxGeometry(element.l, element.w, element.h);
      const material = new THREE.MeshPhysicalMaterial({ color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        element.position[0],
        element.position[1],
        (element.position[2] || 0) + element.h / 2
      );
      mesh.rotation.set(
        (element.rotation?.[0] || 0) * Math.PI / 180,
        (element.rotation?.[1] || 0) * Math.PI / 180,
        (element.rotation?.[2] || 0) * Math.PI / 180
      );
      return mesh;
    }

    if (element.type === 'Circle') {
      const geometry = new THREE.CylinderGeometry(
        element.r,
        element.r,
        element.h,
        element.curveSegments && element.curveSegments > 2 && element.curveSegments <= 10000 ? element.curveSegments : 100
      );
      const material = new THREE.MeshPhysicalMaterial({ color: 0x8cb9d4, roughness: 0.5, metalness: 0.5, flatShading: true });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(
        element.position[0],
        element.position[1],
        (element.position[2] || 0) + element.h / 2
      );
      mesh.rotation.set(
        ((element.rotation?.[0] || 0) - 90) * Math.PI / 180,
        (element.rotation?.[1] || 0) * Math.PI / 180,
        (element.rotation?.[2] || 0) * Math.PI / 180
      );
      return mesh;
    }

    return null;
  }

  private createFreeformMesh(element: FreeObject): THREE.Object3D | null {
    const shape = this.shapeFromCommands(element.commands);
    if (!shape) {
      return null;
    }

    const geometry = new THREE.ExtrudeGeometry(shape, {
      curveSegments: 100,
      depth: element.h,
      bevelEnabled: false
    });
    const material = new THREE.MeshPhysicalMaterial({
      color: 0x8cb9d4,
      roughness: 0.5,
      metalness: 0.5,
      flatShading: true,
      side: THREE.DoubleSide
    });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...element.position);
    mesh.rotation.set(
      element.rotation[0] * Math.PI / 180,
      element.rotation[1] * Math.PI / 180,
      element.rotation[2] * Math.PI / 180
    );

    return mesh;
  }

  private shapeFromCommands(commands: FreeObjectCommand[]): THREE.Shape | null {
    if (!commands?.length) {
      return null;
    }

    const shape = new THREE.Shape();
    let lastX = 0;
    let lastY = 0;

    for (const cmd of commands) {
      if (cmd.type === 'moveTo') {
        shape.moveTo(cmd.x, cmd.y);
        lastX = cmd.x;
        lastY = cmd.y;
      }

      if (cmd.type === 'lineTo') {
        shape.lineTo(cmd.x, cmd.y);
        lastX = cmd.x;
        lastY = cmd.y;
      }

      if (cmd.type === 'quadraticCurveTo') {
        const p0 = new THREE.Vector2(lastX, lastY);
        const p1 = new THREE.Vector2(cmd.cpX, cmd.cpY);
        const p2 = new THREE.Vector2(cmd.x, cmd.y);

        const controlPoint = new THREE.Vector2(
          2 * p1.x - 0.5 * (p0.x + p2.x),
          2 * p1.y - 0.5 * (p0.y + p2.y)
        );

        shape.quadraticCurveTo(controlPoint.x, controlPoint.y, p2.x, p2.y);
        lastX = cmd.x;
        lastY = cmd.y;
      }
    }

    shape.autoClose = true;
    return shape;
  }
}
