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
  deleteDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';

export interface RoomData {
  id?: string;
  name: string;
  description?: string;
  category: string;
  icon?: string;
  accentColor?: string;
  createdBy: string;
  members?: string[];
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

  // ==================================================================
  // REGISTRO Y LOGIN
  // ==================================================================

  register(userData: { email: string; password: string; displayName: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData).pipe(
      tap((user: any) => this.setCurrentUser(user)),
      catchError((httpErr) => {
        console.warn('⚠️ Backend no disponible. Conectando directo a Firebase...', httpErr);
        return from(this.registerDirectFirebase(userData)).pipe(
          tap((user: any) => this.setCurrentUser(user))
        );
      })
    );
  }

  private async registerDirectFirebase(userData: { email: string; password: string; displayName: string }) {
    const usersRef = collection(db, 'users');

    // Verificar email duplicado
    const emailQuery = query(usersRef, where('email', '==', userData.email));
    const emailSnap = await getDocs(emailQuery);
    if (!emailSnap.empty) {
      throw new Error('El usuario ya existe con ese correo');
    }

    // Verificar displayName duplicado
    const nameQuery = query(usersRef, where('displayName', '==', userData.displayName));
    const nameSnap = await getDocs(nameQuery);
    if (!nameSnap.empty) {
      throw new Error('Nombre de usuario ya existente');
    }

    const newDocRef = doc(usersRef);
    const user = {
      id: newDocRef.id,
      email: userData.email,
      password: userData.password,
      displayName: userData.displayName,
      photoURL: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    await setDoc(newDocRef, user);
    const { password, ...result } = user;
    return result;
  }

  // Verificar disponibilidad de displayName
  checkDisplayNameAvailable(name: string): Observable<boolean> {
    return from(this.checkDisplayNameFirebase(name));
  }

  private async checkDisplayNameFirebase(name: string): Promise<boolean> {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('displayName', '==', name));
    const snapshot = await getDocs(q);
    return snapshot.empty; // true = disponible
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, credentials).pipe(
      tap((user: any) => this.setCurrentUser(user)),
      catchError((httpErr) => {
        console.warn('⚠️ Backend no disponible. Autenticando con Firebase...', httpErr);
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

  // ==================================================================
  // CONTACTOS
  // ==================================================================

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

  isContact(contactEmail: string): Observable<boolean> {
    const curr = this.getCurrentUser();
    if (!curr) return of(false);
    return from(this.isContactFirebase(curr.id || curr.email, contactEmail));
  }

  private async isContactFirebase(userKey: string, contactEmail: string): Promise<boolean> {
    const contacts = await this.getContactsFirebase(userKey);
    return contacts.some(c => c.email === contactEmail);
  }

  // ENVIAR SOLICITUD DE CONTACTO (no agrega directo, crea notificación)
  sendContactRequest(targetUser: any): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    return from(this.sendContactRequestFirebase(curr, targetUser));
  }

  private async sendContactRequestFirebase(currUser: any, targetUser: any) {
    const targetKey = targetUser.id || targetUser.email;
    const currKey = currUser.id || currUser.email;

    // Verificar que no haya solicitud previa
    const notifRef = collection(db, 'users', targetKey, 'notifications');
    const existingQuery = query(notifRef,
      where('type', '==', 'contact_request'),
      where('fromEmail', '==', currUser.email)
    );
    const existingSnap = await getDocs(existingQuery);
    if (!existingSnap.empty) {
      return { status: 'already_sent' };
    }

    // Verificar que no sean ya contactos
    const isAlready = await this.isContactFirebase(currKey, targetUser.email);
    if (isAlready) {
      return { status: 'already_contact' };
    }

    // Crear notificación
    const notifDoc = doc(notifRef);
    const notification = {
      id: notifDoc.id,
      type: 'contact_request',
      fromId: currKey,
      fromEmail: currUser.email,
      fromDisplayName: currUser.displayName || currUser.email.split('@')[0],
      toId: targetKey,
      toEmail: targetUser.email,
      status: 'pending',
      createdAt: new Date().toISOString()
    };
    await setDoc(notifDoc, notification);

    // Crear sala directa anticipada para poder enviar mensajes sin agregar
    await this.ensureDirectRoom(currUser, targetUser);

    return { status: 'sent', notification };
  }

  // Asegurar que exista sala directa entre dos usuarios (para chat sin agregar)
  private async ensureDirectRoom(userA: any, userB: any) {
    const emailsSorted = [userA.email, userB.email].sort();
    const roomId = `dm_${emailsSorted[0]}_${emailsSorted[1]}`;
    const roomRef = doc(db, 'rooms', roomId);

    const roomSnap = await getDoc(roomRef);
    if (!roomSnap.exists()) {
      const nameA = userA.displayName || userA.email.split('@')[0];
      const nameB = userB.displayName || userB.email.split('@')[0];
      const roomPayload = {
        id: roomId,
        name: nameB,
        description: `Chat privado entre ${nameA} y ${nameB}`,
        category: 'direct',
        icon: 'person-outline',
        accentColor: 'blue',
        createdBy: userA.email,
        members: [userA.email, userB.email],
        createdAt: new Date().toISOString(),
        lastMessage: '',
        lastMessageTime: 'Ahora',
        unreadCount: 0,
        participantNames: {
          [userA.email]: nameA,
          [userB.email]: nameB
        }
      };
      await setDoc(roomRef, roomPayload);
    }
    return roomId;
  }

  // Enviar mensaje directo a un usuario (crea sala si no existe)
  sendDirectMessage(targetUser: any): Observable<string> {
    const curr = this.getCurrentUser();
    if (!curr) return of('');
    return from(this.ensureDirectRoom(curr, targetUser));
  }

  // ==================================================================
  // NOTIFICACIONES
  // ==================================================================

  getNotifications(): Observable<any[]> {
    const curr = this.getCurrentUser();
    if (!curr) return of([]);
    const userKey = curr.id || curr.email;
    return from(this.getNotificationsFirebase(userKey));
  }

  private async getNotificationsFirebase(userKey: string): Promise<any[]> {
    const notifRef = collection(db, 'users', userKey, 'notifications');
    const snapshot = await getDocs(notifRef);
    return snapshot.docs.map(d => d.data());
  }

  getNotificationCount(): Observable<number> {
    const curr = this.getCurrentUser();
    if (!curr) return of(0);
    const userKey = curr.id || curr.email;
    return from(this.getNotificationCountFirebase(userKey));
  }

  private async getNotificationCountFirebase(userKey: string): Promise<number> {
    const notifRef = collection(db, 'users', userKey, 'notifications');
    const q = query(notifRef, where('status', '==', 'pending'));
    const snapshot = await getDocs(q);
    return snapshot.size;
  }

  acceptContactRequest(notification: any): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    return from(this.acceptContactFirebase(curr, notification));
  }

  private async acceptContactFirebase(currUser: any, notification: any) {
    const currKey = currUser.id || currUser.email;
    const fromKey = notification.fromId;
    const fromEmail = notification.fromEmail;
    const fromName = notification.fromDisplayName;

    // 1. Agregar contacto bidireccional
    const myContactsRef = doc(db, 'users', currKey, 'contacts', fromKey);
    await setDoc(myContactsRef, {
      id: fromKey,
      email: fromEmail,
      displayName: fromName,
      photoURL: '',
      addedAt: new Date().toISOString()
    });

    const theirContactsRef = doc(db, 'users', fromKey, 'contacts', currKey);
    await setDoc(theirContactsRef, {
      id: currKey,
      email: currUser.email,
      displayName: currUser.displayName || currUser.email.split('@')[0],
      photoURL: '',
      addedAt: new Date().toISOString()
    });

    // 2. Asegurar sala directa
    await this.ensureDirectRoom(currUser, {
      id: fromKey,
      email: fromEmail,
      displayName: fromName
    });

    // 3. Eliminar notificación
    const notifDocRef = doc(db, 'users', currKey, 'notifications', notification.id);
    await deleteDoc(notifDocRef);

    return { status: 'accepted' };
  }

  rejectContactRequest(notification: any): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    const currKey = curr.id || curr.email;
    return from(this.rejectContactFirebase(currKey, notification));
  }

