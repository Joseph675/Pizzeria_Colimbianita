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
  selector: 'app-facu-tables',
  templateUrl: './facu-tables.component.html',
  styleUrls: ['./facu-tables.component.scss'],
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
export class FacuTablesComponent implements OnInit {
  myForm!: FormGroup;

  facultades: any[] = [];
  selectedFacu: any = null;

  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  searchTerm: string = ''; // Término de búsqueda
  filteredFacultades: any[] = []; // Lista de facultades filtradas

  constructor(private http: HttpClient, private fb: FormBuilder) {
    // Se incluye también el campo "area" en el formulario
    this.myForm = this.fb.group({
      facultadId: ['', Validators.required], // Campo deshabilitado
      nombre: ['', Validators.required],
      descripcion: ['', [Validators.required]],
      activa: [''] 
    });
  }

  ngOnInit(): void {
    this.loadFacultades();
  }


  applyFilters(): void {
    this.filteredFacultades = this.facultades.filter(facu => {
      const matchesSearchTerm = this.searchTerm
        ? facu.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
          facu.descripcion.toLowerCase().includes(this.searchTerm.toLowerCase())
        : true;
  
      return matchesSearchTerm;
    });
  }

  trackByFn(index: number, item: any): any {
    return item.facultadId; // Usar una propiedad única para el seguimiento
  }

  // Método para cargar las facultades desde el backend
  loadFacultades(): Promise<void> {
    console.log('Cargando facultades desde el backend...');
    return new Promise((resolve, reject) => {
      this.http.get<any[]>('http://localhost:8080/api/facultades').subscribe(
        (data) => {
          this.facultades = data;
          this.filteredFacultades = [...this.facultades]; // Inicializar la lista filtrada
          resolve();
        },
        (error) => {
          console.error('Error al cargar las facultades:', error);
          reject(error);
        }
      );
    });
  }
 

  openFacuModal(facu: any): void {
    this.selectedFacu = facu;
    this.myForm.patchValue(facu);
    console.log('Facultad seleccionado:', this.selectedFacu);
  }


  EliminarFacu(facu: any): void {
    // Realizar la solicitud DELETE al backend
    this.http.delete(`http://localhost:8080/api/facultades/${facu.id}`).subscribe(
      () => {
        // Actualizar la lista de facultades después de eliminar
        this.loadFacultades();
        // Mostrar mensaje de éxito
        this.toastType = 'success';
        this.toastMessage = 'Facultad eliminado exitosamente!';
        this.showToast = true;
        setTimeout(() => this.showToast = false, 3000);

      },
      (error) => {
        console.error('Error al eliminar el Facultad:', error);
        // Mostrar un mensaje de error
        this.toastType = 'error';
        this.toastMessage = 'Error al eliminar el Facultad.';
        this.showToast = true;
        setTimeout(() => (this.showToast = false), 3000);
      }
    );
  }

  guardarCambios(): void {
    if (this.myForm.valid) {
      const formData = this.myForm.value;
      // Realizar la solicitud PUT al backend
      this.http.put(`http://localhost:8080/api/facultades/${this.selectedFacu.id}`, formData).subscribe(
        () => {
          // Actualizar la lista de facultades después de guardar los cambios
          this.loadFacultades();
          // Mostrar mensaje de éxito
          this.toastType = 'success';
          this.toastMessage = 'Facultad actualizada exitosamente!';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al guardar los cambios:', error);
          // Mostrar un mensaje de error
          this.toastType = 'error';
          this.toastMessage = 'Error al guardar los cambios.';
          this.showToast = true;
          setTimeout(() => (this.showToast = false), 3000);
        }
      );
    } else {
      // Mostrar un mensaje de error si el formulario no es válido
      this.toastType = 'error';
      this.toastMessage = 'Por favor, completa todos los campos obligatorios.';
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
    
  }


 
}
