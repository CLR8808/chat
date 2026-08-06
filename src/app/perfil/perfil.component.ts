import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal,
  IonInput
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
  shieldCheckmarkOutline,
  createOutline,
  closeOutline,
  trashOutline,
  checkmarkOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.component.html',
  styleUrls: ['./perfil.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonModal,
    IonInput
  ]
})
export class PerfilComponent implements OnInit {
  activeTab = 'profile';
  currentUser: any = null;
  contactsList: any[] = [];
  contactsCount = 0;
  groupsCount = 0;
  notificationsCount = 0;

  // Modal Editar Perfil
  isEditModalOpen = false;
  newDisplayName = '';
  newBio = '';
  editError = '';
  isSaving = false;

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
      shieldCheckmarkOutline,
      createOutline,
      closeOutline,
      trashOutline,
      checkmarkOutline
    });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadData();
  }

  loadData() {
    this.apiService.getContacts().subscribe({
      next: (contacts) => {
        this.contactsList = contacts || [];
        this.contactsCount = this.contactsList.length;
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

  openEditModal() {
    this.newDisplayName = this.currentUser?.displayName || '';
    this.newBio = this.currentUser?.bio || '';
    this.editError = '';
    this.isEditModalOpen = true;
  }

  closeEditModal() {
    this.isEditModalOpen = false;
  }

  saveProfile() {
    if (!this.newDisplayName.trim() || this.newDisplayName.trim().length < 3) {
      this.editError = 'El nombre debe tener al menos 3 caracteres';
      return;
    }

    this.isSaving = true;
    this.editError = '';

    this.apiService.updateProfile({
      displayName: this.newDisplayName.trim(),
      bio: this.newBio.trim()
    }).subscribe({
      next: (updated) => {
        this.isSaving = false;
        this.currentUser = updated;
        this.isEditModalOpen = false;
      },
      error: (err) => {
        this.isSaving = false;
        this.editError = err.message || 'Error al actualizar perfil';
      }
    });
  }

  deleteContact(contact: any) {
    if (confirm(`¿Eliminar a ${contact.displayName || contact.email} de tus contactos?`)) {
      const contactKey = contact.id || contact.email;
      this.apiService.deleteContact(contactKey).subscribe({
        next: () => {
          this.contactsList = this.contactsList.filter(c => (c.id || c.email) !== contactKey);
          this.contactsCount = this.contactsList.length;
        }
      });
    }
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
