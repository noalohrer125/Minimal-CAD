import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Input, SimpleChanges } from '@angular/core';
import * as THREE from 'three';

@Component({
  selector: 'app-viewcube',
  template: `<canvas #canvas></canvas>`,
  styles: [`canvas { }`]
})
export class ViewcubeComponent implements AfterViewInit {
  @Input() rotation!: THREE.Euler;

  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;

  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
  private renderer!: THREE.WebGLRenderer;
  private cube!: THREE.Mesh;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['rotation'] && this.cube) {
      this.cube.rotation.copy(this.rotation);
      this.renderer.render(this.scene, this.camera);
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

    this.animate();
  }

  animate() {
    requestAnimationFrame(() => this.animate());
    this.renderer.render(this.scene, this.camera);
  }

  @HostListener('window:resize')
  onResize() {
    this.renderer.setSize(150, 150);
    this.camera.updateProjectionMatrix();
  }
}
