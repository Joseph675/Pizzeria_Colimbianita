import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent, ButtonCloseDirective } from '@coreui/angular';
import { environment } from '../../../environments/environment';

// Interfaz basada en la tabla de la base de datos
export interface Mesa {
  sucursal: { idSucursal: number }; // Solo necesitamos el ID para crear la mesa
  id_mesa?: number; // Generado por el backend
  idMesa?: number;
  numeroMesa: number;
  capacidad: number;
  estado?: string;
}

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent, ButtonCloseDirective],
  templateUrl: './mesas-component.component.html',
  styleUrls: ['./mesas-component.component.scss']
})
export class MesasComponent implements OnInit {
  mesas: Mesa[] = [];
  filtroActual: string = 'todas';
  
  // Estado del Modal "Nueva Mesa"
  showNuevaMesaModal: boolean = false;
  public showEditarMesaModal: boolean = false;
  public showEliminarMesaModal: boolean = false;
  public selectedMesa: Mesa | null = null;
  
  // Modelos del formulario
  nuevaMesaNumero: number | null = null;
  nuevaMesaCapacidad: number = 2;
  nuevaMesaSucursal: number = 1; // Puede ser dinámico según la sucursal actual

  // Variables para Toasts de CoreUI
  public position = 'top-end';
  public toasts: { id: number; message: string; type: 'success' | 'danger' | 'warning' | 'info' }[] = [];
  private nextToastId = 0;

  constructor(private http: HttpClient, private router: Router) { }

  addToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success', duration = 3500) {
    const id = this.nextToastId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  ngOnInit(): void {
    this.obtenerMesas();
  }

  // ----- OBTENER MESAS (GET) -----
  obtenerMesas(): void {
    this.http.get<Mesa[]>(`${environment.apiUrl}/api/mesas`).subscribe({
      next: (data) => {
        // Ordenamos las mesas por su número para que se vean organizadas
        this.mesas = data.sort((a, b) => (a.numeroMesa || 0) - (b.numeroMesa || 0));
        console.log('Mesas cargadas:', this.mesas);
      },
      error: (err) => {
        console.error('Error al cargar mesas', err);
        this.addToast('Error al cargar la lista de mesas. Verifica tu conexión.', 'danger');
      }
    });
  }
  
  // ----- FILTROS Y ESTADÍSTICAS -----
  filtrar(estado: string): void {
    this.filtroActual = estado;
  }
  
  // ----- NAVEGACIÓN A PEDIDOS PARA COBRAR -----
  irAPedidos(mesa: Mesa): void {
    const mesaId = mesa.id_mesa || mesa.idMesa;
    if (mesaId) {
      this.router.navigate(['/pedidos'], { queryParams: { mesaId: mesaId } });
    }
  }

  get mesasFiltradas(): Mesa[] {
    if (this.filtroActual === 'todas') return this.mesas;
    return this.mesas.filter(m => (m.estado || 'libre').toLowerCase() === this.filtroActual);
  }

  get totalMesas(): number {
    return this.mesas.length;
  }

  get cuentaOcupadas(): number {
    return this.mesas.filter(m => (m.estado || '').toLowerCase() === 'ocupada').length;
  }

  get cuentaLibres(): number {
    return this.mesas.filter(m => (m.estado || 'libre').toLowerCase() === 'libre').length;
  }

  get cuentaPidenCuenta(): number {
    return this.mesas.filter(m => (m.estado || '').toLowerCase() === 'cuenta').length;
  }

  get cuentaReservadas(): number {
    return this.mesas.filter(m => (m.estado || '').toLowerCase() === 'reservada').length;
  }

  // ----- NUEVA MESA MODAL LOGIC -----
  openNuevaMesaModal(): void {
    this.showNuevaMesaModal = true;
    this.nuevaMesaNumero = null;
    this.nuevaMesaCapacidad = 2;
    this.nuevaMesaSucursal = 1;
  }

  closeNuevaMesaModal(): void {
    this.showNuevaMesaModal = false;
  }

  changeCapacidad(delta: number): void {
    this.nuevaMesaCapacidad = Math.max(1, this.nuevaMesaCapacidad + delta);
  }

  guardarNuevaMesa(): void {
    if (!this.nuevaMesaNumero || this.nuevaMesaNumero <= 0) {
      this.addToast('Por favor ingresa un número de mesa válido.', 'warning');
      return;
    }

    const nuevaMesa: Mesa = {
      sucursal: { idSucursal: 1 },
      numeroMesa: this.nuevaMesaNumero,
      capacidad: this.nuevaMesaCapacidad,
      estado: 'LIBRE' // Estado por defecto según tu DB
    };

    console.log('Creando nueva mesa:', nuevaMesa);

    this.http.post(`${environment.apiUrl}/api/mesas`, nuevaMesa).subscribe({
      next: (res: any) => {
        console.log('Mesa creada correctamente', res);
        this.addToast('Mesa creada con éxito', 'success');
        this.closeNuevaMesaModal();
        
        // Refrescamos la lista llamando de nuevo al GET
        this.obtenerMesas();
      },
      error: (err) => {
        console.error('Error al crear la mesa', err);
        this.addToast('Ocurrió un error al crear la mesa.', 'danger');
      }
    });
  }

