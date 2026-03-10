import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    data: {
      title: 'Forms'
    },
    children: [
      {
        path: '',
        redirectTo: 'form-control',
        pathMatch: 'full'
      },

      {
        path: 'usuarios-form',
        loadComponent: () => import('./usuarios/usuarios.component').then(m => m.UsuariosComponent),
        data: {
          title: 'Usuarios'
        }
      },

      {
        path: 'facultades-form',
        loadComponent: () => import('./facultades/facultades.component').then(m => m.FacultadesComponent),
        data: {
          title: 'Facultades'
        }
      },

      {
        path: 'carreras-form',
        loadComponent: () => import('./carreras/carreras.component').then(m => m.CarrerasComponent),
        data: {
          title: 'Carreras'
        }
      },
      {
        path: 'materias-form',
        loadComponent: () => import('./materias/materias.component').then(m => m.MateriasComponent),
        data: {
          title: 'Materias'
        }
      },
      {
        path: 'carreras_materias-form',
        loadComponent: () => import('./carreras_materias/carreras_materias.component').then(m => m.Carreras_MateriasComponent),
        data: {
          title: 'Materias por Carrera'
        }
      },
      {
        path: 'cursos-form',
        loadComponent: () => import('./cursos/cursos.component').then(m => m.CursosComponent),
        data: {
          title: 'Cursos'
        }
      },
      {
        path: 'inscripciones-form',
        loadComponent: () => import('./inscripciones/inscripciones.component').then(m => m.InscripcionesComponent),
        data: {
          title: 'Inscripciones'
        }
      },
      {
        path: 'secciones',
        loadComponent: () => import('./secciones/secciones.component').then(m => m.SeccionesComponent),
        data: {
          title: 'Secciones'
        }
      }
    ]
  }
];
