import { TestBed } from '@angular/core/testing';
import { AnimationService } from './animation.service';

describe('AnimationService', () => {
    let service: AnimationService;

    beforeEach(() => {
        TestBed.configureTestingModule({ providers: [AnimationService] });
        service = TestBed.inject(AnimationService);
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('Animation Loop', () => {
        function createRafMocks() {
            const frames: Array<(() => void) | null> = [];
            const rafMock = jest.spyOn(global as any, 'requestAnimationFrame').mockImplementation((cb: any) => {
                frames.push(cb);
                return frames.length; // id
            });
            const cancelMock = jest.spyOn(global as any, 'cancelAnimationFrame').mockImplementation(((id: number) => {
                if (id && frames[id - 1]) frames[id - 1] = null;
            }) as any);
            return { frames, rafMock, cancelMock };
        }

        it('TC-ANIM-001: should start animation (use requestAnimationFrame)', () => {
            const renderer: any = { render: jest.fn() };
            const scene: any = {};
            const camera: any = {};
            const rootGroup: any = {
                rotation: { x: 0, y: 0, z: 0, copy: jest.fn(), clone: () => ({ x: 0, y: 0, z: 0 }) },
                scale: { x: 1, y: 1, z: 1, copy: jest.fn() },
                position: { x: 0, y: 0, z: 0, copy: jest.fn() }
            };

            const { frames, rafMock } = createRafMocks();

            service.startAnimation(renderer, scene, camera, rootGroup, jest.fn());

            expect(rafMock).toHaveBeenCalled();
            expect(frames.length).toBeGreaterThan(0);

            // simulate one frame
            const cb = frames.shift();
            if (cb) cb();

            expect(renderer.render).toHaveBeenCalled();
        });

        it('TC-ANIM-002: should stop animation (cancelAnimationFrame invoked)', () => {
            const renderer: any = { render: jest.fn() };
            const scene: any = {};
            const camera: any = {};
            const rootGroup: any = {
                rotation: { x: 0, y: 0, z: 0, copy: jest.fn(), clone: () => ({ x: 0, y: 0, z: 0 }) },
                scale: { x: 1, y: 1, z: 1, copy: jest.fn() },
                position: { x: 0, y: 0, z: 0, copy: jest.fn() }
            };

            const { rafMock, cancelMock } = createRafMocks();

            service.startAnimation(renderer, scene, camera, rootGroup, jest.fn());
            service.stopAnimation();

            expect(cancelMock).toHaveBeenCalled();
            expect(rafMock).toHaveBeenCalled();
        });

        it('TC-ANIM-003: should call renderer.render on each frame', () => {
            const renderer: any = { render: jest.fn() };
            const scene: any = {};
            const camera: any = {};
            const rootGroup: any = {
                rotation: { x: 0, y: 0, z: 0, copy: jest.fn(), clone: () => ({ x: 0, y: 0, z: 0 }) },
                scale: { x: 1, y: 1, z: 1, copy: jest.fn() },
                position: { x: 0, y: 0, z: 0, copy: jest.fn() }
            };

            const { frames } = createRafMocks();

            service.startAnimation(renderer, scene, camera, rootGroup, jest.fn());

            // simulate multiple frames
            for (let i = 0; i < Math.min(frames.length, 3); i++) {
                const cb = frames.shift();
                if (cb) cb();
            }

            expect(renderer.render.mock.calls.length).toBeGreaterThanOrEqual(1);
        });

        it('TC-ANIM-004: should use requestAnimationFrame for smooth animation', () => {
            const renderer: any = { render: jest.fn() };
            const scene: any = {};
            const camera: any = {};
            const rootGroup: any = {
                rotation: { x: 0, y: 0, z: 0, copy: jest.fn(), clone: () => ({ x: 0, y: 0, z: 0 }) },
                scale: { x: 1, y: 1, z: 1, copy: jest.fn() },
                position: { x: 0, y: 0, z: 0, copy: jest.fn() }
            };

            const { rafMock } = createRafMocks();

            service.startAnimation(renderer, scene, camera, rootGroup, jest.fn());

            expect(rafMock).toHaveBeenCalled();
        });
    });
});
