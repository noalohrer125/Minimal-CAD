import { Vector3 } from "three";

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

export type FreeObjectCommand =
    | {
        type: 'moveTo' | 'lineTo';
        x: number;
        y: number;
    }
    | {
        type: 'quadraticCurveTo';
        cpX: number;
        cpY: number;
        x: number;
        y: number;
    }
    | {
        type: 'bezierCurveTo';
        cp1X: number;
        cp1Y: number;
        cp2X: number;
        cp2Y: number;
        x: number;
        y: number;
    };

export interface FreeObject {
    id: string;
    name: string;
    type: 'Freeform';
    commands: FreeObjectCommand[]; // shape building steps
    position: [number, number, number]; // world position
    rotation?: [number, number, number]; // optional
}

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
        },
        scale: {
            x: number,
            y: number,
            z: number
        }
    }
};

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
        },
        scale: new Vector3(1, 1, 1)
    }
};
