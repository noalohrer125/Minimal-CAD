export interface FormObject {
    name: string;
    type: 'Square' | 'Circle' | 'Line';
    size: number[]; // [x, y, z] for squares and lines / [radius, z] for circles
    position: [number, number, number]; // [x, y, z]
}

export interface FreeObject {
    name: string;
    type: 'Freeform';
    size: [[number, number]]; // Array of number pairs for positions of endpoints
    position: [number, number, number]; // [x, y, z]
}
