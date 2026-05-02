import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./combos_promociones.component').then(m => m.CombosyPromocionesComponent),
    data: {
      title: $localize`Combos y Promociones`
    }
  }
];

