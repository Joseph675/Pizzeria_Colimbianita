import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./clientes.component').then(m => m.ClientesComponent),
    data: {
      title: $localize`Clientes`
    }
  }
];

