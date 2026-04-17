import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { setupZoneTestEnv } from 'jest-preset-angular/setup-env/zone';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// Polyfill required by the Firestore gRPC transport layer in jsdom
if (typeof global.setImmediate === 'undefined') {
  (global as any).setImmediate = (
    fn: (...args: any[]) => void,
    ...args: any[]
  ) => global.setTimeout(fn, 0, ...args);
}

setupZoneTestEnv();
