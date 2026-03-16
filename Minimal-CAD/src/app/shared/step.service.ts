import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StlService } from './stl.service';
import { Draw } from './draw.service';
import { DialogService } from './dialog.service';
import { environment } from '../../environments/environment';
import { EMPTY } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class StepService {
  private readonly apiBaseUrl = environment.stlStepApiBaseUrl.replace(/\/+$/, '');
  private readonly convertUrl = `${this.apiBaseUrl}/convert`;
  private readonly downloadUrl = `${this.apiBaseUrl}/download`;

  constructor(
    private http: HttpClient,
    private stlService: StlService,
    private drawService: Draw,
    private dialogService: DialogService,
  ) {}

  convertAndDownload(): void {
    try {
      const modelJson = JSON.stringify(this.drawService.loadObjects());

      this.stlService
        .uploadStlFromJsonString(modelJson)
        .pipe(
          switchMap(() => this.http.get(this.convertUrl)),
          switchMap(() =>
            this.http.get(this.downloadUrl, { responseType: 'blob' }),
          ),
          catchError((error) => {
            console.error('Error converting/downloading STEP file:', error);
            this.dialogService.alert(
              'Error',
              'STEP conversion failed. Maybe the server is not running. Try again later.',
            );
            return EMPTY;
          }),
        )
        .subscribe((blob) => this.downloadStepBlob(blob));
    } catch (error) {
      console.error('Error in convertAndDownload:', error);
      this.dialogService.alert(
        'Error',
        'Failed to convert file. Please try again later.',
      );
    }
  }

  private downloadStepBlob(blob: Blob): void {
    try {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'output.step';
      link.click();
      window.URL.revokeObjectURL(url);
      console.log('STEP file downloaded successfully');
    } catch (error) {
      console.error('Error creating download link:', error);
      this.dialogService.alert('Error', 'Failed to download STEP file.');
    }
  }
}
