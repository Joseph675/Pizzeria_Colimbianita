import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./cocina.component').then(m => m.CocinaComponent),
    data: {
      title: $localize`Cocina`
    }
  }
];

