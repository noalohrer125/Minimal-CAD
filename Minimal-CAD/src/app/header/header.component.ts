import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Draw } from '../draw.service';
import { File  as FileService } from '../file.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  constructor(private drawService: Draw, private fileService: FileService) { }

  save() {
    this.fileService.save();
  }

  upload() {
    this.fileService.upload();
  }

  line() {
    this.drawService.line();
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

  shape_lines() {
    this.drawService.shape_lines();
  }

  extrusion() {
    this.drawService.extrusion();
  }
}
