import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../interfaces';
import { Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';
import { Draw } from '../draw.service';

@Component({
  selector: 'app-overview',
  imports: [
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class Overview {
  constructor(private router: Router, private firebaseService: FirebaseService, private drawService: Draw) {}

  private publicProjectsUnfiltered: Project[] = [];
  public publicProjects: Project[] = [];
  private myProjectsUnfiltered: Project[] = [];
  public myProjects: Project[] = [];
  public showMyProjects: boolean = true;
  public projectsLoading: boolean = false;

  ngOnInit() {
    this.projectsLoading = true;
    this.firebaseService.getPublicProjects().subscribe(projects => {
      this.publicProjectsUnfiltered = projects;
      this.publicProjects = projects;
    });
    this.firebaseService.getProjectsByOwner(this.firebaseService.getCurrentUserEmail()).subscribe(projects => {
      this.myProjectsUnfiltered = projects;
      this.myProjects = projects;
      this.projectsLoading = false;
    });
  }

  addProject() {
    this.drawService.saveProjectToFirebase(true);
  }

  openProject(projectId: string) {
    this.router.navigate(['/editor', projectId]);
  }

  openProjectActions() {
    throw new Error('Method not implemented.');
  }

  applyFilter(searchText: string): void {
    console.log('Applying filter with search text:', searchText);
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
