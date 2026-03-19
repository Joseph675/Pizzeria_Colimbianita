import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./productos.component').then(m => m.ProductosComponent),
    data: {
      title: $localize`Productos`
    }
  }
];

