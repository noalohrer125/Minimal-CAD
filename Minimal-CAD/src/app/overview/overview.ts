import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../interfaces';
import { Router } from '@angular/router';
import { FirebaseService } from '../shared/firebase.service';
import { GlobalService } from '../shared/global.service';
import { Draw } from '../shared/draw.service';
import { Auth } from '@angular/fire/auth';

@Component({
  selector: 'app-overview',
  imports: [
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class Overview {
  private auth = inject(Auth);
  public readonly defaultProjectThumbnail = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="200" viewBox="0 0 320 200"%3E%3Crect width="320" height="200" fill="%23202830"/%3E%3Cpath d="M0 160L80 110L130 145L190 95L260 150L320 120V200H0Z" fill="%2337424f"/%3E%3Ccircle cx="70" cy="56" r="18" fill="%23475868"/%3E%3Ctext x="160" y="110" fill="%23a9c2d8" font-size="18" text-anchor="middle" font-family="Arial, sans-serif"%3EProject Preview%3C/text%3E%3C/svg%3E';
  
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
    const userEmail = this.firebaseService.getCurrentUserEmail();
    if (!userEmail) {
      return; // Auth guard will redirect
    }

    this.projectsLoading = true;
    
    this.firebaseService.getPublicProjects().subscribe({
      next: (projects) => {
        this.publicProjectsUnfiltered = projects;
        this.publicProjects = projects;
      },
      error: (error) => {
        console.error('Error loading public projects:', error);
        if (this.auth.currentUser) {
          alert('Error loading public projects. Please try again.');
        }
        this.projectsLoading = false;
      }
    });

    this.firebaseService.getProjectsByOwner(userEmail).subscribe({
      next: (projects) => {
        this.myProjectsUnfiltered = projects;
        this.myProjects = projects;
        this.projectsLoading = false;
      },
      error: (error) => {
        console.error('Error loading my projects:', error);
        if (this.auth.currentUser) {
          alert('Error loading my projects. Please try again.');
        }
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

  getProjectThumbnail(project: Project): string {
    return project.thumbnailDataUrl || this.defaultProjectThumbnail;
  }
}
