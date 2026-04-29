import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pedidos.component').then(m => m.PedidosComponent),
    data: {
      title: $localize`Pedidos`
    }
  }
];
