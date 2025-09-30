import { inject, Injectable } from '@angular/core';
import { Firestore, collection, collectionData } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { FormObject, FreeObject } from './interfaces';

@Injectable({
  providedIn: 'root'
})
export class FirebaseService {
  firestore = inject(Firestore);
  objectsCollection = collection(this.firestore, 'objects');
  

  getObjects(): Observable<FormObject[] | FreeObject[]> {
    return collectionData(this.objectsCollection, {
      idField: 'id'
    }) as Observable<FormObject[] | FreeObject[]>;
  }
}
