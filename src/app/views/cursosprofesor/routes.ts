import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Asistencias',
    },
    children: [
      {
        path: '',
        redirectTo: 'form-control',
        pathMatch: 'full'
      },
     
      {
        path: 'miscursosprofe',
        loadComponent: () => import('./vercursosprofe/vercursosprofe.component').then(m => m.VerCursosProfeComponent),
        data: {
          title: 'Mis Cursos'
        }
      }

    ]
  }
];
