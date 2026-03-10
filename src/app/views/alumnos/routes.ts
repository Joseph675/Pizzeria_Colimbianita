import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Alumnos'
    },
    children: [
      {
        path: '',
        redirectTo: 'form-control',
        pathMatch: 'full'
      },
      {
        path: 'inscripciones-form',
        loadComponent: () => import('./inscripciones/inscripciones.component').then(m => m.InscripcionesComponent),
        data: {
          title: 'Inscripciones'
        }
      },
      {
        path: 'misinscripciones',
        loadComponent: () => import('./mis_inscripciones/mis_inscripciones.component').then(m => m.MisInscripcionesComponent),
        data: {
          title: 'Mis Inscripciones'
        }
      },
      {
        path: 'horariosemanal',
        loadComponent: () => import('./horariosemanal/HorarioSemanal.component').then(m => m.HorarioSemanalComponent),
        data: {
          title: 'Horario Semanal'
        }
      }
      ,
      {
        path: 'verasistenciasalumno',
        loadComponent: () => import('./verasistenciasalumno/verasistenciasalumno.component').then(m => m.VerAsistenciasAlumnoComponent),
        data: {
          title: 'Mis Asistencias'
        }
      }

    ]
  }
];
