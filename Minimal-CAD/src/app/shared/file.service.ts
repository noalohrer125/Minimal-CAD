import { Injectable } from '@angular/core';
import { Draw } from './draw.service';
import * as THREE from 'three';
import { STLExporter } from 'three-stdlib';
import { FormObject, FreeObject, FreeObjectCommand } from '../interfaces';
import { StlService } from './stl.service';

@Injectable({
    providedIn: 'root'
})
export class File {
    constructor(
        private drawService: Draw,
        private stlService: StlService
    ) { }

    save() {
        const modelDataString = JSON.stringify(this.drawService.loadObjects());
        const jsonToSave = modelDataString ? modelDataString : JSON.stringify([]);
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([jsonToSave], { type: 'application/json' })),
            download: 'model-data.json'
        });
        a.click();
        URL.revokeObjectURL(a.href);
    }

    saveAsSTEP() {
        alert('STEP export requires a backend API.\n\nRecommendation: Set up a Python backend with pythonOCC to convert your JSON parameters to STEP format.');
        console.log('For STEP export, consider using: pythonOCC-core (Python + OpenCASCADE)');
    }

    saveAsSTL() {
        this.stlService.downloadStlFromJsonString(JSON.stringify(this.drawService.loadObjects()), 'model.stl');
    }

    upload() {
        const confirmed = window.confirm(
            "Uploading a file will overwrite all changes in the current project. Sure you want to continue?"
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
                // Save uploaded file content to localStorage under 'model-data'
                localStorage.setItem('model-data', text);
                alert('File uploaded and data saved to localStorage as "model-data".');
                this.drawService.reload$.next();
            } catch (e) {
                alert('Invalid JSON file.');
            }
        };
        input.click();
    }
}
