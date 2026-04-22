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
  templateUrl: 'presentacion_productos.component.html',
  styleUrls: ['presentacion_productos.component.scss'],
  standalone: true,
  imports: [ToastSampleIconComponent, NgIf, NgForOf, NgClass, CurrencyPipe, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormCheckLabelDirective, FormCheckInputDirective, FormCheckComponent, CardFooterComponent, CardGroupComponent, CardImgDirective, CardTextDirective, CardTitleDirective, FormsModule, ReactiveFormsModule, ProgressComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent]
})
export class PresentacionesComponent implements OnInit {
  myForm!: FormGroup;
  selectedPresentacion: any = null;

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


  public presentaciones: any[] = [];
  public presentacionesFiltrados: any[] = [];
  public presentacionesCargaError: string | null = null;
  public productos: any[] = [];
  public productosParaModal: any[] = []; // Para el filtro del modal
  public selectedProductoId: string = 'all';
  public selectedEstado: 'all' | 'active' | 'inactive' = 'all';
  public searchTerm: string = '';
  public searchProductoModal: string = '';

  public totalPresentaciones = 0;
  public totalActivos = 0;
  public totalInactivos = 0;
  public productosCargaError: string | null = null;
  public viewMode: 'table' | 'cards' = 'table';

  constructor(private http: HttpClient, private fromproductos: FormBuilder) { 

    this.myForm = this.fromproductos.group({
      idProducto : ['', Validators.required],
      nombrePresentacion : ['', Validators.required],
      precio : ['', [Validators.required, Validators.min(0)]]
    });

  }

