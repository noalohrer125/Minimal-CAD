export interface FormObject {
    id: string;
    name: string;
    type: 'Square' | 'Circle';
    l?: number; // Length for squares
    w?: number; // Width for squares
    h: number; // Height for squares
    r?: number; // Radius for circles
    position: [number, number, number]; // [x, y, z]
}

export interface LineObject {
    id: string;
    name: string;
    type: 'Line';
    start: [number, number, number]; // [x, y, z]
    end: [number, number, number]; // [x, y, z]
}

// export interface FreeObject {
//     name: string;
//     type: 'Freeform';
//     size: [[number, number]]; // Array of number pairs for positions of endpoints
//     position: [number, number, number]; // [x, y, z]
// }
