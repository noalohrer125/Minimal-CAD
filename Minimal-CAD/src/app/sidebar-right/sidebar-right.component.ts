import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormObject, FreeObject } from '../interfaces';
import { FormGroup, FormControl } from '@angular/forms';

@Component({
  selector: 'app-sidebar-right',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sidebar-right.component.html',
  styleUrl: './sidebar-right.component.css'
})
export class SidebarRightComponent implements OnInit {
  @Input() position: [number, number, number] = [0, 0, 0];
  @Output() positionChange = new EventEmitter<[number, number, number]>();

  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;

  public selectedObject: FormObject | FreeObject | null = null;
  public selectedObjectType!: 'Square' | 'Circle' | 'Freeform';

  constructor(public elementRef: ElementRef) {}

  public form: FormGroup = new FormGroup({
    size: new FormGroup({
      length: new FormControl(0),
      height: new FormControl(0),
      width: new FormControl(0),
      radius: new FormControl(0)
    }),
    position: new FormGroup({
      x: new FormControl(this.position[0]),
      y: new FormControl(this.position[1]),
      z: new FormControl(this.position[2])
    })
  });

  ngOnInit(): void {
    this.selectedObject = localStorage.getItem('selectedObject') ? JSON.parse(localStorage.getItem('selectedObject')!) : null;
    this.selectedObjectType = this.selectedObject?.type!;

    // Initialize form values if selectedObject exists
    if (this.selectedObject) {
      this.form.patchValue({
        size: {
          length: this.selectedObject.size[0] ?? 0,
          height: this.selectedObject.size?.[1] ?? 0,
          width: this.selectedObject.size?.[2] ? this.selectedObject.size[2] : this.selectedObject.size[1] ?? 0,
          radius: this.selectedObject.size?.[0] ?? 0
        },
        position: {
          x: this.selectedObject.position?.[0] ?? this.position[0],
          y: this.selectedObject.position?.[1] ?? this.position[1],
          z: this.selectedObject.position?.[2] ?? this.position[2]
        }
      });
    }

    // Listen for position changes in the form
    this.form.get('position')?.valueChanges.subscribe((pos: any) => {
      this.positionChange.emit([pos.x, pos.y, pos.z]);
    });
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
