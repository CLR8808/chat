import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonModal
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chatbubblesOutline,
  peopleOutline,
  book,
  bookOutline,
  personOutline,
  personAddOutline,
  logOutOutline,
  add,
  schoolOutline,
  trashOutline,
  closeOutline,
  checkmarkOutline
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
    IonIcon,
    IonModal
  ]
})
export class EstudioComponent implements OnInit, OnDestroy {
  activeTab = 'study';
  studyRooms: any[] = [];
  isLoading = false;

  // Add Member Modal State
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
      peopleOutline,
      book,
      bookOutline,
      personOutline,
      personAddOutline,
      logOutOutline,
      add,
      schoolOutline,
      trashOutline,
      closeOutline,
      checkmarkOutline
    });
  }

  ngOnInit() {
    this.loadStudyRooms();
    this.loadContacts();
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

  loadContacts() {
    this.apiService.getContacts().subscribe({
      next: (contacts) => {
        this.userContacts = contacts || [];
      }
    });
  }

  getUnreadCount(room: any): number {
    return this.apiService.getMyUnreadCount(room);
  }

  openAddMemberModal(room: any, event: Event) {
    event.stopPropagation();
    this.selectedRoomForMember = room;
    this.isMemberModalOpen = true;
    this.loadContacts();
  }

  closeMemberModal() {
    this.isMemberModalOpen = false;
    this.selectedRoomForMember = null;
  }

  isAlreadyMember(email: string): boolean {
    if (!this.selectedRoomForMember || !this.selectedRoomForMember.members) return false;
    return this.selectedRoomForMember.members.includes(email);
  }

  addMemberToStudyRoom(email: string) {
    if (!this.selectedRoomForMember || !this.selectedRoomForMember.id) return;
    this.apiService.addMemberToRoom(this.selectedRoomForMember.id, email).subscribe({
      next: (res) => {
        if (res && res.members) {
          this.selectedRoomForMember.members = res.members;
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
