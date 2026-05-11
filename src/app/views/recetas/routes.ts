import { Routes } from '@angular/router';
import { RecetasComponent } from './recetas.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./recetas.component').then(m => m.RecetasComponent),
    data: {
      title: $localize`Recetas`
    }
  }
];
