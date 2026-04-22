import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./usuarios.component').then(m => m.UsuariosComponent),
    data: {
      title: $localize`Usuarios`
    }
  }
];

