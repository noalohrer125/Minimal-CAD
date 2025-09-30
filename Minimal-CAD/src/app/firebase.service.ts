import { inject, Injectable } from '@angular/core';
import { Firestore, addDoc, collection, collectionData, doc, setDoc } from '@angular/fire/firestore';
import { from, Observable } from 'rxjs';
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

  saveObject(object: FormObject | FreeObject): Observable<string> {
    const docRef = addDoc(this.objectsCollection, object).then(
      (response) => response.id
    );
    return from(docRef);
  }
}
