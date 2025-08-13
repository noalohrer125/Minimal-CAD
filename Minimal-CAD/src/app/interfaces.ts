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

export interface view {
    camera: {
        position: {
            x: number,
            y: number,
            z: number
        },
        rotation: {
            x: number,
            y: number,
            z: number
        }
    },
    rootGroup: {
        position: {
            x: number,
            y: number,
            z: number
        },
        rotation: {
            x: number,
            y: number,
            z: number
        }
    }
}

export const DEFAULT_VIEW: view = {
    camera: {
        position: {
            x: 0,
            y: 0,
            z: 10
        },
        rotation: {
            x: 0,
            y: 0,
            z: 0
        }
    },
    rootGroup: {
        position: {
            x: 0,
            y: 0,
            z: 0
        },
        rotation: {
            x: -Math.PI / 3, // 60 degrees down
            y: 0,
            z: -Math.PI / 5 // 36 degrees down
        }
    }
};
