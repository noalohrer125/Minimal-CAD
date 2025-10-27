import { Component } from '@angular/core';
import { FormObject, FreeObject } from '../../interfaces';
import { Draw } from '../../draw.service';
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

  public objects: (FormObject | FreeObject)[] = [];
  public selectedObject: (FormObject | FreeObject) | any = {};

  ngOnInit() {
    this.objects = this.drawService.loadObjects();
    this.selectedObject = this.drawService.loadObjects().find(obj => obj.selected) || {};
  }

  onClick(object: FormObject | FreeObject) {
    this.selectedObject = object;
    const modelData = this.drawService.loadObjects();
    modelData.find(obj => obj.id === object.id)!.selected = true;
    localStorage.setItem('model-data', JSON.stringify(modelData));
    location.reload();
  }
}
