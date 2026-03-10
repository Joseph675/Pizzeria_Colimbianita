import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RowComponent,ColComponent,TextColorDirective,CardComponent,CardHeaderComponent,CardBodyComponent,FormControlDirective,FormDirective,FormLabelDirective,FormSelectDirective,FormCheckComponent,FormCheckInputDirective,FormCheckLabelDirective,ButtonDirective,ColDirective,InputGroupComponent,InputGroupTextDirective} from '@coreui/angular';


@Component({
  selector: 'app-carreras',
  templateUrl: './carreras.component.html',
  styleUrls: ['./carreras.component.scss'],
  imports: [CommonModule,HttpClientModule,RowComponent,ColComponent,TextColorDirective,CardComponent,CardHeaderComponent,CardBodyComponent,FormControlDirective,ReactiveFormsModule,FormsModule,FormDirective,FormLabelDirective,FormSelectDirective,FormCheckComponent,FormCheckInputDirective,FormCheckLabelDirective,ButtonDirective,ColDirective,InputGroupComponent,InputGroupTextDirective],
  standalone: true})
  
export class CarrerasComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  facultades: any[] = []; // Cambiado a any[] para evitar errores de tipo

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      carreraPk: ['', Validators.required],
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      duracionanios: ['', Validators.required],
      facultadId: ['', Validators.required], // Cambiado a facultadId
      descripcion: ['', Validators.required],
      activa: [true], // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
    this.loadFacultades();
  }
  

  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      const carrera = this.myForm.value;
      this.http.post('http://localhost:8080/api/carreras', carrera).subscribe(
        (response) => {
          console.log('Carrera creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Carrera registrado exitosamente!';
          this.showToast = true;

           // Limpiar el formulario después de la creación exitosa
          this.myForm.reset({
          carreraPk: '', // Valor inicial para facultadId
          nombre: '', // Valor inicial para nombre
          codigo: '', // Valor inicial para codigo
          duracionanios: '', // Valor inicial para duracionanios
          facultadId: '', // Valor inicial para facultadId
          descripcion: '', // Valor inicial para descripcion
          activa: true // Valor inicial para activa
        });

          setTimeout(() => this.showToast = false, 3000);
        },
        (error) => {
          console.error('Error al crear Carrera:', error);
          this.toastType = 'error';
          if (error.status === 409) {
            this.toastMessage = 'La Carrera ya existe!';
          } else if (error.status === 400) {
            this.toastMessage = 'Datos inválidos!';
          } else {
            this.toastMessage = 'Error al registrar la Carrera!';
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

  loadFacultades(): void {
    this.http.get<any[]>('http://localhost:8080/api/facultades').subscribe(
      (data) => {
        this.facultades = data;

      },
      (error) => {
        console.error('Error al cargar los usuarios:', error);
      }
    );
  }
}
