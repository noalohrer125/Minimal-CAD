import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Draw } from './draw.service';

@Injectable({
  providedIn: 'root'
})
export class GlobalService {
  private isSaveProjectPopupOpen$ = new BehaviorSubject<boolean>(false);
  private requestProjectData$ = new Subject<void>();
  private isNewProject: boolean = false;

  // Observable for components to subscribe to
  isSaveProjectPopupOpen = this.isSaveProjectPopupOpen$.asObservable();
  requestProjectData = this.requestProjectData$.asObservable();

  constructor(
    private drawService: Draw
  ) { }

  getSaveProjectPopupOpen(): boolean {
    return this.isSaveProjectPopupOpen$.getValue();
  }

  getIsNewProject(): boolean {
    return this.isNewProject;
  }

  openSaveProjectPopup(isNewProject: boolean = false): void {
    this.isNewProject = isNewProject;
    this.isSaveProjectPopupOpen$.next(true);
    this.drawService.reload$.next();
  }

  closeSaveProjectPopup(): void {
    this.isSaveProjectPopupOpen$.next(false);
    this.drawService.reload$.next();
  }
}
