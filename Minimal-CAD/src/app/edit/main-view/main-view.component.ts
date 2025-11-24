import { Component, ElementRef, AfterViewInit, ViewChild, HostListener, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Draw } from '../../shared/draw.service';
import { ThreeSceneService } from '../../shared/three-scene.service';
import { ModelRenderService } from '../../shared/model-render.service';
import { InteractionService } from '../../shared/interaction.service';
import { AnimationService } from '../../shared/animation.service';
import * as THREE from 'three';

@Component({
  selector: 'app-main-view',
  standalone: true,
  imports: [CommonModule],
  template: `<canvas #canvas></canvas>`,
  styleUrl: './main-view.component.css'
})
export class MainViewComponent implements OnInit, AfterViewInit, OnDestroy {
  @Output() rotationChange = new EventEmitter<THREE.Euler>();
  @ViewChild('canvas', { static: true }) canvasRef!: ElementRef;
  @Input() projectId: string = '';
  
  private _cameraReset: any;
  @Input() set cameraReset(val: {
    position: { x: number, y: number, z: number },
    rotation: { x: number, y: number, z: number },
    scale: { x: number, y: number, z: number },
    rootGroupPosition?: { x: number, y: number, z: number }
  }) {
    this._cameraReset = val;
    if (val) {
      this.sceneService.setCameraPosition(val.position.x, val.position.y, val.position.z);
      this.sceneService.setCameraRotation(val.rotation.x, val.rotation.y, val.rotation.z);
      this.animationService.setTargetScale(new THREE.Vector3(val.scale.x, val.scale.y, val.scale.z));
      
      if (val.rootGroupPosition) {
        this.animationService.setTargetPosition(new THREE.Vector3(val.rootGroupPosition.x, val.rootGroupPosition.y, val.rootGroupPosition.z));
      }
      
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

  public isLoading: boolean = false;

  constructor(
    private drawservice: Draw,
    private sceneService: ThreeSceneService,
    private modelRenderService: ModelRenderService,
    private interactionService: InteractionService,
    private animationService: AnimationService
  ) { }

  public setRotation(rot: THREE.Euler) {
    this.animationService.setTargetRotation(rot);
  }

  ngOnInit(): void {
    this.isLoading = true;
    this.drawservice.loadObjectsByProjectId(this.projectId);
    this.isLoading = false;

    this.drawservice.reload$.subscribe(() => {
      this.onReload();
    });
  }

  init() {
    this.sceneService.initScene(this.canvasRef.nativeElement);
    
    const view = this.drawservice.getView();
    this.sceneService.setCameraPosition(view.camera.position.x, view.camera.position.y, view.camera.position.z);
    this.sceneService.setCameraRotation(view.camera.rotation.x, view.camera.rotation.y, view.camera.rotation.z);
    this.sceneService.setRootGroupPosition(view.rootGroup.position.x, view.rootGroup.position.y, view.rootGroup.position.z);
    this.sceneService.setRootGroupRotation(view.rootGroup.rotation.x, view.rootGroup.rotation.y, view.rootGroup.rotation.z);
  }

  loadModels() {
    const modelData = this.drawservice.loadObjects();
    const rootGroup = this.sceneService.getRootGroup();

    modelData.forEach(el => {
      if (el.type === 'Freeform') {
        this.modelRenderService.renderFreeFormObject(el, rootGroup, el.selected, el.ghost || false);
      } else {
        this.modelRenderService.renderFormObject(el, rootGroup, el.selected, el.ghost || false);
      }
    });
  }



  async ngAfterViewInit(): Promise<void> {
    try {
      await this.isLoading === false;
      this.init();
      this.loadModels();
      
      const onReloadCallback = () => {
        this.clearScene();
        this.loadModels();
      };
      
      this.interactionService.setupEventListeners(
        this.canvasRef.nativeElement,
        this.sceneService.getCamera(),
        this.sceneService.getRootGroup(),
        () => this.modelRenderService.getObjects(),
        (rotation: THREE.Euler) => this.rotationChange.emit(rotation),
        onReloadCallback
      );
      
      this.animationService.startAnimation(
        this.sceneService.getRenderer(),
        this.sceneService.getScene(),
        this.sceneService.getCamera(),
        this.sceneService.getRootGroup(),
        (rotation: THREE.Euler) => this.rotationChange.emit(rotation)
      );
    } catch (error) {
      console.error('Error initializing view:', error);
      alert('Fehler beim Initialisieren der Ansicht. Bitte laden Sie die Seite neu.');
    }
  }

  clearScene() {
    this.sceneService.clearScene();
    this.modelRenderService.clearObjects();
  }

  onReload() {
    if (this.isLoading) return;
    this.clearScene();
    this.loadModels();
  }

  @HostListener('window:resize')
  onResize() {
    this.sceneService.onResize();
  }

  ngOnDestroy() {
    this.animationService.stopAnimation();
    localStorage.removeItem('model-data');
  }
}
