import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf,NgClass } from '@angular/common';
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
  FormLabelDirective
} from '@coreui/angular';
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';

@Component({
  templateUrl: 'categorias.component.html',
  styleUrls: ['categorias.component.scss'],
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormsModule, ReactiveFormsModule]
})
export class CategoriasComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';


  public productos: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string; }; estado?: number }[] = [];

  public productosFiltrados: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string; }; estado?: number }[] = [];

  public productosCargaError: string | null = null;

  public categorias: { idCategoria: number; nombre: string }[] = [];
  public categoriasFiltradas: { idCategoria: number; nombre: string }[] = [];
  public categoriasCargaError: string | null = null;
  public viewMode: 'table' | 'cards' = 'table';
  public searchTerm: string = '';
  public totalProductos = 0;
  public totalActivos = 0;
  public totalInactivos = 0;
  public totalCategorias = 0;
  public selectedCategoriaId: string = 'all';
  public selectedEstado: 'all' | 'active' | 'inactive' = 'all';

  // ── NUEVO: categoría seleccionada en el panel derecho ──────────────────────
  public selectedCat: { id_categoria: number; nombre: string; descripcion?: string } | null = null;

  public showNuevaCategoriaModal: boolean = false;

  constructor(private http: HttpClient, private fromproductos: FormBuilder) {
    this.myForm = this.fromproductos.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadproductos();
    this.loadcategorias();
  }

  public setView(mode: 'table' | 'cards') {
    this.viewMode = mode;
  }

  openNuevaCategoriaModal(): void {
    this.myForm.reset({ nombre: '', descripcion: '' });
    this.showNuevaCategoriaModal = true;
  }

  closeNuevaCategoriaModal(): void {
    this.showNuevaCategoriaModal = false;
  }

  // ── NUEVO: seleccionar categoría para el panel derecho ─────────────────────
  public selectCat(cat: { id_categoria: number; nombre: string; descripcion?: string }): void {
    this.selectedCat = cat;
  }

  // ── NUEVO: filtrar productos por categoría ─────────────────────────────────
  public getProductosPorCategoria(idCategoria: number) {
    return this.productos.filter(p => p.categoria?.idCategoria === idCategoria);
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
          this.applyCategoriaFilters();
          this.updateStats();
          console.log('Categorías cargadas:', this.categorias);
        },
        (error) => {
          console.error('Error al cargar las categorías:', error);
          this.categoriasCargaError = 'No se pudo cargar la lista de categorías. Verifica el servidor.';
        }
      );
  }

  applyCategoriaFilters(): void {
    if (this.searchTerm.trim() === '') {
      this.categoriasFiltradas = [...this.categorias];
    } else {
      const term = this.searchTerm.trim().toLowerCase();
      this.categoriasFiltradas = this.categorias.filter((categoria) =>
        categoria.nombre.toLowerCase().includes(term)
      );
    }
  }

  onCategoriaSearch(value: string): void {
    this.searchTerm = value;
    this.applyCategoriaFilters();
  }

  registrarproductos(): void {
    console.log("Formulario enviado");
    console.log(this.myForm.value);

    if (this.myForm.valid) {
      const formValues = this.myForm.value;

      const payload = {
        categoria: {
          idCategoria: Number(formValues.id_categoria)
        },
        nombre: formValues.nombre,
        descripcion: formValues.descripcion,
        imagenUrl: formValues.imagenUrl
      };

      this.http.post('http://localhost:8080/api/productos', payload).subscribe(
        (response) => {
          console.log('Producto creado exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Producto registrado exitosamente!';
          this.showToast = true;
          this.loadproductos();

          this.myForm.reset({
            id_categoria: '',
            nombre: '',
            descripcion: '',
            imagenUrl: ''
          });

          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear producto:', error.error);
          this.toastType = 'error';
          this.toastMessage = error.error || 'Ocurrió un error en el servidor';
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

  registrarcategoria(): void {
    console.log("Formulario de categoría enviado");
    console.log(this.myForm.value);

    if (this.myForm.valid) {
      const formValues = this.myForm.value;

      const payload = {
        nombre: formValues.nombre,
        descripcion: formValues.descripcion
      };

      this.http.post('http://localhost:8080/api/categorias', payload).subscribe(
        (response) => {
          console.log('Categoría creada exitosamente:', response);
          this.toastType = 'success';
          this.toastMessage = 'Categoría registrada exitosamente!';
          this.showToast = true;
          this.loadcategorias();

          this.myForm.reset({
            nombre: '',
            descripcion: ''
          });

          this.closeNuevaCategoriaModal();
          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear categoría:', error.error);
          this.toastType = 'error';
          this.toastMessage = error.error || 'Ocurrió un error en el servidor';
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

  

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }
}