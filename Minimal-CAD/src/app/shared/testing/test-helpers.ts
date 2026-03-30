import { TestBed } from '@angular/core/testing';
import { createFirebaseServiceMock } from './mock-firebase';

export function setupBasicTestingModule(providers: any[] = []) {
    TestBed.configureTestingModule({
        providers: [
            ...providers
        ]
    });
}

export function createFirebaseMock(overrides: any = {}) {
    return createFirebaseServiceMock(overrides);
}
