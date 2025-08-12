import { Component } from '@angular/core';
import { FormObject, LineObject } from '../interfaces';
import { Draw } from '../draw.service';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-sidebar-left',
  standalone: true,
  imports: [MatIcon],
  templateUrl: './sidebar-left.component.html',
  styleUrl: './sidebar-left.component.css'
})
export class SidebarLeftComponent {
  constructor (private drawService: Draw) { }

  public objects: (FormObject | LineObject)[] = [];
  public selectedObject: (FormObject | LineObject) | any = {};

  ngOnInit() {
    this.objects = this.drawService.loadObjects();
    this.selectedObject = localStorage.getItem('selectedObject') ? JSON.parse(localStorage.getItem('selectedObject')!) : {};
    this.selectedObject?.id && this.objects.splice(this.objects.reduce((acc, obj, i) => obj.id === this.selectedObject.id ? i : acc, -1), 1);
  }

  onClick(object: FormObject | LineObject) {
    this.selectedObject = object;
    localStorage.setItem('selectedObject', JSON.stringify(object));
    location.reload();
  }
}
