import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { GlobalService } from '../global.service';
import { Subscription } from 'rxjs';
import { Draw } from '../../draw.service';
import { projectSavingResult } from '../../interfaces';
import { FirebaseService } from '../../firebase.service';

@Component({
  selector: 'app-save-project-popup',
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    ReactiveFormsModule,
    MatIconModule,
    MatExpansionModule,
    MatSlideToggleModule
  ],
  templateUrl: './save-project-popup.component.html',
  styleUrl: './save-project-popup.component.css'
})
export class SaveProjectPopupComponent implements OnInit, OnDestroy {
  public form: FormGroup = new FormGroup({
    projectName: new FormControl('New Project'),
    isPrivate: new FormControl(false)
  });
  public projectSavingResult: projectSavingResult = {
      success: false,
      projectName: '',
      licenceKey: 'public',
      projectId: '',
      error: ''
  };
  public saved: boolean = false;
  public licenceCopied: boolean = false;
  private subscription: Subscription = new Subscription();
  private data: { projectName: string; isPrivate: boolean } = { projectName: 'New Project', isPrivate: false };

  constructor(
    private globalService: GlobalService, 
    private drawService: Draw,
    private firebaseService: FirebaseService
  ) { }

  ngOnInit() {
    this.subscription.add(
      this.globalService.requestProjectData.subscribe(() => {
        this.data = this.getDataFromForm();
      })
    );
    
    // Load current project data and prefill the form
    this.loadCurrentProjectData();
  }

  private loadCurrentProjectData(): void {
    const projectId = localStorage.getItem('project-id');
    
    if (projectId && projectId !== 'notExisting') {
      // Project exists, load its data
      this.firebaseService.getProjectById(projectId).subscribe({
        next: (project) => {
          if (project) {
            // Prefill the form with current project data
            this.form.patchValue({
              projectName: project.name,
              isPrivate: project.licenceKey !== 'public'
            });
          }
        },
        error: (err) => {
          console.error('Error loading project data:', err);
        }
      });
    }
    // If no project exists, keep default values
  }

  public getDataFromForm(): { projectName: string; isPrivate: boolean } {
    const projectName = this.form.get('projectName')?.value;
    const isPrivate = this.form.get('isPrivate')?.value;
    console.log('Form Data:', { projectName, isPrivate });
    return { projectName, isPrivate };
  }

  public copyLicenceKey() {
    navigator.clipboard.writeText(this.projectSavingResult.licenceKey).then(() => {
      this.licenceCopied = true;
      setTimeout(() => {
        this.licenceCopied = false;
      }, 2000);
    });
  }

  onSubmit() {
    this.drawService.saveProjectToFirebase(this.getDataFromForm().projectName, !this.getDataFromForm().isPrivate).then((result: projectSavingResult) => {
      this.projectSavingResult = result;
      this.saved = true;
      this.drawService.reload$.next();
    });
  }

  onClose() {
    this.globalService.closeSaveProjectPopup();
    this.drawService.reload$.next();
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }
}
