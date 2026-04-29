import { Routes } from '@angular/router';
import { DefaultLayoutComponent } from './layout';
import { AuthGuard } from './auth.guard'; 

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: '',
    component: DefaultLayoutComponent,
    data: {
      title: 'Home'
    },
    children: [
      {
        path: 'dashboard',
        loadChildren: () => import('./views/dashboard/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'pos',
        loadChildren: () => import('./views/pos/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'productos',
        loadChildren: () => import('./views/productos/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'presentaciones',
        loadChildren: () => import('./views/presentacion_productos/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'categorias',
        loadChildren: () => import('./views/categorias/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'inventario',
        loadChildren: () => import('./views/inventario/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'ingredientes',
        loadChildren: () => import('./views/ingredientes/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'usuarios',
        loadChildren: () => import('./views/usuarios/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'mesas',
        loadChildren: () => import('./views/mesas/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'cocina',
        loadChildren: () => import('./views/cocina/routes').then((m) => m.routes) ,
        canActivate: [AuthGuard]
      },
      {
        path: 'pedidos',
        loadChildren: () => import('./views/pedidos/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      },
      {
        path: 'facturacion',
        loadChildren: () => import('./views/facturacion/routes').then((m) => m.routes),
        canActivate: [AuthGuard]
      }


    ]
  },
  
  {
    path: '404',
    loadComponent: () => import('./views/pages/page404/page404.component').then(m => m.Page404Component),
    data: {
      title: 'Page 404'
    }
  },
  {
    path: '500',
    loadComponent: () => import('./views/pages/page500/page500.component').then(m => m.Page500Component),
    data: {
      title: 'Page 500'
    }
  },
  {
    path: 'login',
    loadComponent: () => import('./views/pages/login/login.component').then(m => m.LoginComponent),
    data: {
      title: 'Login Page'
    }
  },
  {
    path: 'register',
    loadComponent: () => import('./views/pages/register/register.component').then(m => m.RegisterComponent),
    data: {
      title: 'Register Page'
    }
  },
  { path: '**', redirectTo: 'dashboard' }
];
