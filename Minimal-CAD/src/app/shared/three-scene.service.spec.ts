import { TestBed } from '@angular/core/testing';
import { ThreeSceneService } from './three-scene.service';

// Mock minimal parts of three to avoid WebGL / image dependencies
jest.mock('three', () => {
    class MockObject3D {
        position = { set: jest.fn() } as any;
        rotation = { set: jest.fn() } as any;
        scale = { set: jest.fn() } as any;
        children: any[] = [];
        castShadow = false as any;
        receiveShadow = false as any;
        constructor() { }
    }

    class Scene extends MockObject3D {
        override children: any[] = [];
        add(obj: any) { this.children.push(obj); }
    }

    class PerspectiveCamera extends MockObject3D {
        aspect = 1;
        up = { set: jest.fn() } as any;
        lookAt = jest.fn();
        updateProjectionMatrix = jest.fn();
        constructor(public fov?: number, public aspectArg?: number) { super(); }
    }

    class WebGLRenderer {
        public shadowMap: any = { enabled: false, type: null };
        setSize = jest.fn();
        constructor(public opts?: any) { }
    }

    class Group extends MockObject3D {
        override children: any[] = [];
        add(obj: any) { this.children.push(obj); }
        remove(obj: any) { this.children = this.children.filter(c => c !== obj); }
    }

    class GridHelper extends MockObject3D {
        constructor() { super(); }
    }

    class TextureLoader {
        load(url: string, onLoad?: any, onProgress?: any, onError?: any) {
            // simulate failure to avoid manipulating canvas in tests
            if (onError) onError(new Error('load failed'));
        }
    }

    class Texture { needsUpdate = false; constructor(public image?: any) { } }
    class Color { constructor(public val?: number) { } }
    class AmbientLight { constructor(public color?: any, public intensity?: any) { } }
    class DirectionalLight { position = { set: jest.fn() }; castShadow = false; shadow = { mapSize: { width: 0, height: 0 } }; constructor(public c?: any, public i?: any) { } }
    class PointLight { position = { set: jest.fn() }; constructor(public c?: any, public i?: any) { } }

    return {
        Scene,
        PerspectiveCamera,
        WebGLRenderer,
        Group,
        GridHelper,
        TextureLoader,
        Texture,
        Color,
        AmbientLight,
        DirectionalLight,
        PointLight,
        PCFSoftShadowMap: 'PCFSoftShadowMap',
    };
});

describe('ThreeSceneService', () => {
    let service: ThreeSceneService;

    beforeEach(() => {
        jest.resetAllMocks();
        TestBed.configureTestingModule({ providers: [ThreeSceneService] });
        service = TestBed.inject(ThreeSceneService);
    });

    describe('Scene Initialization', () => {
        it('TC-3D-001: should create a Scene instance', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const scene = service.getScene();
            expect(scene).toBeTruthy();
        });

        it('TC-3D-002: should configure the renderer (shadowMap + size)', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const renderer: any = service.getRenderer();
            expect(renderer).toBeTruthy();
            expect(renderer.setSize).toHaveBeenCalled();
            expect(renderer.shadowMap.enabled).toBe(true);
            expect(renderer.shadowMap.type).toBe('PCFSoftShadowMap');
        });

        it('TC-3D-003: should create and configure the camera', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const camera: any = service.getCamera();
            expect(camera).toBeTruthy();
            expect(camera.up.set).toHaveBeenCalledWith(0, 1, 0);
            expect(camera.lookAt).toHaveBeenCalledWith(0, 0, 0);
        });

        it('TC-3D-004: should add rootGroup to the scene', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const scene: any = service.getScene();
            const root: any = service.getRootGroup();
            expect(scene.children).toContain(root);
        });
    });

    describe('Scene Elements', () => {
        it('TC-3D-005: should add grid helper to root group', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const root = service.getRootGroup();
            expect(root.children.length).toBeGreaterThan(0);
        });

        it('TC-3D-006: should add lights to scene', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const scene = service.getScene() as any;
            expect(scene.children.length).toBeGreaterThanOrEqual(3);
        });
    });

    describe('Getters', () => {
        it('TC-3D-008..011: should return scene/camera/renderer/root and allow setting transforms', () => {
            (global as any).innerWidth = 1024;
            (global as any).innerHeight = 768;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const camera = service.getCamera() as any;
            const root = service.getRootGroup() as any;

            service.setCameraPosition(1, 2, 3);
            expect(camera.position.set).toHaveBeenCalledWith(1, 2, 3);

            service.setCameraRotation(0.1, 0.2, 0.3);
            expect(camera.rotation.set).toHaveBeenCalledWith(0.1, 0.2, 0.3);

            service.setRootGroupPosition(4, 5, 6);
            expect(root.position.set).toHaveBeenCalledWith(4, 5, 6);
        });
    });

    describe('Resize', () => {
        it('TC-3D-012: should update camera aspect and renderer size on resize', () => {
            (global as any).innerWidth = 1024;
            (global as any).innerHeight = 768;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const camera = service.getCamera() as any;
            const renderer: any = service.getRenderer();

            (global as any).innerWidth = 640;
            (global as any).innerHeight = 480;
            service.onResize();
            expect(camera.updateProjectionMatrix).toHaveBeenCalled();
            expect(renderer.setSize).toHaveBeenCalledWith(640, 480);
        });
    });

    describe('Clear', () => {
        it('TC-3D-013: should clear non-grid objects from root group', () => {
            (global as any).innerWidth = 800;
            (global as any).innerHeight = 600;
            const canvas = document.createElement('canvas');
            service.initScene(canvas);
            const root = service.getRootGroup() as any;
            const fake = { name: 'obj' } as any;
            root.children.push(fake);
            expect(root.children.some((c: any) => c.name === 'obj')).toBe(true);
            service.clearScene();
            expect(root.children.some((c: any) => c.name === 'obj')).toBe(false);
        });
    });
});
