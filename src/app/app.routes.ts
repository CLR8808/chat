import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: 'conversation/:roomId',
    loadComponent: () =>
      import('./conversation/conversation.component').then((m) => m.ConversationComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'notificaciones',
    loadComponent: () =>
      import('./notificaciones/notificaciones.component').then((m) => m.NotificacionesComponent),
    canActivate: [AuthGuard],
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
    canActivate: [AuthGuard],
  },
  {
    path: 'crearsala',
    loadComponent: () =>
      import('./crearsala/crearsala.component').then((m) => m.CrearsalaComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'grupos',
    loadComponent: () =>
      import('./grupos/grupos.component').then((m) => m.GruposComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'estudio',
    loadComponent: () =>
      import('./estudio/estudio.component').then((m) => m.EstudioComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'aggcontacto',
    loadComponent: () =>
      import('./aggcontacto/aggcontacto.component').then((m) => m.AggcontactoComponent),
    canActivate: [AuthGuard],
  },
  {
    path: 'perfil',
    loadComponent: () =>
      import('./perfil/perfil.component').then((m) => m.PerfilComponent),
    canActivate: [AuthGuard],
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
