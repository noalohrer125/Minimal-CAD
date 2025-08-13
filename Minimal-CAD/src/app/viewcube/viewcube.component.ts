import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-viewcube',
  template: `<canvas #canvas></canvas>`,
  styles: [`canvas { cursor: pointer; }`]
})
export class ViewcubeComponent implements AfterViewInit {
  @Input() rotation!: THREE.Euler;
  @Output() rotationChange = new EventEmitter<THREE.Euler>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  private renderer!: THREE.WebGLRenderer;
  private cube!: THREE.Mesh;
  private cornerSpheres: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private targetQuat = new THREE.Quaternion();
  private animating = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rotation'] && this.cube && !this.animating) {
      this.cube.rotation.copy(this.rotation);
    }
  }

  ngAfterViewInit() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, alpha: true, antialias: true });
    this.renderer.setSize(150, 150);
    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const materials = [
      new THREE.MeshBasicMaterial({ color: 0xff0000 }), // right
      new THREE.MeshBasicMaterial({ color: 0x00ff00 }), // left
      new THREE.MeshBasicMaterial({ color: 0x0000ff }), // top
      new THREE.MeshBasicMaterial({ color: 0xffff00 }), // bottom
      new THREE.MeshBasicMaterial({ color: 0xff00ff }), // front
      new THREE.MeshBasicMaterial({ color: 0x00ffff })  // back
    ];

    this.cube = new THREE.Mesh(geometry, materials);
    this.scene.add(this.cube);

    this.addCornerSpheres(); // Spheres an Cube hängen

    this.canvasRef.nativeElement.addEventListener('click', (event: MouseEvent) => this.onClick(event));

    this.animate();
  }

  private addCornerSpheres() {
    const sphereGeom = new THREE.SphereGeometry(0.1, 16, 16);
    const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });

    const offsets = [
      [+0.5, +0.5, +0.5],
      [+0.5, +0.5, -0.5],
      [+0.5, -0.5, +0.5],
      [+0.5, -0.5, -0.5],
      [-0.5, +0.5, +0.5],
      [-0.5, +0.5, -0.5],
      [-0.5, -0.5, +0.5],
      [-0.5, -0.5, -0.5],
    ];

    offsets.forEach((pos, index) => {
      const sphere = new THREE.Mesh(sphereGeom, sphereMat.clone());
      sphere.position.set(pos[0], pos[1], pos[2]);
      sphere.userData['cornerIndex'] = index;
      this.cube.add(sphere); // 🔹 Sphere an den Cube hängen
      this.cornerSpheres.push(sphere);
    });
  }

  animate() {
    requestAnimationFrame(() => this.animate());

    if (this.animating) {
      this.cube.quaternion.slerp(this.targetQuat, 0.1);
      if (this.cube.quaternion.angleTo(this.targetQuat) < 0.001) {
        this.cube.quaternion.copy(this.targetQuat);
        this.animating = false;
      }
    }

    this.renderer.render(this.scene, this.camera);
  }

  private onClick(event: MouseEvent) {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects([this.cube, ...this.cornerSpheres], true);

    if (intersects.length > 0) {
      const clickedObj = intersects[0].object as THREE.Mesh;

      // Sphere-Klick → isometrische Ansicht
      if (this.cornerSpheres.includes(clickedObj)) {
        const index = clickedObj.userData['cornerIndex'];
        const newRot = this.getIsometricRotation(index);
        this.targetQuat.setFromEuler(newRot);
        this.animating = true;
        this.rotationChange.emit(newRot);
        return;
      }

      // Würfelfläche → Standardansicht
      if (clickedObj === this.cube) {
        const faceIndex = Math.floor(intersects[0].faceIndex! / 2);
        const newRot = new THREE.Euler();

        switch (faceIndex) {
          case 0: newRot.set(-Math.PI / 2, 0, -Math.PI / 2); break; // right
          case 1: newRot.set(-Math.PI / 2, 0, Math.PI / 2); break;  // left
          case 2: newRot.set(Math.PI / 2, Math.PI, 0); break;       // back
          case 3: newRot.set(-Math.PI / 2, 0, 0); break;            // front
          case 4: newRot.set(0, 0, 0); break;                       // top
          case 5: newRot.set(0, Math.PI, Math.PI); break;           // bottom
        }

        this.targetQuat.setFromEuler(newRot);
        this.animating = true;
        this.rotationChange.emit(newRot);
      }
    }
  }

  private getIsometricRotation(index: number): THREE.Euler {
    const angle = Math.PI / 4; // 45°
    const tilt60 = Math.PI / 3; // 60°
    const tilt135 = Math.PI * 3 / 4; // 135°

    switch (index) {
      case 0: console.log('1'); return new THREE.Euler(-tilt60, 0, -tilt135, 'XYZ');  // t,l,b
      case 1: console.log('2'); return new THREE.Euler(-tilt135, 0, -tilt135, 'XYZ'); // b,l,b
      case 2: console.log('3'); return new THREE.Euler(-tilt60, 0, -angle, 'XYZ');    // t,r,f
      case 3: console.log('4'); return new THREE.Euler(-tilt135, 0, -angle, 'XYZ');   // b,r,f
      case 4: console.log('5'); return new THREE.Euler(-tilt60, 0, +tilt135, 'XYZ');  // t,r,b
      case 5: console.log('6'); return new THREE.Euler(-tilt135, 0, +tilt135, 'XYZ'); // b,r,b
      case 6: console.log('7'); return new THREE.Euler(-tilt60, 0, +angle, 'XYZ');    // t,l,f
      case 7: console.log('8'); return new THREE.Euler(-tilt135, 0, +angle, 'XYZ');   // b,l,f
      default: return new THREE.Euler();
    }

    //       (-Math.PI / 2, 0, -Math.PI / 2) // right
    //       (-Math.PI / 2, 0, Math.PI / 2)  // left
    //       (Math.PI / 2, Math.PI, 0)       // back
    //       (-Math.PI / 2, 0, 0)            // front
    //       (0, 0, 0)                       // top
    //       (0, Math.PI, Math.PI)           // bottom
  }

  @HostListener('window:resize')
  onResize() {
    this.renderer.setSize(150, 150);
    this.camera.updateProjectionMatrix();
  }
}
