import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./presentacion_productos.component').then(m => m.PresentacionesComponent),
    data: {
      title: $localize`Presentaciones`
    }
  }
];

