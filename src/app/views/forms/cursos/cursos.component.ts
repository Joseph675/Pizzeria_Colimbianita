import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective } from '@coreui/angular';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-cursos',
  templateUrl: './cursos.component.html',
  styleUrls: ['./cursos.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [MatInputModule, MatIcon, MatTimepickerModule, MatFormFieldModule, CommonModule, HttpClientModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective],
  standalone: true
})

export class CursosComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  usuarios: any[] = []; // Cambiado a any[] para evitar errores de tipo
  materias: any[] = []; // Cambiado a any[] para evitar errores de tipo
  tipoCursoSeleccionado: string = ''; // Variable para almacenar el tipo de curso seleccionado

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      cursoPk: ['', Validators.required],
      materiaPk: ['', Validators.required],
      profesorId: ['', Validators.required],
      tipoCurso: ['', Validators.required],
      cicloLectivo: ['', Validators.required],
      cuatrimestre: ['', Validators.required],
      horasSemanales: ['', Validators.required],
      estado: ['', Validators.required],
      aula: [''],
      capacidad: [''],
      plataforma: [''],
      enlaceAcceso: [''],
      activa: [true], // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
    this.loadMaterias();
    this.loadUsuarios();
  }

  onTipoCursoChange(): void {
    this.tipoCursoSeleccionado = this.myForm.get('tipoCurso')?.value; // Actualiza el tipo de curso seleccionado
  }


  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      const Curso = this.myForm.value;
      this.http.post('http://localhost:8080/api/cursos', Curso).subscribe(
        (response) => {
          console.log('Curso creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Curso registrado exitosamente!';
          this.showToast = true;

          // Limpiar el formulario después de la creación exitosa
          this.myForm.reset({
            cursoPk: '', // Valor inicial 
            materiaPk: '', // Valor inicial para nombre
            profesorId: '', // Valor inicial para codigo
            tipoCurso: '', // Valor inicial para duracionanios
            cicloLectivo: '', // Valor inicial
            cuatrimestre: '', // Valor inicial para descripcion
            horasSemanales: '', // Valor inicial para descripcion
            aula: '', // Valor inicial para descripcion
            capacidad: '', // Valor inicial para descripcion
            plataforma: '', // Valor inicial para descripcion
            enlaceAcceso: '', // Valor inicial para descripcion
            activa: true // Valor inicial para activa
          });

          setTimeout(() => this.showToast = false, 3000);
        },
        (error) => {
          console.error('Error al crear Curso:', error);
          this.toastType = 'error';
          if (error.status === 409) {
            this.toastMessage = 'La Curso ya existe!';
          } else if (error.status === 400) {
            this.toastMessage = 'Datos inválidos!';
          } else {
            this.toastMessage = 'Error al registrar la Curso!';
          }
          this.showToast = true;
          setTimeout(() => this.showToast = false, 3000);
        }
      );
    } else {
      console.error('El formulario no es válido');
      this.toastType = 'error';
      this.toastMessage = 'El formulario no es válido!';
      this.showToast = true;
      setTimeout(() => this.showToast = false, 3000);
    }
  }

  loadUsuarios(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios/profesores ').subscribe(
      (data) => {
        this.usuarios = data;

      },
      (error) => {
        console.error('Error al cargar los materias:', error);
      }
    );
  }

  loadMaterias(): void {
    this.http.get<any[]>('http://localhost:8080/api/materias').subscribe(
      (data) => {
        this.materias = data;

      },
      (error) => {
        console.error('Error al cargar los materias:', error);
      }
    );
  }
}
