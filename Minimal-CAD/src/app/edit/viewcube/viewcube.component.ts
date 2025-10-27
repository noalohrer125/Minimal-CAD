import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Input, Output, EventEmitter, SimpleChanges } from '@angular/core';
import * as THREE from 'three';
import { Draw } from '../../draw.service';

@Component({
  selector: 'app-viewcube',
  template: `<canvas #canvas></canvas>`,
  styles: [`canvas { cursor: pointer; }`]
})
export class ViewcubeComponent implements AfterViewInit {
  @Input() rotation!: THREE.Euler;
  @Output() rotationChange = new EventEmitter<THREE.Euler>();

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  @Output() cameraReset = new EventEmitter<{ position: { x: number, y: number, z: number }, rotation: { x: number, y: number, z: number }, scale: { x: number, y: number, z: number }, rootGroupPosition: { x: number, y: number, z: number } }>();

  constructor(private drawservice: Draw) { }

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  private renderer!: THREE.WebGLRenderer;
  private size = Math.min(window.innerWidth, window.innerHeight) * 0.15;
  private cube!: THREE.Mesh;
  private cornerBoxes: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2();

  private targetQuat = new THREE.Quaternion();
  private animating = false;

  private materials: any = [
    new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.5, metalness: 1 }), // right
    new THREE.MeshStandardMaterial({ color: 0xff5555, roughness: 0.5, metalness: 1 }), // left
    new THREE.MeshStandardMaterial({ color: 0x55ff55, roughness: 0.5, metalness: 1 }), // front
    new THREE.MeshStandardMaterial({ color: 0x55ff55, roughness: 0.5, metalness: 1 }), // back
    new THREE.MeshStandardMaterial({ color: 0x5555ff, roughness: 0.5, metalness: 1 }), // top
    new THREE.MeshStandardMaterial({ color: 0x5555ff, roughness: 0.5, metalness: 1 })  // bottom
  ];
  private cornerBoxMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.5, metalness: 2 });

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rotation'] && this.cube && !this.animating) {
      this.cube.rotation.copy(this.rotation);
    }
  }

  ngAfterViewInit() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvasRef.nativeElement, alpha: true, antialias: true });
    this.renderer.setSize(this.size, this.size);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.camera.position.set(0, 0, 3);
    this.camera.lookAt(0, 0, 0);

    const geometry = new THREE.BoxGeometry(0.9, 0.9, 0.9);

    this.cube = new THREE.Mesh(geometry, this.materials);
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;
    this.scene.add(this.cube);

    const light = new THREE.DirectionalLight(0xffffff, 10);
    light.position.set(5, 5, 2);
    light.castShadow = true;

    const light2 = new THREE.DirectionalLight(0xffffff, 1);
    light2.position.set(-5, -5, -2);
    light2.castShadow = true;

    this.scene.add(light, light2);

    this.addAxesArrows();
    this.addCornerSpheres();

    this.camera.up.set(0, 1, 0);
    const view = this.drawservice.getView();
    this.cube.rotation.x = view.rootGroup.rotation.x;
    this.cube.rotation.y = view.rootGroup.rotation.y;
    this.cube.rotation.z = view.rootGroup.rotation.z;

    this.canvasRef.nativeElement.addEventListener('click', (event: MouseEvent) => this.onClick(event));
    this.animate();
  }

  private addCornerSpheres() {
    const boxGeom = new THREE.BoxGeometry(0.2, 0.2, 0.2);
    const offsets = [
      [+0.351, +0.351, +0.351],
      [+0.351, +0.351, -0.351],
      [+0.351, -0.351, +0.351],
      [+0.351, -0.351, -0.351],
      [-0.351, +0.351, +0.351],
      [-0.351, +0.351, -0.351],
      [-0.351, -0.351, +0.351],
      [-0.351, -0.351, -0.351],
    ];
    offsets.forEach((pos, index) => {
      const box = new THREE.Mesh(boxGeom, this.cornerBoxMaterial);
      box.position.set(pos[0], pos[1], pos[2]);
      box.userData['cornerIndex'] = index;
      box.castShadow = true;
      box.receiveShadow = true;
      this.cube.add(box);
      this.cornerBoxes.push(box);
    });
  }

  private addAxesArrows() {
    const length = 1.5; // Pfeillänge
    const headLength = 0.2;
    const headWidth = 0.2;
    const arrowX = new THREE.ArrowHelper(
      new THREE.Vector3(1, 0, 0), // Richtung X
      new THREE.Vector3(-0.6, -0.6, -0.6), // Ursprung
      length,
      0xff0000, // Rot
      headLength,
      headWidth
    );
    const arrowY = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(-0.6, -0.6, -0.6),
      length,
      0x00ff00, // Grün
      headLength,
      headWidth
    );
    const arrowZ = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1),
      new THREE.Vector3(-0.6, -0.6, -0.6),
      length,
      0x0000ff, // Blau
      headLength,
      headWidth
    );

    // Prevent arrows from interfering with raycasting
    (arrowX as any).raycast = () => { };
    (arrowY as any).raycast = () => { };
    (arrowZ as any).raycast = () => { };

    // An den Cube hängen, damit sie sich mitdrehen
    this.cube.add(arrowX, arrowY, arrowZ);
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
    const intersects = this.raycaster.intersectObjects([this.cube], true);

    if (intersects.length > 0) {
      // Find the first intersected object that is a corner box
      const boxIntersect = intersects.find(i => this.cornerBoxes.includes(i.object as THREE.Mesh));
      if (boxIntersect) {
        const clickedObj = boxIntersect.object as THREE.Mesh;
        const index = clickedObj.userData['cornerIndex'];
        const newRot = this.getIsometricRotation(index);
        this.targetQuat.setFromEuler(newRot);
        this.animating = true;
        this.rotationChange.emit(newRot);
        // Emit camera reset event
        this.cameraReset.emit({
          position: { x: 0, y: 0, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          rootGroupPosition: { x: 0, y: 0, z: 0 }
        });
        return;
      }

      // Otherwise, check if the cube itself was clicked
      const cubeIntersect = intersects.find(i => i.object === this.cube);
      if (cubeIntersect) {
        const faceIndex = Math.floor(cubeIntersect.faceIndex! / 2);
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
        // Emit camera reset event
        this.cameraReset.emit({
          position: { x: 0, y: 0, z: 10 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
          rootGroupPosition: { x: 0, y: 0, z: 0 }
        });
      }
    }
  }

  private getIsometricRotation(index: number): THREE.Euler {
    const angle = Math.PI / 4;       // 45°
    const tilt60 = Math.PI / 3;      // 60°
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
  }

  @HostListener('window:resize')
  onResize() {
    this.renderer.setSize(this.size, this.size);
    this.camera.updateProjectionMatrix();
  }
}
