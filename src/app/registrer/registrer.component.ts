import { Component } from '@angular/core';
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
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  school,
  schoolOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  shieldCheckmarkOutline,
  arrowForwardOutline,
  logoGoogle,
  logoWindows,
  personOutline,
  checkmarkCircleOutline,
  closeCircleOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-registrer',
  templateUrl: './registrer.component.html',
  styleUrls: ['./registrer.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonInput,
    IonButton,
    IonIcon
  ]
})
export class RegistrerComponent {

  showPassword = false;
  showConfirmPassword = false;
  isLoading = false;
  errorMessage = '';

  // Username availability
  nameCheckStatus: 'idle' | 'checking' | 'available' | 'taken' = 'idle';
  private nameCheckTimer: any = null;

  form: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      school,
      schoolOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      shieldCheckmarkOutline,
      arrowForwardOutline,
      logoGoogle,
      logoWindows,
      personOutline,
      checkmarkCircleOutline,
      closeCircleOutline
    });

    this.form = this.fb.group({
      displayName: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    });

    // Verificar disponibilidad del nombre con debounce
    this.form.get('displayName')?.valueChanges.subscribe(value => {
      if (this.nameCheckTimer) clearTimeout(this.nameCheckTimer);

      if (!value || value.length < 3) {
        this.nameCheckStatus = 'idle';
        return;
      }

      this.nameCheckStatus = 'checking';
      this.nameCheckTimer = setTimeout(() => {
        this.apiService.checkDisplayNameAvailable(value).subscribe({
          next: (available) => {
            this.nameCheckStatus = available ? 'available' : 'taken';
          },
          error: () => {
            this.nameCheckStatus = 'idle';
          }
        });
      }, 500);
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  register() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    if (this.nameCheckStatus === 'taken') {
      this.errorMessage = 'Nombre de usuario ya existente. Elige otro.';
      return;
    }

    const { displayName, email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.register({ displayName, email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('✅ Usuario registrado:', res);
        this.router.navigate(['/chats']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error al registrar:', err);
        if (err.message && err.message.includes('Nombre')) {
          this.errorMessage = err.message;
          this.nameCheckStatus = 'taken';
        } else {
          this.errorMessage = err.error?.message || err.message || 'Error al conectar con el servidor';
        }
      }
    });
  }

  goLogin() {
    this.router.navigate(['/login']);
  }
}
