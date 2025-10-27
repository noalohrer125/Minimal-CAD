import { Component, Input, Output, EventEmitter, HostListener, ElementRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormGroup, FormControl, FormArray, Validators } from '@angular/forms';
import { FormObject, FreeObject, FreeObjectCommand } from '../interfaces';
import { MatIconModule } from '@angular/material/icon';
import { debounceTime } from 'rxjs';
import { Draw } from '../draw.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-sidebar-right',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatExpansionModule
  ],
  templateUrl: './sidebar-right.component.html',
  styleUrl: './sidebar-right.component.css'
})
export class SidebarRightComponent implements OnInit {
  @Input() position: [number, number, number] = [0, 0, 0];
  @Input() selectedObjectInput: (FormObject | FreeObject)[] = [];
  @Output() positionChange = new EventEmitter<[number, number, number]>();

  constructor(
    public elementRef: ElementRef,
    private drawService: Draw
  ) { }

  public selectedObject: FormObject | FreeObject | any = {};
  public selectedObjectType!: 'Square' | 'Circle' | 'Freeform';

  public form: FormGroup = new FormGroup({
    name: new FormControl('New Object'),
    size: new FormGroup({
      length: new FormControl(0),
      height: new FormControl(0),
      width: new FormControl(0),
      radius: new FormControl(0),
      curveSegments: new FormControl(100)
    }),
    position: new FormGroup({
      x: new FormControl(0),
      y: new FormControl(0),
      z: new FormControl(0)
    }),
    rotation: new FormGroup({
      x: new FormControl(0),
      y: new FormControl(0),
      z: new FormControl(0)
    }),
    start: new FormGroup({
      x: new FormControl(0),
      y: new FormControl(0),
      z: new FormControl(0)
    }),
    end: new FormGroup({
      x: new FormControl(0),
      y: new FormControl(0),
      z: new FormControl(0)
    }),
    commands: new FormArray([])
  });

  ngOnInit(): void {
    this.initForm();

    // Create ghost object when starting to edit
    if (this.selectedObject && this.selectedObject.id) {
      this.drawService.createGhostObject(this.selectedObject.id);
    }

    this.form.get('position')?.valueChanges.subscribe((pos: any) => {
      this.positionChange.emit([pos.x, pos.y, pos.z]);
    });

    this.form.valueChanges.pipe(debounceTime(500)).subscribe(() => {
      this.updatePreview();
    });
  }

  // Getter fürs Template
  get commands(): FormArray {
    return this.form.get('commands') as FormArray;
  }

  private createCommandGroup(cmd?: FreeObjectCommand): FormGroup {
    const group: any = {
      type: new FormControl({value: cmd?.type ?? 'lineTo', disabled: false}, Validators.required),
      new: new FormControl(cmd?.new ?? false),
      x: new FormControl((cmd as any)?.x ?? 0),
      y: new FormControl((cmd as any)?.y ?? 0)
    };
    if (cmd?.type === 'quadraticCurveTo') {
      group.cpX = new FormControl((cmd as any)?.cpX ?? 0);
      group.cpY = new FormControl((cmd as any)?.cpY ?? 0);
    }
    return new FormGroup(group);
  }

  initForm(): void {
    this.selectedObject = this.drawService.loadObjects().find(obj => obj.selected) || null;
    this.selectedObjectType = this.selectedObject?.type!;

    if (this.selectedObject) {
      const patch: any = { name: this.selectedObject.name };

      if (this.selectedObject.type === 'Square' || this.selectedObject.type === 'Circle') {
        patch.size = {
          length: this.selectedObject.l ?? 0,
          width: this.selectedObject.w ?? 0,
          height: this.selectedObject.h ?? 0,
          radius: this.selectedObject.r ?? 0,
          ...(this.selectedObject.type === 'Circle' ? { curveSegments: this.selectedObject.curveSegments ?? 100 } : {})
        };
        patch.position = {
          x: this.selectedObject.position?.[0] ?? 0,
          y: this.selectedObject.position?.[1] ?? 0,
          z: this.selectedObject.position?.[2] ?? 0
        };
      } else if (this.selectedObject.type === 'Freeform') {
        // Patch position
        patch.position = {
          x: this.selectedObject.position?.[0] ?? 0,
          y: this.selectedObject.position?.[1] ?? 0,
          z: this.selectedObject.position?.[2] ?? 0
        };
        patch.size = {
          height: this.selectedObject.h ?? 0
        };
        // Patch commands
        const cmds = this.selectedObject.commands ?? [];
        cmds.forEach((c: FreeObjectCommand) =>
          this.commands.push(this.createCommandGroup(c))
        );
      }
      patch.rotation = {
        x: this.selectedObject.rotation?.[0] ?? 0,
        y: this.selectedObject.rotation?.[1] ?? 0,
        z: this.selectedObject.rotation?.[2] ?? 0
      };
      this.form.patchValue(patch);
    }
  }

