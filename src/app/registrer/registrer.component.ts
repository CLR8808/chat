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
  logoWindows
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
      logoWindows
    });

    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
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

    const { email, password, confirmPassword } = this.form.value;

    if (password !== confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.apiService.register({ email, password }).subscribe({
      next: (res) => {
        this.isLoading = false;
        console.log('✅ Usuario registrado exitosamente en Firebase:', res);
        this.router.navigate(['/chats']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error al registrar en Firebase:', err);
        this.errorMessage = err.error?.message || 'Error al conectar con el servidor';
      }
    });
  }

  goLogin() {
    this.router.navigate(['/login']);
  }

}
