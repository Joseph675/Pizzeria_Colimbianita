import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective } from '@coreui/angular';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { provideNativeDateAdapter } from '@angular/material/core';

import { RfidService } from '../../../services/rfid.service';




@Component({
  selector: 'app-usuarios',
  templateUrl: './usuarios.component.html',
  providers: [provideNativeDateAdapter()],
  styleUrls: ['./usuarios.component.scss'],
  imports: [MatDatepickerModule, MatInputModule, MatFormFieldModule, CommonModule, HttpClientModule, RowComponent, ColComponent, TextColorDirective, CardComponent, CardHeaderComponent, CardBodyComponent, FormControlDirective, ReactiveFormsModule, FormsModule, FormDirective, FormLabelDirective, FormSelectDirective, FormCheckComponent, FormCheckInputDirective, FormCheckLabelDirective, ButtonDirective, ColDirective, InputGroupComponent, InputGroupTextDirective],
  standalone: true
})

export class UsuariosComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  facultades: any[] = []; // Cambiado a any[] para evitar errores de tipo
  carreras: any[] = []; // Carreras disponibles
  filteredCarreras: any[] = []; // Carreras filtradas según la facultad seleccionada

  constructor(private http: HttpClient, private fb: FormBuilder, private rfid: RfidService) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      tipo: ['', Validators.required],
      idUsuUni: ['', Validators.required],
      uid: ['', Validators.required],
      cedula: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      facultadId: [''],
      carrera: [''],
      fechaNacimiento: ['', Validators.required],
      especialidad: [''], // Sin validadores, es opcional
      area: [''],         // Sin validadores, es opcional
      password: ['', Validators.required],
      activo: [true], // Valor predeterminado como booleano
    });
  }

  ngOnInit(): void {
    this.loadFacultades();
    this.loadCarreras();

    this.rfid.uid$.subscribe(uid => {
      // 1. Actualiza el campo alumnoId del formulario con el UID recibido
      this.myForm.patchValue({ uid: uid });
    });

  }

  registrar(): void {
    console.log(this.myForm.value);
    if (this.myForm.valid) {
      // Construir el objeto con la estructura requerida
      const formData = this.myForm.value;
      const payload = {
        usuarioDTO: {
          tipo: formData.tipo,
          idUsuUni: formData.idUsuUni,
          uid: formData.uid,
          cedula: formData.cedula,
          nombre: formData.nombre,
          email: formData.email,
          facultadId: formData.facultadId,
          carrera: formData.carrera,
          fechaNacimiento: formData.fechaNacimiento,
          especialidad: formData.especialidad,
          area: formData.area,
          activo: formData.activo
        },
        password: formData.password
      };

      console.log('Payload enviado:', payload);

      // Enviar el payload al backend
      this.http.post('http://localhost:8080/api/usuarios', payload).subscribe(
        (response) => {
          console.log('Usuario creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Usuario registrado exitosamente!';
          this.showToast = true;

          // Reiniciar el formulario con valores iniciales
          this.myForm.reset({
            tipo: '',
            idUsuUni: '',
            uid: '',
            cedula: '',
            nombre: '',
            email: '',
            facultadId: '',
            carrera: '',
            fechaNacimiento: '',
            especialidad: '',
            area: '',
            password: '',
            activo: true
          });

          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear usuario:', error.error);
          this.toastType = 'error';
          this.toastMessage = error.error;
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

  onFacultadChange(event: Event): void {
    const selectedFacultadId = (event.target as HTMLSelectElement).value;

    console.log('Facultad seleccionada:', selectedFacultadId); // Verifica el ID de la facultad seleccionada
    // Filtrar las carreras según la facultad seleccionada
    this.filteredCarreras = this.carreras.filter(carrera => carrera.facultadId === parseInt(selectedFacultadId, 10));

    console.log('Carreras filtradas:', this.filteredCarreras); // Verifica las carreras filtradas
  }
}
