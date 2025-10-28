import { CommonModule } from '@angular/common';
import { Component, Input, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Draw } from '../draw.service';
import { File  as FileService } from '../file.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() isAuthenticated: boolean = false;

  constructor(
    private drawService: Draw,
    private fileService: FileService,
    private router: Router,
    public authService: AuthService
  ) { }

  saveProjectToFirebase() {
    this.drawService.saveProjectToFirebase();
  }

  saveToLocalFile() {
    this.fileService.save();
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
    this.router.navigate(['/']);
  }

  home(): void {
    this.router.navigate(['/']);
  }
}
