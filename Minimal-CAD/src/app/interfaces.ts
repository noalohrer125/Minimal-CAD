export interface FormObject {
    id: string;
    name: string;
    type: 'Square' | 'Circle' | 'Line';
    l?: number; // Length for squares and lines
    w?: number; // Width for squares and lines
    h: number; // Height for squares and lines
    r?: number; // Radius for circles
    position: [number, number, number]; // [x, y, z]
}

// export interface FreeObject {
//     name: string;
//     type: 'Freeform';
//     size: [[number, number]]; // Array of number pairs for positions of endpoints
//     position: [number, number, number]; // [x, y, z]
// }
