import { Injectable } from '@angular/core';
import { Draw } from './draw.service';
import { StlService } from './stl.service';
import { StepService } from './step.service';
import { DialogService } from './dialog.service';

@Injectable({
  providedIn: 'root',
})
export class File {
  constructor(
    private drawService: Draw,
    private stlService: StlService,
    private stepService: StepService,
    private dialogService: DialogService,
  ) {}

  save() {
    const modelDataString = JSON.stringify(this.drawService.loadObjects());
    const jsonToSave = modelDataString ? modelDataString : JSON.stringify([]);
    const a = Object.assign(document.createElement('a'), {
      href: URL.createObjectURL(
        new Blob([jsonToSave], { type: 'application/json' }),
      ),
      download: 'model-data.json',
    });
    a.click();
    URL.revokeObjectURL(a.href);
  }

  saveAsSTEP() {
    this.stepService.convertAndDownload();
  }

  saveAsSTL() {
    this.stlService.downloadStlFromJsonString(
      JSON.stringify(this.drawService.loadObjects()),
      'model.stl',
    );
  }

  async upload() {
    const confirmed = await this.dialogService.confirm(
      'Upload File',
      'Uploading a file will overwrite all changes in the current project. Do you want to continue?',
      'Continue',
    );
    if (!confirmed) return;

    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/json';
    input.onchange = async () => {
      const file = input.files && input.files[0];
      if (!file) return;

      try {
        const text = await file.text();
        // Validate JSON before saving
        JSON.parse(text);
        // Save uploaded file content to localStorage under 'model-data'
        localStorage.setItem('model-data', text);
        await this.dialogService.alert(
          'Upload Successful',
          'File was uploaded and saved as "model-data".',
        );
        this.drawService.reload$.next();
      } catch (error) {
        console.error('Error uploading file:', error);
        await this.dialogService.alert(
          'Invalid File',
          'Invalid JSON file. Please check the format.',
        );
      }
    };
    input.click();
  }
}
