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
  mailOutline,
  chatboxEllipsesOutline
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
      mailOutline,
      chatboxEllipsesOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.isLoading = true;

    // Load all registered users
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

    // Load current contacts
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
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.displayName && u.displayName.toLowerCase().includes(q))
    );
  }

  isContactAdded(user: any): boolean {
    return this.userContacts.some(c => c.email === user.email);
  }

  addContact(user: any) {
    if (this.isContactAdded(user)) {
      this.router.navigate(['/chats']);
      return;
    }

    this.apiService.addContact(user).subscribe({
      next: (res) => {
        if (res) {
          this.userContacts.push(res);
        }
        // Redirigir a chats para que pueda chatear inmediatamente con el nuevo contacto
        this.router.navigate(['/chats']);
      }
    });
  }

  openContactChat(contact: any) {
    this.router.navigate(['/chats']);
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
