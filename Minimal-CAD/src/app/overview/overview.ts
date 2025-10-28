import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../interfaces';
import { Router } from '@angular/router';
import { FirebaseService } from '../firebase.service';

@Component({
  selector: 'app-overview',
  imports: [
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class Overview {
  constructor(private router: Router, private firebaseService: FirebaseService) {}

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

  openProject(projectId: string) {
    this.router.navigate(['/project', projectId]);
  }

  openProjectActions() {
    throw new Error('Method not implemented.');
  }

  applyFilter(searchText: string): void {
    this.myProjects = this.myProjects.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.ownerEmail.toLowerCase().includes(searchText.toLowerCase()) ||
      project.createdAt.toLocaleDateString().includes(searchText.toLowerCase())
    );
    this.publicProjects = this.publicProjects.filter(project =>
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      project.ownerEmail.toLowerCase().includes(searchText.toLowerCase()) ||
      project.updatedAt?.toLocaleDateString().includes(searchText.toLowerCase())
    );
  }
}
