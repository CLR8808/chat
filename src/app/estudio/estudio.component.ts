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
  book,
  bookOutline,
  personOutline,
  logOutOutline,
  add,
  schoolOutline
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
export class EstudioComponent implements OnInit {
  activeTab = 'study';
  studyRooms: any[] = [];
  isLoading = false;

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
      schoolOutline
    });
  }

  ngOnInit() {
    this.loadStudyRooms();
  }

  loadStudyRooms() {
    this.isLoading = true;
    this.apiService.getRooms('estudio').subscribe({
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

  logout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  openRoom(room: any) {
    console.log('Abriendo estudio room:', room.name);
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
