import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective } from '@coreui/angular';

interface Faculty {
  name: string;
  carreras: string[];
}

@Component({
  selector: 'app-materias',
  templateUrl: './materias.component.html',
  styleUrls: ['./materias.component.scss'],
  imports: [CommonModule, HttpClientModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective],
  standalone: true
})

export class MateriasComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  time? = new Date();

  carreras: any[] = [];

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      materiaPk: ['', Validators.required],
      codigo: ['', Validators.required],
      nombre: ['', [Validators.required]],
      descripcion: ['', Validators.required],
      creditos: ['', Validators.required],
      activa: [true]  // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
    this.loadCarreras();
  }


  registrar(): void {
    console.log(this.myForm.value); // Verifica el valor del formulario antes de enviarlo
    if (this.myForm.valid) {
      const usuario = this.myForm.value;
      this.http.post('http://localhost:8080/api/materias', usuario).subscribe(
        (response) => {
          console.log('materias creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Materias registrado exitosamente!';
          this.showToast = true;
          setTimeout(() => this.showToast = false, 3000);
        },
        (error) => {
          console.error('Error al crear usuario:', error);
          this.toastType = 'error'; // Asegurarse de que el tipo de toast sea error
          if (error.status === 409) {
            this.toastMessage = 'El Materias ya existe!';
          } else {
            this.toastMessage = 'Error al registrar el Materias!';
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


  

  loadCarreras(): void {
    this.http.get<any[]>('http://localhost:8080/api/carreras').subscribe(
      (data) => {
        this.carreras = data;
      },
      (error) => {
        console.error('Error al cargar las carreras:', error);
      }
    );
  }

}
