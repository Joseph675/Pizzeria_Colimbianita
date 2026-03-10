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
  selector: 'app-carrera-tables',
  templateUrl: './carreras-tables.component.html',
  styleUrls: ['./carreras-tables.component.scss'],
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
export class CarreraTablesComponent implements OnInit {
  myForm!: FormGroup;

  carreras: any[] = []; // Lista de carreras
  facultades: any[] = []; // Lista de facultades
  filteredCarreras: any[] = []; // Carreras filtradas
  selectedCarrera: any = null; // Carrera seleccionada para editar
  searchTerm: string = ''; // Término de búsqueda
  selectedFaculty: string = ''; // Facultad seleccionada para filtrar

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private http: HttpClient, private fb: FormBuilder) {
    this.myForm = this.fb.group({
      carreraPk: ['', Validators.required],
      nombre: ['', Validators.required],
      codigo: ['', Validators.required],
      facultadId: ['', Validators.required],
      duracionanios: ['', Validators.required],
      descripcion: [''],
      activa: [true]
    });
  }

  ngOnInit(): void {
    Promise.all([this.loadFacultades(), this.loadCarreras()]).then(() => {
      this.applyFilters();
    });
  }

  openCarreraModal(carrera: any): void {
    this.selectedCarrera = carrera;
    this.myForm.patchValue(carrera);
  }

  applyFilters(): void {
    this.filteredCarreras = this.carreras.filter(carrera => {
      const matchesFaculty = this.selectedFaculty
        ? carrera.facultadId === +this.selectedFaculty
        : true;

      const matchesSearchTerm = this.searchTerm
        ? carrera.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          carrera.codigo.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          carrera.descripcion?.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;

      return matchesFaculty && matchesSearchTerm;
    });
  }

  onFacultyChange(): void {
    this.applyFilters();
  }

  trackByFn(index: number, item: any): any {
    return item.carreraPk; // Usar una propiedad única para el seguimiento
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
          // Agregar el nombre de la facultad a cada carrera
          this.carreras = data.map(carrera => {
            const facultad = this.facultades.find(f => f.facultadId === carrera.facultadId);
            return {
              ...carrera,
              facultadNombre: facultad ? facultad.nombre : 'Sin Facultad'
            };
          });
          this.filteredCarreras = [...this.carreras]; // Inicializar la lista filtrada
          resolve();
        },
        (error) => {
          console.error('Error al cargar las carreras:', error);
          reject(error);
        }
      );
    });
  }
  guardarCambios(): void {
    if (this.myForm.valid) {
      const updatedCarrera = this.myForm.value;

      if (this.selectedCarrera) {
        // Actualizar carrera existente
        this.http.put(`http://localhost:8080/api/carreras/${this.selectedCarrera.id}`, updatedCarrera).subscribe(
          (response) => {
            console.log('Carrera actualizada exitosamente:', response);
            const index = this.carreras.findIndex(c => c.id === this.selectedCarrera.id);
            if (index !== -1) {
              this.carreras[index] = { ...this.carreras[index], ...updatedCarrera };
            }
            this.applyFilters();
            this.showToastMessage('success', 'Carrera actualizada exitosamente!');
          },
          (error) => {
            console.error('Error al actualizar la carrera:', error);
            this.showToastMessage('error', 'Error al actualizar la carrera.');
          }
        );
      } 
    } else {
      console.error('El formulario no es válido');
      this.showToastMessage('error', 'El formulario no es válido!');
    }
  }

  eliminarCarrera(carrera: any): void {
    this.http.delete(`http://localhost:8080/api/carreras/${carrera.id}`).subscribe(
      () => {
        console.log(`Carrera con ID ${carrera.id} eliminada exitosamente.`);
        this.carreras = this.carreras.filter(c => c.id !== carrera.id);
        this.applyFilters();
        this.showToastMessage('success', 'Carrera eliminada exitosamente!');
      },
      (error) => {
        console.error('Error al eliminar la carrera:', error);
        this.showToastMessage('error', 'Error al eliminar la carrera.');
      }
    );
  }

  getColorForCarrera(carrera: any): string {
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A1', '#A133FF', '#33FFF5', '#F5FF33'];
    const index = carrera.carreraPk % colors.length;
    return colors[index];
  }

  getInitials(name: string): string {
    return name ? name.charAt(0).toUpperCase() : '?';
  }

  onFacultadChange(event: Event): void {
    const selectedFacultadId = (event.target as HTMLSelectElement).value;

    console.log('Facultad seleccionada:', selectedFacultadId);
    this.filteredCarreras = this.carreras.filter(carrera => carrera.facultadId === parseInt(selectedFacultadId, 10));

    console.log('Carreras filtradas:', this.filteredCarreras);
  }

  private showToastMessage(type: 'success' | 'error', message: string): void {
    this.toastType = type;
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => (this.showToast = false), 3000);
  }
}
