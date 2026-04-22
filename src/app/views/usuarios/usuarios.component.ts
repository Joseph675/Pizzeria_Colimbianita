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
  templateUrl: 'usuarios.component.html',
  styleUrls: ['usuarios.component.scss'],
  standalone: true,
  imports: [ToastSampleIconComponent, NgIf, NgForOf, NgClass, CurrencyPipe, CardBodyComponent, CardComponent, CardHeaderComponent, ColComponent, RowComponent, WidgetStatFComponent, TemplateIdDirective, ButtonDirective, ButtonCloseDirective, ModalBodyComponent, ModalComponent, ModalFooterComponent, ModalHeaderComponent, ModalTitleDirective, ModalToggleDirective, FormControlDirective, FormDirective, FormLabelDirective, FormCheckLabelDirective, FormCheckInputDirective, FormCheckComponent, CardFooterComponent, CardGroupComponent, CardImgDirective, CardTextDirective, CardTitleDirective, FormsModule, ReactiveFormsModule, ProgressComponent, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent]
})
export class UsuariosComponent implements OnInit {
  myForm!: FormGroup;
  selectedUsuario: any = null;

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


  public usuarios: any[] = [];
  public roles: { idRol?: number; id_rol?: number; nombre: string; }[] = [];
  public sucursales: { idSucursal?: number; id_sucursal?: number; nombre: string; direccion: string; telefono: string; }[] = [];

  public usuariosFiltrados: any[] = [];
  public searchTerm: string = '';

  public totalUsuarios = 0;
  public viewMode: 'table' | 'cards' = 'table';

  constructor(private http: HttpClient, private formBuilder: FormBuilder) {

    this.myForm = this.formBuilder.group({
      idRol: ['', Validators.required],
      idSucursal: ['', Validators.required],
      nombres: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      passwordHash: ['', Validators.required],
      estado: ['']

    });

  }

  ngOnInit(): void {
    this.cargarRol();
    this.cargarSucursales();
    this.cargarUsuarios();
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

  cargarUsuarios(): void {
    this.http.get<any[]>('http://localhost:8080/api/usuarios').subscribe(
      (data) => {
        this.usuarios = data || [];
        this.applyFilters();
        this.updateStats();
        console.log('Usuarios cargados:', this.usuarios);
      },
      (error) => {
        console.error('Error al cargar usuarios:', error);
        this.addToast('Error al cargar usuarios', 'danger');
      }
    );
  }

  cargarRol(): void {
    this.http.get<{ idRol?: number; id_rol?: number; nombre: string; }[]>('http://localhost:8080/api/roles').subscribe(
      (data) => {
        this.roles = data || [];
        this.applyFilters();
        this.updateStats();
        console.log('Roles cargados:', this.roles);
      },
      (error) => {
        console.error('Error al cargar roles:', error);
        this.addToast('Error al cargar roles', 'danger');
      }
    );
  }

  cargarSucursales(): void {
    this.http.get<{ idSucursal?: number; id_sucursal?: number; nombre: string; direccion: string; telefono: string; }[]>('http://localhost:8080/api/sucursales').subscribe(
      (data) => {
        this.sucursales = data || [];
        this.applyFilters();
        this.updateStats();
        console.log('sucursales cargados:', this.sucursales);
      },
      (error) => {
        console.error('Error al cargar sucursales:', error);
        this.addToast('Error al cargar sucursales', 'danger');
      }
    );
  }

  prepararNuevoUsuarios(): void {
    this.selectedUsuario = null;
    this.myForm.reset();
    this.myForm.get('passwordHash')?.setValidators([Validators.required]);
    this.myForm.get('passwordHash')?.updateValueAndValidity();
  }

  crearUsuarios(): void {
    console.log('Formulario válido:', this.myForm.value);

    if (this.myForm.valid) {
      const formValues = this.myForm.value;
      const payload = {
        nombres: formValues.nombres,
        email: formValues.email,
        passwordHash: formValues.passwordHash,
        estado: formValues.estado,
        rol: {
          idRol: formValues.idRol
        },
        sucursal: {
          idSucursal: formValues.idSucursal
        }
      };

      this.http.post('http://localhost:8080/api/usuarios', payload).subscribe(
        (response) => {
          console.log('Usuario creado exitosamente:', response);
          this.addToast('Usuario registrado exitosamente!', 'success');
          this.myForm.reset();
          this.cargarUsuarios();
        },
        (error) => {
          console.error('Error al crear usuario:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido!', 'warning');
    }
  }

  actualizarUsuario(): void {
    console.log('Formulario válido:', this.myForm.value);
    if (this.myForm.valid && this.selectedUsuario) {
      const formValues = this.myForm.value;
      const payload = {
        nombres: formValues.nombres,
        email: formValues.email,
        estado: formValues.estado,
        rol: {
          idRol: formValues.idRol
        },
        sucursal: {
          idSucursal: formValues.idSucursal
        }
      };

      const usuarioId = this.selectedUsuario.idUsuario || this.selectedUsuario.id_usuario;
      this.http.put(`http://localhost:8080/api/usuarios/${usuarioId}`, payload).subscribe(
        (response) => {
          console.log('Usuario actualizado exitosamente:', response);
          this.addToast('Usuario actualizado exitosamente!', 'success');
          this.selectedUsuario = null;
          this.myForm.reset();
          this.cargarUsuarios();
        },
        (error) => {
          console.error('Error al actualizar usuario:', error.error);
          this.addToast(error.error || 'Ocurrió un error en el servidor', 'danger');
        }
      );
    } else {
      this.addToast('El formulario no es válido o no hay usuario seleccionado!', 'warning');
    }
  }

  updateStats(): void {
    this.totalUsuarios = this.usuarios.length;
  }

  applyFilters(): void {
    let filtered = [...this.usuarios];

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((u) =>
        (u.nombres || '').toLowerCase().includes(term) ||
        (u.email || '').toLowerCase().includes(term)
      );
    }

    this.usuariosFiltrados = filtered;
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  openEditUsuarioModal(usuario: any): void {
    this.selectedUsuario = { ...usuario };
    this.myForm.get('passwordHash')?.clearValidators();
    this.myForm.get('passwordHash')?.updateValueAndValidity();
    this.myForm.patchValue({
      idRol: usuario.rol?.idRol || '',
      idSucursal: usuario.sucursal?.idSucursal || '',
      nombres: usuario.nombres || '',
      email: usuario.email || '',
      estado: usuario.estado !== undefined ? usuario.estado : 1
    });
  }

  openDeleteUsuarioModal(usuario: any): void {
    this.selectedUsuario = { ...usuario };
  }

  confirmEliminar(usuarioId: number | undefined): void {
    console.log('ID de usuario a eliminar:', usuarioId);
    if (!usuarioId) {
      this.addToast('ID de usuario no válido para eliminación', 'danger');
      return;
    }

    this.http.delete(`http://localhost:8080/api/usuarios/${usuarioId}`).subscribe(
      (response) => {
        this.addToast('Usuario eliminado permanentemente', 'success');
        this.cargarUsuarios();
      },
      (error) => {
        console.error('Error al eliminar usuario:', error.error);
        this.addToast(error.error || 'No se pudo eliminar el usuario', 'danger');
      }
    );
  }

}
