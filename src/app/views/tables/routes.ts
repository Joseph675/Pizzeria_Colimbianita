import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Tables'
    },
    children: [
      {
        path: '',
        redirectTo: 'tables',
        pathMatch: 'full'
      },
      {
        path: 'usu-tables',
        loadComponent: () => import('./usu-tables/usu-tables.component').then(m => m.UsuTablesComponent),
        data: {
          title: 'Listado de Usuarios'
        }
      },
      {
        path: 'facu-tables',
        loadComponent: () => import('./facu-tables/facu-tables.component').then(m => m.FacuTablesComponent),
        data: {
          title: 'Listado de Facultades'
        }
      },
      {
        path: 'carreras-tables',
        loadComponent: () => import('./carreras-tables/carreras-tables.component').then(m => m.CarreraTablesComponent),
        data: {
          title: 'Listado de Carreras'
        }
      },
      {
        path: 'materias-tables',
        loadComponent: () => import('./materias-tables/materias-tables.component').then(m => m.MateriaTablesComponent),
        data: {
          title: 'Listado de Materias'
        }
      }
    ]
  }
];

