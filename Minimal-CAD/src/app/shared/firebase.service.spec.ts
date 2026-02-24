import { TestBed } from '@angular/core/testing';
import { firstValueFrom } from 'rxjs';
import { FirebaseService } from './firebase.service';
import { Auth } from '@angular/fire/auth';
import { Firestore, getDocs, getDoc, addDoc, setDoc, deleteDoc } from '@angular/fire/firestore';
jest.mock('@angular/fire/firestore', () => ({
    getDocs: jest.fn(),
    getDoc: jest.fn(),
    addDoc: jest.fn(),
    setDoc: jest.fn(),
    deleteDoc: jest.fn(),
    doc: jest.fn(),
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    Firestore: function Firestore() { },
}));

import * as firestoreModule from '@angular/fire/firestore';

describe('FirebaseService', () => {
    let service: FirebaseService;
    const authMock: any = { currentUser: { email: 'test@example.com' } };
    const firestoreMock: any = {};

    beforeEach(() => {
        jest.resetAllMocks();
        TestBed.configureTestingModule({
            providers: [
                FirebaseService,
                { provide: Auth, useValue: authMock },
                { provide: Firestore, useValue: firestoreMock }
            ]
        });
        service = TestBed.inject(FirebaseService);
    });

    describe('Authentication', () => {
        it('TC-FB-001: should return current user email', () => {
            authMock.currentUser = { email: 'me@x.com' };
            expect(service.getCurrentUserEmail()).toBe('me@x.com');
        });

        it('TC-FB-002: should return null when no current user', () => {
            authMock.currentUser = null;
            expect(service.getCurrentUserEmail()).toBeNull();
        });
    });

    describe('Project Operations', () => {
        it('TC-FB-003: should get all projects', async () => {
            (firestoreModule.getDocs as jest.Mock).mockResolvedValueOnce({ docs: [{ id: 'p1', data: () => ({ name: 'P1' }) }] } as any);
            const obs = service.getProjects();
            const res = await firstValueFrom(obs);
            expect(res[0].id).toBe('p1');
        });

        it('TC-FB-004: should get public projects', async () => {
            (firestoreModule.getDocs as jest.Mock).mockResolvedValueOnce({ docs: [{ id: 'pub', data: () => ({ licenceKey: 'public' }) }] } as any);
            const obs = service.getPublicProjects();
            const res = await firstValueFrom(obs);
            expect(res[0].licenceKey).toBe('public');
        });

        it('TC-FB-005: should get projects by owner', async () => {
            (firestoreModule.getDocs as jest.Mock).mockResolvedValueOnce({ docs: [{ id: 'o1', data: () => ({ ownerEmail: 'me@x.com' }) }] } as any);
            const obs = service.getProjectsByOwner('me@x.com');
            const res = await firstValueFrom(obs);
            expect(res[0].ownerEmail).toBe('me@x.com');
        });

        it('TC-FB-006: should get project by id', async () => {
            (firestoreModule.getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true, data: () => ({ name: 'Proj' }) } as any);
            const obs = service.getProjectById('p1');
            const res = await firstValueFrom(obs);
            expect(res).toBeTruthy();
            expect(JSON.parse(JSON.stringify(res)).name).toBe('Proj');
        });

        it('TC-FB-007: should save project', async () => {
            (firestoreModule.setDoc as jest.Mock).mockResolvedValueOnce(undefined as any);
            const project = { id: 'p1', name: 'P' } as any;
            const obsPromise = await service.saveProject(project as any);
            const val = await firstValueFrom(obsPromise);
            expect(firestoreModule.setDoc).toHaveBeenCalled();
            expect(val).toBe('p1');
        });
    });

    describe('Object Operations', () => {
        it('TC-FB-008: should get objects by project id', async () => {
            (firestoreModule.getDocs as jest.Mock).mockResolvedValueOnce({ docs: [{ id: 'o1', data: () => ({ id: 'o1' }) }] } as any);
            const obs = service.getObjectsByProjectId('proj1');
            const res = await firstValueFrom(obs);
            expect(res[0].id).toBe('o1');
        });

        it('TC-FB-009: should save object when not exists (addDoc path)', async () => {
            (firestoreModule.getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => false } as any);
            (firestoreModule.addDoc as jest.Mock).mockResolvedValueOnce({ id: 'newid' } as any);
            const obs = service.saveObject('proj1', { id: 'tmp' } as any);
            const res = await firstValueFrom(obs);
            expect(firestoreModule.addDoc).toHaveBeenCalled();
            expect(res).toBe('newid');
        });

        it('TC-FB-010: should update existing object (setDoc path)', async () => {
            (firestoreModule.getDoc as jest.Mock).mockResolvedValueOnce({ exists: () => true } as any);
            (firestoreModule.setDoc as jest.Mock).mockResolvedValueOnce(undefined as any);
            const obs = service.saveObject('proj1', { id: 'exist' } as any);
            const res = await firstValueFrom(obs);
            expect(firestoreModule.setDoc).toHaveBeenCalled();
            expect(res).toBe('exist');
        });

        it('TC-FB-011: should updateObject and return id', async () => {
            (firestoreModule.setDoc as jest.Mock).mockResolvedValueOnce(undefined as any);
            const obs = service.updateObject('proj', { id: 'u1' } as any);
            const res = await firstValueFrom(obs);
            expect(firestoreModule.setDoc).toHaveBeenCalled();
            expect(res).toBe('u1');
        });
    });

    describe('Error Handling', () => {
        it('TC-FB-012: should deleteObject', async () => {
            (firestoreModule.deleteDoc as jest.Mock).mockResolvedValueOnce(undefined as any);
            const obs = service.deleteObject('proj', 'o1');
            await firstValueFrom(obs);
            expect(firestoreModule.deleteDoc).toHaveBeenCalled();
        });

        it('TC-FB-013: should handle errors when getDocs fails', async () => {
            (firestoreModule.getDocs as jest.Mock).mockRejectedValueOnce(new Error('fail') as any);
            const obs = service.getProjects();
            await expect(firstValueFrom(obs)).rejects.toThrow();
        });
    });
});
