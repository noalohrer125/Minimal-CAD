import 'zone.js';
import 'zone.js/testing';
import 'whatwg-fetch';
import { TextEncoder, TextDecoder } from 'util';
import { getTestBed } from '@angular/core/testing';
import {
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting,
} from '@angular/platform-browser-dynamic/testing';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder as any;

// TestBed initialisieren
getTestBed().initTestEnvironment(
  BrowserDynamicTestingModule,
  platformBrowserDynamicTesting(),
);
