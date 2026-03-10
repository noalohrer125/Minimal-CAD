import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StlService } from './stl.service';
import { Draw } from './draw.service';
import { DialogService } from './dialog.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class StepService {
  private readonly apiBaseUrl = environment.stlStepApiBaseUrl.replace(/\/+$/, '');
  private readonly apiUrl = `${this.apiBaseUrl}/convert`;
  private readonly downloadUrl = `${this.apiBaseUrl}/download`;

  constructor(
    private http: HttpClient,
    private stlService: StlService,
    private drawService: Draw,
    private dialogService: DialogService,
  ) {}

  convertAndDownload(): void {
    try {
      this.stlService.downloadStlFromJsonString(
        JSON.stringify(this.drawService.loadObjects()),
        'model.stl',
        true,
      );
      this.http.get(this.apiUrl).subscribe({
        next: () => {
          console.log('Conversion request sent successfully');
          // Trigger download after conversion completes
          setTimeout(() => this.downloadStepFile(), 1000);
        },
        error: (error) => {
          console.error('Error calling convert endpoint:', error);
          this.dialogService.alert(
            'Error',
            'STEP conversion failed. Make sure the server is running.',
          );
        },
      });
    } catch (error) {
      console.error('Error in convertAndDownload:', error);
      this.dialogService.alert(
        'Error',
        'Failed to convert file. Please try again.',
      );
    }
  }

  private downloadStepFile(): void {
    this.http.get(this.downloadUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
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
      },
      error: (error) => {
        console.error('Error downloading STEP file:', error);
        this.dialogService.alert(
          'Error',
          'Failed to download STEP file from the server.',
        );
      },
    });
  }
}
