import { INavData } from '@coreui/angular';
import { CustomNavData } from './CustomNavData'; // Asegúrate de importar la interfaz correcta

export const navItems: CustomNavData[] = [
  
  {
    title: true,
    name: 'Menú & Productos'
  },
  {
    name: 'Dashboards',
    url: '/dashboard',
    materialIcon: 'dashboard',
  },

  {
    name: 'Productos',
    url: '/productos',
    materialIcon: 'restaurant',  // Material icon name
  },

  {
    name: 'Categorías',
    url: '/categorias',
    materialIcon: 'category',  // Material icon name
  },

  {
    name: 'Combos y Promociones',
    url: '/combos-promociones',
    materialIcon: 'redeem',  // Material icon name
  },

  {
    title: true,
    name: 'Negocio'
  },

  {
    name: 'mesas',
    url: '/mesas',
    materialIcon: 'table_restaurant',  // Material icon name
  },

  {
    name: 'Clientes',
    url: '/clientes',
    materialIcon: 'people',  // Material icon name
  },

  {
    name: 'Ingredientes',
    url: '/ingredientes',
    materialIcon: 'local_pizza',  // Material icon name
  },
  {
    name: 'Inventario',
    url: '/inventario',
    materialIcon: 'inventory',  // Material icon name
  },


  {
    title: true,
    name: 'Sistema'
  },

  {
    name: 'Usuario y Roles',
    url: '/usuarios',
    materialIcon: 'people',  // Material icon name
  },

  {
    name: 'Reportes',
    url: '/reportes',
    materialIcon: 'description',  // Material icon name
  },

  {
    name: 'Configuración',
    url: '/configuracion',
    materialIcon: 'settings',  // Material icon name
  },

  {
    name: 'Forms',
    url: '/forms',
    materialIcon: 'description',
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
    materialIcon: 'table_chart',
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
    materialIcon: 'school',
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
    materialIcon: 'schedule',
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
    materialIcon: 'check_circle',
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
    materialIcon: 'book',
  },
  {
    name: 'Ver Mis Asistencias ',
    url: '/alumnos/verasistenciasalumno',
    allowedFor: ['Alumno'],
    materialIcon: 'fact_check',
  },

];
