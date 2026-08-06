import { Component } from '@angular/core';
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
  logOutOutline
} from 'ionicons/icons';

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
export class PerfilComponent {
  activeTab = 'profile';

  constructor(private router: Router) {
    addIcons({
      chatbubblesOutline,
      peopleOutline,
      bookOutline,
      person,
      personOutline,
      logOutOutline
    });
  }

  logout() {
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
