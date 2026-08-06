import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  arrowBack,
  searchOutline,
  personAddOutline,
  personOutline,
  checkmarkOutline,
  closeOutline,
  chatbubblesOutline,
  chatbubbles,
  peopleOutline,
  bookOutline,
  paperPlaneOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-aggcontacto',
  templateUrl: './aggcontacto.component.html',
  styleUrls: ['./aggcontacto.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput
  ]
})
export class AggcontactoComponent implements OnInit {

  searchQuery = '';
  currentUser: any = null;
  allRegisteredUsers: any[] = [];
  userContacts: any[] = [];
  isLoading = false;
  requestStatusMap: { [email: string]: string } = {};

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      arrowBack,
      searchOutline,
      personAddOutline,
      personOutline,
      checkmarkOutline,
      closeOutline,
      chatbubblesOutline,
      chatbubbles,
      peopleOutline,
      bookOutline,
      paperPlaneOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    this.apiService.getAllRegisteredUsers().subscribe({
      next: (users) => {
        const currEmail = this.currentUser?.email;
        this.allRegisteredUsers = (users || []).filter(u => u.email !== currEmail);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });

    this.apiService.getContacts().subscribe({
      next: (contacts) => {
        this.userContacts = contacts || [];
      }
    });
  }

  get filteredUsers(): any[] {
    if (!this.searchQuery.trim()) {
      return this.allRegisteredUsers;
    }
    const q = this.searchQuery.toLowerCase();
    return this.allRegisteredUsers.filter(u =>
      u.displayName && u.displayName.toLowerCase().includes(q)
    );
  }

  isContactAdded(user: any): boolean {
    return this.userContacts.some(c => c.email === user.email);
  }

  sendContactRequest(user: any) {
    if (this.isContactAdded(user)) return;

    this.requestStatusMap[user.email] = 'sending';
    this.apiService.sendContactRequest(user).subscribe({
      next: (res) => {
        if (res && res.status === 'sent') {
          this.requestStatusMap[user.email] = 'sent';
        } else if (res && res.status === 'already_contact') {
          this.requestStatusMap[user.email] = 'added';
        } else {
          this.requestStatusMap[user.email] = 'sent';
        }
      },
      error: () => {
        this.requestStatusMap[user.email] = 'error';
      }
    });
  }

  // Permite enviar mensaje directo sin necesidad de agregar al contacto
  sendMessageWithoutAdding(user: any) {
    this.apiService.sendDirectMessage(user).subscribe({
      next: (roomId) => {
        if (roomId) {
          this.router.navigate(['/conversation', roomId]);
        }
      }
    });
  }

  openContactChat(contact: any) {
    this.apiService.sendDirectMessage(contact).subscribe({
      next: (roomId) => {
        if (roomId) {
          this.router.navigate(['/conversation', roomId]);
        }
      }
    });
  }

  goBack() {
    this.router.navigate(['/chats']);
  }

  navigateTo(tab: string) {
    if (tab === 'chats') this.router.navigate(['/chats']);
    else if (tab === 'groups') this.router.navigate(['/grupos']);
    else if (tab === 'study') this.router.navigate(['/estudio']);
    else if (tab === 'profile') this.router.navigate(['/perfil']);
  }
}
