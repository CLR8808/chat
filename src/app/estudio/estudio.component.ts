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
  chatbubblesOutline,
  peopleOutline,
  book,
  bookOutline,
  personOutline,
  logOutOutline,
  add,
  schoolOutline,
  trashOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-estudio',
  templateUrl: './estudio.component.html',
  styleUrls: ['./estudio.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon
  ]
})
export class EstudioComponent implements OnInit, OnDestroy {
  activeTab = 'study';
  studyRooms: any[] = [];
  isLoading = false;

  // Subscriptions
  private roomsSub: any = null;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      chatbubblesOutline,
      peopleOutline,
      book,
      bookOutline,
      personOutline,
      logOutOutline,
      add,
      schoolOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadStudyRooms();
  }

  ngOnDestroy() {
    if (this.roomsSub) {
      this.roomsSub.unsubscribe();
    }
  }

  loadStudyRooms() {
    this.isLoading = true;
    this.roomsSub = this.apiService.getRoomsRealtime('estudio').subscribe({
      next: (data) => {
        this.isLoading = false;
        this.studyRooms = data || [];
      },
      error: () => {
        this.isLoading = false;
        this.studyRooms = [];
      }
    });
  }

  getUnreadCount(room: any): number {
    return this.apiService.getMyUnreadCount(room);
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  openRoom(room: any) {
    if (room.id) {
      this.router.navigate(['/conversation', room.id]);
    }
  }

  deleteRoom(room: any, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar la sala de estudio "${room.name}"?`)) {
      this.apiService.deleteRoom(room.id).subscribe({
        next: () => {
          this.studyRooms = this.studyRooms.filter(r => r.id !== room.id);
        }
      });
    }
  }

  createStudyRoom() {
    this.router.navigate(['/crearsala']);
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
