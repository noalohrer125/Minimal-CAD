import { of } from 'rxjs';

// Provide jest declaration for TypeScript
declare const jest: any;

export function createFirebaseServiceMock(overrides: any = {}) {
    const mock = {
        getObjectsByProjectId: jest.fn((projectId: string) => of([])),
        saveProject: jest.fn((project: any) => Promise.resolve(of('project-id'))),
        saveObject: jest.fn((projectId: string, obj: any) => of('saved')),
        updateObject: jest.fn((projectId: string, obj: any) => of('updated')),
        deleteObject: jest.fn((projectId: string, id: string) => of(void 0)),
        getCurrentUserEmail: jest.fn(() => 'test@example.com'),
        getProjects: jest.fn(() => of([])),
        getPublicProjects: jest.fn(() => of([])),
        getProjectsByOwner: jest.fn((owner: string) => of([])),
        getProjectById: jest.fn((id: string) => of(null)),
        ...overrides
    };
    return mock;
}
