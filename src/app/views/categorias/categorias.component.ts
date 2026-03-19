import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf } from '@angular/common';
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
  imports: [NgIf, NgForOf, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormsModule, ReactiveFormsModule]
})
export class CategoriasComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  public productos: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string } }[] = [];
  public productosCargaError: string | null = null;

  public categorias: { id_categoria: number; nombre: string; descripcion?: string }[] = [];
  public categoriasCargaError: string | null = null;
  public viewMode: 'table' | 'cards' = 'table';

  // ── NUEVO: categoría seleccionada en el panel derecho ──────────────────────
  public selectedCat: { id_categoria: number; nombre: string; descripcion?: string } | null = null;

  constructor(private http: HttpClient, private fromproductos: FormBuilder) {
    this.myForm = this.fromproductos.group({
      nombre:       ['', Validators.required],
      descripcion:  ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadproductos();
    this.loadcategorias(); // ← AGREGADO: antes no se llamaba
  }

  public setView(mode: 'table' | 'cards') {
    this.viewMode = mode;
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
      .get<{ id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string } }[]>('http://localhost:8080/api/productos')
      .subscribe(
        (data) => {
          this.productos = data || [];
          console.log('Productos cargados:', this.productos);
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
      .get<{ id_categoria: number; nombre: string; descripcion?: string }[]>('http://localhost:8080/api/categorias')
      .subscribe(
        (data) => {
          this.categorias = data || [];
          console.log('Categorías cargadas:', this.categorias);
        },
        (error) => {
          console.error('Error al cargar las categorías:', error);
          this.categoriasCargaError = 'No se pudo cargar la lista de categorías. Verifica el servidor.';
        }
      );
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
        nombre:      formValues.nombre,
        descripcion: formValues.descripcion,
        imagenUrl:   formValues.imagenUrl
      };

      this.http.post('http://localhost:8080/api/productos', payload).subscribe(
        (response) => {
          console.log('Producto creado exitosamente:', response);
          this.toastType    = 'success';
          this.toastMessage = 'Producto registrado exitosamente!';
          this.showToast    = true;
          this.loadproductos();

          this.myForm.reset({
            id_categoria: '',
            nombre:       '',
            descripcion:  '',
            imagenUrl:    ''
          });

          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear producto:', error.error);
          this.toastType    = 'error';
          this.toastMessage = error.error || 'Ocurrió un error en el servidor';
          this.showToast    = true;
          setTimeout(() => (this.showToast = false), 3000);
        }
      );
    } else {
      console.error('El formulario no es válido');
      this.toastType    = 'error';
      this.toastMessage = 'El formulario no es válido!';
      this.showToast    = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
  }

  registrarcategoria(): void {
    console.log("Formulario de categoría enviado");
    console.log(this.myForm.value);

    if (this.myForm.valid) {
      const formValues = this.myForm.value;

      const payload = {
        nombre:       formValues.nombre,
        descripcion:  formValues.descripcion
      };

      this.http.post('http://localhost:8080/api/categorias', payload).subscribe(
        (response) => {
          console.log('Categoría creada exitosamente:', response);
          this.toastType    = 'success';
          this.toastMessage = 'Categoría registrada exitosamente!';
          this.showToast    = true;
          this.loadcategorias();

          this.myForm.reset({
            nombre:       '',
            descripcion:  ''
          });

          setTimeout(() => (this.showToast = false), 3000);
        },
        (error) => {
          console.error('Error al crear categoría:', error.error);
          this.toastType    = 'error';
          this.toastMessage = error.error || 'Ocurrió un error en el servidor';
          this.showToast    = true;
          setTimeout(() => (this.showToast = false), 3000);
        }
      );
    } else {
      console.error('El formulario no es válido');
      this.toastType    = 'error';
      this.toastMessage = 'El formulario no es válido!';
      this.showToast    = true;
      setTimeout(() => (this.showToast = false), 3000);
    }
  }
}