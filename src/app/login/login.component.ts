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

import { AuthService } from '../services/auth.service';

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
  successMessage = '';

  loginForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
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

  async login() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const credentials = this.loginForm.value;

    try {
      const user = await this.authService.login(credentials);
      this.isLoading = false;
      console.log('✅ Sesión iniciada:', user);
      this.router.navigate(['/chats']);
    } catch (err: any) {
      this.isLoading = false;
      console.error('❌ Error al iniciar sesión:', err);
      this.errorMessage = AuthService.getErrorMessage(err);
    }
  }

  createAccount() {
    this.router.navigate(['/registrer']);
  }

  async forgotPassword() {
    const email = this.loginForm.get('email')?.value;
    if (!email) {
      this.errorMessage = 'Ingresa tu correo electrónico para recuperar la contraseña.';
      return;
    }

    try {
      await this.authService.forgotPassword(email);
      this.successMessage = 'Se envió un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.';
      this.errorMessage = '';
    } catch (err: any) {
      this.errorMessage = AuthService.getErrorMessage(err);
      this.successMessage = '';
    }
  }

}
