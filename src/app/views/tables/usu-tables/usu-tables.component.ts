import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {
  ButtonDirective,
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  RowComponent,
  AvatarComponent,
  ProgressComponent,
  TableModule,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ModalToggleDirective,
  FormCheckComponent,FormCheckInputDirective,FormCheckLabelDirective
} from '@coreui/angular';

import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {provideNativeDateAdapter} from '@angular/material/core';

interface Faculty {
  name: string;
  carreras: string[];
}

@Component({
  selector: 'app-usu-tables',
  templateUrl: './usu-tables.component.html',
  styleUrls: ['./usu-tables.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    MatDatepickerModule,
    MatInputModule,
    MatFormFieldModule,
    FormCheckComponent,
    FormCheckInputDirective,
    FormCheckLabelDirective,
    ProgressComponent,
    ButtonDirective,
    CommonModule,
    HttpClientModule,
    FormsModule,
    RowComponent,
    ColComponent,
    CardComponent,
    CardHeaderComponent,
    CardBodyComponent,
    IconDirective,
    RouterLink,
    AvatarComponent,
    ProgressComponent,
    TableModule,
    ReactiveFormsModule,
    ModalComponent, ModalHeaderComponent, ModalTitleDirective, ModalBodyComponent, ModalFooterComponent, ModalToggleDirective
  ],
  standalone: true
})
export class UsuTablesComponent implements OnInit {
  myForm!: FormGroup;

  users: any[] = [];
  selectedUser: any = null;
  filteredUsers: any[] = [];
  facultades: any[] = []; // Cambiado a any[] para evitar errores de tipo
  carreras: any[] = []; // Carreras disponibles
  filteredCarreras: any[] = []; // Carreras filtradas según la facultad seleccionada

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  selectedFaculty: string = '';
  selectedCarrera: string = '';
  selectedTipoUsuario: string = '';
  searchTerm: string = '';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      idUsuUni: ['', Validators.required], // Campo deshabilitado
      cedula: ['', Validators.required],
      nombre: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      facultadId: [''],
      carrera: [''],
      fechaNacimiento: ['',],
      especialidad: [''],
      area: [''],
      tipo: ['', Validators.required],
      activo: [''] 
    });
  }

  ngOnInit(): void {
    Promise.all([this.loadFacultades(), this.loadCarreras()]).then(() => {
      this.loadUsers();
    });
  }


  loadUsers(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios').subscribe(
      (data) => {

        this.users = data.map(user => {
          // Convertir los valores a números para la comparación
          const carrera = this.carreras.find(c => +c.carreraPk === +user.carrera);
          user.carreraNombre = carrera ? carrera.nombre : 'Carrera no encontrada';

          const facultad = this.facultades.find(f => +f.facultadId === +user.facultadId);
          user.facultadNombre = facultad ? facultad.nombre : 'Facultad no encontrada';

          return user;
        });

        this.applyFilters(); // Inicializar la lista filtrada
      },
      (error) => {
        console.error('Error al cargar los usuarios:', error);
      }
    );
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

  onFacultyChange(): void {
    // Buscar la facultad seleccionada
    const selectedFaculty = this.facultades.find(f => f.facultadId === +this.selectedFaculty);

    // Filtrar las carreras según la facultad seleccionada
    this.filteredCarreras = selectedFaculty
      ? this.carreras.filter(c => c.facultadId === selectedFaculty.facultadId)
      : [];

    // Limpiar el filtro de carrera si la facultad cambia
    this.selectedCarrera = '';

    // Aplicar los filtros
    this.applyFilters();
  }


  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Filtrar por facultad
      const matchesFaculty = this.selectedFaculty
        ? user.facultadId === +this.selectedFaculty
        : true;

      // Filtrar por carrera
      const matchesCarrera = this.selectedCarrera
        ? user.carrera === this.selectedCarrera
        : true;

      // Filtrar por tipo de usuario
      const matchesTipoUsuario = this.selectedTipoUsuario
        ? user.tipo === this.selectedTipoUsuario
        : true;

      // Filtrar por término de búsqueda
      const matchesSearchTerm = this.searchTerm
        ? user.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        user.idUsuUni.toString().includes(this.searchTerm) ||
        user.email.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      // Retornar true si el usuario cumple con todos los filtros
      return matchesFaculty && matchesCarrera && matchesTipoUsuario && matchesSearchTerm;
    });
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  trackByFn(index: number, item: any): any {
    return item.idUsuUni; // o cualquier propiedad única del usuario
  }

  openEditModal(user: any): void {
    this.selectedUser = user;
    this.myForm.patchValue(user);
    console.log('Usuario seleccionado:', this.selectedUser);
  }


  EliminarUser(user: any): void {
    console.log(user)
    // Realizar la solicitud DELETE al backend
    this.http.delete(`http://localhost:8080/api/usuarios/${user.idUsuario}`).subscribe(
      () => {
        console.log(`Usuario con ID ${user.idUsuario} eliminado exitosamente.`);
        // Actualizar la lista de usuarios después de eliminar
        this.users = this.users.filter(u => u.idUsuario !== user.idUsuario);
        this.applyFilters(); // Actualizar la lista filtrada

        // Mostrar mensaje de éxito
        this.toastType = 'success';
        this.toastMessage = 'Usuario Eliminado exitosamente!';
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);

      },
      (error) => {
        console.error('Error al eliminar el usuario:', error);
        // Mostrar un mensaje de error
        this.toastType = 'error';
        this.toastMessage = 'Error al eliminar el usuario.';
        this.showToast = true;
        setTimeout(() => (this.showToast = false), 3000);
      }
    );
  }

  guardarCambios(): void {
    if (this.myForm.valid) {
      const updatedUser = this.myForm.value;
      // Realizar la solicitud PUT al backend
      this.http.put(`http://localhost:8080/api/usuarios/${this.selectedUser.idUsuario}`, updatedUser).subscribe(
        (response) => {
          console.log('Usuario actualizado exitosamente:', response);
          // Actualizar la lista de usuarios después de la edición
          const index = this.users.findIndex(u => u.idUsuario === this.selectedUser.idUsuario);
          if (index !== -1) {
            this.users[index] = { ...this.users[index], ...updatedUser };
          }
          this.applyFilters(); // Actualizar la lista filtrada

          // Mostrar mensaje de éxito
          this.toastType = 'success';
          this.toastMessage = 'Usuario actualizado exitosamente!';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
          this.ngOnInit(); // Recargar los usuarios después de la edición

        },
        (error) => {
          console.error('Error al actualizar el usuario:', error);
          // Mostrar un mensaje de error
          this.toastType = 'error';
          this.toastMessage = 'Error al actualizar el usuario.';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
        }
      );
    } else {
      console.error('El formulario no es válido');
      // Mostrar un mensaje de error
      this.toastType = 'error';
      this.toastMessage = 'El formulario no es válido!';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
  }
  
  getColorForUser(user: any): string {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', '#F5FF33'];
    const index = user.idUsuUni % colors.length; // Usa el ID para asignar un color
    return colors[index];
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?'; // Obtiene la primera letra del nombre
  }

  onFacultadChange(event: Event): void {
    const selectedFacultadId = (event.target as HTMLSelectElement).value;
  
    console.log('Facultad seleccionada:', selectedFacultadId); // Verifica el ID de la facultad seleccionada
    // Filtrar las carreras según la facultad seleccionada
    this.filteredCarreras = this.carreras.filter(carrera => carrera.facultadId === parseInt(selectedFacultadId, 10));
  
    console.log('Carreras filtradas:', this.filteredCarreras); // Verifica las carreras filtradas
  }
}
