import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  people,
  peopleOutline,
  bookOutline,
  personOutline,
  logOutOutline,
  personAddOutline,
  closeOutline,
  schoolOutline,
  megaphoneOutline,
  rocketOutline,
  checkmarkOutline,
  searchOutline,
  trashOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-grupos',
  templateUrl: './grupos.component.html',
  styleUrls: ['./grupos.component.scss'],
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
export class GruposComponent implements OnInit, OnDestroy {
  activeTab = 'groups';
  groupRooms: any[] = [];
  isLoading = false;

  // Add Member Modal state
  isMemberModalOpen = false;
  selectedRoomForMember: any = null;
  userContacts: any[] = [];

  // Subscriptions
  private roomsSub: any = null;

  constructor(
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      chatbubblesOutline,
      people,
      peopleOutline,
      bookOutline,
      personOutline,
      logOutOutline,
      personAddOutline,
      closeOutline,
      schoolOutline,
      megaphoneOutline,
      rocketOutline,
      checkmarkOutline,
      searchOutline,
      trashOutline
    });
  }

  deleteGroup(room: any, event: Event) {
    event.stopPropagation();
    if (confirm(`¿Eliminar el grupo "${room.name}"?`)) {
      this.apiService.deleteRoom(room.id).subscribe({
        next: () => {
          this.groupRooms = this.groupRooms.filter(r => r.id !== room.id);
        }
      });
    }
  }

  ngOnInit() {
    this.loadGroups();
    this.loadContacts();
  }

  ngOnDestroy() {
    if (this.roomsSub) {
      this.roomsSub.unsubscribe();
    }
  }

  loadGroups() {
    this.isLoading = true;
    this.roomsSub = this.apiService.getRoomsRealtime().subscribe({
      next: (rooms) => {
        this.isLoading = false;
        // Solo mostrar grupos (excluir chats directos 1-a-1 y estudio)
        this.groupRooms = (rooms || []).filter(r =>
          r.category !== 'estudio' && r.category !== 'direct'
        );
      },
      error: () => {
        this.isLoading = false;
        this.groupRooms = [];
      }
    });
  }

  getUnreadCount(room: any): number {
    return this.apiService.getMyUnreadCount(room);
  }

  loadContacts() {
    this.apiService.getContacts().subscribe({
      next: (contacts) => {
        this.userContacts = contacts || [];
      }
    });
  }

  openAddMemberModal(room: any, event: Event) {
    event.stopPropagation();
    this.selectedRoomForMember = room;
    this.isMemberModalOpen = true;
  }

  closeMemberModal() {
    this.isMemberModalOpen = false;
    this.selectedRoomForMember = null;
  }

  isAlreadyMember(contactEmail: string): boolean {
    if (!this.selectedRoomForMember || !this.selectedRoomForMember.members) return false;
    return this.selectedRoomForMember.members.includes(contactEmail);
  }

  addMemberToGroup(contactEmail: string) {
    if (!this.selectedRoomForMember) return;

    this.apiService.addMemberToRoom(this.selectedRoomForMember.id, contactEmail).subscribe({
      next: () => {
        if (!this.selectedRoomForMember.members) {
          this.selectedRoomForMember.members = [];
        }
        if (!this.selectedRoomForMember.members.includes(contactEmail)) {
          this.selectedRoomForMember.members.push(contactEmail);
        }
      }
    });
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
