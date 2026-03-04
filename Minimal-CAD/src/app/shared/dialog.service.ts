import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { UiDialogComponent } from './ui-dialog/ui-dialog.component';

@Injectable({
  providedIn: 'root',
})
export class DialogService {
  constructor(private dialog: MatDialog) {}

  async alert(
    title: string,
    message?: string,
    confirmText = 'OK',
  ): Promise<void> {
    const ref = this.dialog.open(UiDialogComponent, {
      data: {
        type: 'alert',
        title,
        message,
        confirmText,
      },
      width: '420px',
    });

    await firstValueFrom(ref.afterClosed());
  }

  async confirm(
    title: string,
    message?: string,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
  ): Promise<boolean> {
    const ref = this.dialog.open(UiDialogComponent, {
      data: {
        type: 'confirm',
        title,
        message,
        confirmText,
        cancelText,
      },
      width: '420px',
    });

    const result = await firstValueFrom(ref.afterClosed());
    return result === true;
  }

  async prompt(
    title: string,
    message?: string,
    value = '',
    confirmText = 'OK',
    cancelText = 'Cancel',
  ): Promise<string | null> {
    const ref = this.dialog.open(UiDialogComponent, {
      data: {
        type: 'prompt',
        title,
        message,
        value,
        confirmText,
        cancelText,
      },
      width: '460px',
    });

    const result = await firstValueFrom(ref.afterClosed());
    if (typeof result !== 'string') {
      return null;
    }

    return result;
  }
}
