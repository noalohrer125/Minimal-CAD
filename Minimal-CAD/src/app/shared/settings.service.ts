import { Injectable, signal } from '@angular/core';
import { DEFAULT_SETTINGS, Settings, User } from '../interfaces';
import { FirebaseService } from './firebase.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  settings = signal<Settings>({ ...DEFAULT_SETTINGS });

  constructor(private firebaseService: FirebaseService) {}

  loadSettings(): Settings {
    return this.settings();
  }

  saveSettings(settings: Settings): void {
    this.settings.set({ ...settings });

    const currentUserId = this.firebaseService.getCurrentUserId();
    if (!currentUserId) {
      return;
    }

    this.firebaseService.updateUserSettings(currentUserId, settings).subscribe({
      error: (error) => {
        console.error('Error saving settings to Firestore:', error);
      },
    });
  }

  updateSettings<K extends keyof Settings>(
    setting: K,
    value: Settings[K],
  ): void {
    const settings: Settings = { ...this.loadSettings() };
    settings[setting] = value;
    this.saveSettings(settings);
  }

  hydrateSettingsFromUser(user: User | null): void {
    if (!user?.settings) {
      this.settings.set({ ...DEFAULT_SETTINGS });
      return;
    }

    this.settings.set({ ...user.settings });
  }
}
