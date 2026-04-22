import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pos.component').then(m => m.PosComponent),
    data: {
      title: $localize`POS`
    }
  }
];

