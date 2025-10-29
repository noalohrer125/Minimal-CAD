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

  public publicProjects: Project[] = [];
  public myProjects: Project[] = [];
  public showMyProjects: boolean = true;

  ngOnInit() {
    this.firebaseService.getPublicProjects().subscribe(projects => {
      this.publicProjects = projects
    })
    this.firebaseService.getProjectsByOwner(this.firebaseService.getCurrentUserEmail()).subscribe(projects => {
      this.myProjects = projects
    })
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
    this.myProjects = this.myProjects.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.ownerEmail.toLowerCase().includes(searchText.toLowerCase()) ||
      project.createdAt.toDate().toString().includes(searchText.toLowerCase())
    );
    this.publicProjects = this.publicProjects.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.ownerEmail.toLowerCase().includes(searchText.toLowerCase()) ||
      project.updatedAt?.toDate().toString().includes(searchText.toLowerCase())
    );
  }
}
