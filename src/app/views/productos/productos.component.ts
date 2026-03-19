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
import { FormsModule, ReactiveFormsModule,FormGroup, FormBuilder,Validators} from '@angular/forms';

@Component({
  templateUrl: 'productos.component.html',
  styleUrls: ['productos.component.scss'],
  standalone: true,
  imports: [NgIf, NgForOf, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormsModule, ReactiveFormsModule]
})
export class ProductosComponent implements OnInit {
  myForm!: FormGroup;
  showToast: boolean = false;
  toastMessage: string = '';
  toastType: 'success' | 'error' = 'success';

  public productos: { id_producto: number; id_categoria: number; nombre: string; descripcion?: string; imagenUrl?: string; categoria: { idCategoria: number; nombre: string } }[] = [];
  public productosCargaError: string | null = null;
  public viewMode: 'table' | 'cards' = 'table';

  constructor(private http: HttpClient, private fromproductos: FormBuilder) { 

    this.myForm = this.fromproductos.group({
      id_categoria : ['', Validators.required],
      nombre : ['', Validators.required],
      descripcion : ['', Validators.required],
      imagen_url  : ['', Validators.required]

    });

  }

  ngOnInit(): void {
    this.loadproductos();
  }

  public setView(mode: 'table' | 'cards') {
    this.viewMode = mode;
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

  registrarproductos(): void {
  console.log("Formulario enviado");
  console.log(this.myForm.value);

  if (this.myForm.valid) {
    const formValues = this.myForm.value;

    // 1. Construir el objeto con la estructura anidada que requiere Spring Boot
    const payload = {
      categoria: {
        idCategoria: Number(formValues.id_categoria) // Convertimos a número por seguridad
      },
      nombre: formValues.nombre,
      descripcion: formValues.descripcion,
      imagenUrl: formValues.imagenUrl // <-- Ajustado a camelCase coincidiendo con tu HTML y el backend
    };

    // Enviar el payload al backend
    this.http.post('http://localhost:8080/api/productos', payload).subscribe(
      (response) => {
        console.log('Producto creado exitosamente:', response);
        this.toastType = 'success';
        this.toastMessage = 'Producto registrado exitosamente!';
        this.showToast = true;
        this.loadproductos();

        // Reiniciar el formulario con los nombres exactos de los formControls
        this.myForm.reset({
          id_categoria: '',
          nombre: '',
          descripcion: '',
          imagenUrl: '' // <-- Ajustado aquí también
        });

        setTimeout(() => (this.showToast = false), 3000);
        
      },
      
      (error) => {
        console.error('Error al crear producto:', error.error);
        this.toastType = 'error';
        // Nota: Si Spring Boot devuelve un error por defecto, a veces es un objeto JSON. 
        // Si no ves el mensaje en el toast, intenta con error.error.message o error.message
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

}
