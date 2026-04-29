import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

// Interfaz basada en la tabla de la base de datos
export interface Mesa {
  sucursal: { idSucursal: number }; // Solo necesitamos el ID para crear la mesa
  id_mesa?: number; // Generado por el backend
  numeroMesa: number;
  capacidad: number;
  estado?: string;
}

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mesas-component.component.html',
  styleUrls: ['./mesas-component.component.scss']
})
export class MesasComponent implements OnInit {
  mesas: Mesa[] = [];
  filtroActual: string = 'todas';
  
  // Estado del Modal "Nueva Mesa"
  showNuevaMesaModal: boolean = false;
  
  // Modelos del formulario
  nuevaMesaNumero: number | null = null;
  nuevaMesaCapacidad: number = 2;
  nuevaMesaSucursal: number = 1; // Puede ser dinámico según la sucursal actual

  constructor(private http: HttpClient) { }

  ngOnInit(): void {
    this.obtenerMesas();
  }

  // ----- OBTENER MESAS (GET) -----
  obtenerMesas(): void {
    this.http.get<Mesa[]>('http://localhost:8080/api/mesas').subscribe({
      next: (data) => {
        // Ordenamos las mesas por su número para que se vean organizadas
        this.mesas = data.sort((a, b) => (a.numeroMesa || 0) - (b.numeroMesa || 0));
        console.log('Mesas cargadas:', this.mesas);
      },
      error: (err) => {
        console.error('Error al cargar mesas', err);
        alert('Error al cargar la lista de mesas. Verifica la consola.');
      }
    });
  }
  
  // ----- FILTROS Y ESTADÍSTICAS -----
  filtrar(estado: string): void {
    this.filtroActual = estado;
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
      alert('Por favor ingresa un número de mesa válido.');
      return;
    }

    const nuevaMesa: Mesa = {
      sucursal: { idSucursal: 1 },
      numeroMesa: this.nuevaMesaNumero,
      capacidad: this.nuevaMesaCapacidad,
      estado: 'LIBRE' // Estado por defecto según tu DB
    };

    console.log('Creando nueva mesa:', nuevaMesa);

    this.http.post('http://localhost:8080/api/mesas', nuevaMesa).subscribe({
      next: (res: any) => {
        console.log('Mesa creada correctamente', res);
        alert('Mesa creada con éxito');
        this.closeNuevaMesaModal();
        
        // Refrescamos la lista llamando de nuevo al GET
        this.obtenerMesas();
      },
      error: (err) => {
        console.error('Error al crear la mesa', err);
        alert('Ocurrió un error al crear la mesa. Verifica la consola.');
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