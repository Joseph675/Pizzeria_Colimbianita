import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./facturacion.component').then(m => m.FacturacionComponent),
    data: {
      title: $localize`Facturación`
    }
  }
];

