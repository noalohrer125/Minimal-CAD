import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Project } from '../interfaces';
import { Router } from '@angular/router';

@Component({
  selector: 'app-overview',
  imports: [
    MatIconModule
  ],
  templateUrl: './overview.html',
  styleUrl: './overview.css'
})
export class Overview {
  public projects: Project[] = [
    {
      id: '1',
      name: 'Sample Project',
      licenceKey: 'public',
      ownerEmail: 'you@example.com',
      createdAt: new Date(),
      updatedAt: new Date(),
      objectIds: []
    }
  ];

  constructor(private router: Router) {}

  openProject(projectId: string) {
    this.router.navigate(['/project', projectId]);
  }

  openProjectActions() {
    throw new Error('Method not implemented.');
  }
}
