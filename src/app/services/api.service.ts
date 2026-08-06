import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, from, of } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { db } from '../../environments/environment';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  query,
  where
} from 'firebase/firestore';

export interface RoomData {
  id?: string;
  name: string;
  description?: string;
  category: string; // 'estudio' | 'academica' | 'social' | 'urgente' | 'direct'
  icon?: string;
  accentColor?: string;
  createdBy: string;
  members?: string[]; // email or user IDs
  createdAt?: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private apiUrl = 'http://localhost:3000';
  private currentUser: any = null;

  constructor(private http: HttpClient) {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      this.currentUser = JSON.parse(saved);
    }
  }

  // Register user in Firestore
  register(userData: { email: string; password: string; displayName?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData).pipe(
      tap((user: any) => this.setCurrentUser(user)),
      catchError((httpErr) => {
        console.warn('⚠️ Conexión HTTP al backend no disponible (status 0). Conectando directamente a Firebase Firestore SDK...', httpErr);
        return from(this.registerDirectFirebase(userData)).pipe(
          tap((user: any) => this.setCurrentUser(user))
        );
      })
    );
  }

  private async registerDirectFirebase(userData: { email: string; password: string; displayName?: string }) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', userData.email));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      throw new Error('El usuario ya existe con ese correo');
    }

    const newDocRef = doc(usersRef);
    const user = {
      id: newDocRef.id,
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName || userData.email.split('@')[0],
      photoURL: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await setDoc(newDocRef, user);
    const { password, ...result } = user;
    return result;
  }

  // Login user in Firestore
  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((user: any) => this.setCurrentUser(user)),
      catchError((httpErr) => {
        console.warn('⚠️ Conexión HTTP al backend no disponible (status 0). Autenticando directamente con Firebase Firestore SDK...', httpErr);
        return from(this.loginDirectFirebase(credentials)).pipe(
          tap((user: any) => this.setCurrentUser(user))
        );
      })
    );
  }

  private async loginDirectFirebase(credentials: { email: string; password: string }) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('email', '==', credentials.email), where('password', '==', credentials.password));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      throw new Error('Correo o contraseña incorrectos');
    }

    const docSnap = snapshot.docs[0];
    const userData = docSnap.data();
    const { password, ...result } = userData;
    return result;
  }

  setCurrentUser(user: any) {
    this.currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
  }

  getCurrentUser() {
    if (!this.currentUser) {
      const saved = localStorage.getItem('currentUser');
      if (saved) {
        this.currentUser = JSON.parse(saved);
      }
    }
    return this.currentUser;
  }

  logout() {
    this.currentUser = null;
    localStorage.removeItem('currentUser');
  }

  // ------------------------------------------------------------------
  // GESTIÓN DE CONTACTOS & CHATS DIRECTOS 1-ON-1
  // ------------------------------------------------------------------
  getAllRegisteredUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users`).pipe(
      catchError(() => from(this.getAllRegisteredUsersFirebase()))
    );
  }

  private async getAllRegisteredUsersFirebase(): Promise<any[]> {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    return snapshot.docs.map(doc => {
      const { password, ...data } = doc.data();
      return data;
    });
  }

  getContacts(): Observable<any[]> {
    const curr = this.getCurrentUser();
    if (!curr) return of([]);

    return from(this.getContactsFirebase(curr.id || curr.email));
  }

  private async getContactsFirebase(userKey: string): Promise<any[]> {
    const contactsRef = collection(db, 'users', userKey, 'contacts');
    const snapshot = await getDocs(contactsRef);
    return snapshot.docs.map(doc => doc.data());
  }

  // AGREGAR CONTACTO + CREAR SALA DE CHAT DIRECTO 1-A-1
  addContact(contactUser: any): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);

    return from(this.addContactAndCreateDirectChat(curr, contactUser));
  }

  private async addContactAndCreateDirectChat(currUser: any, contactUser: any) {
    const currEmail = currUser.email;
    const contactEmail = contactUser.email;
    const currKey = currUser.id || currEmail;
    const contactKey = contactUser.id || contactEmail;

    // 1. Guardar en los contactos del usuario actual
    const contactsRef = collection(db, 'users', currKey, 'contacts');
    const contactDocRef = doc(contactsRef, contactKey);
    const contactData = {
      id: contactKey,
      email: contactEmail,
      displayName: contactUser.displayName || contactEmail.split('@')[0],
      photoURL: contactUser.photoURL || '',
      addedAt: new Date().toISOString()
    };
    await setDoc(contactDocRef, contactData);

    // 2. Guardar también en los contactos del usuario receptor (para que ambos se vean)
    const reciprocalContactsRef = collection(db, 'users', contactKey, 'contacts');
    const reciprocalDocRef = doc(reciprocalContactsRef, currKey);
    const reciprocalData = {
      id: currKey,
      email: currEmail,
      displayName: currUser.displayName || currEmail.split('@')[0],
      photoURL: currUser.photoURL || '',
      addedAt: new Date().toISOString()
    };
    await setDoc(reciprocalDocRef, reciprocalData);

    // 3. Crear o asegurar sala de chat directo 1-a-1
    // Id determinista único para ambos usuarios
    const emailsSorted = [currEmail, contactEmail].sort();
    const roomId = `dm_${emailsSorted[0]}_${emailsSorted[1]}`;
    const roomRef = doc(db, 'rooms', roomId);

    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      const roomPayload = {
        id: roomId,
        name: contactData.displayName,
        description: `Chat privado entre ${currUser.displayName || currEmail} y ${contactData.displayName}`,
        category: 'direct',
        icon: 'person-outline',
        accentColor: 'blue',
        createdBy: currEmail,
        members: [currEmail, contactEmail],
        createdAt: new Date().toISOString(),
        lastMessage: 'Chat iniciado',
        lastMessageTime: 'Ahora',
        unreadCount: 0,
        // Guardamos los nombres de participantes para resolver el nombre mostrado a cada usuario
        participantNames: {
          [currEmail]: currUser.displayName || currEmail.split('@')[0],
          [contactEmail]: contactData.displayName
        }
      };
      await setDoc(roomRef, roomPayload);
    }

    return contactData;
  }

  // ------------------------------------------------------------------
  // GESTIÓN DE SALAS Y GRUPOS CON FILTRADO ESTRICTO DE MIEMBROS
  // ------------------------------------------------------------------

  getIconForCategory(category: string, name: string = ''): { icon: string; accentColor: string } {
    const n = name.toLowerCase();
    if (category === 'estudio' || n.includes('estudio') || n.includes('tarea') || n.includes('cálculo') || n.includes('matemática')) {
      return { icon: 'book-outline', accentColor: 'green' };
    }
    if (category === 'academica' || n.includes('clase') || n.includes('examen') || n.includes('profesor')) {
      return { icon: 'school-outline', accentColor: 'blue' };
    }
    if (category === 'urgente' || n.includes('aviso') || n.includes('urgente') || n.includes('importante')) {
      return { icon: 'megaphone-outline', accentColor: 'red' };
    }
    if (n.includes('proyecto') || n.includes('código') || n.includes('software')) {
      return { icon: 'rocket-outline', accentColor: 'orange' };
    }
    return { icon: 'chatbubbles-outline', accentColor: 'blue' };
  }

  // Obtener salas filtradas ESTRICTAMENTE por miembros (solo salas donde pertenezca el usuario)
  getRooms(category?: string): Observable<any[]> {
    const curr = this.getCurrentUser();
    if (!curr) return of([]);

    return from(this.getRoomsForUserFirebase(curr.email, category));
  }

  private async getRoomsForUserFirebase(userEmail: string, category?: string): Promise<any[]> {
    const roomsRef = collection(db, 'rooms');
    const snapshot = await getDocs(roomsRef);

    const userRooms = snapshot.docs
      .map(doc => doc.data())
      .filter(room => {
        const members: string[] = room['members'] || [];
        const createdBy: string = room['createdBy'] || '';

        // SOLO si el usuario actual es miembro o creador de la sala
        const isMember = members.includes(userEmail) || createdBy === userEmail;
        if (!isMember) return false;

        // Filtrado opcional por categoría
        if (category && category !== 'todas') {
          return room['category'] === category;
        }
        return true;
      })
      .map(room => {
        // Para salas de chat directo 1-a-1, personalizar el nombre del contacto
        if (room['category'] === 'direct' && room['participantNames']) {
          const otherEmail = (room['members'] || []).find((m: string) => m !== userEmail);
          if (otherEmail && room['participantNames'][otherEmail]) {
            return {
              ...room,
              name: room['participantNames'][otherEmail]
            };
          }
        }
        return room;
      });

    return userRooms;
  }

  createRoom(roomData: RoomData): Observable<any> {
    const iconInfo = this.getIconForCategory(roomData.category, roomData.name);
    const fullRoomData: RoomData = {
      ...roomData,
      icon: roomData.icon || iconInfo.icon,
      accentColor: roomData.accentColor || iconInfo.accentColor
    };

    return this.http.post(`${this.apiUrl}/rooms`, fullRoomData).pipe(
      catchError(() => from(this.createRoomDirectFirebase(fullRoomData)))
    );
  }

  private async createRoomDirectFirebase(roomData: RoomData) {
    const roomsRef = collection(db, 'rooms');
    const newDocRef = doc(roomsRef);
    const currUser = this.getCurrentUser();
    const creatorEmail = currUser?.email || roomData.createdBy;

    // Asegurar que el creador y los miembros seleccionados pertenezcan al grupo
    const members = Array.from(new Set([creatorEmail, ...(roomData.members || [])]));

    const room = {
      id: newDocRef.id,
      name: roomData.name,
      description: roomData.description || '',
      category: roomData.category || 'social',
      accentColor: roomData.accentColor || 'blue',
      icon: roomData.icon || 'chatbox-ellipses-outline',
      createdBy: creatorEmail,
      members: members,
      createdAt: new Date().toISOString(),
      lastMessage: 'Grupo creado',
      lastMessageTime: 'Ahora',
      unreadCount: 0
    };

    await setDoc(newDocRef, room);
    return room;
  }

  addMemberToRoom(roomId: string, memberEmail: string): Observable<any> {
    return from(this.addMemberToRoomFirebase(roomId, memberEmail));
  }

  private async addMemberToRoomFirebase(roomId: string, memberEmail: string) {
    const roomDocRef = doc(db, 'rooms', roomId);
    const snap = await getDoc(roomDocRef);
    if (!snap.exists()) throw new Error('Sala no encontrada');

    const data = snap.data();
    const members: string[] = data['members'] || [];
    if (!members.includes(memberEmail)) {
      members.push(memberEmail);
      await setDoc(roomDocRef, { ...data, members });
    }
    return { ...data, members };
  }
}
