import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export type UiDialogType = 'alert' | 'confirm' | 'prompt';

export interface UiDialogData {
  type: UiDialogType;
  title: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  value?: string;
}

@Component({
  selector: 'app-ui-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>

    <mat-dialog-content>
      @if (data.message) {
        <p>{{ data.message }}</p>
      }

      @if (data.type === 'prompt') {
        <mat-form-field
          appearance="outline"
          style="width: 100%; margin-top: 8px;"
        >
          <input matInput [(ngModel)]="inputValue" cdkFocusInitial />
        </mat-form-field>
      }
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      @if (data.type !== 'alert') {
        <button mat-button (click)="closeCancel()">
          {{ data.cancelText || 'Cancel' }}
        </button>
      }
      <button mat-flat-button (click)="closeConfirm()">
        {{ data.confirmText || 'OK' }}
      </button>
    </mat-dialog-actions>
  `,
})
export class UiDialogComponent {
  public inputValue: string;

  constructor(
    private dialogRef: MatDialogRef<UiDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UiDialogData,
  ) {
    this.inputValue = data.value ?? '';
  }

  closeCancel(): void {
    this.dialogRef.close(null);
  }

  closeConfirm(): void {
    if (this.data.type === 'prompt') {
      this.dialogRef.close(this.inputValue);
      return;
    }

    this.dialogRef.close(true);
  }
}
