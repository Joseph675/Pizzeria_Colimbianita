import { Component, OnInit, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf, NgClass } from '@angular/common';
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
  templateUrl: 'productos.component.html',
  styleUrls: ['productos.component.scss'],
  standalone: true,
  imports: [ToastSampleIconComponent, NgIf, NgForOf, NgClass, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormCheckLabelDirective, FormCheckInputDirective, FormCheckComponent, CardFooterComponent, CardGroupComponent, CardImgDirective, CardTextDirective, CardTitleDirective, FormsModule, ReactiveFormsModule, ProgressComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent]
})
export class ProductosComponent implements OnInit {
  myForm!: FormGroup;
  selectedProducto: any = null;

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


  public productos: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string; }; estado?: number }[] = [];
  public productosFiltrados: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string; }; estado?: number }[] = [];
  public productosCargaError: string | null = null;
  public categorias: { idCategoria: number; nombre: string }[] = [];
  public selectedCategoriaId: string = 'all';
  public selectedEstado: 'all' | 'active' | 'inactive' = 'all';
  public searchTerm: string = '';

  public totalProductos = 0;
  public totalActivos = 0;
  public totalInactivos = 0;
  public totalCategorias = 0;
  public categoriasCargaError: string | null = null;
  public viewMode: 'table' | 'cards' = 'table';

  public showNuevoProductoModal: boolean = false;
  public showEditarProductoModal: boolean = false;
  public showEliminarProductoModal: boolean = false;
  public modalTop: string = '50%';

  constructor(private http: HttpClient, private fromproductos: FormBuilder) { 

    this.myForm = this.fromproductos.group({
      idCategoria : ['', Validators.required],
      nombre : ['', Validators.required],
      descripcion : ['', Validators.required],
      imagenUrl  : ['', Validators.required]

    });

  }

  ngOnInit(): void {
    this.loadproductos();
    this.loadcategorias();
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

  openNuevoProductoModal(): void {
    this.myForm.reset({ idCategoria: '', nombre: '', descripcion: '', imagenUrl: '' });
    this.showNuevoProductoModal = true;

    setTimeout(() => {
      const container = document.querySelector('.productos-wrap') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;
        const positionY = viewportCenterY - rect.top;
        this.modalTop = `${positionY}px`;
      }
    }, 0);
  }

  closeNuevoProductoModal(): void {
    this.showNuevoProductoModal = false;
  }
  

  loadproductos(): void {
    this.productosCargaError = null;
    this.http
      .get<{ id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string }; estado?: number }[]>('http://localhost:8080/api/productos')
      .subscribe(
        (data) => {
          // Ordenar productos por ID de manera ascendente para mantener orden consistente
          this.productos = (data || []).sort((a, b) => {
            const idA = a.id_producto || 0;
            const idB = b.id_producto || 0;
            return idA - idB;
          });
          this.applyFilters();
          this.updateStats();
          console.log('Productos cargados y ordenados por ID:', this.productos);
        },
        (error) => {
          console.error('Error al cargar los productos:', error);
          this.productosCargaError = 'No se pudo cargar la lista de productos. Verifica el servidor.';
        }
      );
  }

  loadcategorias(): void {
    this.categoriasCargaError = null;
    this.http
      .get<{ idCategoria: number; nombre: string }[]>('http://localhost:8080/api/categorias')
      .subscribe(
        (data) => {
          this.categorias = (data || []).sort((a, b) => a.nombre.localeCompare(b.nombre));
          this.updateStats();
          console.log('Categorías cargadas:', this.categorias);
        },
        (error) => {
          console.error('Error al cargar las categorías:', error);
          this.categoriasCargaError = 'No se pudo cargar la lista de categorías. Verifica el servidor.';
        }
      );
  }


   

  crearProducto(): void {
    if (this.myForm.valid) {
      const formValues = this.myForm.value;
      const payload = {
        categoria: { idCategoria: Number(formValues.idCategoria) },
        nombre: formValues.nombre,
        descripcion: formValues.descripcion,
        imagenUrl: formValues.imagenUrl
      };

      this.http.post('http://localhost:8080/api/productos', payload).subscribe(
        (response) => {
          console.log('Producto creado exitosamente:', response);
          this.addToast('Producto registrado exitosamente!', 'success');
          this.loadproductos();
          this.myForm.reset({ idCategoria: '', nombre: '', descripcion: '', imagenUrl: '' });
          this.closeNuevoProductoModal();
        },
        (error) => {
          console.error('Error al crear producto:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido!', 'warning');
    }
  }

  actualizarProducto(): void {

    console.log('Formulario válido:', this.myForm.valid);

    if (this.myForm.valid && this.selectedProducto) {
      const formValues = this.myForm.value;
      const payload = {
        idProducto: this.selectedProducto.idProducto,
        categoria: { idCategoria: Number(formValues.idCategoria) },
        nombre: formValues.nombre,
        descripcion: formValues.descripcion,
        imagenUrl: formValues.imagenUrl,
        estado: this.selectedProducto.estado ?? 1 // Mantener estado actual
      };

      this.http.put(`http://localhost:8080/api/productos/${this.selectedProducto.idProducto || this.selectedProducto.id_producto}`, payload).subscribe(
        (response) => {
          console.log('Producto actualizado exitosamente:', response);
          this.addToast('Producto actualizado exitosamente!', 'success');
          this.loadproductos();
          this.selectedProducto = null;
          this.myForm.reset({ idCategoria: '', nombre: '', descripcion: '', imagenUrl: '' });
          this.closeEditarProductoModal();
        },
        (error) => {
          console.error('Error al actualizar producto:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido o no hay producto seleccionado!', 'warning');
    }
  }

  inactivarProducto(producto: any): void {
    const payload = {
      idProducto: producto.idProducto || producto.id_producto,
      categoria: { idCategoria: producto.categoria?.idCategoria ?? producto.id_categoria ?? 0 },
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagenUrl: producto.imagenUrl,
      estado: 0
    };

    console.log('Payload para inactivar producto:', payload);
    console.log('Producto original:', producto);

    this.http.put(`http://localhost:8080/api/productos/${producto.idProducto || producto.id_producto}`, payload).subscribe(
      (response) => {
        console.log('Producto inactivado exitosamente:', response);
        this.addToast('Producto inactivado correctamente', 'success');
        this.loadproductos();
      },
      (error) => {
        console.error('Error al inactivar producto:', error.error);
        this.addToast(error.error || 'No se pudo inactivar el producto', 'danger');
      }
    );
  }

  toggleProductoEstado(producto: any): void {
    const nuevoEstado = producto.estado === 1 ? 0 : 1;
    const payload = {
      idProducto: producto.idProducto || producto.id_producto,
      categoria: { idCategoria: producto.categoria?.idCategoria ?? producto.id_categoria ?? 0 },
      nombre: producto.nombre,
      descripcion: producto.descripcion,
      imagenUrl: producto.imagenUrl,
      estado: nuevoEstado
    };

    this.http.put(`http://localhost:8080/api/productos/${producto.idProducto || producto.id_producto}`, payload).subscribe(
      (response) => {
        const mensaje = nuevoEstado === 1 ? 'Producto activado correctamente' : 'Producto desactivado correctamente';
        this.addToast(mensaje, 'success');
        this.loadproductos();
      },
      (error) => {
        console.error('Error al cambiar estado del producto:', error.error);
        this.addToast(error.error || 'No se pudo cambiar el estado del producto', 'danger');
      }
    );
  }

  updateStats(): void {
    this.totalProductos = this.productos.length;
    this.totalActivos = this.productos.filter((p) => p.estado === 1).length;
    this.totalInactivos = this.productos.filter((p) => p.estado === 0).length;
    this.totalCategorias = this.categorias.length;
  }

  applyFilters(): void {
    let filtered = [...this.productos];

    if (this.selectedCategoriaId !== 'all') {
      const categoriaId = Number(this.selectedCategoriaId);
      filtered = filtered.filter((p) => p.categoria?.idCategoria === categoriaId || p.id_categoria === categoriaId);
    }

    if (this.selectedEstado !== 'all') {
      filtered = filtered.filter((p) =>
        this.selectedEstado === 'active' ? p.estado === 1 : p.estado === 0
      );
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        (p.nombre || '').toLowerCase().includes(term) ||
        (p.descripcion || '').toLowerCase().includes(term) ||
        (p.categoria?.nombre || '').toLowerCase().includes(term)
      );
    }

    this.productosFiltrados = filtered;
  }

  onCategoryChange(value: string): void {
    this.selectedCategoriaId = value;
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

  openEditProductModal(producto: any): void {
    this.selectedProducto = { ...producto }; // Copia completa del producto
    // Mapear la estructura del producto a los campos del formulario
    this.myForm.patchValue({
      idCategoria: producto.categoria?.idCategoria || '',
      nombre: producto.nombre || '',
      descripcion: producto.descripcion || '',
      imagenUrl: producto.imagenUrl || ''
    });
    console.log('Producto seleccionado para editar:', this.selectedProducto);
    this.showEditarProductoModal = true;

    setTimeout(() => {
      const container = document.querySelector('.productos-wrap') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;
        const positionY = viewportCenterY - rect.top;
        this.modalTop = `${positionY}px`;
      }
    }, 0);
  }

  closeEditarProductoModal(): void {
    this.showEditarProductoModal = false;
    this.selectedProducto = null;
  }

  openDeleteProductModal(producto: any): void {
    this.selectedProducto = { ...producto }; // Copia del producto para mostrar en el modal
    console.log('Producto seleccionado para eliminar:', this.selectedProducto);
    this.showEliminarProductoModal = true;

    setTimeout(() => {
      const container = document.querySelector('.productos-wrap') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;
        const positionY = viewportCenterY - rect.top;
        this.modalTop = `${positionY}px`;
      }
    }, 0);
  }

  closeEliminarProductoModal(): void {
    this.showEliminarProductoModal = false;
    this.selectedProducto = null;
  }

  confirmEliminar(productoId: number | undefined): void {

    console.log('ID de producto a eliminar:', productoId);
    if (!productoId) {
      this.addToast('ID de producto no válido para eliminación', 'danger');
      return;
    }

    this.http.delete(`http://localhost:8080/api/productos/${productoId}`).subscribe(
      (response) => {
        console.log('Producto eliminado exitosamente:', response);
        this.addToast('Producto eliminado permanentemente', 'success');
        this.loadproductos();
        this.closeEliminarProductoModal();
      },
      (error) => {
        console.error('Error al eliminar producto:', error.error);
        this.addToast(error.error || 'No se pudo eliminar el producto', 'danger');
      }
    );
  }

}
