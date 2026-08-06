import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { IonContent, IonIcon, IonInput } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBack,
  sendOutline,
  send,
  personOutline,
  ellipsisVertical,
  checkmarkDoneOutline
} from 'ionicons/icons';

import { db } from '../../environments/environment';
import { ApiService } from '../services/api.service';
import {
  collection,
  doc,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  getDoc,
  Timestamp
} from 'firebase/firestore';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon, IonInput]
})
export class ConversationComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('messagesEnd') messagesEnd!: ElementRef;

  roomId: string = '';
  roomData: any = null;
  currentUser: any = null;
  messages: any[] = [];
  newMessage = '';
  isLoading = true;
  contactName = '';
  contactInitial = '';
  isGroup = false;
  memberCount = 0;

  private unsubscribe: (() => void) | null = null;
  private shouldScrollToBottom = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({ arrowBack, sendOutline, send, personOutline, ellipsisVertical, checkmarkDoneOutline });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';

    if (!this.roomId || !this.currentUser) {
      this.router.navigate(['/chats']);
      return;
    }

    this.loadRoomAndMessages();
  }

  ngAfterViewChecked() {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
    }
  }

  ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  async loadRoomAndMessages() {
    // 1. Cargar datos de la sala
    const roomRef = doc(db, 'rooms', this.roomId);
    const roomSnap = await getDoc(roomRef);

    if (!roomSnap.exists()) {
      this.router.navigate(['/chats']);
      return;
    }

    this.roomData = roomSnap.data();
    this.isGroup = this.roomData.category !== 'direct';
    this.memberCount = (this.roomData.members || []).length;

    // Resolver nombre de contacto en chats 1-a-1
    if (!this.isGroup && this.roomData.participantNames) {
      const myEmail = this.currentUser.email;
      const otherEmail = (this.roomData.members || []).find((m: string) => m !== myEmail);
      if (otherEmail && this.roomData.participantNames[otherEmail]) {
        this.contactName = this.roomData.participantNames[otherEmail];
      } else {
        this.contactName = this.roomData.name || 'Contacto';
      }
    } else {
      this.contactName = this.roomData.name || 'Grupo';
    }

    this.contactInitial = this.contactName.charAt(0).toUpperCase();
    this.isLoading = false;

    // 2. Suscribirse en tiempo real a mensajes ordenados por fecha
    const msgsRef = collection(db, 'rooms', this.roomId, 'messages');
    const msgsQuery = query(msgsRef, orderBy('sentAt', 'asc'));

    this.unsubscribe = onSnapshot(msgsQuery, (snapshot) => {
      this.messages = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          ...data,
          sentAtDate: data['sentAt'] instanceof Timestamp
            ? data['sentAt'].toDate()
            : new Date(data['sentAt'] || Date.now()),
          isOwn: data['senderEmail'] === this.currentUser.email
        };
      });
      this.shouldScrollToBottom = true;
    });
  }

  async sendMessage() {
    const text = this.newMessage.trim();
    if (!text || !this.roomId) return;

    this.newMessage = '';
    const msgsRef = collection(db, 'rooms', this.roomId, 'messages');

    const msg = {
      text: text,
      senderEmail: this.currentUser.email,
      senderName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
      sentAt: serverTimestamp(),
      read: false
    };

    await addDoc(msgsRef, msg);

    // Actualizar último mensaje en la sala
    const roomRef = doc(db, 'rooms', this.roomId);
    await updateDoc(roomRef, {
      lastMessage: text,
      lastMessageTime: new Date().toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' })
    });
  }

  scrollToBottom() {
    try {
      if (this.messagesEnd?.nativeElement) {
        this.messagesEnd.nativeElement.scrollIntoView({ behavior: 'smooth' });
      }
    } catch {}
    this.shouldScrollToBottom = false;
  }

  formatTime(date: Date): string {
    if (!date) return '';
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  }

  formatDate(date: Date): string {
    if (!date) return '';
    const today = new Date();
    const msgDate = new Date(date);
    if (msgDate.toDateString() === today.toDateString()) return 'Hoy';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (msgDate.toDateString() === yesterday.toDateString()) return 'Ayer';
    return msgDate.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
  }

  isNewDay(index: number): boolean {
    if (index === 0) return true;
    const prev = this.messages[index - 1].sentAtDate;
    const curr = this.messages[index].sentAtDate;
    return new Date(prev).toDateString() !== new Date(curr).toDateString();
  }

  onEnterKey(event: any) {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }

  goBack() {
    this.router.navigate(['/chats']);
  }
}
