import { Injectable } from '@angular/core';
import * as THREE from 'three';

@Injectable({
  providedIn: 'root'
})
export class AnimationService {
  private animationFrameId: number | null = null;
  private targetRotation: THREE.Euler | null = null;
  private targetScale: THREE.Vector3 | null = null;
  private targetPosition: THREE.Vector3 | null = null;
  private isRotating = false;
  private isScaling = false;
  private isPositioning = false;
  private readonly rotationSpeed = 0.1;
  private readonly scaleSpeed = 0.1;
  private readonly positionSpeed = 0.1;

  startAnimation(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    rootGroup: THREE.Group,
    onRotationChange: (rotation: THREE.Euler) => void
  ): void {
    const animate = () => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Smooth rotation animation
      if (this.isRotating && this.targetRotation) {
        const current = rootGroup.rotation;
        const target = this.targetRotation;
        current.x += (target.x - current.x) * this.rotationSpeed;
        current.y += (target.y - current.y) * this.rotationSpeed;
        current.z += (target.z - current.z) * this.rotationSpeed;

        if (
          Math.abs(current.x - target.x) < 0.001 &&
          Math.abs(current.y - target.y) < 0.001 &&
          Math.abs(current.z - target.z) < 0.001
        ) {
          rootGroup.rotation.copy(target);
          this.isRotating = false;
          this.targetRotation = null;
        }
        onRotationChange(rootGroup.rotation.clone());
      }

      // Smooth zoom/scale animation
      if (this.isScaling && this.targetScale) {
        const current = rootGroup.scale;
        const target = this.targetScale;
        current.x += (target.x - current.x) * this.scaleSpeed;
        current.y += (target.y - current.y) * this.scaleSpeed;
        current.z += (target.z - current.z) * this.scaleSpeed;

        if (
          Math.abs(current.x - target.x) < 0.001 &&
          Math.abs(current.y - target.y) < 0.001 &&
          Math.abs(current.z - target.z) < 0.001
        ) {
          rootGroup.scale.copy(target);
          this.isScaling = false;
          this.targetScale = null;
        }
      }

      // Smooth position animation
      if (this.isPositioning && this.targetPosition) {
        const current = rootGroup.position;
        const target = this.targetPosition;
        current.x += (target.x - current.x) * this.positionSpeed;
        current.y += (target.y - current.y) * this.positionSpeed;
        current.z += (target.z - current.z) * this.positionSpeed;

        if (
          Math.abs(current.x - target.x) < 0.001 &&
          Math.abs(current.y - target.y) < 0.001 &&
          Math.abs(current.z - target.z) < 0.001
        ) {
          rootGroup.position.copy(target);
          this.isPositioning = false;
          this.targetPosition = null;
        }
      }

      renderer.render(scene, camera);
    };

    animate();
  }

  stopAnimation(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  setTargetRotation(rotation: THREE.Euler): void {
    this.targetRotation = rotation.clone();
    this.isRotating = true;
  }

  setTargetScale(scale: THREE.Vector3): void {
    this.targetScale = scale.clone();
    this.isScaling = true;
  }

  setTargetPosition(position: THREE.Vector3): void {
    this.targetPosition = position.clone();
    this.isPositioning = true;
  }
}
