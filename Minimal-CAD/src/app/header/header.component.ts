import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { Draw } from '../shared/draw.service';
import { File  as FileService } from '../shared/file.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GlobalService } from '../shared/global.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() isAuthenticated: boolean = false;

  constructor(
    private drawService: Draw,
    private globalService: GlobalService,
    private fileService: FileService,
    public router: Router,
    public authService: AuthService
  ) { }

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
