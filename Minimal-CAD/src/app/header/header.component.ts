import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Draw } from '../draw.service';

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
  constructor(private drawService: Draw) { }

  ngOnInit() {
    // Initialization logic here
  }

  save() {
    // this.drawService.save();
  }

  upload() {
    // this.drawService.upload();
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

  extrusion() {
    this.drawService.extrusion();
  }
}
