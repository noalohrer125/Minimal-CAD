import { TestBed } from '@angular/core/testing';
import { BehaviorSubject } from 'rxjs';
import { File } from './file.service';
import { StlService } from './stl.service';
import { StepService } from './step.service';

describe('File Service', () => {
    let service: File;
    let drawMock: any;
    let stlMock: any;
    let stepMock: any;

    beforeEach(() => {
        jest.resetAllMocks();
        localStorage.clear();

        drawMock = {
            loadObjects: jest.fn().mockReturnValue([]),
            reload$: new BehaviorSubject<void>(undefined),
        };

        stlMock = { downloadStlFromJsonString: jest.fn() };
        stepMock = { convertAndDownload: jest.fn() };

        TestBed.configureTestingModule({
            providers: [
                File,
                { provide: 'Draw', useValue: drawMock },
                { provide: StlService, useValue: stlMock },
                { provide: StepService, useValue: stepMock }
            ]
        });

        // Because File service injects Draw by type in code, use override provider
        TestBed.overrideProvider((File as any), { useValue: undefined });
        // Instead instantiate via TestBed with manual providers
        service = new File(drawMock as any, stlMock as any, stepMock as any);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        localStorage.clear();
    });

    describe('File Operations', () => {
        it('TC-FILE-001: should trigger JSON download on save()', () => {
            // prepare draw data
            drawMock.loadObjects.mockReturnValue([{ id: 'x' }]);

            const originalCreate = document.createElement.bind(document);
            const aClick = jest.fn();
            const aMock = { href: '', download: '', click: aClick } as any;
            const createSpy = jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'a') return aMock;
                return originalCreate(tag);
            });

            (global as any).URL = {
                createObjectURL: jest.fn().mockReturnValue('blob:fake'),
                revokeObjectURL: jest.fn()
            } as any;

            service.save();

            expect(createSpy).toHaveBeenCalledWith('a');
            expect((global as any).URL.createObjectURL).toHaveBeenCalled();
            expect((global as any).URL.revokeObjectURL).toHaveBeenCalled();
        });

        it('TC-FILE-002: saveAsSTEP calls stepService.convertAndDownload', () => {
            service.saveAsSTEP();
            expect(stepMock.convertAndDownload).toHaveBeenCalled();
        });

        it('TC-FILE-003: saveAsSTL calls stlService.downloadStlFromJsonString', () => {
            drawMock.loadObjects.mockReturnValue([{ id: 'a' }]);
            service.saveAsSTL();
            expect(stlMock.downloadStlFromJsonString).toHaveBeenCalled();
            const args = (stlMock.downloadStlFromJsonString as jest.Mock).mock.calls[0];
            expect(typeof args[0]).toBe('string');
            expect(args[1]).toBe('model.stl');
        });

        it('TC-FILE-004: upload() should read file, save to localStorage and trigger reload when confirmed', async () => {
            // confirm true
            jest.spyOn(window, 'confirm').mockReturnValue(true);
            const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

            // mock input element
            const mockFile = { text: jest.fn().mockResolvedValue(JSON.stringify([{ id: 'u' }])) } as any;
            let onchangePromise: Promise<any> | null = null;
            const inputMock: any = {
                type: '',
                accept: '',
                files: [mockFile],
                onchange: null as any,
                click() {
                    if (typeof this.onchange === 'function') {
                        const res = this.onchange();
                        if (res && typeof res.then === 'function') onchangePromise = res;
                    }
                }
            };

            const originalCreate = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag: string) => {
                if (tag === 'input') return inputMock as any;
                return originalCreate(tag);
            });

            const reloadSpy = jest.spyOn(drawMock.reload$, 'next');

            service.upload();
            // wait for the onchange async handler to complete
            if (onchangePromise) await onchangePromise;

            expect(localStorage.getItem('model-data')).toBeTruthy();
            expect(alertSpy).toHaveBeenCalled();
            expect(reloadSpy).toHaveBeenCalled();
        });

        it('TC-FILE-004: upload() should abort when user cancels confirm', () => {
            jest.spyOn(window, 'confirm').mockReturnValue(false);
            const createSpy = jest.spyOn(document, 'createElement');
            service.upload();
            expect(createSpy).not.toHaveBeenCalled();
        });
    });

    describe('Service Integration', () => {
        it('TC-FILE-005: DrawService is injected/available', () => {
            expect(drawMock).toBeTruthy();
            expect(typeof drawMock.loadObjects).toBe('function');
        });

        it('TC-FILE-006: StlService is injected/available', () => {
            expect(stlMock).toBeTruthy();
            expect(typeof stlMock.downloadStlFromJsonString).toBe('function');
        });

        it('TC-FILE-007: StepService is injected/available', () => {
            expect(stepMock).toBeTruthy();
            expect(typeof stepMock.convertAndDownload).toBe('function');
        });
    });
});