  addCommand() {
    this.commands.push(this.createCommandGroup());
  }

  removeCommand(index: number) {
    this.commands.removeAt(index);
  }

  private updatePreview() {
    if (!this.selectedObject) return;
    this.saveToLocalStorage();
    window.location.reload();
  }

  private saveToLocalStorage() {
    let localStorageData: any = {};

    if (this.selectedObjectType === 'Square') {
      localStorageData = {
        name: this.form.value.name,
        type: this.selectedObjectType,
        l: this.form.value.size.length,
        w: this.form.value.size.width,
        h: this.form.value.size.height,
        position: [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ]
      };
    } else if (this.selectedObjectType === 'Circle') {
      localStorageData = {
        name: this.form.value.name,
        type: this.selectedObjectType,
        r: this.form.value.size.radius,
        h: this.form.value.size.height,
        curveSegments: this.form.value.size.curveSegments,
        position: [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ]
      };
    } else if (this.selectedObjectType === 'Freeform') {
      // Mapping der Commands entsprechend dem Interface
      const commands = (this.form.value.commands || []).map((cmd: any) => {
        if (cmd.type === 'moveTo' || cmd.type === 'lineTo') {
          return {
            type: cmd.type,
            x: Number(cmd.x),
            y: Number(cmd.y),
            new: !!cmd.new
          };
        } else if (cmd.type === 'quadraticCurveTo') {
          return {
            type: 'quadraticCurveTo',
            cpX: Number(cmd.cpX),
            cpY: Number(cmd.cpY),
            x: Number(cmd.x),
            y: Number(cmd.y),
            new: !!cmd.new
          };
        } else if (cmd.type === 'bezierCurveTo') {
          return {
            type: 'bezierCurveTo',
            cp1X: Number(cmd.cp1X ?? cmd.cp1x),
            cp1Y: Number(cmd.cp1Y ?? cmd.cp1y),
            cp2X: Number(cmd.cp2X ?? cmd.cp2x),
            cp2Y: Number(cmd.cp2Y ?? cmd.cp2y),
            x: Number(cmd.x),
            y: Number(cmd.y),
            new: !!cmd.new
          };
        }
        return null;
      }).filter((c: any) => !!c);
      localStorageData = {
        name: this.form.value.name,
        type: this.selectedObjectType,
        commands,
        position: [
          this.form.value.position.x,
          this.form.value.position.y,
          this.form.value.position.z
        ],
        h: this.form.value.size.height
      };
    }

    const modelData = this.drawService.loadObjects();
    localStorageData.id = this.selectedObject?.id;
    localStorageData.rotation = [
      this.form.value.rotation.x,
      this.form.value.rotation.y,
      this.form.value.rotation.z
    ];
    localStorageData.selected = true;
    
    // Update the preview object (non-ghost version)
    const existingIndex = modelData.findIndex((model: any) => model.id === this.selectedObject.id && !model.ghost);
    if (existingIndex !== -1) {
      modelData[existingIndex] = {...localStorageData};
    }
    
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  onSubmit() {
    if (!this.selectedObject) return;
    
    // Save the final object and clean up ghosts
    this.saveToLocalStorage();
    this.drawService.saveObject(this.selectedObject);
    window.location.reload();
  }

  onClose() {
    // Remove ghost objects and deselect all
    this.drawService.removeGhostObjects();
    this.drawService.deselectAllObjects();
    this.selectedObject = null;
    location.reload();
  }

  onDelete() {
    if (
      window.confirm(
        `You are about to delete ${this.selectedObject.name}. Proceed?`
      )
    ) {
      let models = this.drawService.loadObjects();
      models = models.filter(
        (model) => model.id !== this.selectedObject.id
      );
      localStorage.setItem('model-data', JSON.stringify(models));
      this.selectedObject = null;
      location.reload();
    }
  }

  // Dragging
  private isDragging = false;
  private startX = 0;
  private startY = 0;
  private initialX = 0;
  private initialY = 0;

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

    const mainView = document.querySelector('.main-view') as HTMLElement;
    const sidebar = this.elementRef.nativeElement;

    if (mainView) {
      const mainViewRect = mainView.getBoundingClientRect();
      const sidebarRect = sidebar.getBoundingClientRect();

      const minX = mainViewRect.left;
      const maxX = mainViewRect.right - sidebarRect.width;
      newX = Math.max(minX, Math.min(maxX, newX));

      const minY = mainViewRect.top;
      const maxY = mainViewRect.bottom - sidebarRect.height;
      newY = Math.max(minY, Math.min(maxY, newY));
    }
    this.elementRef.nativeElement.style.left = `${newX}px`;
    this.elementRef.nativeElement.style.top = `${newY}px`;
    this.elementRef.nativeElement.style.right = 'auto';

    this.positionChange.emit([newX, newY, this.position[2]]);
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    this.isDragging = false;
  }
}