  ngOnInit(): void {
    this.loadPresentaciones();
    this.loadProductos();
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


  

  loadPresentaciones(): void {
    this.presentacionesCargaError = null;
    this.http
      .get<any[]>('http://localhost:8080/api/presentaciones')
      .subscribe(
        (data) => {
          this.presentaciones = (data || []).sort((a, b) => {
            const idA = a.idPresentacion || a.id_presentacion || 0;
            const idB = b.idPresentacion || b.id_presentacion || 0;
            return idA - idB;
          });
          this.applyFilters();
          this.updateStats();
        },
        (error) => {
          console.error('Error al cargar presentaciones:', error);
          this.presentacionesCargaError = 'No se pudo cargar la lista de presentaciones. Verifica el servidor.';
        }
      );
  }

  loadProductos(): void {
    this.productosCargaError = null;
    this.http
      .get<any[]>('http://localhost:8080/api/productos')
      .subscribe(
        (data) => {
          this.productos = (data || []).filter(p => p.estado === 1).sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.productosParaModal = [...this.productos];
        },
        (error) => {
          console.error('Error al cargar los productos:', error);
          this.productosCargaError = 'No se pudo cargar la lista de productos. Verifica el servidor.';
        }
      );
  }

  crearPresentacion(): void {
    if (this.myForm.valid) {
      const formValues = this.myForm.value;
      const payload = {
        producto: { idProducto: Number(formValues.idProducto) },
        nombrePresentacion: formValues.nombrePresentacion,
        precio: Number(formValues.precio)
      };

      this.http.post('http://localhost:8080/api/presentaciones', payload).subscribe(
        (response) => {
          this.addToast('Presentación registrada exitosamente!', 'success');
          this.loadPresentaciones();
          this.myForm.reset({ idProducto: '', nombrePresentacion: '', precio: '' });
        },
        (error) => {
          console.error('Error al crear presentación:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido!', 'warning');
    }
  }

  actualizarPresentacion(): void {
    if (this.myForm.valid && this.selectedPresentacion) {
      const formValues = this.myForm.value;
      const payload = {
        producto: { idProducto: Number(formValues.idProducto) },
        nombrePresentacion: formValues.nombrePresentacion,
        precio: Number(formValues.precio),
        estado: this.selectedPresentacion.estado ?? 1
      };

      const id = this.selectedPresentacion.idPresentacion || this.selectedPresentacion.id_presentacion;
      this.http.put(`http://localhost:8080/api/presentaciones/${id}`, payload).subscribe(
        (response) => {
          this.addToast('Presentación actualizada exitosamente!', 'success');
          this.loadPresentaciones();
          this.selectedPresentacion = null;
          this.myForm.reset({ idProducto: '', nombrePresentacion: '', precio: '' });
        },
        (error) => {
          console.error('Error al actualizar presentación:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido o no hay presentación seleccionada!', 'warning');
    }
  }

  inactivarPresentacion(presentacion: any): void {
    const payload = {
      producto: { idProducto: presentacion.producto?.idProducto || presentacion.id_producto },
      nombrePresentacion: presentacion.nombrePresentacion || presentacion.nombre_presentacion,
      precio: presentacion.precio,
      estado: 0
    };

    const id = presentacion.idPresentacion || presentacion.id_presentacion;
    this.http.put(`http://localhost:8080/api/presentaciones/${id}`, payload).subscribe(
      (response) => {
        this.addToast('Presentación inactivada correctamente', 'success');
        this.loadPresentaciones();
      },
      (error) => {
        console.error('Error al inactivar presentación:', error.error);
        this.addToast(error.error || 'No se pudo inactivar la presentación', 'danger');
      }
    );
  }

  togglePresentacionEstado(presentacion: any): void {
    const nuevoEstado = presentacion.estado === 1 ? 0 : 1;
    const payload = {
      producto: { idProducto: presentacion.producto?.idProducto || presentacion.id_producto },
      nombrePresentacion: presentacion.nombrePresentacion || presentacion.nombre_presentacion,
      precio: presentacion.precio,
      estado: nuevoEstado
    };

    const id = presentacion.idPresentacion || presentacion.id_presentacion;
    this.http.put(`http://localhost:8080/api/presentaciones/${id}`, payload).subscribe(
      (response) => {
        const mensaje = nuevoEstado === 1 ? 'Presentación activada correctamente' : 'Presentación desactivada correctamente';
        this.addToast(mensaje, 'success');
        this.loadPresentaciones();
      },
      (error) => {
        console.error('Error al cambiar estado:', error.error);
        this.addToast(error.error || 'No se pudo cambiar el estado', 'danger');
      }
    );
  }

  updateStats(): void {
    this.totalPresentaciones = this.presentaciones.length;
    this.totalActivos = this.presentaciones.filter((p) => p.estado === 1).length;
    this.totalInactivos = this.presentaciones.filter((p) => p.estado === 0).length;
  }

  applyFilters(): void {
    let filtered = [...this.presentaciones];

    if (this.selectedProductoId !== 'all') {
      const productoId = Number(this.selectedProductoId);
      filtered = filtered.filter((p) => p.producto?.idProducto === productoId || p.id_producto === productoId);
    }

    if (this.selectedEstado !== 'all') {
      filtered = filtered.filter((p) =>
        this.selectedEstado === 'active' ? p.estado === 1 : p.estado === 0
      );
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        (p.nombrePresentacion || p.nombre_presentacion || '').toLowerCase().includes(term) ||
        (p.producto?.nombre || '').toLowerCase().includes(term)
      );
    }

    this.presentacionesFiltrados = filtered;
  }

  onProductoChange(value: string): void {
    this.selectedProductoId = value;
    this.applyFilters();
  }

  onEstadoChange(value: 'all' | 'active' | 'inactive'): void {
    this.selectedEstado = value;
    this.applyFilters();
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  filtrarProductosModal(value: string): void {
    this.searchProductoModal = value.toLowerCase();
    this.productosParaModal = this.productos.filter(p => 
      p.nombre.toLowerCase().includes(this.searchProductoModal)
    );
  }

  prepararNuevaPresentacion(): void {
    this.selectedPresentacion = null;
    this.myForm.reset();
    this.searchProductoModal = '';
    this.productosParaModal = [...this.productos];
  }

  openEditPresentacionModal(presentacion: any): void {
    this.selectedPresentacion = { ...presentacion };
    this.searchProductoModal = '';
    this.productosParaModal = [...this.productos];
    this.myForm.patchValue({
      idProducto: presentacion.producto?.idProducto || presentacion.id_producto || '',
      nombrePresentacion: presentacion.nombrePresentacion || presentacion.nombre_presentacion || '',
      precio: presentacion.precio || ''
    });
  }

  openDeletePresentacionModal(presentacion: any): void {
    this.selectedPresentacion = { ...presentacion };
  }

  confirmEliminar(id: number | undefined): void {
    if (!id) {
      this.addToast('ID no válido para eliminación', 'danger');
      return;
    }

    this.http.delete(`http://localhost:8080/api/presentaciones/${id}`).subscribe(
      (response) => {
        this.addToast('Presentación eliminada permanentemente', 'success');
        this.loadPresentaciones();
      },
      (error) => {
        console.error('Error al eliminar:', error.error);
        this.addToast(error.error || 'No se pudo eliminar', 'danger');
      }
    );
  }

}
