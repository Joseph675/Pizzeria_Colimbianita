import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./inventario.component').then(m => m.InventarioComponent),
    data: {
      title: $localize`Inventario`
    }
  }
];

