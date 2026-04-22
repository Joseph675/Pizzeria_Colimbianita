import { Component, OnInit, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf, NgClass, CurrencyPipe } from '@angular/common';
import {
  CardBodyComponent,
  CardComponent,
  CardHeaderComponent,
  ColComponent,
  RowComponent,
  WidgetStatFComponent,
  TemplateIdDirective,
  ButtonDirective,
  ButtonCloseDirective,
  ModalBodyComponent,
  ModalComponent,
  ModalFooterComponent,
  ModalHeaderComponent,
  ModalTitleDirective,
  ModalToggleDirective,
  FormControlDirective,
  FormDirective,
  FormLabelDirective,
  FormCheckLabelDirective,
  FormCheckInputDirective,
  FormCheckComponent,
  CardFooterComponent,
  CardGroupComponent,
  CardImgDirective,
  CardTextDirective,
  CardTitleDirective,
  ProgressComponent,
  ToastBodyComponent,
  ToastComponent,
  ToasterComponent,
  ToastHeaderComponent  
} from '@coreui/angular';
import { FormsModule, ReactiveFormsModule,FormGroup, FormBuilder,Validators} from '@angular/forms';
import { ToastSampleIconComponent } from './toast-sample-icon.component';

@Component({
  templateUrl: 'usuarios.component.html',
  styleUrls: ['usuarios.component.scss'],
  standalone: true,
  imports: [ToastSampleIconComponent, NgIf, NgForOf, NgClass, CurrencyPipe, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormCheckLabelDirective, FormCheckInputDirective, FormCheckComponent, CardFooterComponent, CardGroupComponent, CardImgDirective, CardTextDirective, CardTitleDirective, FormsModule, ReactiveFormsModule, ProgressComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent]
})
export class UsuariosComponent implements OnInit {
  myForm!: FormGroup;
  selectedIngrediente: any = null;

  position = 'top-end';
  visible = signal(false);
  percentage = signal(0);

  toasts: { id: number; message: string; type: 'success' | 'danger' | 'warning' | 'info' }[] = [];
  private nextToastId = 0;

  addToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success', duration = 2500) {
    const id = this.nextToastId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }


  public ingrediente: { idIngrediente?: number; id_ingrediente?: number; nombre: string; unidadMedida?: string; costoUnitario?: number;  }[] = [];
  
  public ingredientesFiltrados: { idIngrediente?: number; id_ingrediente?: number; nombre: string; unidadMedida?: string; costoUnitario?: number;  }[] = [];
  public searchTerm: string = '';

  public totalIngredientes = 0;
  public viewMode: 'table' | 'cards' = 'table';

  constructor(private http: HttpClient, private formBuilder: FormBuilder) { 

    this.myForm = this.formBuilder.group({
      idInventario : [''],
      nombre : ['', Validators.required],
      unidadMedida : ['', Validators.required],
      costoUnitario  : ['', Validators.required]

    });

  }

  ngOnInit(): void {
    this.cargarIngredientes();
  }

  public setView(mode: 'table' | 'cards') {
    this.viewMode = mode;
  }
  

  toggleToast() {
    this.visible.update((value) => !value);
  }

  onVisibleChange($event: boolean) {
    this.visible.set($event);
    this.percentage.set(this.visible() ? this.percentage() : 0);
  }

  onTimerChange($event: number) {
    this.percentage.set($event * 25);
  }


  cargarIngredientes(): void {
    this.http.get<{ idIngrediente?: number; id_ingrediente?: number; nombre: string; unidadMedida?: string; costoUnitario?: number;  }[]>('http://localhost:8080/api/ingredientes').subscribe(
      (data) => {
        this.ingrediente = data || [];
        this.applyFilters();
        this.updateStats();
        console.log('Ingredientes cargados:', this.ingrediente);
      },
      (error) => {
        console.error('Error al cargar ingredientes:', error);
        this.addToast('Error al cargar ingredientes', 'danger');
      }
    );
  }

  prepararNuevoIngrediente(): void {
    this.selectedIngrediente = null;
    this.myForm.reset();
  }

  crearIngrediente(): void {
      console.log('Formulario válido:', this.myForm.value);

    if (this.myForm.valid) {
      const formValues = this.myForm.value;
      const payload = {
        nombre: formValues.nombre,
        unidadMedida: formValues.unidadMedida,
        costoUnitario: formValues.costoUnitario
      };

      this.http.post('http://localhost:8080/api/ingredientes', payload).subscribe(
        (response) => {
          console.log('Ingrediente creado exitosamente:', response);
          this.addToast('Ingrediente registrado exitosamente!', 'success');
          this.myForm.reset();
          this.cargarIngredientes();
        },
        (error) => {
          console.error('Error al crear ingrediente:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido!', 'warning');
    }
  }

  actualizarIngrediente(): void {
    if (this.myForm.valid && this.selectedIngrediente) {
      const formValues = this.myForm.value;
      const payload = {
        nombre: formValues.nombre,
        unidadMedida: formValues.unidadMedida,
        costoUnitario: formValues.costoUnitario
      };

      this.http.put(`http://localhost:8080/api/ingredientes/${this.selectedIngrediente.idIngrediente || this.selectedIngrediente.id_ingrediente}`, payload).subscribe(
        (response) => {
          console.log('Ingrediente actualizado exitosamente:', response);
          this.addToast('Ingrediente actualizado exitosamente!', 'success');
          this.selectedIngrediente = null;
          this.myForm.reset();
          this.cargarIngredientes();
        },
        (error) => {
          console.error('Error al actualizar ingrediente:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido o no hay ingrediente seleccionado!', 'warning');
    }
  }

  updateStats(): void {
    this.totalIngredientes = this.ingrediente.length;
  }

  applyFilters(): void {
    let filtered = [...this.ingrediente];

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((i) =>
        (i.nombre || '').toLowerCase().includes(term) ||
        (i.unidadMedida || '').toLowerCase().includes(term)
      );
    }

    this.ingredientesFiltrados = filtered;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  openEditIngredienteModal(ingrediente: any): void {
    this.selectedIngrediente = { ...ingrediente }; 
    this.myForm.patchValue({
      nombre: ingrediente.nombre || '',
      unidadMedida: ingrediente.unidadMedida || ingrediente.unidad_medida || '',
      costoUnitario: ingrediente.costoUnitario || ingrediente.costo_unitario || ''
    });
  }

  openDeleteIngredienteModal(ingrediente: any): void {
    this.selectedIngrediente = { ...ingrediente }; 
  }

  confirmEliminar(ingredienteId: number | undefined): void {
    console.log('ID de ingrediente a eliminar:', ingredienteId);
    if (!ingredienteId) {
      this.addToast('ID de ingrediente no válido para eliminación', 'danger');
      return;
    }

    this.http.delete(`http://localhost:8080/api/ingredientes/${ingredienteId}`).subscribe(
      (response) => {
        this.addToast('Ingrediente eliminado permanentemente', 'success');
        this.cargarIngredientes();
      },
      (error) => {
        console.error('Error al eliminar ingrediente:', error.error);
        this.addToast(error.error || 'No se pudo eliminar el ingrediente', 'danger');
      }
    );
  }

}
