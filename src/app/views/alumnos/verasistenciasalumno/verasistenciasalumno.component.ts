import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective, ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ModalToggleDirective,
  CardImgDirective,
  CardTextDirective,
  CardTitleDirective,
  TableModule,
  ProgressComponent,
  AvatarComponent,
  TableDirective,
  TemplateIdDirective,
  WidgetStatFComponent,
  Tabs2Module
} from '@coreui/angular';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../../services/auth.service';
import { RfidService } from '../../../services/rfid.service';
import { cilArrowRight, cilChartPie, cilUser, cilAddressBook, cilHome } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-verasistenciasalumno',
  templateUrl: './verasistenciasalumno.component.html',
  styleUrls: ['./verasistenciasalumno.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    Tabs2Module,
    TemplateIdDirective,
    WidgetStatFComponent,
    IconDirective,
    TableDirective,
    ProgressComponent,
    AvatarComponent,
    TableModule,
    CardImgDirective,
    CardTextDirective,
    CardTitleDirective,
    ModalBodyComponent,
    ModalComponent,
    ModalFooterComponent,
    ModalHeaderComponent,
    ModalTitleDirective,
    ModalToggleDirective, MatInputModule, MatIcon, MatTimepickerModule, MatFormFieldModule, CommonModule, HttpClientModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective],
  standalone: true
})

export class VerAsistenciasAlumnoComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  cilHome = cilHome;

  public scannedUid: string | null = null;

  handleChange($event: string | number | undefined) {
    console.log('handleChange', $event);
  }

  usuarios: any[] = []; // Cambiado a any[] para evitar errores de tipo
  alumnos: any[] = []; // Cambiado a any[] para evitar errores de tipo
  cursos: any[] = []; // Cambiado a any[] para evitar errores de tipo
  materias: any[] = []; // Cambiado a any[] para evitar errores de tipo

  user: any = null;
  userName: string = '';
  useridUsuUni: string = '';
  userFacultad: string = '';
  userCarrera: string = '';
  userCarreraNUM: string = '';
  inscripciones: any[] = []; // Cambiado a any[] para evitar errores de tipo
  sesiones: any[] = []; // Cambiado a any[] para evitar errores de tipo
  cursoSeleccionado: any = null; // Curso seleccionado por el profesor
  sesionesFiltradas: any[] = []; // Sesiones filtradas por el curso seleccionado
  selectedFaculty: string = '';
  selectedCarrera: string = '';
  selectedTipoUsuario: string = '';
  searchTerm: string = '';
  filteredUsers: any[] = []; // Cambiado a any[] para evitar errores de tipo
  filteredCarreras: any[] = []; // Cambiado a any[] para evitar errores de tipo
  facultades: any[] = []; // Cambiado a any[] para evitar errores de tipo
  carreras: any[] = []; // Cambiado a any[] para evitar errores de tipo
  carrerasMaterias: any[] = []; // Cambiado a any[] para evitar errores de tipo
  selecteCurso: any = null; // Cambiado a any para evitar errores de tipo
  searchCursoTerm: string = '';
  filteredCursos: any[] = []; // Cambiado a any[] para evitar errores de tipo

  todaslassecciones: any[] = []; // Cambiado a any[] para evitar errores de tipo
  todosloscursos: any[] = []; // Cambiado a any[] para evitar errores de tipo
  asistencias: any[] = [];
  asistenciasEnriquecidas: any[] = [];

  searchText: string = '';
  asistenciasFiltradas: any[] = [];


  sesionSeleccionada: any = null;
  icons = { cilChartPie, cilArrowRight, cilUser, cilAddressBook };


  constructor(private http: HttpClient, private fb: FormBuilder, private authService: AuthService, private rfid: RfidService) {

  }

  ngOnInit(): void {
    // Cargar datos iniciales
    Promise.all([
      this.loadFacultades(),
      this.loadCarreras(),
      this.loadMaterias(),
      this.loadCarrerasMaterias(),
      this.loadUsuarios(),
      this.loadCursos(),
      this.loadSesiones()
    ]).then(() => {
      this.loadAsistencias(); // Cargar sesiones después de los cursos
    });

    // Obtener usuario actual
    const user = this.authService.getUser();
    this.user = user;
    this.userName = user.nombre || 'Usuario';
    this.useridUsuUni = user.idUsuUni || 'Usuario no encontrado';
    this.userFacultad = user.facultadId || 'Facultad no encontrada';
    this.userCarrera = user.carrera || 'Carrera no encontrada';
    this.userCarreraNUM = user.carrera || 'Carrera no encontrada';

    // Mostrar nombre de facultad y carrera
    this.loadFacultades().then(() => {
      const facultad = this.facultades.find(f => f.facultadId === this.userFacultad);
      this.userFacultad = facultad ? facultad.nombre : 'Facultad no encontrada';
    });
    this.loadCarreras().then(() => {
      const carrera = this.carreras.find(c => +c.carreraPk === +this.userCarrera);
      this.userCarrera = carrera ? carrera.nombre : 'Carrera no encontrada';
    });

    this.myForm = this.fb.group({
      alumnoId: [''],
      // ...otros campos...
    });


    // Suscripción al lector RFID para registrar asistencia automáticamente
    this.rfid.uid$.subscribe(uid => {
      if (!uid) return;
      this.myForm.patchValue({ alumnoId: uid });
      this.searchText = uid;         // <-- Esto pone el UID en el input de búsqueda
      this.filtrarAsistencias();     // <-- Esto actualiza la tabla filtrada
    });
  }

  onSesionChange(event: any) {
    const sesionId = event.target.value;
    this.sesionSeleccionada = this.sesiones.find(s => s.sesionId == sesionId) || null;
  }

  onCursoChange() {
    this.cursoSeleccionado = this.myForm.get('cursoSelect')?.value;
    if (this.cursoSeleccionado) {
      this.sesionesFiltradas = this.sesiones.filter(
        s => s.cursoPk === this.cursoSeleccionado.cursoPk
      );
      this.myForm.patchValue({ sesionId: '' });
    } else {
      this.sesionesFiltradas = [];
      this.myForm.patchValue({ sesionId: '' });
    }
  }

  registrar(): void {
    if (this.myForm.valid && this.cursoSeleccionado) {
      const asistencia = {
        ...this.myForm.value,
        cursoPk: this.cursoSeleccionado.cursoPk, // Agregar el curso seleccionado
        sesionId: this.cursoSeleccionado.sesionId, // Agregar la sesión seleccionada
      };
      console.log('Asistencia registrada:', asistencia);
      // Aquí puedes enviar los datos al backend
      this.myForm.reset({ presente: true, justificada: false }); // Reiniciar el formulario
    } else {
      console.error('Formulario inválido o curso no seleccionado');
    }
  }


  seleccionarCurso(curso: any): void {
    if (curso) {
      this.cursoSeleccionado = JSON.parse(curso); // Si estás pasando un objeto como string
      console.log('Curso seleccionado:', this.cursoSeleccionado);
    } else {
      console.warn('No se seleccionó un curso válido');
    }
  }
  loadMaterias(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/materias').subscribe(
        (data) => {
          this.materias = data;
          resolve(); // Resuelve la promesa cuando las materias se cargan correctamente
        },
        (error) => {
          console.error('Error al cargar las materias:', error);
          reject(error); // Rechaza la promesa si ocurre un error
        }
      );
    });
  }

  loadFacultades(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/facultades').subscribe(
        (data) => {
          this.facultades = data;
          resolve();
        },
        (error) => {
          console.error('Error al cargar las facultades:', error);
          reject(error);
        }
      );
    });
  }

  loadCarreras(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/carreras').subscribe(
        (data) => {
          this.carreras = data;
          resolve();
        },
        (error) => {
          console.error('Error al cargar las carreras:', error);
          reject(error);
        }
      );
    });
  }

  loadUsuarios(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios').subscribe(
      (data) => {

        this.usuarios = data.map(user => {
          // Convertir los valores a números para la comparación
          const carrera = this.carreras.find(c => +c.carreraPk === +user.carrera);
          user.carreraNombre = carrera ? carrera.nombre : 'Carrera no encontrada';

          const facultad = this.facultades.find(f => +f.facultadId === +user.facultadId);
          user.facultadNombre = facultad ? facultad.nombre : 'Facultad no encontrada';

          return user;
        });

      },
      (error) => {
        console.error('Error al cargar los usuarios:', error);
      }
    );
  }


  loadCarrerasMaterias(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/carrera_materia').subscribe(
        (data) => {
          this.carrerasMaterias = data.map(cm => ({
            carreraPk: cm.id.carreraPk,
            materiaPk: cm.id.materiaPk,
            anioCursada: cm.anioCursada,
            cuatrimestre: cm.cuatrimestre
          }));

          resolve();
        },
        (error) => {
          console.error('Error al cargar la relación carrera-materia:', error);
          reject(error);
        }
      );
    });
  }

  loadCursos(): void {
    this.http.get<any[]>('http://localhost:8080/api/cursos').subscribe(
      (data) => {
        console.log('Cursos disponibles:', data);
        this.todosloscursos = data; // Guardar todos los cursos para referencia futura

        // Filtrar los cursos para que solo se incluyan los del profesor logueado
        this.cursos = data.filter(curso => curso.profesorId === +this.useridUsuUni);

        if (this.cursos.length === 0) {
          console.warn('El filtro no devolvió ningún curso para el profesor logueado');
        } else {
          // Enriquecer los datos de los cursos con información adicional
          this.cursos = this.cursos.map(curso => {
            const materia = this.materias.find(m => m.materiaPk === curso.materiaPk);
            const profesor = this.usuarios.find(u => u.idUsuUni === curso.profesorId);

            return {
              ...curso,
              materiaNombre: materia ? materia.nombre : 'Sin Materia',
              materiaDescripcion: materia ? materia.descripcion : 'Sin Descripción',
              profesorNombre: profesor ? profesor.nombre : 'Sin Profesor'
            };
          });
        }

        this.filteredCursos = this.cursos; // Mostrar todos los cursos al inicio
        console.log('Cursos filtrados para el profesor logueado:', this.cursos);
      },
      (error) => {
        console.error('Error al cargar los cursos:', error);
      }
    );
  }



  loadSesiones(): void {
    this.http.get<any[]>('http://localhost:8080/api/sesiones').subscribe(
      (data) => {
        console.log('Todas las sesiones:', data);

        this.todaslassecciones = data; // Guardar todas las sesiones para referencia futura

        // Filtrar las sesiones para incluir solo las de los cursos del profesor logueado
        this.sesiones = data.filter(sesion => {
          // Buscar el curso correspondiente a la sesión
          const curso = this.cursos.find(c => c.cursoPk === sesion.cursoPk);
          console.log('Curso encontrado para la sesión:', curso);
          // Verificar si el profesorId del curso coincide con el usuario logueado
          return curso && curso.profesorId === +this.useridUsuUni;
        }).map(sesion => {
          // Buscar el curso correspondiente
          const curso = this.cursos.find(c => c.cursoPk === sesion.cursoPk);

          // Obtener materiaPk y materiaNombre del curso
          const materiaPk = curso ? curso.materiaPk : 'Sin materiaPk';
          const materiaNombre = curso ? curso.materiaNombre : 'Sin materiaNombre';
          const cursoTipo = curso ? curso.tipoCurso : 'Sin tipoCurso';

          // Combinar los datos
          return {
            ...sesion,
            materiaPk,
            materiaNombre,
            cursoTipo
          };
        });

        console.log('Sesiones filtradas para el profesor logueado:', this.sesiones);
      },
      (error) => {
        console.error('Error al cargar las sesiones:', error);
      }
    );
  }

  loadAsistencias(): void {
    this.http.get<any[]>('http://localhost:8080/api/asistencias').subscribe(
      (data) => {
        // Filtra solo las asistencias del alumno logueado (por idUsuUni)
        this.asistencias = data.filter(a => a.alumnoId === this.user.uid);

        this.asistenciasEnriquecidas = this.asistencias.map(asistencia => {
          // Buscar usuario por idUsuUni
          const usuario = this.usuarios.find(u => u.uid === asistencia.alumnoId);
          // Buscar sesión
          const sesion = this.todaslassecciones.find(s => s.sesionId === asistencia.sesionId);
          // Buscar curso
          const curso = sesion ? this.todosloscursos.find(c => c.cursoPk === sesion.cursoPk) : null;
          console.log('Sesión encontrada para la asistencia:', curso);

          // Buscar materia
          const materia = curso ? this.materias.find(m => m.materiaPk === curso.materiaPk) : null;

          return {
            ...asistencia,
            alumnoidusu: usuario ? usuario.idUsuUni : 'Desconocido',
            alumnouid: usuario ? usuario.uid : 'Desconocido',
            alumnoNombre: usuario ? usuario.nombre : 'Desconocido',
            materiaNombre: materia ? materia.nombre : 'Sin materia',
            fechaRegistro: asistencia.fechaRegistro ? asistencia.fechaRegistro : 'Sin fecha'
          };
        });
        this.filtrarAsistencias(); // <-- filtra al cargar
        console.log('Asistencias filtradas para el alumno logueado:', this.asistenciasEnriquecidas);
      },
      (error) => {
        console.error('Error al cargar las asistencias:', error);
      }
    );
  }

  filtrarAsistencias(): void {
    const texto = this.searchText ? this.searchText.toLowerCase() : '';
    this.asistenciasFiltradas = this.asistenciasEnriquecidas.filter(a =>
      (!texto) ||
      (a.alumnoNombre && a.alumnoNombre.toLowerCase().includes(texto)) ||
      (a.materiaNombre && a.materiaNombre.toLowerCase().includes(texto)) ||
      (a.observaciones && a.observaciones.toLowerCase().includes(texto)) ||
      (a.alumnoidusu && a.alumnoidusu.toString().toLowerCase().includes(texto)) ||
      (a.alumnouid && a.alumnouid.toString().toLowerCase().includes(texto))
    );
  }

}
