import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'conversation/:roomId',
    loadComponent: () =>
      import('./conversation/conversation.component').then((m) => m.ConversationComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registrer',
    loadComponent: () =>
      import('./registrer/registrer.component').then((m) => m.RegistrerComponent),
  },
  {
    path: 'chats',
    loadComponent: () =>
      import('./chats/chats.component').then((m) => m.ChatsComponent),
  },
  {
    path: 'crearsala',
    loadComponent: () =>
      import('./crearsala/crearsala.component').then((m) => m.CrearsalaComponent),
  },
  {
    path: 'grupos',
    loadComponent: () =>
      import('./grupos/grupos.component').then((m) => m.GruposComponent),
  },
  {
    path: 'estudio',
    loadComponent: () =>
      import('./estudio/estudio.component').then((m) => m.EstudioComponent),
  },
  {
    path: 'aggcontacto',
    loadComponent: () =>
      import('./aggcontacto/aggcontacto.component').then((m) => m.AggcontactoComponent),
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./perfil/perfil.component').then((m) => m.PerfilComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
