import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { GlobalService } from './global.service';
import { Draw } from './draw.service';

describe('GlobalService', () => {
  let service: GlobalService;
  const mockDraw: any = { reload$: { next: jest.fn() } };

  beforeEach(() => {
    jest.resetAllMocks();
    TestBed.configureTestingModule({
      providers: [
        GlobalService,
        { provide: Draw, useValue: mockDraw }
      ]
    });
    service = TestBed.inject(GlobalService);
  });

  describe('Popup Management', () => {
    it('TC-GLOBAL-001: should open save project popup', () => {
      service.openSaveProjectPopup(true);
      expect(service.getSaveProjectPopupOpen()).toBe(true);
      expect(service.getIsNewProject()).toBe(true);
      expect(mockDraw.reload$.next).toHaveBeenCalled();
    });

    it('TC-GLOBAL-002: should close save project popup', () => {
      service.openSaveProjectPopup();
      expect(service.getSaveProjectPopupOpen()).toBe(true);
      mockDraw.reload$.next.mockClear();
      service.closeSaveProjectPopup();
      expect(service.getSaveProjectPopupOpen()).toBe(false);
      expect(mockDraw.reload$.next).toHaveBeenCalled();
    });

    it('TC-GLOBAL-003: should set isNewProject flag', () => {
      service.openSaveProjectPopup(false);
      expect(service.getIsNewProject()).toBe(false);
      service.openSaveProjectPopup(true);
      expect(service.getIsNewProject()).toBe(true);
    });
  });

  describe('Observables', () => {
    it('TC-GLOBAL-006: should provide isSaveProjectPopupOpen observable', async () => {
      const emitted: boolean[] = [];
      const sub = service.isSaveProjectPopupOpen.subscribe(v => emitted.push(v));
      service.openSaveProjectPopup();
      // give observable a tick
      await Promise.resolve();
      expect(emitted.length).toBeGreaterThan(0);
      expect(emitted[emitted.length - 1]).toBe(true);
      sub.unsubscribe();
    });

    it('TC-GLOBAL-007: should provide requestProjectData observable', async () => {
      const emitted: number[] = [];
      const sub = service.requestProjectData.subscribe(() => emitted.push(1));
      // trigger internal subject (private) for test purposes
      (service as any).requestProjectData$.next();
      await Promise.resolve();
      expect(emitted.length).toBe(1);
      sub.unsubscribe();
    });
  });
});
