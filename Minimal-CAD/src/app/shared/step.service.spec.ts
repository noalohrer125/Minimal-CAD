import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StepService } from './step.service';
import { StlService } from './stl.service';
import { Draw } from './draw.service';
import { DialogService } from './dialog.service';
import { BehaviorSubject, of } from 'rxjs';

const BASE_URL = 'https://minimalcad-dev.web.app';

describe('StepService', () => {
    let service: StepService;
    let httpMock: HttpTestingController;
    let stlServiceMock: any;
    let drawServiceMock: any;
    let dialogServiceMock: any;

    beforeEach(() => {
        stlServiceMock = {
            uploadStlFromJsonString: jest.fn().mockReturnValue(of({})),
            downloadStlFromJsonString: jest.fn(),
        };

        drawServiceMock = {
            loadObjects: jest.fn().mockReturnValue([]),
            reload$: new BehaviorSubject<void>(undefined),
        };

        dialogServiceMock = {
            alert: jest.fn().mockResolvedValue(undefined),
            confirm: jest.fn().mockResolvedValue(false),
            prompt: jest.fn().mockResolvedValue(null),
        };

        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [
                StepService,
                { provide: StlService, useValue: stlServiceMock },
                { provide: Draw, useValue: drawServiceMock },
                { provide: DialogService, useValue: dialogServiceMock },
            ]
        });

        service = TestBed.inject(StepService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
        jest.restoreAllMocks();
    });

    describe('API Communication', () => {
        it('TC-STEP-001: should call convertAndDownload and send request to convert API', () => {
            service.convertAndDownload();

            const req = httpMock.expectOne(`${BASE_URL}/convert`);
            expect(req.request.method).toBe('GET');
            req.flush({});

            const dlReq = httpMock.expectOne(`${BASE_URL}/download`);
            dlReq.flush(new Blob());
        });

        it('TC-STEP-002: should call downloadStepBlob after successful conversion', () => {
            const downloadSpy = jest
                .spyOn(service as any, 'downloadStepBlob')
                .mockImplementation(() => {});

            service.convertAndDownload();

            const req = httpMock.expectOne(`${BASE_URL}/convert`);
            req.flush({});

            const dlReq = httpMock.expectOne(`${BASE_URL}/download`);
            dlReq.flush(new Blob());

            expect(downloadSpy).toHaveBeenCalledTimes(1);
        });

        it('TC-STEP-003: should handle API errors gracefully', () => {
            const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

            service.convertAndDownload();

            const req = httpMock.expectOne(`${BASE_URL}/convert`);
            req.flush(null, { status: 500, statusText: 'Server Error' });

            expect(errorSpy).toHaveBeenCalledWith(
                'Error converting/downloading STEP file:',
                expect.anything()
            );
        });
    });

    describe('Service Integration', () => {
        it('TC-STEP-004: should use StlService.uploadStlFromJsonString for STL upload', () => {
            service.convertAndDownload();

            expect(stlServiceMock.uploadStlFromJsonString).toHaveBeenCalledTimes(1);

            const req = httpMock.expectOne(`${BASE_URL}/convert`);
            req.flush({});
            const dlReq = httpMock.expectOne(`${BASE_URL}/download`);
            dlReq.flush(new Blob());
        });

        it('TC-STEP-005: should use DrawService data as model input', () => {
            const modelObjects = [{ type: 'Square', h: 2 }];
            drawServiceMock.loadObjects.mockReturnValue(modelObjects);

            service.convertAndDownload();

            expect(drawServiceMock.loadObjects).toHaveBeenCalledTimes(1);
            expect(stlServiceMock.uploadStlFromJsonString).toHaveBeenCalledWith(
                JSON.stringify(modelObjects)
            );

            const req = httpMock.expectOne(`${BASE_URL}/convert`);
            req.flush({});
            const dlReq = httpMock.expectOne(`${BASE_URL}/download`);
            dlReq.flush(new Blob());
        });
    });
});
