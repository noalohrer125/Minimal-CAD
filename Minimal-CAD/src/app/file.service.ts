import { Injectable, model } from '@angular/core';
import modelDataJson from './models/model-data.json' assert { type: "json" };
import { FormObject, LineObject } from './interfaces';

const modelData: (FormObject | LineObject)[] = modelDataJson as (FormObject | LineObject)[];

@Injectable({
    providedIn: 'root'
})
export class File {
    save() {
        const a = Object.assign(document.createElement('a'), {
            href: URL.createObjectURL(new Blob([JSON.stringify(model)], { type: 'application/json' })),
            download: 'model-data.json'
        });
        a.click();
        URL.revokeObjectURL(a.href);
    }

    upload() {
        const confirmed = window.confirm(
            "Uploading a file will overwrite all changes in the current file. Do you want to continue?"
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
            } catch (e) {
                alert('Invalid JSON file.');
            }
        };
        input.click();
    }
}
