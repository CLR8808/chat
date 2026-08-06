import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  logOutOutline,
  searchOutline,
  add,
  personAdd,
  chatbubbles,
  chatbubblesOutline,
  chatboxEllipsesOutline,
  clipboardOutline,
  rocketOutline,
  megaphoneOutline,
  schoolOutline,
  peopleOutline,
  bookOutline,
  personOutline,
  closeOutline,
  notificationsOutline,
  trashOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-chats',
  templateUrl: './chats.component.html',
  styleUrls: ['./chats.component.scss'],
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
export class ChatsComponent implements OnInit {

  searchQuery = '';
  activeTab = 'chats';
  currentUser: any = null;

  // FAB state
  isFabOpen = false;

  categories = [
    { label: 'Todas', value: 'todas', active: true },
    { label: 'Académicas', value: 'academica', active: false },
    { label: 'Social', value: 'social', active: false },
    { label: 'Urgente', value: 'urgente', active: false }
  ];

  selectedCategory = 'todas';
  rooms: any[] = [];
  isLoading = false;
  notificationCount = 0;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      logOutOutline,
      searchOutline,
      add,
      personAdd,
      chatbubbles,
      chatbubblesOutline,
      chatboxEllipsesOutline,
      clipboardOutline,
      rocketOutline,
      megaphoneOutline,
      schoolOutline,
      peopleOutline,
      bookOutline,
      personOutline,
      closeOutline,
      notificationsOutline,
      trashOutline
    });
  }

  deleteRoom(room: any, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar la conversación "${room.name}"?`)) {
      this.apiService.deleteRoom(room.id).subscribe({
        next: () => {
          this.rooms = this.rooms.filter(r => r.id !== room.id);
        }
      });
    }
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadRooms();
    this.loadNotificationsCount();
  }

  loadNotificationsCount() {
    this.apiService.getNotificationCount().subscribe({
      next: (count) => {
        this.notificationCount = count;
      }
    });
  }

  goToNotifications() {
    this.router.navigate(['/notificaciones']);
  }

  loadRooms() {
    this.isLoading = true;
    this.apiService.getRooms(this.selectedCategory).subscribe({
      next: (data) => {
        this.isLoading = false;
        // Mostrar todo excepto la categoría 'estudio' (tiene su propia pantalla)
        this.rooms = (data || []).filter(r => r.category !== 'estudio');
      },
      error: () => {
        this.isLoading = false;
        this.rooms = [];
      }
    });
  }

  toggleFab() {
    this.isFabOpen = !this.isFabOpen;
  }

  closeFab() {
    this.isFabOpen = false;
  }

  goToAddContact() {
    this.isFabOpen = false;
    this.router.navigate(['/aggcontacto']);
  }

  goToCreateRoom() {
    this.isFabOpen = false;
    this.router.navigate(['/crearsala']);
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

  selectCategory(categoryValue: string) {
    this.selectedCategory = categoryValue;
    this.categories.forEach(c => c.active = (c.value === categoryValue));
    this.loadRooms();
  }

  get filteredRooms(): any[] {
    if (!this.searchQuery.trim()) return this.rooms;
    const q = this.searchQuery.toLowerCase();
    return this.rooms.filter(r =>
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  }

  navigateTo(tab: string) {
    this.activeTab = tab;
    if (tab === 'chats') this.router.navigate(['/chats']);
    else if (tab === 'groups') this.router.navigate(['/grupos']);
    else if (tab === 'study') this.router.navigate(['/estudio']);
    else if (tab === 'profile') this.router.navigate(['/perfil']);
  }

}
