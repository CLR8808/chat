import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { auth, db } from '../../environments/environment';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
  User
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  createdAt: string;
  lastLogin: string;
  bio?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private currentUserSubject = new BehaviorSubject<UserProfile | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private authReady = new BehaviorSubject<boolean>(false);
  public authReady$ = this.authReady.asObservable();

  constructor(private ngZone: NgZone) {
    // Pre-populate from cache if available for instant UI rendering while Firebase initializes
    const cached = localStorage.getItem('currentUser');
    if (cached) {
      try {
        this.currentUserSubject.next(JSON.parse(cached));
      } catch (_) {}
    }

    // Listen for Firebase Auth state changes
    onAuthStateChanged(auth, async (firebaseUser) => {
      this.ngZone.run(async () => {
        if (firebaseUser) {
          // User is signed in — load their profile from Firestore
          const profile = await this.loadUserProfile(firebaseUser.uid);
          if (profile) {
            this.currentUserSubject.next(profile);
            // Keep localStorage as auxiliary cache (NOT as auth source)
            localStorage.setItem('currentUser', JSON.stringify(profile));
          } else {
            // Profile doesn't exist yet (edge case) — create minimal one
            const minimalProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: new Date().toISOString(),
              lastLogin: new Date().toISOString()
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), minimalProfile);
            this.currentUserSubject.next(minimalProfile);
            localStorage.setItem('currentUser', JSON.stringify(minimalProfile));
          }
        } else {
          // User is signed out
          this.currentUserSubject.next(null);
          localStorage.removeItem('currentUser');
        }
        this.authReady.next(true);
      });
    });
  }

  // ==================================================================
  // REGISTER
  // ==================================================================

  async register(userData: { email: string; password: string; displayName: string }): Promise<UserProfile> {
    const targetName = (userData.displayName || '').trim().toLowerCase();

    // 1. Validar que el nombre no esté ya en uso (case-insensitive) antes de crear auth
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const nameTaken = snapshot.docs.some(docSnap => {
        const existingName = (docSnap.data()['displayName'] || '').trim().toLowerCase();
        return existingName === targetName;
      });

      if (nameTaken) {
        throw new Error('Nombre de usuario ya existente. Elige otro.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Nombre de usuario ya existente')) {
        throw err;
      }
    }

    // 2. Crear usuario en Firebase Auth
    const credential = await createUserWithEmailAndPassword(auth, userData.email.trim(), userData.password);
    const firebaseUser = credential.user;

    // 3. Doble verificación con permisos autenticados (por si la lectura anónima previa fue restringida)
    try {
      const usersRef = collection(db, 'users');
      const snapshot = await getDocs(usersRef);
      const duplicateFound = snapshot.docs.some(docSnap => {
        if (docSnap.id === firebaseUser.uid) return false;
        const existingName = (docSnap.data()['displayName'] || '').trim().toLowerCase();
        return existingName === targetName;
      });

      if (duplicateFound) {
        // Revertir creación en Firebase Auth para no dejar cuentas huérfanas
        await firebaseUser.delete();
        throw new Error('Nombre de usuario ya existente. Elige otro.');
      }
    } catch (err: any) {
      if (err.message && err.message.includes('Nombre de usuario ya existente')) {
        throw err;
      }
    }

    // 4. Set displayName on Firebase Auth profile
    await updateProfile(firebaseUser, { displayName: userData.displayName.trim() });

    // 5. Create user document in Firestore using uid as document ID
    const profile: UserProfile = {
      uid: firebaseUser.uid,
      email: userData.email.trim(),
      displayName: userData.displayName.trim(),
      photoURL: '',
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    } catch (firestoreErr) {
      console.warn('⚠️ No se pudo crear el documento en Firestore (verifica tus reglas de seguridad):', firestoreErr);
    }

    this.currentUserSubject.next(profile);
    localStorage.setItem('currentUser', JSON.stringify(profile));

    return profile;
  }

  // ==================================================================
  // LOGIN
  // ==================================================================

  async login(credentials: { email: string; password: string }): Promise<UserProfile> {
    const credential = await signInWithEmailAndPassword(auth, credentials.email, credentials.password);
    const firebaseUser = credential.user;

    // Load profile from Firestore
    let profile = await this.loadUserProfile(firebaseUser.uid);

    if (!profile) {
      // User exists in Auth but not in Firestore — create profile
      profile = {
        uid: firebaseUser.uid,
        email: firebaseUser.email || credentials.email,
        displayName: firebaseUser.displayName || credentials.email.split('@')[0],
        photoURL: firebaseUser.photoURL || '',
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', firebaseUser.uid), profile);
    } else {
      // Update lastLogin
      await updateDoc(doc(db, 'users', firebaseUser.uid), {
        lastLogin: new Date().toISOString()
      });
      profile.lastLogin = new Date().toISOString();
    }

    this.currentUserSubject.next(profile);
    localStorage.setItem('currentUser', JSON.stringify(profile));

    return profile;
  }

  // ==================================================================
  // LOGOUT
  // ==================================================================

  async logout(): Promise<void> {
    await signOut(auth);
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  // ==================================================================
  // FORGOT PASSWORD
  // ==================================================================

  async forgotPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  // ==================================================================
  // GETTERS
  // ==================================================================

  getCurrentUser(): UserProfile | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isAuthenticated$(): Observable<boolean> {
    return this.currentUser$.pipe(map(user => user !== null));
  }

  getFirebaseUser(): User | null {
    return auth.currentUser;
  }

  updateCurrentUserProfile(partial: Partial<UserProfile>) {
    const current = this.currentUserSubject.value;
    if (current) {
      const updated = { ...current, ...partial };
      this.currentUserSubject.next(updated);
      localStorage.setItem('currentUser', JSON.stringify(updated));
    }
  }

  // ==================================================================
  // HELPERS
  // ==================================================================

  private async loadUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
    } catch (err) {
      console.warn('⚠️ No se pudo leer perfil desde Firestore:', err);
    }
    return null;
  }

  /**
   * Translate Firebase Auth error codes to user-friendly messages in Spanish.
   */
  static getErrorMessage(error: any): string {
    const code = error?.code || '';
    switch (code) {
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Correo o contraseña incorrectos.';
      case 'auth/email-already-in-use':
        return 'Este correo ya está registrado.';
      case 'auth/weak-password':
        return 'La contraseña debe tener al menos 6 caracteres.';
      case 'auth/invalid-email':
        return 'El correo electrónico no es válido.';
      case 'auth/too-many-requests':
        return 'Demasiados intentos. Intenta de nuevo más tarde.';
      case 'auth/network-request-failed':
        return 'Error de conexión. Verifica tu internet.';
      case 'auth/user-disabled':
        return 'Esta cuenta ha sido deshabilitada.';
      default:
        if (error?.message) {
          return error.message;
        }
        return 'Ha ocurrido un error. Intenta de nuevo.';
    }
  }
}
