import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { HeaderComponent } from './header/header.component';
import { GlobalService } from './shared/global.service';
import { SaveProjectPopupComponent } from './shared/save-project-popup.component/save-project-popup.component';
import { Draw } from './draw.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    HeaderComponent,
    SaveProjectPopupComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit{
  authService = inject(AuthService);
  globalService = inject(GlobalService);
  drawService = inject(Draw);
  isAuthenticated: boolean = false;
  public isAuthLoading: boolean = true;
  public isSaveProjectPopupOpen: boolean = false;

  ngOnInit(): void {
    this.checkSaveProjectPopupState();
    this.authService.$user.subscribe(user => {
      if (user) {
        this.authService.currentUserSignal.set({
          email: user.email!,
          username: user.displayName!,
        });
      } else {
        this.authService.currentUserSignal.set(null);
      }
    });
    // Reactively update isAuthenticated when auth state changes
    this.authService.$user.subscribe(user => {
      this.isAuthenticated = user !== null;
      this.isAuthLoading = false;
    });

    this.drawService.reload$.subscribe(() => {
      this.checkSaveProjectPopupState();
    });
  }

  checkSaveProjectPopupState(): void {
    this.isSaveProjectPopupOpen = this.globalService.getSaveProjectPopupOpen();
    if (this.isSaveProjectPopupOpen) {
      document.getElementById('app')!.style.userSelect = 'none';
      document.getElementById('app')!.style.pointerEvents = 'none';
    } else {
      document.getElementById('app')!.style.userSelect = 'auto';
      document.getElementById('app')!.style.pointerEvents = 'auto';
    }
  }
}
