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
  selector: 'app-carreras_materias',
  templateUrl: './carreras_materias.component.html',
  styleUrls: ['./carreras_materias.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [MatInputModule, MatIcon, MatTimepickerModule, MatFormFieldModule, CommonModule, HttpClientModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective],
  standalone: true
})

export class Carreras_MateriasComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  carreras: any[] = []; // Cambiado a any[] para evitar errores de tipo
  materias: any[] = []; // Cambiado a any[] para evitar errores de tipo
  tipoCursoSeleccionado: string = ''; // Variable para almacenar el tipo de curso seleccionado

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      carreraPk: ['', Validators.required],
      materiaPk: ['', Validators.required],
      anioCursada: ['', Validators.required],
      cuatrimestre: ['', Validators.required],
    
      activa: [true], // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
    this.loadMaterias();
    this.loadCarreras();
  }



  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      // Construir el JSON con la estructura requerida
      const curso = {
        id: {
          carreraPk: this.myForm.get('carreraPk')?.value,
          materiaPk: this.myForm.get('materiaPk')?.value
        },
        anioCursada: this.myForm.get('anioCursada')?.value,
        cuatrimestre: this.myForm.get('cuatrimestre')?.value,
        activa: this.myForm.get('activa')?.value
      };
  
      this.http.post('http://localhost:8080/api/carrera_materia', curso).subscribe(
        (response) => {
          console.log('carrera_materia creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Materia registrada a la carrera exitosamente!';
          this.showToast = true;
  
          // Limpiar el formulario después de la creación exitosa
          this.myForm.reset({
            carreraPk: '', // Valor inicial
            materiaPk: '', // Valor inicial
            anioCursada: '', // Valor inicial
            cuatrimestre: '', // Valor inicial
            activa: true // Valor inicial
          });
  
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

  loadCarreras(): void {
    this.http.get<any[]>('http://localhost:8080/api/carreras').subscribe(
      (data) => {
        this.carreras = data;

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
