import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { StlService } from './stl.service';
import { Draw } from './draw.service';

@Injectable({
  providedIn: 'root'
})
export class StepService {
  private apiUrl = 'http://localhost:5000/convert';
  private downloadUrl = 'http://localhost:5000/download';

  constructor(
    private http: HttpClient,
    private stlService: StlService,
    private drawService: Draw
  ) {}

  convertAndDownload(): void {
    this.stlService.downloadStlFromJsonString(JSON.stringify(this.drawService.loadObjects()), 'model.stl', true);
    this.http.get(this.apiUrl).subscribe({
      next: () => {
        console.log('Conversion request sent successfully');
        // Trigger download after conversion completes
        setTimeout(() => this.downloadStepFile(), 1000);
      },
      error: (error) => {
        console.error('Error calling convert endpoint:', error);
      }
    });
  }

  private downloadStepFile(): void {
    this.http.get(this.downloadUrl, { responseType: 'blob' }).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'output.step';
        link.click();
        window.URL.revokeObjectURL(url);
        console.log('STEP file downloaded successfully');
      },
      error: (error) => {
        console.error('Error downloading STEP file:', error);
      }
    });
  }
}
