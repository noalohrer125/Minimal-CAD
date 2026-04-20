import { SettingsService } from './../shared/settings.service';
import { CommonModule } from '@angular/common';
import { Component, effect, Input, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { Draw } from '../shared/draw.service';
import { File as FileService } from '../shared/file.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NavigationEnd, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GlobalService } from '../shared/global.service';
import { StepService } from '../shared/step.service';
import { Subscription, interval } from 'rxjs';
import { FirebaseService } from '../shared/firebase.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    MatMenuModule,
    MatSlideToggleModule,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() isAuthenticated: boolean = false;
  autosave: boolean = false;
  public changesPollingSubscription?: Subscription;
  public ownershipSubscription?: Subscription;
  public routerEventsSubscription?: Subscription;
  public hasUnsavedChanges: boolean = false;
  public isCurrentUserProjectOwner: boolean = false;
  private currentProjectOwnerEmail: string | null = null;

  constructor(
    private drawService: Draw,
    private globalService: GlobalService,
    private fileService: FileService,
    public stepService: StepService,
    public router: Router,
    public authService: AuthService,
    private settingsService: SettingsService,
    private firebaseService: FirebaseService,
  ) {
    effect(() => {
      this.autosave = this.settingsService.settings().autosave;
      this.authService.currentUserSignal();
      this.updateOwnershipState();
    });
  }

  ngOnInit(): void {
    this.loadCurrentProjectOwner();
    this.routerEventsSubscription = this.router.events.subscribe((event) => {
      if (
        event instanceof NavigationEnd &&
        this.router.url.includes('/editor')
      ) {
        this.loadCurrentProjectOwner();
      }
    });

    this.hasUnsavedChanges = this.checkForChanges();
    this.changesPollingSubscription = interval(20).subscribe(() => {
      this.hasUnsavedChanges = this.checkForChanges();
    });
  }

  ngOnDestroy(): void {
    this.changesPollingSubscription?.unsubscribe();
    this.ownershipSubscription?.unsubscribe();
    this.routerEventsSubscription?.unsubscribe();
  }

  private loadCurrentProjectOwner(): void {
    this.ownershipSubscription?.unsubscribe();
    this.ownershipSubscription = this.firebaseService
      .getOwnerEmailForCurrentProject()
      .subscribe({
        next: (ownerEmail) => {
          this.currentProjectOwnerEmail = ownerEmail;
          this.updateOwnershipState();
        },
        error: () => {
          this.currentProjectOwnerEmail = null;
          this.isCurrentUserProjectOwner = false;
        },
      });
  }

  private updateOwnershipState(): void {
    const currentUserEmail = this.authService.currentUserSignal()?.email;
    if (!currentUserEmail || !this.currentProjectOwnerEmail) {
      this.isCurrentUserProjectOwner = false;
      return;
    }

    this.isCurrentUserProjectOwner =
      currentUserEmail.toLowerCase() ===
      this.currentProjectOwnerEmail.toLowerCase();
  }

  public checkForChanges(): boolean {
    const legacyObjects = this.parseAndNormalizeModelData(
      localStorage.getItem('model-data-old'),
    );
    const currentObjects = this.parseAndNormalizeModelData(
      localStorage.getItem('model-data'),
    );
    return (
      this.stableStringify(legacyObjects) !==
      this.stableStringify(currentObjects)
    );
  }

  private parseAndNormalizeModelData(rawData: string | null): unknown {
    if (!rawData) {
      return [];
    }

    try {
      const parsed = JSON.parse(rawData) as unknown;
      return this.normalizeForComparison(parsed);
    } catch {
      return rawData;
    }
  }

  private normalizeForComparison(value: unknown): unknown {
    if (Array.isArray(value)) {
      const normalizedArray = value
        .filter((item) => {
          if (!item || typeof item !== 'object') {
            return true;
          }
          return (item as Record<string, unknown>)['ghost'] !== true;
        })
        .map((item) => this.normalizeForComparison(item));

      if (
        normalizedArray.every(
          (item) => !!item && typeof item === 'object' && !Array.isArray(item),
        )
      ) {
        return (normalizedArray as Record<string, unknown>[]).sort((a, b) => {
          const aId = String(a['id'] ?? '');
          const bId = String(b['id'] ?? '');
          return aId.localeCompare(bId);
        });
      }

      return normalizedArray;
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const result: Record<string, unknown> = {};
      for (const key of Object.keys(obj)) {
        if (key === 'selected' || key === 'ghost' || key === 'new') {
          continue;
        }
        result[key] = this.normalizeForComparison(obj[key]);
      }
      return result;
    }

    return value;
  }

  private stableStringify(value: unknown): string {
    return JSON.stringify(this.sortKeysDeep(value));
  }

  private sortKeysDeep(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortKeysDeep(item));
    }

    if (value && typeof value === 'object') {
      const obj = value as Record<string, unknown>;
      const sorted: Record<string, unknown> = {};
      const keys = Object.keys(obj).sort((a, b) => a.localeCompare(b));
      for (const key of keys) {
        sorted[key] = this.sortKeysDeep(obj[key]);
      }
      return sorted;
    }

    return value;
  }

  saveProjectToFirebase() {
    this.globalService.openSaveProjectPopup(!this.isCurrentUserProjectOwner, !this.isCurrentUserProjectOwner);
  }

  saveToLocalFile() {
    this.fileService.save();
  }

  exportAsJSON() {
    this.fileService.save();
  }

  exportAsSTEP() {
    this.fileService.saveAsSTEP();
  }

  exportAsSTL() {
    this.fileService.saveAsSTL();
  }

  uploadFromLocalFile() {
    this.fileService.upload();
  }

  rectangle() {
    this.drawService.rectangle();
  }

  circle() {
    this.drawService.circle();
  }

  freeform() {
    this.drawService.freeform();
  }

  updateSettings(event: MatSlideToggleChange): void {
    this.autosave = event.checked;
    this.settingsService.updateSettings('autosave', this.autosave);
  }

  login(): void {
    this.router.navigate(['/login']);
  }

  register(): void {
    this.router.navigate(['/register']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  home(): void {
    this.router.navigate(['/overview']);
  }
}
