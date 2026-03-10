import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RowComponent,ColComponent,TextColorDirective,CardComponent,CardHeaderComponent,CardBodyComponent,FormControlDirective,FormDirective,FormLabelDirective,FormSelectDirective,FormCheckComponent,FormCheckInputDirective,FormCheckLabelDirective,ButtonDirective,ColDirective,InputGroupComponent,InputGroupTextDirective} from '@coreui/angular';

interface Faculty {
  name: string;
  carreras: string[];
}

@Component({
  selector: 'app-facultades',
  templateUrl: './facultades.component.html',
  styleUrls: ['./facultades.component.scss'],
  imports: [CommonModule,HttpClientModule,RowComponent,ColComponent,TextColorDirective,CardComponent,CardHeaderComponent,CardBodyComponent,FormControlDirective,ReactiveFormsModule,FormsModule,FormDirective,FormLabelDirective,FormSelectDirective,FormCheckComponent,FormCheckInputDirective,FormCheckLabelDirective,ButtonDirective,ColDirective,InputGroupComponent,InputGroupTextDirective],
  standalone: true})
  
export class FacultadesComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';


  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      facultadId: ['', Validators.required],
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      activa: [true], // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
  }
  

  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      const facultad = this.myForm.value;
      this.http.post('http://localhost:8080/api/facultades', facultad).subscribe(
        (response) => {
          console.log('Facultad creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Facultad registrado exitosamente!';
          this.showToast = true;

           // Limpiar el formulario después de la creación exitosa
          this.myForm.reset({
          facultadId: '', // Valor inicial para facultadId
          nombre: '', // Valor inicial para nombre
          descripcion: '', // Valor inicial para descripcion
          activa: true // Valor inicial para activa
        });

          setTimeout(() => this.showToast = false, 3000);
        },
        (error) => {
          console.error('Error al crear Facultad:', error);
          this.toastType = 'error';
          if (error.status === 409) {
            this.toastMessage = 'La Facultad ya existe!';
          } else if (error.status === 400) {
            this.toastMessage = 'Datos inválidos!';
          } else {
            this.toastMessage = 'Error al registrar la Facultad!';
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
}