  private async rejectContactFirebase(userKey: string, notification: any) {
    const notifDocRef = doc(db, 'users', userKey, 'notifications', notification.id);
    await deleteDoc(notifDocRef);
    return { status: 'rejected' };
  }

  // Agregar contacto directamente (para uso interno cuando ambos aceptan)
  addContactDirect(contactUser: any): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    return from(this.addContactDirectFirebase(curr, contactUser));
  }

  private async addContactDirectFirebase(currUser: any, contactUser: any) {
    const currKey = currUser.id || currUser.email;
    const contactKey = contactUser.id || contactUser.email;

    const contactsRef = doc(db, 'users', currKey, 'contacts', contactKey);
    const contactData = {
      id: contactKey,
      email: contactUser.email,
      displayName: contactUser.displayName || contactUser.email.split('@')[0],
      photoURL: contactUser.photoURL || '',
      addedAt: new Date().toISOString()
    };
    await setDoc(contactsRef, contactData);

    await this.ensureDirectRoom(currUser, contactUser);

    return contactData;
  }

  // ==================================================================
  // SALAS Y GRUPOS
  // ==================================================================

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
        const isMember = members.includes(userEmail) || createdBy === userEmail;
        if (!isMember) return false;

        if (category && category !== 'todas') {
          return room['category'] === category;
        }
        return true;
      })
      .map(room => {
        if (room['category'] === 'direct' && room['participantNames']) {
          const otherEmail = (room['members'] || []).find((m: string) => m !== userEmail);
          if (otherEmail && room['participantNames'][otherEmail]) {
            return { ...room, name: room['participantNames'][otherEmail] };
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

  // ==================================================================
  // ELIMINACIÓN DE SALAS / CHATS, CONTACTOS Y MENSAJES
  // ==================================================================

  deleteRoom(roomId: string): Observable<any> {
    return from(this.deleteRoomFirebase(roomId));
  }

  private async deleteRoomFirebase(roomId: string) {
    const roomRef = doc(db, 'rooms', roomId);
    await deleteDoc(roomRef);
    return { success: true, id: roomId };
  }

  deleteContact(contactEmailOrId: string): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    return from(this.deleteContactFirebase(curr, contactEmailOrId));
  }

  private async deleteContactFirebase(currUser: any, contactKey: string) {
    const currKey = currUser.id || currUser.email;

    // Eliminar de los contactos del usuario actual
    const myContactRef = doc(db, 'users', currKey, 'contacts', contactKey);
    await deleteDoc(myContactRef);

    // Eliminar también de los contactos del otro usuario si existe
    const recipContactRef = doc(db, 'users', contactKey, 'contacts', currKey);
    try {
      await deleteDoc(recipContactRef);
    } catch {}

    return { success: true };
  }

  deleteMessage(roomId: string, messageId: string): Observable<any> {
    return from(this.deleteMessageFirebase(roomId, messageId));
  }

  private async deleteMessageFirebase(roomId: string, messageId: string) {
    const msgRef = doc(db, 'rooms', roomId, 'messages', messageId);
    await deleteDoc(msgRef);
    return { success: true, id: messageId };
  }

  // ==================================================================
  // EDITAR PERFIL
  // ==================================================================

  updateProfile(data: { displayName?: string; bio?: string }): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr) return of(null);
    return from(this.updateProfileFirebase(curr, data));
  }

  private async updateProfileFirebase(currUser: any, data: { displayName?: string; bio?: string }) {
    const userKey = currUser.id || currUser.email;
    const usersRef = collection(db, 'users');

    if (data.displayName && data.displayName !== currUser.displayName) {
      const q = query(usersRef, where('displayName', '==', data.displayName));
      const snap = await getDocs(q);
      if (!snap.empty) {
        throw new Error('Nombre de usuario ya existente');
      }
    }

    const userDocRef = doc(db, 'users', userKey);
    const updated = {
      ...currUser,
      displayName: data.displayName || currUser.displayName,
      bio: data.bio !== undefined ? data.bio : (currUser.bio || '')
    };

    await setDoc(userDocRef, updated, { merge: true });
    this.setCurrentUser(updated);
    return updated;
  }

  // ==================================================================
  // INDICADOR DE ESCRITURA (TYPING)
  // ==================================================================

  setTypingStatus(roomId: string, isTyping: boolean): Observable<any> {
    const curr = this.getCurrentUser();
    if (!curr || !roomId) return of(null);
    return from(this.setTypingFirebase(roomId, curr.email, isTyping));
  }

  private async setTypingFirebase(roomId: string, userEmail: string, isTyping: boolean) {
    const typingRef = doc(db, 'rooms', roomId, 'typing', userEmail.replace(/[@.]/g, '_'));
    await setDoc(typingRef, {
      email: userEmail,
      isTyping: isTyping,
      updatedAt: new Date().toISOString()
    });
  }
}
