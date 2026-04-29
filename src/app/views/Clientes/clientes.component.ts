import { Component, OnInit, signal } from '@angular/core';
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
import { FormsModule, ReactiveFormsModule, FormGroup, FormBuilder, Validators } from '@angular/forms';
import { ToastSampleIconComponent } from './toast-sample-icon.component';

@Component({
  selector: 'app-clientes',
  templateUrl: 'clientes.component.html',
  styleUrls: ['clientes.component.scss'],
  standalone: true,
  imports: [ToastSampleIconComponent, NgIf, NgForOf, NgClass, CurrencyPipe, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormCheckLabelDirective, FormCheckInputDirective, FormCheckComponent, CardFooterComponent, CardGroupComponent, CardImgDirective, CardTextDirective, CardTitleDirective, FormsModule, ReactiveFormsModule, ProgressComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent]
})
export class ClientesComponent implements OnInit {
  myForm!: FormGroup;
  selectedCliente: any = null;

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


  public clientes: any[] = [];

  public clientesFiltrados: any[] = [];
  public searchTerm: string = '';

  public totalClientes = 0;
  public viewMode: 'table' | 'cards' = 'table';

  public showNuevoClienteModal: boolean = false;
  public showEditarClienteModal: boolean = false;
  public showEliminarClienteModal: boolean = false;

  constructor(private http: HttpClient, private formBuilder: FormBuilder) {

    this.myForm = this.formBuilder.group({
      celular: ['', Validators.required],
      nombres: ['', Validators.required],
      direccion_predeterminada: [''],
      estado: [1]

    });

  }

  ngOnInit(): void {
    this.cargarClientes();
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

  cargarClientes(): void {
    this.http.get<any[]>('http://localhost:8080/api/clientes').subscribe(
      (data) => {
        this.clientes = data || [];
        this.applyFilters();
        this.updateStats();
        console.log('Clientes cargados:', this.clientes);
      },
      (error) => {
        console.error('Error al cargar clientes:', error);
        this.addToast('Error al cargar clientes', 'danger');
      }
    );
  }

  prepararNuevoCliente(): void {
    this.selectedCliente = null;
    this.myForm.reset();
    this.myForm.patchValue({ estado: 1 });
  }

  openNuevoClienteModal(): void {
    this.showNuevoClienteModal = true;
    this.prepararNuevoCliente();
  }

  closeNuevoClienteModal(): void {
    this.showNuevoClienteModal = false;
  }

  crearCliente(): void {
    console.log('Formulario válido:', this.myForm.value);
    if (this.myForm.valid) {
      const formValues = this.myForm.value;
      const payload = {
        celular: formValues.celular,
        nombres: formValues.nombres,
        direccionPredeterminada: formValues.direccion_predeterminada,
        estado: formValues.estado !== null && formValues.estado !== '' ? formValues.estado : 1
      };

      this.http.post('http://localhost:8080/api/clientes', payload).subscribe(
        (response) => {
          console.log('Cliente creado exitosamente:', response);
          this.addToast('Cliente registrado exitosamente!', 'success');
          this.myForm.reset();
          this.cargarClientes();
          this.closeNuevoClienteModal();
        },
        (error) => {
          console.error('Error al crear cliente:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido!', 'warning');
    }
  }

  actualizarCliente(): void {
    console.log('Formulario válido:', this.myForm.value);
    if (this.myForm.valid && this.selectedCliente) {
      const formValues = this.myForm.value;
      const payload = {
        celular: formValues.celular,
        nombres: formValues.nombres,
        direccionPredeterminada: formValues.direccion_predeterminada,
        estado: formValues.estado
      };

      const clienteId = this.selectedCliente.idCliente || this.selectedCliente.id_cliente;
      this.http.put(`http://localhost:8080/api/clientes/${clienteId}`, payload).subscribe(
        (response) => {
          console.log('Cliente actualizado exitosamente:', response);
          this.addToast('Cliente actualizado exitosamente!', 'success');
          this.selectedCliente = null;
          this.myForm.reset();
          this.cargarClientes();
          this.closeEditarClienteModal();
        },
        (error) => {
          console.error('Error al actualizar cliente:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido o no hay cliente seleccionado!', 'warning');
    }
  }

  updateStats(): void {
    this.totalClientes = this.clientes.length;
  }

  applyFilters(): void {
    let filtered = [...this.clientes];

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((c) =>
        (c.nombres || '').toLowerCase().includes(term) ||
        (c.celular || '').toLowerCase().includes(term)
      );
    }

    this.clientesFiltrados = filtered;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  openEditClienteModal(cliente: any): void {
    this.selectedCliente = { ...cliente };
    this.myForm.patchValue({
      celular: cliente.celular || '',
      nombres: cliente.nombres || '',
      direccion_predeterminada: cliente.direccion_predeterminada || '',
      estado: cliente.estado !== undefined ? cliente.estado : 1
    });
    this.showEditarClienteModal = true;
  }

  closeEditarClienteModal(): void {
    this.showEditarClienteModal = false;
    this.selectedCliente = null;
  }

  openDeleteClienteModal(cliente: any): void {
    this.selectedCliente = { ...cliente };
    this.showEliminarClienteModal = true;
  }

  closeEliminarClienteModal(): void {
    this.showEliminarClienteModal = false;
    this.selectedCliente = null;
  }

  confirmEliminar(clienteId: number | undefined): void {
    console.log('ID de cliente a eliminar:', clienteId);
    if (!clienteId) {
      this.addToast('ID de cliente no válido para eliminación', 'danger');
      return;
    }

    this.http.delete(`http://localhost:8080/api/clientes/${clienteId}`).subscribe(
      (response) => {
        this.addToast('Cliente eliminado permanentemente', 'success');
        this.cargarClientes();
        this.closeEliminarClienteModal();
      },
      (error) => {
        console.error('Error al eliminar cliente:', error.error);
        this.addToast(error.error || 'No se pudo eliminar el cliente', 'danger');
      }
    );
  }

}
