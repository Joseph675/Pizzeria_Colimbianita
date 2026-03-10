import { INavData } from '@coreui/angular';
import { CustomNavData } from './CustomNavData'; // Asegúrate de importar la interfaz correcta

export const navItems: CustomNavData[] = [
  {
    name: 'Dashboard',
    url: '/dashboard',
    iconComponent: { name: 'cil-speedometer' },
  },
  
  
  
  {
    name: 'Forms',
    url: '/forms',
    iconComponent: { name: 'cil-notes' },
    allowedFor: ['Admin'],
    children: [
      {
        name: 'Usuarios',
        url: '/forms/usuarios-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Facultades',
        url: '/forms/facultades-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Carreras',
        url: '/forms/carreras-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Materias',
        url: '/forms/materias-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Materias por Carrera',
        url: '/forms/carreras_materias-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Cursos',
        url: '/forms/cursos-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Inscripciones',
        url: '/forms/inscripciones-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Secciones',
        url: '/forms/secciones',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Asistencias',
        url: '/forms/asistencias-form',
        icon: 'nav-icon-bullet'
      }
      
    ]
  },
  
  {
    name: 'Tables',
    url: '/tables',
    iconComponent: { name: 'cil-align-center' },
    allowedFor: ['Admin'],
    children: [
      {
        name: 'Usuarios',
        url: '/tables/usu-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Facultades',
        url: '/tables/facu-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Carreras',
        url: '/tables/carreras-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Materias',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Materias por Carrera',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Cursos',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Inscripciones',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Sesiones',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Asistencias',
        url: '/tables/materias-tables',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  
  {
    name: 'Inscripciones ',
    url: '/alumnos',
    iconComponent: { name: 'cil-education' },
    allowedFor: ['Alumno'], 
    children: [
      {
        name: 'Catálogo de cursos disponibles',
        url: '/alumnos/inscripciones-form',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Mis inscripciones',
        url: '/alumnos/misinscripciones',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  
  {
    name: 'Horario De Clases',
    url: '/horariosemanal',
    iconComponent: { name: 'cil-clock' },
    allowedFor: ['Alumno'], 
    children: [
      {
        name: 'Ver mi horario semanal',
        url: '/alumnos/horariosemanal',
        icon: 'nav-icon-bullet'
      }
    ]
  },

  {
    name: 'Asistencias',
    url: '/asistencias',
    iconComponent: { name: 'cil-address-book' },
    allowedFor: ['Profesor'], 
    children: [
      {
        name: 'Registro de asistencias',
        url: '/asistencias/registrar_asistencia',
        icon: 'nav-icon-bullet'
      },
      {
        name: 'Historial de asistencia',
        url: '/asistencias/misasistenciasprofe',
        icon: 'nav-icon-bullet'
      }
    ]
  },
  {
    name: 'Ver Mis Cursos ',
    url: '/vercursos/miscursosprofe',
    allowedFor: ['Profesor'], 
    iconComponent: { name: 'cil-address-book' },
  },
  {
    name: 'Ver Mis Asistencias ',
    url: '/alumnos/verasistenciasalumno',
    allowedFor: ['Alumno'], 
    iconComponent: { name: 'cil-address-book' },
  },
  
];
