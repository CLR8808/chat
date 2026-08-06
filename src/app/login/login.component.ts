import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';

import {
  IonContent,
  IonButton,
  IonIcon,
  IonInput
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  chatboxEllipsesOutline,
  mailOutline,
  lockClosedOutline,
  eyeOutline,
  eyeOffOutline,
  arrowForwardOutline,
  personAddOutline,
  schoolOutline,
  shieldCheckmarkOutline
} from 'ionicons/icons';

import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    IonContent,
    IonButton,
    IonIcon,
    IonInput
  ]
})
export class LoginComponent {

  showPassword = false;
  isLoading = false;
  errorMessage = '';

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private apiService: ApiService
  ) {
    addIcons({
      chatboxEllipsesOutline,
      mailOutline,
      lockClosedOutline,
      eyeOutline,
      eyeOffOutline,
      arrowForwardOutline,
      personAddOutline,
      schoolOutline,
      shieldCheckmarkOutline
    });

    this.loginForm = this.fb.group({
      email: [
        '',
        [
          Validators.required,
          Validators.email
        ]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.minLength(6)
        ]
      ]
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const credentials = this.loginForm.value;

    this.apiService.login(credentials).subscribe({
      next: (user) => {
        this.isLoading = false;
        console.log('✅ Sesión iniciada:', user);
        this.router.navigate(['/chats']);
      },
      error: (err) => {
        this.isLoading = false;
        console.error('❌ Error al iniciar sesión:', err);
        this.errorMessage = err.error?.message || 'Correo o contraseña incorrectos';
      }
    });
  }

  createAccount() {
    this.router.navigate(['/registrer']);
  }

  forgotPassword() {
    console.log('Recuperar contraseña');
  }

}
