import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../interfaces';
import { Router } from '@angular/router';
import { FirebaseService } from '../shared/firebase.service';
import { GlobalService } from '../shared/global.service';
import { Draw } from '../shared/draw.service';

@Component({
  selector: 'app-overview',
  imports: [
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class Overview {
  constructor(
    private router: Router,
    private firebaseService: FirebaseService,
    private globalService: GlobalService,
    private drawService: Draw
  ) {}

  private publicProjectsUnfiltered: Project[] = [];
  public publicProjects: Project[] = [];
  private myProjectsUnfiltered: Project[] = [];
  public myProjects: Project[] = [];
  public showMyProjects: boolean = true;
  public projectsLoading: boolean = false;

  ngOnInit() {
    this.projectsLoading = true;
    this.firebaseService.getPublicProjects().subscribe({
      next: (projects) => {
        this.publicProjectsUnfiltered = projects;
        this.publicProjects = projects;
      },
      error: (error) => {
        console.error('Error loading public projects:', error);
        alert('Error loading public projects. Please try again.');
        this.projectsLoading = false;
      }
    });
    this.firebaseService.getProjectsByOwner(this.firebaseService.getCurrentUserEmail()).subscribe({
      next: (projects) => {
        this.myProjectsUnfiltered = projects;
        this.myProjects = projects;
        this.projectsLoading = false;
      },
      error: (error) => {
        console.error('Error loading user projects:', error);
        alert('Error loading your projects. Please try again.');
        this.projectsLoading = false;
      }
    });
  }

  addProject() {
    this.globalService.openSaveProjectPopup(true);
  }

  openProject(projectId: string, projectName: string, licenceKey: string) {
    let userInput = '';
    if (licenceKey !== 'public') {
      userInput = prompt('Enter the license key for this project:', projectName) || '';
    } else {
      userInput = 'public';
    }
    if (userInput === licenceKey) {
      this.router.navigate(['/editor', projectId]);
    } else {
      alert('Please enter the correct license key to open this project.');
    }
  }

  openProjectActions() {
    throw new Error('Method not implemented.');
  }

  applyFilter(searchText: string): void {
    this.myProjects = this.myProjectsUnfiltered.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.createdAt.toDate().toLocaleDateString().includes(searchText.toLowerCase())
    );
    this.publicProjects = this.publicProjectsUnfiltered.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.ownerEmail.toLowerCase().includes(searchText.toLowerCase())
    );
  }
}
