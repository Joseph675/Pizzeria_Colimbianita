import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./mesas-component.component').then(m => m.MesasComponent),
    data: {
      title: $localize`Mesas`
    }
  }
];
