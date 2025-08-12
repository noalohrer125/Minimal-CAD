import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormObject, LineObject } from '../interfaces';
import { FormGroup, FormControl } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime } from 'rxjs';
import { Draw } from '../draw.service';

@Component({
  selector: 'app-sidebar-right',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule
  ],
  templateUrl: './sidebar-right.component.html',
  styleUrl: './sidebar-right.component.css'
})
export class SidebarRightComponent implements OnInit {
  @Input() position: [number, number, number] = [0, 0, 0];
  @Input() selectedObjectInput: (FormObject | LineObject)[] = [];
  @Output() positionChange = new EventEmitter<[number, number, number]>();

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;

  public selectedObject: FormObject | LineObject | any = {};
  public selectedObjectType!: 'Square' | 'Circle' | 'Line';

  constructor(public elementRef: ElementRef, private drawService: Draw) {}

  public form: FormGroup = new FormGroup({
      name: new FormControl('New Object'),
      size: new FormGroup({
        length: new FormControl(0),
        height: new FormControl(0),
        width: new FormControl(0),
        radius: new FormControl(0)
      }),
      position: new FormGroup({
        x: new FormControl(0),
        y: new FormControl(0),
        z: new FormControl(0)
      }),
      // For Line objects
      start: new FormGroup({
        x: new FormControl(0),
        y: new FormControl(0),
        z: new FormControl(0)
      }),
      end: new FormGroup({
        x: new FormControl(0),
        y: new FormControl(0),
        z: new FormControl(0)
      })
  });

  ngOnInit(): void {
    this.initForm();
    this.form.get('position')?.valueChanges.subscribe((pos: any) => {
      this.positionChange.emit([pos.x, pos.y, pos.z]);
    });

    this.form.valueChanges.pipe(debounceTime(1000)).subscribe(() => {
      let localStorageData: any = {};
      if (this.selectedObjectType === 'Square') {
        localStorageData = {
          name: this.form.value.name,
          type: this.selectedObjectType,
          l: this.form.value.size.length,
          w: this.form.value.size.width,
          h: this.form.value.size.height
        };
        localStorageData.position = [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ];
      } else if (this.selectedObjectType === 'Circle') {
        localStorageData = {
          name: this.form.value.name,
          type: this.selectedObjectType,
          r: this.form.value.size.radius,
          h: this.form.value.size.height
        };
        localStorageData.position = [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ];
      } else if (this.selectedObjectType === 'Line') {
        localStorageData = {
          name: this.form.value.name,
          type: this.selectedObjectType,
          start: [
            this.form.value.start.x,
            this.form.value.start.y,
            this.form.value.start.z
          ],
          end: [
            this.form.value.end.x,
            this.form.value.end.y,
            this.form.value.end.z
          ]
        };
      }
      localStorageData.id = this.selectedObject.id;
      this.selectedObject = localStorageData;
      localStorage.setItem('selectedObject', JSON.stringify(this.selectedObject));
      location.reload();
    });
  }

  initForm(): void {
    this.selectedObject = localStorage.getItem('selectedObject') ? JSON.parse(localStorage.getItem('selectedObject')!) : null;
    this.selectedObjectType = this.selectedObject?.type!;

    // Initialize form values if selectedObject exists
    if (this.selectedObject) {
      const patch: any = {
        name: this.selectedObject.name
      };
      if (this.selectedObject.type === 'Line') {
        patch.start = {
          x: this.selectedObject.start?.[0] ?? 0,
          y: this.selectedObject.start?.[1] ?? 0,
          z: this.selectedObject.start?.[2] ?? 0
        };
        patch.end = {
          x: this.selectedObject.end?.[0] ?? 0,
          y: this.selectedObject.end?.[1] ?? 0,
          z: this.selectedObject.end?.[2] ?? 0
        };
      } else {
        patch.size = {
          length: this.selectedObject.l ?? 0,
          width: this.selectedObject.w ?? 0,
          height: this.selectedObject.h ?? 0,
          radius: this.selectedObject.r ?? 0
        };
        patch.position = {
          x: this.selectedObject.position?.[0] ?? 0,
          y: this.selectedObject.position?.[1] ?? 0,
          z: this.selectedObject.position?.[2] ?? 0
        };
      }
      this.form.patchValue(patch);
    }
  }

  onClose() {
    if (window.confirm("You have unsaved changes. Are you sure you want to close the Editor?")) {
      this.selectedObject = null;
      localStorage.removeItem('selectedObject');
      location.reload();
    }
  }

  onSubmit() {
    if (this.selectedObject) {
      if (this.selectedObject.type === 'Line') {
        this.selectedObject.start = [
          this.form.value.start.x,
          this.form.value.start.y,
          this.form.value.start.z
        ];
        this.selectedObject.end = [
          this.form.value.end.x,
          this.form.value.end.y,
          this.form.value.end.z
        ];
      }
      else if (this.selectedObject.type === 'Square') {
        this.selectedObject.l = this.form.value.size.length;
        this.selectedObject.w = this.form.value.size.width;
        this.selectedObject.h = this.form.value.size.height;
        delete this.selectedObject.r;
        this.selectedObject.position = [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ];
      } else if (this.selectedObject.type === 'Circle') {
        this.selectedObject.r = this.form.value.size.radius;
        this.selectedObject.h = this.form.value.size.height;
        delete this.selectedObject.l;
        delete this.selectedObject.w;
        this.selectedObject.position = [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ];
      }
      this.selectedObject.id = this.selectedObject.id;
      this.selectedObject.name = this.form.value.name;
      this.selectedObject.type = this.selectedObjectType;
      this.drawService.saveObject(this.selectedObject);
      window.location.reload();
    }
  }

  onMouseDown(event: MouseEvent) {
    this.isDragging = true;
    this.startX = event.clientX;
    this.startY = event.clientY;
    
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.initialX = rect.left;
    this.initialY = rect.top;
    
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;

    const deltaX = event.clientX - this.startX;
    const deltaY = event.clientY - this.startY;
    
    let newX = this.initialX + deltaX;
    let newY = this.initialY + deltaY;
    
    // Get the main-view bounds for constraining movement
    const mainView = document.querySelector('.main-view') as HTMLElement;
    const sidebar = this.elementRef.nativeElement;
    
    if (mainView) {
      const mainViewRect = mainView.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();
      
      // Constrain X position (left and right boundaries)
      const minX = mainViewRect.left;
      const maxX = mainViewRect.right - sidebarRect.width;
      newX = Math.max(minX, Math.min(maxX, newX));
      
      // Constrain Y position (top and bottom boundaries)
      const minY = mainViewRect.top;
      const maxY = mainViewRect.bottom - sidebarRect.height;
      newY = Math.max(minY, Math.min(maxY, newY));
    }
    
    // Update the element position
    this.elementRef.nativeElement.style.left = `${newX}px`;
    this.elementRef.nativeElement.style.top = `${newY}px`;
    this.elementRef.nativeElement.style.right = 'auto'; // Override CSS right positioning
    
    // Emit position change (converting to your coordinate system if needed)
    this.positionChange.emit([newX, newY, this.position[2]]);
  }

  @HostListener('document:mouseup', ['$event'])
  onMouseUp(event: MouseEvent) {
    this.isDragging = false;
  }
}
