import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./categorias.component').then(m => m.CategoriasComponent),
    data: {
      title: $localize`Categorías`
    }
  }
];

