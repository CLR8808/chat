import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonInput,
  IonTextarea,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  school,
  schoolOutline,
  logOutOutline,
  arrowBack,
  people,
  peopleOutline,
  book,
  bookOutline,
  chatbubblesOutline,
  megaphoneOutline,
  rocketOutline,
  checkmarkCircle,
  shieldCheckmark,
  addCircleOutline,
  personOutline,
  checkmarkOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-crearsala',
  templateUrl: './crearsala.component.html',
  styleUrls: ['./crearsala.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonTextarea,
    IonButton,
    IonIcon
  ]
})
export class CrearsalaComponent implements OnInit {

  form: FormGroup;
  activeTab = 'groups';
  currentUser: any = null;

  // Selected Category
  selectedCategory = 'academica'; // Default

  categories = [
    { value: 'academica', label: 'Académica', icon: 'school-outline' },
    { value: 'estudio', label: 'Estudio (Frame propio)', icon: 'book-outline' },
    { value: 'social', label: 'Social', icon: 'chatbubbles-outline' },
    { value: 'urgente', label: 'Urgente', icon: 'megaphone-outline' }
  ];

  // User Contacts & Selected Members
  userContacts: any[] = [];
  selectedMemberEmails: string[] = [];

  isLoading = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      school,
      schoolOutline,
      logOutOutline,
      arrowBack,
      people,
      peopleOutline,
      book,
      bookOutline,
      chatbubblesOutline,
      megaphoneOutline,
      rocketOutline,
      checkmarkCircle,
      shieldCheckmark,
      addCircleOutline,
      personOutline,
      checkmarkOutline
    });

    this.form = this.fb.group({
      name: ['', Validators.required],
      description: ['']
    });
  }

  ngOnInit() {
    this.currentUser = this.apiService.getCurrentUser();
    this.loadContacts();

    // Auto-detect icon/category when typing name
    this.form.get('name')?.valueChanges.subscribe(name => {
      if (name) {
        const detected = this.apiService.getIconForCategory(this.selectedCategory, name);
        if (name.toLowerCase().includes('estudio') || name.toLowerCase().includes('cálculo') || name.toLowerCase().includes('tarea')) {
          this.selectedCategory = 'estudio';
        }
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

  selectCategory(categoryValue: string) {
    this.selectedCategory = categoryValue;
  }

  toggleMemberSelection(email: string) {
    const idx = this.selectedMemberEmails.indexOf(email);
    if (idx > -1) {
      this.selectedMemberEmails.splice(idx, 1);
    } else {
      this.selectedMemberEmails.push(email);
    }
  }

  isMemberSelected(email: string): boolean {
    return this.selectedMemberEmails.includes(email);
  }

  goBack() {
    this.router.navigate(['/chats']);
  }

  logout() {
    this.apiService.logout();
    this.router.navigate(['/login']);
  }

  createRoom() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const { name, description } = this.form.value;
    const creatorEmail = this.currentUser?.email || 'alumno@correo.com';

    // Include creator + selected members
    const members = Array.from(new Set([creatorEmail, ...this.selectedMemberEmails]));

    const iconInfo = this.apiService.getIconForCategory(this.selectedCategory, name);

    const roomPayload = {
      name,
      description,
      category: this.selectedCategory,
      icon: iconInfo.icon,
      accentColor: iconInfo.accentColor,
      createdBy: creatorEmail,
      members
    };

    this.apiService.createRoom(roomPayload).subscribe({
      next: () => {
        this.isLoading = false;
        // If category is estudio, navigate to /estudio, otherwise /chats
        if (this.selectedCategory === 'estudio') {
          this.router.navigate(['/estudio']);
        } else {
          this.router.navigate(['/chats']);
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Error al crear sala:', err);
      }
    });
  }

  cancel() {
    this.router.navigate(['/chats']);
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
