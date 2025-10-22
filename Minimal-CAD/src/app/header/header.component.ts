import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Draw } from '../draw.service';
import { File  as FileService } from '../file.service';
import { MatTooltipModule } from '@angular/material/tooltip';

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
  constructor(private drawService: Draw, private fileService: FileService) { }

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
}