  openEditarMesaModal(mesa: Mesa): void {
    this.selectedMesa = { ...mesa };
    this.nuevaMesaNumero = mesa.numeroMesa;
    this.nuevaMesaCapacidad = mesa.capacidad;
    this.showEditarMesaModal = true;
  }

  closeEditarMesaModal(): void {
    this.showEditarMesaModal = false;
    this.selectedMesa = null;
  }

  actualizarMesa(): void {
    if (!this.selectedMesa || !this.nuevaMesaNumero || this.nuevaMesaNumero <= 0) {
      this.addToast('Por favor ingresa un número de mesa válido.', 'warning');
      return;
    }

    const mesaId = this.selectedMesa.id_mesa || this.selectedMesa.idMesa;
    if (!mesaId) {
      this.addToast('No se encontró el identificador de la mesa.', 'danger');
      return;
    }

    const updatedMesa: Mesa = {
      sucursal: { idSucursal: this.selectedMesa.sucursal?.idSucursal || 1 },
      numeroMesa: this.nuevaMesaNumero,
      capacidad: this.nuevaMesaCapacidad,
      estado: this.selectedMesa.estado || 'LIBRE'
    };

    this.http.put(`${environment.apiUrl}/api/mesas/${mesaId}`, updatedMesa).subscribe({
      next: () => {
        this.addToast('Mesa actualizada con éxito', 'success');
        this.closeEditarMesaModal();
        this.obtenerMesas();
      },
      error: (err) => {
        console.error('Error al actualizar la mesa', err);
        this.addToast('Ocurrió un error al actualizar la mesa.', 'danger');
      }
    });
  }

  liberarMesa(mesa: Mesa): void {
    const mesaId = mesa.id_mesa || mesa.idMesa;
    if (!mesaId) {
      this.addToast('No se encontró el identificador de la mesa.', 'danger');
      return;
    }

    if (confirm(`¿Estás seguro de que deseas liberar la mesa ${mesa.numeroMesa} manualmente?`)) {
      const updatedMesa: Mesa = {
        sucursal: { idSucursal: mesa.sucursal?.idSucursal || 1 },
        numeroMesa: mesa.numeroMesa,
        capacidad: mesa.capacidad,
        estado: 'LIBRE'
      };

      this.http.put(`${environment.apiUrl}/api/mesas/${mesaId}`, updatedMesa).subscribe({
        next: () => {
          this.obtenerMesas();
        },
        error: (err) => {
          console.error('Error al liberar la mesa', err);
          this.addToast('Ocurrió un error al liberar la mesa.', 'danger');
        }
      });
    }
  }

  openEliminarMesaModal(mesa: Mesa): void {
    this.selectedMesa = { ...mesa };
    this.showEliminarMesaModal = true;
  }

  closeEliminarMesaModal(): void {
    this.showEliminarMesaModal = false;
    this.selectedMesa = null;
  }

  confirmEliminarMesa(mesaId: number | undefined): void {
    if (!mesaId) {
      this.addToast('No se encontró el identificador de la mesa a eliminar.', 'warning');
      return;
    }

    this.http.delete(`${environment.apiUrl}/api/mesas/${mesaId}`).subscribe({
      next: () => {
        this.addToast('Mesa eliminada correctamente', 'success');
        this.closeEliminarMesaModal();
        this.obtenerMesas();
      },
      error: (err) => {
        console.error('Error al eliminar la mesa', err);
        this.addToast('Ocurrió un error al eliminar la mesa.', 'danger');
      }
    });
  }

  // ----- HELPERS VISUALES (SVG Y ESTILOS) -----
  getSvgType(capacidad: number): string {
    if (capacidad <= 2) return 'rect2';
    if (capacidad === 3) return 'rect3';
    if (capacidad === 4) return 'rect4';
    return 'rect6'; // Para mesas de 5 o más personas
  }

  getBadgeLabel(estado: string | undefined): string {
    const est = (estado || 'libre').toLowerCase();
    switch(est) {
      case 'ocupada': return 'Ocupada';
      case 'cuenta': return 'Pide cuenta';
      case 'reservada': return 'Reservada';
      default: return 'Libre';
    }
  }

  formatMesaSVGClass(estado: string | undefined, isBase: boolean = false): string {
    const est = (estado || 'libre').toLowerCase();
    if (est === 'ocupada') return isBase ? 'rgba(46,204,113,.12)' : 'rgba(46,204,113,.28)';
    if (est === 'cuenta') return isBase ? 'rgba(245,200,66,.12)' : 'rgba(245,200,66,.3)';
    if (est === 'reservada') return isBase ? 'rgba(52,152,219,.12)' : 'rgba(52,152,219,.1)';
    return isBase ? 'rgba(255,255,255,.04)' : 'none'; // libre
  }

  formatMesaSVGStroke(estado: string | undefined, isBase: boolean = false): string {
    const est = (estado || 'libre').toLowerCase();
    if (est === 'ocupada') return isBase ? 'rgba(46,204,113,.4)' : 'rgba(46,204,113,.55)';
    if (est === 'cuenta') return isBase ? 'rgba(245,200,66,.4)' : 'rgba(245,200,66,.6)';
    if (est === 'reservada') return isBase ? 'rgba(52,152,219,.4)' : 'rgba(52,152,219,.35)';
    return isBase ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.12)'; // libre
  }
}