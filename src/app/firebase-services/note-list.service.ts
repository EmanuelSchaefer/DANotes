import { Injectable, inject } from '@angular/core';
import { Note } from '../interfaces/note.interface'
import { Firestore, collection, doc, addDoc, onSnapshot, updateDoc, deleteDoc, where, orderBy, limit, query } from '@angular/fire/firestore';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class NoteListService {
  trashNotes: Note[] = [];
  normalNotes: Note[] = [];
  normalMarkedNotes: Note[] = [];

  unsubTrash;
  unsubNotes;
  unsubMarkedNotes;

  firestore: Firestore = inject(Firestore);

  constructor() {
    this.unsubNotes = this.subNotesList();
    this.unsubMarkedNotes = this.subMarkedNotesList();
    this.unsubTrash = this.subTrashList();
  }

  async deleteNote(colId: "notes" | "trash", docId: string) {
    await deleteDoc(this.getSingleDocRef(colId, docId)).catch(
      (err) => { console.log(err) }
    )
  }

  async updateNote(note: Note) {
    if (note.id) {
      let docRef = this.getSingleDocRef(this.getColIdFromNote(note), note.id);
      await updateDoc(docRef, this.getCleanJson(note)).catch(
        (err) => { console.log(err); }
      );
    }
  }

  getCleanJson(note: Note): {} {
    return {
      type: note.type,
      title: note.title,
      content: note.content,
      marked: note.marked,
    }
  }

  getColIdFromNote(note: Note) {
    if (note.type == 'note') {
      return 'notes'
    } else {
      return 'trash'
    }
  }

  async addNote(item: Note, colId: "notes" | "trash") {
    const collectionRef = colId === 'notes' ? this.getNotesRef() : this.getTrashRef();

    await addDoc(collectionRef, item).catch(
      (err) => { console.error(err); }
    ).then(
      (docRef) => { console.log("Document written with ID:", docRef?.id); }
    );
  }


  ngonDestroy() { // zum beänden
    this.unsubNotes();
    this.unsubTrash();
    this.unsubMarkedNotes();
  }

  subTrashList() {
    return onSnapshot(this.getTrashRef(), (list) => {
      this.trashNotes = [];
      list.forEach(element => {
        this.trashNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  subNotesList() {
    let ref = collection(this.firestore, "notes/c9ynzIcnlMJGXYu16VNS/notesExtra");
    const q = query(ref, limit(100));
    return onSnapshot(q, (list) => {  // onSnapshot steht für Echtzeit-Updates.
      this.normalNotes = [];
      list.forEach((element: any) => {
        this.normalNotes.push(this.setNoteObject(element.data(), element.id));
      });
      list.docChanges().forEach((change) => {
        if (change.type === "added") {
          console.log("New note:", change.doc.data());
        }
        if (change.type === "modified") {
          console.log("Modified note:", change.doc.data());
        }
        if (change.type === "removed") {
          console.log("Removed note:", change.doc.data());
        }
      });
    });
  }

  subMarkedNotesList() {
    const q = query(this.getNotesRef(), where("marked", "==", true), limit(100));
    return onSnapshot(q, (list) => {
      this.normalMarkedNotes = [];
      list.forEach((element: any) => {
        this.normalMarkedNotes.push(this.setNoteObject(element.data(), element.id));
      });
    });
  }

  setNoteObject(obj: any, id: string): Note {
    return {
      id: id,
      type: obj.type || "note",
      title: obj.title || "",
      content: obj.content || "",
      marked: obj.marked || false
    }
  }

  ngOnDestroy() {

  }

  getNotesRef() {      // Datenbank    //key
    return collection(this.firestore, 'notes');
  }

  getTrashRef() {      // Datenbank    //key
    return collection(this.firestore, 'trash');
  }

  // doc steht für alleine also wen man ein eigenes element vom firestore abrufen will.
  getSingleDocRef(colId: string, docId: string) {
    return doc(this.firestore, colId, docId);
  }

}