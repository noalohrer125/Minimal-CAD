import { Injectable } from '@angular/core';
import {
  DEFAULT_VIEW,
  FormObject,
  FreeObject,
  Project,
  ProjectVersionSnapshot,
  projectSavingResult,
  view,
} from '../interfaces';
import { FirebaseService } from './firebase.service';
import { BehaviorSubject, firstValueFrom, Observable } from 'rxjs';
import { Timestamp } from '@angular/fire/firestore';
import { ProjectThumbnailService } from './project-thumbnail.service';

@Injectable({
  providedIn: 'root',
})
export class Draw {
  constructor(
    private firebaseService: FirebaseService,
    private projectThumbnailService: ProjectThumbnailService,
  ) {}

  public reload$: BehaviorSubject<void> = new BehaviorSubject<void>(undefined);

  public canUndo$ = new BehaviorSubject<boolean>(false);
  public canRedo$ = new BehaviorSubject<boolean>(false);

  async refreshVersionState(): Promise<void> {
    const projectId = localStorage.getItem('project-id');
    if (!projectId || projectId === 'notExisting') {
      this.canUndo$.next(false);
      this.canRedo$.next(false);
      return;
    }
    try {
      const allSnapshots = await firstValueFrom(
        this.firebaseService.getProjectVersionSnapshots(projectId),
      );
      const sorted = [...allSnapshots].sort(
        (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis(),
      );
      const currentId = localStorage.getItem('version-current-id');
      const idx = currentId
        ? sorted.findIndex((s) => s.id === currentId)
        : sorted.length - 1;
      const effectiveIdx = idx === -1 ? sorted.length - 1 : idx;
      this.canUndo$.next(effectiveIdx > 0);
      this.canRedo$.next(effectiveIdx < sorted.length - 1);
    } catch {
      this.canUndo$.next(false);
      this.canRedo$.next(false);
    }
  }

  async undoVersion(): Promise<void> {
    const projectId = localStorage.getItem('project-id');
    if (!projectId || projectId === 'notExisting') return;
    try {
      const allSnapshots = await firstValueFrom(
        this.firebaseService.getProjectVersionSnapshots(projectId),
      );
      const sorted = [...allSnapshots].sort(
        (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis(),
      );
      if (sorted.length === 0) return;
      const currentId = localStorage.getItem('version-current-id');
      const idx = currentId
        ? sorted.findIndex((s) => s.id === currentId)
        : sorted.length - 1;
      const effectiveIdx = idx === -1 ? sorted.length - 1 : idx;
      if (effectiveIdx <= 0) return;
      const target = sorted[effectiveIdx - 1];
      this.applySnapshot(target);
      localStorage.setItem('version-current-id', target.id);
      await firstValueFrom(
        this.firebaseService.updateProjectVersionState(
          projectId,
          target.id,
          sorted.length,
        ),
      );
      this.reload$.next();
      await this.refreshVersionState();
    } catch (error) {
      console.error('Error during undo:', error);
    }
  }

  async redoVersion(): Promise<void> {
    const projectId = localStorage.getItem('project-id');
    if (!projectId || projectId === 'notExisting') return;
    try {
      const allSnapshots = await firstValueFrom(
        this.firebaseService.getProjectVersionSnapshots(projectId),
      );
      const sorted = [...allSnapshots].sort(
        (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis(),
      );
      if (sorted.length === 0) return;
      const currentId = localStorage.getItem('version-current-id');
      const idx = currentId
        ? sorted.findIndex((s) => s.id === currentId)
        : sorted.length - 1;
      const effectiveIdx = idx === -1 ? sorted.length - 1 : idx;
      if (effectiveIdx >= sorted.length - 1) return;
      const target = sorted[effectiveIdx + 1];
      this.applySnapshot(target);
      localStorage.setItem('version-current-id', target.id);
      await firstValueFrom(
        this.firebaseService.updateProjectVersionState(
          projectId,
          target.id,
          sorted.length,
        ),
      );
      this.reload$.next();
      await this.refreshVersionState();
    } catch (error) {
      console.error('Error during redo:', error);
    }
  }

  private applySnapshot(snapshot: ProjectVersionSnapshot): void {
    const objects = snapshot.objects.map((obj) => ({
      ...obj,
      selected: false,
      ghost: false,
    }));
    localStorage.setItem('model-data', JSON.stringify(objects));
    localStorage.setItem('model-data-old', JSON.stringify(objects));
  }

  loadObjects(): (FormObject | FreeObject)[] {
    const modelDataString = localStorage.getItem('model-data');
    const data = modelDataString
      ? (JSON.parse(modelDataString) as (FormObject | FreeObject)[])
      : [];
    if (data) {
      return data;
    }
    return [];
  }

  async loadObjectsByProjectId(
    projectId: string,
  ): Promise<(FormObject | FreeObject)[]> {
    if (!projectId) {
      return [];
    }

    try {
      return new Promise((resolve, reject) => {
        this.loadObjectsFirebase(projectId).subscribe({
          next: (firebaseData) => {
            localStorage.setItem(
              'model-data',
              JSON.stringify(firebaseData as (FormObject | FreeObject)[]),
            );
            resolve(firebaseData as (FormObject | FreeObject)[]);
          },
          error: (err) => {
            console.error('Error loading objects from Firebase:', err);
            reject(new Error('Error loading objects. Please try again.'));
          },
        });
      });
    } catch (error) {
      console.error('Error loading objects by project ID:', error);
      throw new Error('Error loading objects. Please try again.');
    }
  }

  loadObjectsFirebase(
    projectId: string,
  ): Observable<(FormObject | FreeObject)[]> {
    return new Observable<(FormObject | FreeObject)[]>((observer) => {
      this.firebaseService.getObjectsByProjectId(projectId).subscribe({
        next: (firebaseObjects: (FormObject | FreeObject)[]) => {
          const normalizedObjects = firebaseObjects.map((obj) => ({
            ...obj,
            selected: false,
            ghost: false,
          }));
          localStorage.setItem('model-data', JSON.stringify(normalizedObjects));
          localStorage.setItem(
            'model-data-old',
            JSON.stringify(normalizedObjects),
          );
          observer.next(normalizedObjects);
          observer.complete();
        },
        error: (err) => {
          console.error('Failed to load Firebase objects', err);
          observer.error(err);
        },
      });
    });
  }

  setView(position: view): void {
    localStorage.setItem('view', position ? JSON.stringify(position) : '');
  }

  getView(): view {
    const viewString = localStorage.getItem('view');
    return viewString ? (JSON.parse(viewString) as view) : DEFAULT_VIEW;
  }

  saveObject(object: FormObject | FreeObject, newId: string = object.id): void {
    let modelData = this.loadObjects();
    const existingIndex = modelData.findIndex(
      (obj: FormObject | FreeObject) => obj.id === object.id && !obj.ghost,
    );

    if (existingIndex === -1) {
      // New object
      modelData.push({ ...object, id: newId });
    } else {
      // Update existing object
      modelData[existingIndex] = { ...object, id: newId };
    }

    // Remove all ghost objects and deselect all objects
    modelData = modelData.filter((obj) => !obj.ghost);
    modelData.forEach((obj) => (obj.selected = false));
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  async saveProjectToFirebase(
    projectName: string,
    isPrivate: boolean,
    newProject: boolean = false,
  ): Promise<projectSavingResult> {
    try {
      // Determine project ID first
      const isExistingProject =
        localStorage.getItem('project-id') || 'notExisting';
      let projectId: string | null = null;
      if (isExistingProject !== 'notExisting' && !newProject) {
        projectId = isExistingProject;
      } else {
        projectId = this.generateId();
      }

      const currentUserEmail = this.firebaseService.getCurrentUserEmail();
      if (!currentUserEmail) {
        throw new Error('User not authenticated');
      }

      let modelData = this.loadObjects().filter((obj) => !obj.ghost);
      modelData.forEach((obj) => (obj.selected = false));
      const thumbnailDataUrl =
        this.projectThumbnailService.createProjectThumbnail(modelData);

      const project: Project = {
        id: projectId,
        name: projectName,
        licenceKey: isPrivate ? this.generateHash(this.generateId()) : 'public',
        ownerEmail: currentUserEmail,
        createdAt: Timestamp.now(),
        ...(thumbnailDataUrl ? { thumbnailDataUrl } : {}),
      };

      // Save project first to create the document
      await new Promise<void>((resolve, reject) => {
        this.firebaseService.saveProject(project).then((obs) => {
          obs.subscribe({
            next: () => resolve(),
            error: (err) => reject(err),
          });
        });
      });

      // Then save all objects to the project's subcollection
      await Promise.all(
        modelData.map((obj) => {
          return new Promise((resolve, reject) => {
            this.firebaseService.saveObject(projectId!, obj).subscribe({
              next: () => resolve(true),
              error: (err) => {
                console.error('Failed to save object to Firebase: ', err);
                reject(err);
              },
            });
          });
        }),
      );

      await this.firebaseService.cleanupObjects(
        projectId,
        modelData.map((obj) => obj.id),
      );

      localStorage.setItem('project-id', projectId);
      return {
        success: true,
        projectName: project.name,
        licenceKey: project.licenceKey,
        projectId: project.id,
        error: '',
      };
    } catch (error) {
      console.error('Error saving project to Firebase:', error);
      return {
        success: false,
        projectName: projectName,
        licenceKey: '',
        projectId: '',
        error: 'Error saving project. Please try again.',
      };
    }
  }

  async saveVersionCommitToFirebase(projectName: string): Promise<void> {
    try {
      const projectId = localStorage.getItem('project-id');
      if (!projectId || projectId === 'notExisting') {
        return;
      }

      let modelData = this.loadObjects().filter((obj) => !obj.ghost);
      modelData.forEach((obj) => (obj.selected = false));

      // If we're not at the newest snapshot (i.e. we did undo), delete all snapshots
      // that are newer than the current position before saving the new commit.
      const existingSnapshots = await firstValueFrom(
        this.firebaseService.getProjectVersionSnapshots(projectId),
      );
      const sortedOldestFirst = [...existingSnapshots].sort(
        (a, b) => a.timestamp.toMillis() - b.timestamp.toMillis(),
      );
      const currentId = localStorage.getItem('version-current-id');
      if (currentId) {
        const currentIdx = sortedOldestFirst.findIndex(
          (s) => s.id === currentId,
        );
        if (currentIdx !== -1 && currentIdx < sortedOldestFirst.length - 1) {
          const futureIds = sortedOldestFirst
            .slice(currentIdx + 1)
            .map((s) => s.id);
          await this.firebaseService.deleteProjectVersionSnapshots(
            projectId,
            futureIds,
          );
        }
      }

      const snapshot: ProjectVersionSnapshot = {
        id: this.generateId(),
        projectId,
        projectName,
        objects: modelData,
        timestamp: Timestamp.now(),
      };

      await firstValueFrom(
        this.firebaseService.saveProjectVersionSnapshot(projectId, snapshot),
      );

      const allSnapshots = await firstValueFrom(
        this.firebaseService.getProjectVersionSnapshots(projectId),
      );

      const sortedByNewest = [...allSnapshots].sort(
        (a, b) => b.timestamp.toMillis() - a.timestamp.toMillis(),
      );

      const snapshotsToDelete = sortedByNewest.slice(10).map((s) => s.id);
      await this.firebaseService.deleteProjectVersionSnapshots(
        projectId,
        snapshotsToDelete,
      );

      const versionCount = sortedByNewest.length - snapshotsToDelete.length;
      localStorage.setItem('version-current-id', snapshot.id);
      await firstValueFrom(
        this.firebaseService.updateProjectVersionState(
          projectId,
          snapshot.id,
          versionCount,
        ),
      );
      await this.refreshVersionState();
    } catch (error) {
      console.error('Error saving version commit to Firebase:', error);
    }
  }

  createGhostObject(objectId: string): void {
    let modelData = this.loadObjects();
    const originalObject = modelData.find(
      (obj) => obj.id === objectId && !obj.ghost,
    );

    if (
      originalObject &&
      !modelData.some((obj) => obj.id === objectId && obj.ghost)
    ) {
      // Create ghost copy of the original object
      const ghostObject = { ...originalObject, ghost: true, selected: false };
      modelData.push(ghostObject);
      localStorage.setItem('model-data', JSON.stringify(modelData));
    }
  }

  removeGhostObjects(): void {
    let modelData = this.loadObjects();
    modelData = modelData.filter((obj) => !obj.ghost);
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  deselectAllObjects(): void {
    let modelData = this.loadObjects();
    modelData.forEach((obj) => (obj.selected = false));
    localStorage.setItem('model-data', JSON.stringify(modelData));
  }

  generateId(): string {
    return Date.now().toString() + Math.random().toString(36);
  }

  generateHash(string: string): string {
    let hash = 0;
    for (const char of string) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0; // Constrain to 32bit integer
    }
    return hash.toString();
  }

  rectangle() {
    const newObject: FormObject = {
      id: this.generateId(),
      name: 'New Rectangle',
      type: 'Square',
      l: 1,
      w: 1,
      h: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      selected: true,
    };
    localStorage.setItem(
      'model-data',
      JSON.stringify([...this.loadObjects(), newObject]),
    );
    this.reload$.next();
  }

  circle() {
    const newObject: FormObject = {
      id: this.generateId(),
      name: 'New Circle',
      type: 'Circle',
      r: 1,
      h: 0,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      curveSegments: 100,
      selected: true,
    };
    localStorage.setItem(
      'model-data',
      JSON.stringify([...this.loadObjects(), newObject]),
    );
    this.reload$.next();
  }

  freeform() {
    const newObject: FreeObject = {
      id: this.generateId(),
      name: 'New Freeform',
      type: 'Freeform',
      commands: [
        {
          type: 'moveTo',
          x: 0,
          y: 0,
          new: false,
        },
        {
          type: 'lineTo',
          x: 1,
          y: 0,
          new: false,
        },
        {
          type: 'lineTo',
          x: 1,
          y: 1,
          new: false,
        },
      ],
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      h: 2,
      selected: true,
    };
    localStorage.setItem(
      'model-data',
      JSON.stringify([...this.loadObjects(), newObject]),
    );
    this.reload$.next();
  }
}
