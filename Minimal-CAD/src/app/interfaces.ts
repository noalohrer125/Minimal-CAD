export interface FormObject {
    name: string;
    type: 'Square' | 'Circle' | 'Freeform';
    size: number[]; // [x, y, z] / [radius, z] for circles
    position: [number, number, number]; // [x, y, z]
}

export interface FreeObject {
    name: string;
    type: 'Freeform';
    size: [[number, number]]; // Array of numbers representing the size
    position: [number, number, number]; // [x, y, z]
}
