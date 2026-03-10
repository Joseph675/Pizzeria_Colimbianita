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
        path: 'registrar_asistencia',
        loadComponent: () => import('./registrarasistenciasprofe/registrarasistenciasprofe.component').then(m => m.RegistrarAsistenciasProfeComponent),
        data: {
          title: 'Registrar Asistencia'
        }
      },
      {
        path: 'misasistenciasprofe',
        loadComponent: () => import('./versistenciasprofe/versistenciasprofe.component').then(m => m.VerAsistenciasProfeComponent),
        data: {
          title: 'Mis Asistencias'
        }
      }

    ]
  }
];
