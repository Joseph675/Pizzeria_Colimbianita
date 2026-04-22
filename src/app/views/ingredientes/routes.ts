import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./ingredientes.component').then(m => m.IngredientesComponent),
    data: {
      title: $localize`Ingredientes`
    }
  }
];

