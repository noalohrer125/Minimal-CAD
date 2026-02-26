import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StepService } from './step.service';
import { StlService } from './stl.service';
import { Draw } from './draw.service';
import { BehaviorSubject } from 'rxjs';

describe('StepService', () => {
    let service: StepService;
    let httpMock: HttpTestingController;
    let stlServiceMock: jest.Mocked<StlService>;
    let drawServiceMock: jest.Mocked<Draw>;

    beforeEach(() => {
        const stlMock: jest.Mocked<StlService> = {
            downloadStlFromJsonString: jest.fn(),
            fmt: jest.fn(),
            geometryToASCIIStl: jest.fn()
        } as unknown as jest.Mocked<StlService>;

        const drawMock: jest.Mocked<Draw> = {
            loadObjects: jest.fn(),
            reload$: new BehaviorSubject<void>(undefined),
            loadObjectsByProjectId: jest.fn(),
            loadObjectsFirebase: jest.fn(),
            setView: jest.fn(),
            rectangle: jest.fn(),
            circle: jest.fn(),
            freeform: jest.fn(),
            getView: jest.fn(),
            saveObject: jest.fn(),
            saveProjectToFirebase: jest.fn(),
            createGhostObject: jest.fn(),
            removeGhostObjects: jest.fn(),
            deselectAllObjects: jest.fn(),
            generateId: jest.fn(),
            generateHash: jest.fn(),
            firebaseService: {}
        } as unknown as jest.Mocked<Draw>;

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                StepService,
                { provide: StlService, useValue: stlMock },
                { provide: Draw, useValue: drawMock }
            ]
        });

        service = TestBed.inject(StepService);
        httpMock = TestBed.inject(HttpTestingController);
        stlServiceMock = TestBed.inject(StlService) as jest.Mocked<StlService>;
        drawServiceMock = TestBed.inject(Draw) as jest.Mocked<Draw>;
    });

    afterEach(() => {
        httpMock.verify();
        jest.useRealTimers();
        jest.restoreAllMocks();
    });

    describe('API Communication', () => {
        it('TC-STEP-001: should call convertAndDownload and send request to convert API', () => {
            drawServiceMock.loadObjects.mockReturnValue([] as never[]);

            service.convertAndDownload();

            const req = httpMock.expectOne('http://localhost:5000/convert');
            expect(req.request.method).toBe('GET');
            req.flush({});
        });

        it('TC-STEP-002: should trigger STEP download after successful conversion', () => {
            jest.useFakeTimers();
            drawServiceMock.loadObjects.mockReturnValue([] as never[]);
            const downloadSpy = jest
                .spyOn(service as any, 'downloadStepFile')
                .mockImplementation(() => {});

            service.convertAndDownload();

            const req = httpMock.expectOne('http://localhost:5000/convert');
            req.flush({});

            expect(downloadSpy).not.toHaveBeenCalled();
            jest.advanceTimersByTime(1000);
            expect(downloadSpy).toHaveBeenCalledTimes(1);
        });

        it('TC-STEP-003: should handle API outage errors', () => {
            drawServiceMock.loadObjects.mockReturnValue([] as never[]);
            const alertSpy = jest.spyOn(global, 'alert').mockImplementation(() => {});
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            service.convertAndDownload();

            const req = httpMock.expectOne('http://localhost:5000/convert');
            req.flush(null, { status: 0, statusText: 'Unknown Error' });

            expect(errorSpy).toHaveBeenCalledWith(
                'Error calling convert endpoint:',
                expect.anything()
            );
            expect(alertSpy).toHaveBeenCalledWith(
                'Fehler bei der STEP-Konvertierung. Stellen Sie sicher, dass der Server läuft.'
            );
    });
    });

    describe('Service Integration', () => {
        it('TC-STEP-004: should use StlService for STL generation', () => {
            drawServiceMock.loadObjects.mockReturnValue([] as never[]);

            service.convertAndDownload();

            expect(stlServiceMock.downloadStlFromJsonString).toHaveBeenCalledTimes(1);
            const req = httpMock.expectOne('http://localhost:5000/convert');
            req.flush({});
        });

        it('TC-STEP-005: should use DrawService data as model input', () => {
            const modelObjects = [{ type: 'Square', h: 2 }];
            drawServiceMock.loadObjects.mockReturnValue(modelObjects as never[]);

            service.convertAndDownload();

            expect(drawServiceMock.loadObjects).toHaveBeenCalledTimes(1);
            expect(stlServiceMock.downloadStlFromJsonString).toHaveBeenCalledWith(
                JSON.stringify(modelObjects),
                'model.stl',
                true
            );
            const req = httpMock.expectOne('http://localhost:5000/convert');
            req.flush({});
    });
    });
});
