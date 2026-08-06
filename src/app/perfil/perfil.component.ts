import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  peopleOutline,
  bookOutline,
  person,
  personOutline,
  logOutOutline,
  mailOutline,
  calendarOutline,
  notificationsOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class PerfilComponent implements OnInit {
  activeTab = 'profile';
  currentUser: any = null;
  contactsCount = 0;
  groupsCount = 0;
  notificationsCount = 0;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      chatbubblesOutline,
      peopleOutline,
      bookOutline,
      person,
      personOutline,
      logOutOutline,
      mailOutline,
      calendarOutline,
      notificationsOutline,
      shieldCheckmarkOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadStats();
  }

  loadStats() {
    this.apiService.getContacts().subscribe({
      next: (contacts) => {
        this.contactsCount = (contacts || []).length;
      }
    });

    this.apiService.getRooms().subscribe({
      next: (rooms) => {
        this.groupsCount = (rooms || []).filter(r => r.category !== 'direct' && r.category !== 'estudio').length;
      }
    });

    this.apiService.getNotificationCount().subscribe({
      next: (count) => {
        this.notificationsCount = count;
      }
    });
  }

  goToNotifications() {
    this.router.navigate(['/notificaciones']);
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  navigateTo(tab: string) {
    this.activeTab = tab;
    if (tab === 'chats') {
      this.router.navigate(['/chats']);
    } else if (tab === 'groups') {
      this.router.navigate(['/grupos']);
    } else if (tab === 'study') {
      this.router.navigate(['/estudio']);
    } else if (tab === 'profile') {
      this.router.navigate(['/perfil']);
    }
  }
}
