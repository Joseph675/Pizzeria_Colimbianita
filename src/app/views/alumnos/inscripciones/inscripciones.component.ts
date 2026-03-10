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
  WidgetStatFComponent
} from '@coreui/angular';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';
import { AuthService } from '../../../services/auth.service';

import { cilArrowRight, cilChartPie, cilUser, cilAddressBook } from '@coreui/icons';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-inscripciones',
  templateUrl: './inscripciones.component.html',
  styleUrls: ['./inscripciones.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
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

export class InscripcionesComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

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


  icons = { cilChartPie, cilArrowRight, cilUser, cilAddressBook };


  constructor(private http: HttpClient, private fb: FormBuilder, private authService: AuthService) {
    
  }

  ngOnInit(): void {
    Promise.all([this.loadFacultades(), this.loadCarreras(), this.loadMaterias(), this.loadCarrerasMaterias(), this.loadUsuarios()]).then(() => {
      this.loadCursos(); // Cargar cursos después de que materias y carrerasMaterias estén disponibles
    });

    const user = this.authService.getUser(); // Recuperar el usuario desde localStorage
    this.userName = user.nombre || 'Usuario';
    this.useridUsuUni = user.idUsuUni || 'Usuario no encontrado';

    this.userFacultad = user.facultadId || 'Facultad no encontrada';
    this.userCarrera = user.carrera || 'Carrera no encontrada';
    this.userCarreraNUM = user.carrera || 'Carrera no encontrada';



    this.loadFacultades().then(() => {
      const facultad = this.facultades.find(f => f.facultadId === this.userFacultad);
      this.userFacultad = facultad ? facultad.nombre : 'Facultad no encontrada';
    });

    this.loadCarreras().then(() => {
      const carrera = this.carreras.find(c => +c.carreraPk === +this.userCarrera); // Convertir ambos a número
      this.userCarrera = carrera ? carrera.nombre : 'Carrera no encontrada';
    });

    this.myForm = this.fb.group({
      cursoPk: ['', Validators.required],
      alumnoId: [this.useridUsuUni, Validators.required],
      estado: ['Activo', Validators.required]
    });

  }

  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      // Construir el JSON con la estructura requerida
      const inscripcion = this.myForm.value;
      this.http.post('http://localhost:8080/api/inscripciones', inscripcion).subscribe(
        (response) => {
          console.log('inscripcion creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Inscripcion registrada exitosamente!';
          this.showToast = true;

          // Limpiar el formulario y las variables
          this.myForm.reset({
            cursoPk: '', // Valor inicial
            alumnoId: '', // Valor inicial
            estado: '' // Valor inicial
          });

        
          this.selecteCurso = null; // Limpiar la selección del curso
          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear Curso:', error);
          this.toastType = 'error';
          if (error.status === 409) {
            this.toastMessage = 'El Curso ya existe!';
          } else if (error.status === 400) {
            this.toastMessage = 'Datos inválidos!';
          } else {
            this.toastMessage = 'Error al registrar el Curso!';
          }
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
        }
      );
    } else {
      console.error('El formulario no es válido');
      this.toastType = 'error';
      this.toastMessage = 'El formulario no es válido!';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
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

          console.log('CarrerasMaterias cargadas:', this.carrerasMaterias);
          resolve();
        },
        (error) => {
          console.error('Error al cargar la relación carrera-materia:', error);
          reject(error);
        }
      );
    });
  }

filterCursos(): void {
    const term = this.searchCursoTerm.toLowerCase();
    this.filteredCursos = this.cursos.filter(curso =>
      curso.materiaNombre.toLowerCase().includes(term) || // Buscar por nombre
      curso.cursoPk.toString().includes(term) // Buscar por código
    );
  }

  loadCursos(): void {

    this.http.get<any[]>('http://localhost:8080/api/cursos').subscribe(
      (data) => {

        console.log('Cursos antes del filtro:', data); // Verifica los datos de los cursos
        console.log('CarrerasMaterias:', this.carrerasMaterias); // Verifica la relación carrera-materia
        console.log('Usuario seleccionado carrera:', this.userCarreraNUM); // Verifica la carrera del usuario seleccionado

        this.cursos = data.filter(curso => {
          const carreraMateria = this.carrerasMaterias.find(cm => cm.materiaPk === curso.materiaPk);

          console.log('MateriaPk del curso:', curso.materiaPk);
          console.log('CarreraMateria encontrada:', carreraMateria);

          if (!carreraMateria) {
            console.warn(`No se encontró relación en carrerasMaterias para materiaPk: ${curso.materiaPk}`);
          } else if (carreraMateria.carreraPk !== +this.userCarreraNUM) { // Convertir a número
            console.warn(`La carrera del usuario (${this.userCarreraNUM}) no coincide con la carrera de la materia (${carreraMateria.carreraPk})`);
          }

          return carreraMateria && carreraMateria.carreraPk === +this.userCarreraNUM; // Convertir a número
        });

        console.log('Cursos después del filtro:', this.cursos);

        if (this.cursos.length === 0) {
          console.warn('El filtro no devolvió ningún curso');
        } else {
          this.cursos = this.cursos.map(curso => {
            const materia = this.materias.find(m => m.materiaPk === curso.materiaPk);
            const profesor = this.usuarios.find(u => u.idUsuUni === curso.profesorId);

            console.log('Materia:', materia);
            console.log('Profesor:', profesor);

            return {
              ...curso,
              materiaNombre: materia ? materia.nombre : 'Sin Materia',
              materiaDescripcion: materia ? materia.descripcion : 'Sin Descripción',
              profesorNombre: profesor ? profesor.nombre : 'Sin Profesor'
            };
          });
        }

        console.log('Cursos filtrados:', this.cursos);
        this.filteredCursos = this.cursos; // Mostrar todos los cursos al inicio
      },
      (error) => {
        console.error('Error al cargar los cursos:', error);
      }
    );
  }

  SelectCurso(curso: any): void {
    this.selecteCurso = curso; // Mantén el objeto completo para mostrar el nombre en el span
    console.log('Curso seleccionado:', this.selecteCurso);

    // Actualizar el valor del formulario reactivo con el identificador del curso
    this.myForm.patchValue({
      cursoPk: curso.cursoPk // Solo el identificador del curso
    });

    console.log('Valor del formulario después de seleccionar el curso:', this.myForm.value); // Verifica el valor del formulario
  }



}
