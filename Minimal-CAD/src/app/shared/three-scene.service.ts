import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class ThreeSceneService {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private rootGroup!: THREE.Group;

  initScene(canvas: HTMLCanvasElement): void {
    // Initialize renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
    });
    const withOffset = window.innerWidth * 0.1;
    const heightOffset = Math.max(window.innerHeight * 0.08, 80);
    this.renderer.setSize(window.innerWidth - withOffset, window.innerHeight - heightOffset);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Initialize scene
    this.scene = new THREE.Scene();
    this.loadBackground();

    // Initialize camera
    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);

    // Initialize root group
    this.rootGroup = new THREE.Group();
    this.scene.add(this.rootGroup);

    // Add grid
    this.addGrid();

    // Add lights
    this.addLights();
  }

  private loadBackground(): void {
    const loader = new THREE.TextureLoader();
    const textureUrl = new URL('bg-gray.png', document.baseURI).href;
    loader.load(
      textureUrl,
      (texture) => {
        try {
          // Darken the texture via an offscreen canvas
          const canvas = document.createElement('canvas');
          canvas.width = texture.image.width;
          canvas.height = texture.image.height;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            console.warn('[ThreeSceneService] 2D context unavailable; using original texture as background');
            this.scene.background = texture;
            return;
          }
          ctx.drawImage(texture.image, 0, 0);
          ctx.globalAlpha = 0.6;
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          const darkTexture = new THREE.Texture(canvas);
          darkTexture.needsUpdate = true;
          this.scene.background = darkTexture;
        } catch (e) {
          this.scene.background = texture;
        }
      },
      undefined,
      (err) => {
        this.scene.background = new THREE.Color(0x202830);
      }
    );
  }

  private addGrid(): void {
    const size = 10;
    const divisions = 10;
    const gridColor = 0xf5f8fa;
    const gridCenterLineColor = 0xb9cee4;
    const gridHelper = new THREE.GridHelper(size, divisions, gridCenterLineColor, gridColor);

    gridHelper.position.set(0, 0, 0);
    gridHelper.rotation.x = Math.PI / 2;
    gridHelper.castShadow = true;
    gridHelper.receiveShadow = true;
    (gridHelper as any).isGridHelper = true;
    this.rootGroup.add(gridHelper);
  }

  private addLights(): void {
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
  }

  setCameraPosition(x: number, y: number, z: number): void {
    this.camera.position.set(x, y, z);
  }

  setCameraRotation(x: number, y: number, z: number): void {
    this.camera.rotation.set(x, y, z);
  }

  setRootGroupPosition(x: number, y: number, z: number): void {
    this.rootGroup.position.set(x, y, z);
  }

  setRootGroupRotation(x: number, y: number, z: number): void {
    this.rootGroup.rotation.set(x, y, z);
  }

  setRootGroupScale(x: number, y: number, z: number): void {
    this.rootGroup.scale.set(x, y, z);
  }

  onResize(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  clearScene(): void {
    const objectsToRemove = [...this.rootGroup.children];
    objectsToRemove.forEach(child => {
      if (!(child as any).isGridHelper) {
        this.rootGroup.remove(child);
      }
    });
  }

  getScene(): THREE.Scene {
    return this.scene;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  getRootGroup(): THREE.Group {
    return this.rootGroup;
  }
}
