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
    rotation: [number, number, number]; // optional [x, y, z] in radians
}

export type FreeObjectCommand =
    | {
        type: 'moveTo' | 'lineTo';
        x: number;
        y: number;
        new: boolean;
    }
    | {
        type: 'quadraticCurveTo';
        cpX: number;
        cpY: number;
        x: number;
        y: number;
        new: boolean;
    };

export interface FreeObject {
    id: string;
    name: string;
    type: 'Freeform';
    commands: FreeObjectCommand[]; // shape building steps
    height: number; // extrusion height
    position: [number, number, number]; // world position
    rotation: [number, number, number]; // optional
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
