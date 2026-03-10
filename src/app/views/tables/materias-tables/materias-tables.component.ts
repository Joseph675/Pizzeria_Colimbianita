import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { IconDirective } from '@coreui/icons-angular';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import {
  FormControlDirective,
  FormFloatingDirective,
  FormLabelDirective,
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


@Component({
  selector: 'app-materias-tables',
  templateUrl: './materias-tables.component.html',
  styleUrls: ['./materias-tables.component.scss'],
  providers: [provideNativeDateAdapter()],
  imports: [
    FormControlDirective,
    FormFloatingDirective,
    FormLabelDirective,
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
export class MateriaTablesComponent implements OnInit {
  myForm!: FormGroup;

  carreras: any[] = []; // Lista de carreras
  facultades: any[] = []; // Lista de facultades
  materias: any[] = []; // Lista de materias
  filteredMaterias: any[] = []; // Materias filtradas
  selectedMateria: any = null; // Materia seleccionada para editar
  selectedFaculty: string = ''; // Facultad seleccionada para filtrar
  selectedCarrera: string = ''; // Carrera seleccionada para filtrar
  searchTerm: string = ''; // Término de búsqueda

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private fb: FormBuilder) {
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
    Promise.all([this.loadFacultades(), this.loadCarreras(), this.loadMaterias()]).then(() => {
      this.applyFilters();
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

  loadMaterias(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/materias').subscribe(
        (data) => {
          this.materias = data.map(materia => {
            const carrera = this.carreras.find(c => c.carreraPk === materia.carreraPk);
            const facultad = carrera ? this.facultades.find(f => f.facultadId === carrera.facultadId) : null;
            return {
              ...materia,
              carreraNombre: carrera ? carrera.nombre : 'Sin Carrera',
              facultadNombre: facultad ? facultad.nombre : 'Sin Facultad'
            };
          });
          this.filteredMaterias = [...this.materias]; // Inicializar la lista filtrada
          resolve();
        },
        (error) => {
          console.error('Error al cargar las materias:', error);
          reject(error);
        }
      );
    });
  }

  applyFilters(): void {
    this.filteredMaterias = this.materias.filter(materia => {
      const matchesFaculty = this.selectedFaculty
        ? materia.facultadNombre === this.facultades.find(f => f.facultadId === +this.selectedFaculty)?.nombre
        : true;

      const matchesCarrera = this.selectedCarrera
        ? materia.carreraPk === +this.selectedCarrera
        : true;

      const matchesSearchTerm = this.searchTerm
        ? materia.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          materia.codigo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          materia.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return matchesFaculty && matchesCarrera && matchesSearchTerm;
    });
  }

  onFacultyChange(): void {
    this.selectedCarrera = ''; // Reset carrera cuando cambia la facultad
    this.applyFilters();
  }

  onCarreraChange(): void {
    this.applyFilters();
  }

  guardarCambios(): void {
    if (this.myForm.valid) {
      const updatedMateria = this.myForm.value;
      // Realizar la solicitud PUT al backend
      this.http.put(`http://localhost:8080/api/materias/${this.selectedMateria.id}`, updatedMateria).subscribe(
        (response) => {
          console.log('Materia actualizado exitosamente:', response);
          // Actualizar la lista de usuarios después de la edición
          const index = this.materias.findIndex(u => u.id === this.selectedMateria.id);
          if (index !== -1) {
            this.materias[index] = { ...this.materias[index], ...updatedMateria };
          }
          this.applyFilters(); // Actualizar la lista filtrada

          // Mostrar mensaje de éxito
          this.toastType = 'success';
          this.toastMessage = 'Materia actualizado exitosamente!';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
          this.ngOnInit(); // Recargar los usuarios después de la edición

        },
        (error) => {
          console.error('Error al actualizar la Materia:', error);
          // Mostrar un mensaje de error
          this.toastType = 'error';
          this.toastMessage = 'Error al actualizar la Materia.';
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

  eliminarMateria(materia: any): void {
    this.http.delete(`http://localhost:8080/api/materias/${materia.id}`).subscribe(
      () => {
        this.materias = this.materias.filter(m => m.id !== materia.id);
        this.applyFilters();
        this.showToastMessage('success', 'Materia eliminada exitosamente!');
      },
      () => {
        this.showToastMessage('error', 'Error al eliminar la materia.');
      }
    );
  }

  private showToastMessage(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }

  trackByFn(index: number, item: any): any {
    return item.materiaPk; // Usar una propiedad única para el seguimiento
  }

  getColorForCarrera(materia: any): string {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', '#F5FF33'];
    const index = materia.carreraPk % colors.length; // Usa el `carreraPk` para calcular el índice
    return colors[index];
  }
  getInitials(name: string): string {
    if (!name) return '?'; // Si el nombre no está definido, retorna un signo de interrogación
    return name
      .split(' ') // Divide el nombre en palabras
      .map(word => word.charAt(0).toUpperCase()) // Toma la primera letra de cada palabra y la convierte en mayúscula
      .join(''); // Une las iniciales
  }

  openMateriaModal(materia: any): void {
    this.selectedMateria = materia; // Asigna la materia seleccionada
    this.myForm.patchValue(materia); // Carga los datos de la materia en el formulario
  }
}
