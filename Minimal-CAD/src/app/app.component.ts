import { Component, HostListener } from '@angular/core';
import { HeaderComponent } from './header/header.component';
import { SidebarLeftComponent } from './sidebar-left/sidebar-left.component';
import { ViewcubeComponent } from './viewcube/viewcube.component';
import { CommonModule } from '@angular/common';
import { MainViewComponent } from './main-view/main-view.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    HeaderComponent,
    MainViewComponent,
    SidebarLeftComponent,
    ViewcubeComponent,
    CommonModule,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Minimal-CAD';

  @HostListener('contextmenu', ['$event'])
  onRightClick(event: MouseEvent) {
    event.preventDefault(); // blockiert das Browser-Kontextmenü
  }
}
