import { SettingsService } from './../shared/settings.service';
import { CommonModule } from '@angular/common';
import { Component, effect, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { Draw } from '../shared/draw.service';
import { File as FileService } from '../shared/file.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GlobalService } from '../shared/global.service';
import { StepService } from '../shared/step.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatSlideToggleModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent {
  @Input() isAuthenticated: boolean = false;
  autosave: boolean = false;

  constructor(
    private drawService: Draw,
    private globalService: GlobalService,
    private fileService: FileService,
    public stepService: StepService,
    public router: Router,
    public authService: AuthService,
    private settingsService: SettingsService,
  ) {
    effect(() => {
      this.autosave = this.settingsService.settings().autosave;
    });
  }

  saveProjectToFirebase() {
    this.globalService.openSaveProjectPopup();
  }

  saveToLocalFile() {
    this.fileService.save();
  }

  exportAsJSON() {
    this.fileService.save();
  }

  exportAsSTEP() {
    this.fileService.saveAsSTEP();
  }

  exportAsSTL() {
    this.fileService.saveAsSTL();
  }

  uploadFromLocalFile() {
    this.fileService.upload();
  }

  rectangle() {
    this.drawService.rectangle();
  }

  circle() {
    this.drawService.circle();
  }

  freeform() {
    this.drawService.freeform();
  }

  updateSettings(event: MatSlideToggleChange): void {
    this.autosave = event.checked;
    this.settingsService.updateSettings('autosave', this.autosave);
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  home(): void {
    this.router.navigate(['/overview']);
  }
}
