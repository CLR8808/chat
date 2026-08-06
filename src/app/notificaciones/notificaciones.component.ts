import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  notifications,
  notificationsOutline,
  personAddOutline,
  checkmarkOutline,
  closeOutline,
  arrowBack,
  chatbubblesOutline,
  peopleOutline,
  bookOutline,
  personOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-notificaciones',
  templateUrl: './notificaciones.component.html',
  styleUrls: ['./notificaciones.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class NotificacionesComponent implements OnInit, OnDestroy {

  notificationsList: any[] = [];
  isLoading = false;

  // Subscriptions
  private notifSub: any = null;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      notifications,
      notificationsOutline,
      personAddOutline,
      checkmarkOutline,
      closeOutline,
      arrowBack,
      chatbubblesOutline,
      peopleOutline,
      bookOutline,
      personOutline
    });
  }

  ngOnInit() {
    this.loadNotifications();
  }

  ngOnDestroy() {
    if (this.notifSub) {
      this.notifSub.unsubscribe();
    }
  }

  loadNotifications() {
    this.isLoading = true;
    this.notifSub = this.apiService.getNotificationsRealtime().subscribe({
      next: (data) => {
        this.notificationsList = data || [];
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  acceptRequest(notif: any) {
    this.apiService.acceptContactRequest(notif).subscribe({
      next: () => {
        this.notificationsList = this.notificationsList.filter(n => n.id !== notif.id);
      }
    });
  }

  rejectRequest(notif: any) {
    this.apiService.rejectContactRequest(notif).subscribe({
      next: () => {
        this.notificationsList = this.notificationsList.filter(n => n.id !== notif.id);
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
