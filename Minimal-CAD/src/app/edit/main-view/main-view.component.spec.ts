import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MainViewComponent } from './main-view.component';
import { CommonModule } from '@angular/common';
import * as THREE from 'three';
import { Draw } from '../../shared/draw.service';
import { ThreeSceneService } from '../../shared/three-scene.service';
import { ModelRenderService } from '../../shared/model-render.service';
import { InteractionService } from '../../shared/interaction.service';
import { AnimationService } from '../../shared/animation.service';

describe('MainViewComponent', () => {
    let fixture: ComponentFixture<MainViewComponent>;
    let component: MainViewComponent;

    // service mocks
    const drawMock: any = {
        loadObjectsByProjectId: jest.fn(),
        reload$: { subscribe: jest.fn((cb: any) => { /* noop */ }) },
        getView: jest.fn(),
        setView: jest.fn(),
        loadObjects: jest.fn()
    };

    const sceneMock: any = {
        initScene: jest.fn(),
        setCameraPosition: jest.fn(),
        setCameraRotation: jest.fn(),
        setRootGroupPosition: jest.fn(),
        setRootGroupRotation: jest.fn(),
        getRootGroup: jest.fn(),
        getCamera: jest.fn(),
        getRenderer: jest.fn(),
        getScene: jest.fn(),
        clearScene: jest.fn(),
        onResize: jest.fn()
    };

    const modelRenderMock: any = {
        renderFormObject: jest.fn(),
        renderFreeFormObject: jest.fn(),
        clearObjects: jest.fn(),
        getObjects: jest.fn(() => [])
    };

    const interactionMock: any = {
        setupEventListeners: jest.fn()
    };

    const animationMock: any = {
        startAnimation: jest.fn(),
        stopAnimation: jest.fn(),
        setTargetScale: jest.fn(),
        setTargetPosition: jest.fn(),
        setTargetRotation: jest.fn()
    };

    beforeEach(async () => {
        jest.resetAllMocks();

        await TestBed.configureTestingModule({
            imports: [MainViewComponent, CommonModule],
            providers: [
                { provide: Draw, useValue: drawMock },
                { provide: ThreeSceneService, useValue: sceneMock },
                { provide: ModelRenderService, useValue: modelRenderMock },
                { provide: InteractionService, useValue: interactionMock },
                { provide: AnimationService, useValue: animationMock }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(MainViewComponent);
        component = fixture.componentInstance;

        // ensure canvas element exists for ViewChild
        fixture.detectChanges();
    });

    describe('Component Lifecycle', () => {
        it('TC-MAIN-001: should create component', () => {
            expect(component).toBeTruthy();
        });

        it('TC-MAIN-002: ngOnInit should run and call drawservice.loadObjectsByProjectId', () => {
            component.projectId = 'proj-123';
            component.ngOnInit();
            expect(drawMock.loadObjectsByProjectId).toHaveBeenCalledWith('proj-123');
            expect(component.isLoading).toBe(false);
        });

        it('TC-MAIN-003: ngAfterViewInit should initialize scene and load models without throwing', async () => {
            const fakeView = {
                camera: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
                rootGroup: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
            };
            drawMock.getView.mockReturnValue(fakeView);
            drawMock.loadObjects.mockReturnValue([]);
            sceneMock.getCamera.mockReturnValue({});
            sceneMock.getRootGroup.mockReturnValue({});
            sceneMock.getRenderer.mockReturnValue({});
            sceneMock.getScene.mockReturnValue({});

            interactionMock.setupEventListeners.mockImplementation(() => {});
            animationMock.startAnimation.mockImplementation(() => {});

            await expect(component.ngAfterViewInit()).resolves.not.toThrow();
            expect(sceneMock.initScene).toHaveBeenCalled();
            expect(animationMock.startAnimation).toHaveBeenCalled();
        });

        it('TC-MAIN-004: ngOnDestroy should stop animation and clear localStorage', () => {
            localStorage.setItem('model-data', 'xyz');
            component.ngOnDestroy();
            expect(animationMock.stopAnimation).toHaveBeenCalled();
            expect(localStorage.getItem('model-data')).toBeNull();
        });
    });

    describe('Scene Management', () => {
        it('TC-MAIN-005: init should call sceneService.initScene with the canvas and set camera/root positions', () => {
            const fakeView = {
                camera: { position: { x: 1, y: 2, z: 3 }, rotation: { x: 0, y: 0, z: 0 } },
                rootGroup: { position: { x: 4, y: 5, z: 6 }, rotation: { x: 0, y: 0, z: 0 } }
            };
            drawMock.getView.mockReturnValue(fakeView);
            component.canvasRef = fixture.nativeElement.querySelector('canvas') as any;
            component.init();
            expect(sceneMock.initScene).toHaveBeenCalledWith(component.canvasRef.nativeElement);
            expect(sceneMock.setCameraPosition).toHaveBeenCalledWith(1, 2, 3);
            expect(sceneMock.setRootGroupPosition).toHaveBeenCalledWith(4, 5, 6);
        });

        it('TC-MAIN-006: loadModels should call drawservice.loadObjects and render each model', () => {
            const rootGroup = { add: jest.fn() };
            sceneMock.getRootGroup.mockReturnValue(rootGroup);
            const models = [
                { id: 'a', type: 'Square', selected: false, ghost: false },
                { id: 'b', type: 'Freeform', selected: true, ghost: true }
            ];
            drawMock.loadObjects.mockReturnValue(models);
            component.loadModels();
            expect(modelRenderMock.renderFormObject).toHaveBeenCalledWith(models[0], rootGroup, false, false);
            expect(modelRenderMock.renderFreeFormObject).toHaveBeenCalledWith(models[1], rootGroup, true, true);
        });

        it('TC-MAIN-007: clearScene should call sceneService.clearScene and modelRenderService.clearObjects', () => {
            component.clearScene();
            expect(sceneMock.clearScene).toHaveBeenCalled();
            expect(modelRenderMock.clearObjects).toHaveBeenCalled();
        });

        it('TC-MAIN-008: onReload should call clearScene and loadModels when not loading', () => {
            component.isLoading = false;
            // ensure loadModels has safe model data to iterate
            drawMock.loadObjects.mockReturnValue([]);
            const clearSpy = jest.spyOn(MainViewComponent.prototype, 'clearScene');
            const loadSpy = jest.spyOn(MainViewComponent.prototype, 'loadModels');
            component.onReload();
            expect(clearSpy).toHaveBeenCalled();
            expect(loadSpy).toHaveBeenCalled();
            clearSpy.mockRestore();
            loadSpy.mockRestore();
        });

        it('TC-MAIN-008 (loading): onReload should not do anything when isLoading is true', () => {
            component.isLoading = true;
            // guard: even if loadObjects would return undefined, onReload should not call loadModels
            drawMock.loadObjects.mockReturnValue([]);
            const clearSpy = jest.spyOn(MainViewComponent.prototype, 'clearScene');
            const loadSpy = jest.spyOn(MainViewComponent.prototype, 'loadModels');
            component.onReload();
            expect(clearSpy).not.toHaveBeenCalled();
            expect(loadSpy).not.toHaveBeenCalled();
            clearSpy.mockRestore();
            loadSpy.mockRestore();
        });
    });

    describe('Input/Output', () => {
        it('TC-MAIN-009: should emit rotationChange when interaction or animation triggers rotation', async () => {
            const fakeView = {
                camera: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } },
                rootGroup: { position: { x: 0, y: 0, z: 0 }, rotation: { x: 0, y: 0, z: 0 } }
            };
            drawMock.getView.mockReturnValue(fakeView);
            drawMock.loadObjects.mockReturnValue([]);
            sceneMock.getCamera.mockReturnValue({});
            sceneMock.getRootGroup.mockReturnValue({});
            sceneMock.getRenderer.mockReturnValue({});
            sceneMock.getScene.mockReturnValue({});

            // make setupEventListeners call the rotation callback
            interactionMock.setupEventListeners.mockImplementation((canvas: any, camera: any, rootGroup: any, getObjects: any, rotCb: any) => {
                rotCb(new THREE.Euler(1, 2, 3));
            });

            // capture animation callback
            let animCb: any = null;
            animationMock.startAnimation.mockImplementation((renderer: any, scene: any, camera: any, rootGroup: any, cb: any) => {
                animCb = cb;
            });

            const rotSpy = jest.fn();
            component.rotationChange.subscribe(rotSpy);
            await component.ngAfterViewInit();
            expect(rotSpy).toHaveBeenCalled();
            // trigger animation callback
            if (animCb) animCb(new THREE.Euler(4, 5, 6));
            expect(rotSpy).toHaveBeenCalled();
        });

        it('TC-MAIN-010: cameraReset input should set camera, rotation and scale and call drawservice.setView', () => {
            const view = { camera: { position: {}, rotation: {} }, rootGroup: { scale: {}, position: {} } };
            drawMock.getView.mockReturnValue(view);
            const reset = {
                position: { x: 1, y: 2, z: 3 },
                rotation: { x: 0.1, y: 0.2, z: 0.3 },
                scale: { x: 1, y: 1, z: 1 },
                rootGroupPosition: { x: 7, y: 8, z: 9 }
            };
            component.cameraReset = reset as any;
            expect(sceneMock.setCameraPosition).toHaveBeenCalledWith(1, 2, 3);
            expect(sceneMock.setCameraRotation).toHaveBeenCalledWith(0.1, 0.2, 0.3);
            expect(animationMock.setTargetScale).toHaveBeenCalled();
            expect(animationMock.setTargetPosition).toHaveBeenCalled();
            expect(drawMock.setView).toHaveBeenCalled();
        });

        it('TC-MAIN-011: projectId input should be used in ngOnInit to load objects by project id', () => {
            component.projectId = 'project-xyz';
            component.ngOnInit();
            expect(drawMock.loadObjectsByProjectId).toHaveBeenCalledWith('project-xyz');
        });
    });

    describe('Window Events', () => {
        it('TC-MAIN-012: onResize should call sceneService.onResize', () => {
            component.onResize();
            expect(sceneMock.onResize).toHaveBeenCalled();
        });
    });
});
