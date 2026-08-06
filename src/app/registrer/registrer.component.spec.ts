import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule
} from '@angular/forms';

import {
  IonContent,
  IonInput,
  IonButton,
  IonIcon
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-registrer',
  templateUrl: './registrer.page.html',
  styleUrls: ['./registrer.page.scss'],
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

export class RegistrerPage {

  showPassword = false;
  showConfirmPassword = false;

  form: FormGroup;

  constructor(private fb: FormBuilder) {

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

    console.log(this.form.value);

  }

  goLogin() {

    console.log('Ir a Login');

  }

}