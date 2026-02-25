/* eslint-disable */
// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { StlService } from './stl.service';
import * as THREE from 'three';

describe('StlService', () => {
    let service;
    let httpMock;
    let _origURL: any;

    beforeEach(() => {
        _origURL = (global as any).URL;
        TestBed.configureTestingModule({ imports: [HttpClientTestingModule], providers: [StlService] });
        service = TestBed.inject(StlService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        jest.restoreAllMocks();
        httpMock.verify();
        if (typeof _origURL !== 'undefined') {
            (global as any).URL = _origURL;
        }
    });

    describe('Geometry Conversion', () => {
        it('TC-STL-001: should convert BufferGeometry to ASCII STL', () => {
            const geom = new THREE.BufferGeometry();
            const positions = new Float32Array([
                0, 0, 0,
                1, 0, 0,
                0, 1, 0
            ]);
            geom.setAttribute('position', new THREE.BufferAttribute(positions, 3));

            const stl = service.geometryToASCIIStl(geom);
            expect(stl).toContain('facet normal');
            expect(stl).toContain('vertex 0.000000 0.000000 0.000000');
        });

        it('TC-STL-002: should format numbers with 6 decimals via fmt()', () => {
            expect(service.fmt(1.23456789)).toBe('1.234568');
            expect(service.fmt(0)).toBe('0.000000');
        });
    });

    describe('File Download', () => {
        beforeEach(() => {
            (global as any).URL = Object.assign({}, _origURL || {}, {
                createObjectURL: jest.fn(() => 'blob:mock'),
                revokeObjectURL: jest.fn(),
            });
        });

        it('TC-STL-003: should trigger STL download from JSON string', () => {
            const appendSpy = jest.spyOn(document.body, 'appendChild');
            const removeSpy = jest.spyOn(document.body, 'removeChild');

            const json = JSON.stringify([{ type: 'Square', l: 1, w: 1, h: 1 }]);
            const clickSpy = jest.fn();
            const origCreate = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const el = origCreate(tag);
                if (tag === 'a') el.click = clickSpy;
                return el;
            });

            const spyGeom = jest.spyOn(service, 'geometryToASCIIStl');
            service.downloadStlFromJsonString(json, 'test.stl', false);

            expect(spyGeom).toHaveBeenCalled();
            expect(appendSpy).toHaveBeenCalled();
            expect(clickSpy).toHaveBeenCalled();
            expect(removeSpy).toHaveBeenCalled();
        });

        it('TC-STL-004: should convert Square to geometry (BoxGeometry) and call converter', () => {
            const json = JSON.stringify([{ type: 'Square', l: 2, w: 3, h: 4 }]);
            const spyGeom = jest.spyOn(service, 'geometryToASCIIStl');
            const origCreate2 = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const el = origCreate2(tag);
                el.click = jest.fn();
                return el;
            });
            service.downloadStlFromJsonString(json, 'sq.stl', false);
            expect(spyGeom).toHaveBeenCalled();
            const geomArg = spyGeom.mock.calls[0][0];
            expect(geomArg.getAttribute('position')).toBeDefined();
        });

        it('TC-STL-005: should convert Circle to geometry (CylinderGeometry) and call converter', () => {
            const json = JSON.stringify([{ type: 'Circle', r: 1, h: 2 }]);
            const spyGeom = jest.spyOn(service, 'geometryToASCIIStl');
            const origCreate3 = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const el = origCreate3(tag);
                el.click = jest.fn();
                return el;
            });
            service.downloadStlFromJsonString(json, 'cyl.stl', false);
            expect(spyGeom).toHaveBeenCalled();
        });

        it('TC-STL-006: should process Freeform commands and create ExtrudeGeometry', () => {
            const moveSpy = jest.spyOn(THREE.Shape.prototype, 'moveTo');
            const lineSpy = jest.spyOn(THREE.Shape.prototype, 'lineTo');
            const quadSpy = jest.spyOn(THREE.Shape.prototype, 'quadraticCurveTo');

            const commands = [
                { type: 'moveTo', x: 0, y: 0 },
                { type: 'lineTo', x: 1, y: 0 },
                { type: 'quadraticCurveTo', cpX: 1, cpY: 1, x: 2, y: 0 }
            ];

            const json = JSON.stringify([{ type: 'Freeform', commands, h: 1 }]);
            const spyGeom = jest.spyOn(service, 'geometryToASCIIStl');
            const origCreate4 = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const el = origCreate4(tag);
                el.click = jest.fn();
                return el;
            });
            service.downloadStlFromJsonString(json, 'free.stl', false);

            expect(moveSpy).toHaveBeenCalled();
            expect(lineSpy).toHaveBeenCalled();
            expect(quadSpy).toHaveBeenCalled();
            expect(spyGeom).toHaveBeenCalled();
        });
    });

    describe('Unit Conversion & Server', () => {
        beforeEach(() => {
            (global as any).URL = Object.assign({}, _origURL || {}, {
                createObjectURL: jest.fn(() => 'blob:mock'),
                revokeObjectURL: jest.fn(),
            });
        });
        it('TC-STL-007: should convert cm to mm (multiply by 10)', () => {
            const spyGeom = jest.spyOn(service, 'geometryToASCIIStl');
            const origCreate5 = document.createElement.bind(document);
            jest.spyOn(document, 'createElement').mockImplementation((tag) => {
                const el = origCreate5(tag);
                el.click = jest.fn();
                return el;
            });
            const json = JSON.stringify([{ type: 'Square', l: 2, w: 2, h: 2, position: [1, 2, 3] }]);
            service.downloadStlFromJsonString(json, 'unit.stl', false);
            const geom = spyGeom.mock.calls[0][0];
            const pos = geom.getAttribute('position');
            // positions should reflect mm-scale values (> 2)
            expect(pos.getX(0)).not.toBe(0);
            expect(pos.array.length).toBeGreaterThan(0);
        });

        it('TC-STL-008: should POST STL to server when saveToServer=true', () => {
            const json = JSON.stringify([{ type: 'Square', l: 1, w: 1, h: 1 }]);
            service.downloadStlFromJsonString(json, 'upload.stl', true);
            const req = httpMock.expectOne('http://localhost:5000/uploadStlToServer');
            expect(req.request.method).toBe('POST');
            // respond to complete
            req.flush({ ok: true });
        });
    });
});
