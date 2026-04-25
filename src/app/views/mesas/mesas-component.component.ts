import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface MesaItem {
  e: string;
  n: string;
  q: string;
  p: string;
}

export interface Mesa {
  id: number;
  num: string;
  estado: 'libre' | 'ocupada' | 'cuenta' | 'reservada';
  zona: string;
  timer: string;
  capacidad: number;
  svgType: string;
  cliente?: string | null;
  avatar?: string;
  avatarBg?: string;
  sub?: string;
  items?: MesaItem[];
  sub_total?: string;
  descuento?: string;
  total?: string;
  progress?: string;
}

@Component({
  selector: 'app-mesas',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mesas-component.component.html',
  styleUrls: ['./mesas-component.component.scss']
})
export class MesasComponent implements OnInit {
  filtroActual: string = 'todas';
  panelAbierto: boolean = false;
  mesaSeleccionada: Mesa | null = null;
  
  // Estado del Modal "Nueva Mesa"
  showNuevaMesaModal: boolean = false;
  nuevaMesaCapacidad: number = 2;

  badgeCfg: any = {
    ocupada: { bg: 'rgba(46,204,113,.14)', color: 'var(--green)', border: 'rgba(46,204,113,.3)', label: 'Ocupada', numColor: 'var(--green)' },
    cuenta: { bg: 'rgba(245,200,66,.14)', color: 'var(--gold)', border: 'rgba(245,200,66,.3)', label: 'Pide cuenta', numColor: 'var(--gold)' },
    libre: { bg: 'rgba(255,255,255,.06)', color: 'rgba(247,244,238,.3)', border: 'rgba(255,255,255,.1)', label: 'Libre', numColor: 'rgba(247,244,238,.25)' },
    reservada: { bg: 'rgba(52,152,219,.14)', color: 'var(--blue)', border: 'rgba(52,152,219,.3)', label: 'Reservada', numColor: 'var(--blue)' },
  };

  mesas: Mesa[] = [
    {
      id: 1, num: '01', estado: 'ocupada', zona: 'Salón Principal', timer: '38 min', capacidad: 4, svgType: 'rect4', progress: '63%',
      cliente: 'Andrés Mora', avatar: 'AM', avatarBg: 'linear-gradient(135deg,#1a6b3a,#27ae60)', sub: '4 personas · Mesa para cenar',
      items: [{ e: '🍕', n: 'Pizza BBQ Chicken', q: 'Grande · Sin cebolla', p: '$31.900' }, { e: '🍔', n: 'Double Bacon', q: '×2 · Con papas', p: '$55.800' }, { e: '🥤', n: 'Limonada Natural', q: '×2 · Sin azúcar', p: '$14.000' }, { e: '🍟', n: 'Papas Medianas', q: '×1', p: '$8.900' }],
      sub_total: '$110.600', descuento: '$0', total: '$67.800'
    },
    {
      id: 2, num: '02', estado: 'cuenta', zona: 'Salón Principal', timer: '1h 12min', capacidad: 2, svgType: 'rect2', progress: '100%',
      cliente: 'Laura Pérez', avatar: 'LP', avatarBg: 'linear-gradient(135deg,#6b3a1a,#c0892a)', sub: '2 personas · Pide la cuenta',
      items: [{ e: '🍕', n: 'Pizza Margherita', q: 'Grande', p: '$24.900' }, { e: '🍔', n: 'Mushroom Swiss', q: '×2', p: '$51.800' }, { e: '🍰', n: 'Cheesecake', q: '×2', p: '$17.800' }, { e: '🥤', n: 'Jugo Natural', q: '×2 · Naranja', p: '$12.000' }],
      sub_total: '$106.500', descuento: '−$8.300', total: '$98.200'
    },
    { id: 3, num: '03', estado: 'libre', zona: 'Salón Principal', timer: '—', capacidad: 4, svgType: 'rect4', cliente: null },
    {
      id: 4, num: '04', estado: 'ocupada', zona: 'Salón Principal', timer: '22 min', capacidad: 6, svgType: 'rect6', progress: '37%',
      cliente: 'Familia Ramírez', avatar: 'FR', avatarBg: 'linear-gradient(135deg,#1a3a6b,#2a6bc0)', sub: '6 personas · Mesa familiar',
      items: [{ e: '🍕', n: 'Pizza 4 Quesos', q: 'Familiar', p: '$29.900' }, { e: '🍕', n: 'Pizza Pepperoni', q: 'Familiar', p: '$28.900' }, { e: '🌭', n: 'Hot Dog Ranchero', q: '×3', p: '$47.700' }, { e: '🥤', n: 'Gaseosa', q: '×6', p: '$24.000' }, { e: '🍟', n: 'Papas grandes', q: '×2', p: '$19.800' }],
      sub_total: '$150.300', descuento: '−$25.800', total: '$124.500'
    },
    { id: 5, num: '05', estado: 'reservada', zona: 'Salón Principal', timer: '8:30 PM', capacidad: 4, svgType: 'rect4', cliente: 'Reserva Gómez', avatar: 'RG', avatarBg: 'linear-gradient(135deg,#1a4a6b,#2a7bc0)', sub: '4 personas · Reserva a las 8:30 PM' },
    {
      id: 6, num: '06', estado: 'ocupada', zona: 'Salón Principal', timer: '55 min', capacidad: 3, svgType: 'rect3', progress: '80%',
      cliente: 'Martínez H.', avatar: 'MH', avatarBg: 'linear-gradient(135deg,#4a1a6b,#8b2ac0)', sub: '3 personas',
      items: [{ e: '🍕', n: 'Pizza BBQ Chicken', q: 'Mediana', p: '$22.900' }, { e: '🍔', n: 'Classic Smash', q: '×1', p: '$22.900' }, { e: '🥤', n: 'Cerveza artesanal', q: '×3', p: '$21.000' }],
      sub_total: '$66.800', descuento: '−$8.400', total: '$58.400'
    },
    {
      id: 7, num: '07', estado: 'cuenta', zona: 'Salón Principal', timer: '1h 28min', capacidad: 5, svgType: 'rect5', progress: '100%',
      cliente: 'Rodríguez F.', avatar: 'RF', avatarBg: 'linear-gradient(135deg,#6b1a1a,#c02a2a)', sub: '5 personas · Pide la cuenta',
      items: [{ e: '🍕', n: 'Pizza Margherita', q: 'Familiar ×2', p: '$49.800' }, { e: '🍔', n: 'Double Bacon', q: '×3', p: '$83.700' }, { e: '🥤', n: 'Refrescos', q: '×5', p: '$25.000' }, { e: '🍰', n: 'Brownie', q: '×2', p: '$18.000' }, { e: '🍟', n: 'Papas grandes', q: '×2', p: '$19.800' }],
      sub_total: '$196.300', descuento: '−$9.000', total: '$187.300'
    },
    { id: 8, num: '08', estado: 'libre', zona: 'Salón Principal', timer: '—', capacidad: 2, svgType: 'rect2', cliente: null },
    {
      id: 9, num: '09', estado: 'ocupada', zona: 'Terraza', timer: '14 min', capacidad: 2, svgType: 'circle2', progress: '24%',
      cliente: 'Pareja VIP', avatar: '♥', avatarBg: 'linear-gradient(135deg,#6b1a4a,#c02a8b)', sub: '2 personas · Terraza',
      items: [{ e: '🍕', n: 'Pizza Margherita', q: 'Personal', p: '$18.900' }, { e: '🍷', n: 'Copa de vino', q: '×2', p: '$18.000' }],
      sub_total: '$36.900', descuento: '−$4.000', total: '$32.900'
    },
    { id: 10, num: '10', estado: 'reservada', zona: 'Terraza', timer: '9:00 PM', capacidad: 6, svgType: 'rect6', cliente: 'Reserva Torres', avatar: 'RT', avatarBg: 'linear-gradient(135deg,#1a3a6b,#2a6bc0)', sub: '6 personas · Terraza · 9:00 PM' },
    { id: 11, num: '11', estado: 'libre', zona: 'Terraza', timer: '—', capacidad: 2, svgType: 'circle2', cliente: null },
    {
      id: 12, num: '12', estado: 'ocupada', zona: 'Terraza', timer: '41 min', capacidad: 4, svgType: 'rect4', progress: '68%',
      cliente: 'Herrera F.', avatar: 'HF', avatarBg: 'linear-gradient(135deg,#2a6b1a,#5ac02a)', sub: '4 personas · Terraza',
      items: [{ e: '🍔', n: 'Mushroom Swiss', q: '×2', p: '$51.800' }, { e: '🌭', n: 'Hot Dog Ranchero', q: '×2', p: '$31.800' }, { e: '🍟', n: 'Papas medianas', q: '×2', p: '$17.800' }],
      sub_total: '$101.400', descuento: '−$24.500', total: '$76.900'
    }
  ];

  constructor() { }

  ngOnInit(): void {
  }

  get mesasFiltradas(): Mesa[] {
    if (this.filtroActual === 'todas') return this.mesas;
    return this.mesas.filter(m => m.estado === this.filtroActual);
  }

  get mesasSalonPrincipal(): Mesa[] {
    return this.mesasFiltradas.filter(m => m.zona === 'Salón Principal');
  }

  get mesasTerraza(): Mesa[] {
    return this.mesasFiltradas.filter(m => m.zona === 'Terraza');
  }

  // Estadísticas
  get cuentaOcupadas(): number {
    return this.mesas.filter(m => m.estado === 'ocupada').length;
  }

  get cuentaLibres(): number {
    return this.mesas.filter(m => m.estado === 'libre').length;
  }

  get cuentaPidenCuenta(): number {
    return this.mesas.filter(m => m.estado === 'cuenta').length;
  }

  get cuentaReservadas(): number {
    return this.mesas.filter(m => m.estado === 'reservada').length;
  }

  get totalVentasActivas(): number {
    let sum = 0;
    this.mesas.forEach(m => {
      if (m.total) {
        const num = parseFloat(m.total.replace('$', '').replace('.', ''));
        if (!isNaN(num)) {
          sum += num;
        }
      }
    });
    return sum; // lo devolvemos en formato crudo, se puede formatear en HTML
  }

  filtrar(estado: string): void {
    this.filtroActual = estado;
  }

  abrirDetalle(id: number): void {
    const mesa = this.mesas.find(m => m.id === id);
    if (mesa) {
      this.mesaSeleccionada = mesa;
      this.panelAbierto = true;
    }
  }

  cerrarDetalle(): void {
    this.panelAbierto = false;
    setTimeout(() => {
      this.mesaSeleccionada = null;
    }, 280); // Tiempo que coincide con la transición en SCSS
  }

  formatMesaSVGClass(estado: string, isBase: boolean = false): string {
    if (estado === 'ocupada' && isBase) return 'rgba(46,204,113,.12)';
    if (estado === 'ocupada') return 'rgba(46,204,113,.28)';
    
    if (estado === 'cuenta' && isBase) return 'rgba(245,200,66,.12)';
    if (estado === 'cuenta') return 'rgba(245,200,66,.3)';
    
    if (estado === 'reservada' && isBase) return 'rgba(52,152,219,.12)';
    if (estado === 'reservada') return 'rgba(52,152,219,.1)';

    if (isBase) return 'rgba(255,255,255,.04)'; // libre
    return 'none'; // libre
  }

  formatMesaSVGStroke(estado: string, isBase: boolean = false): string {
    if (estado === 'ocupada' && isBase) return 'rgba(46,204,113,.4)';
    if (estado === 'ocupada') return 'rgba(46,204,113,.55)';
    
    if (estado === 'cuenta' && isBase) return 'rgba(245,200,66,.4)';
    if (estado === 'cuenta') return 'rgba(245,200,66,.6)';
    
    if (estado === 'reservada' && isBase) return 'rgba(52,152,219,.4)';
    if (estado === 'reservada') return 'rgba(52,152,219,.35)';

    if (isBase) return 'rgba(255,255,255,.15)'; // libre
    return 'rgba(255,255,255,.12)'; // libre
  }

  // ----- NUEVA MESA MODAL LOGIC -----
  openNuevaMesaModal(): void {
    this.showNuevaMesaModal = true;
    this.nuevaMesaCapacidad = 2; // Resetea la capacidad por defecto
  }

  closeNuevaMesaModal(): void {
    this.showNuevaMesaModal = false;
  }

  changeCapacidad(delta: number): void {
    this.nuevaMesaCapacidad = Math.max(1, this.nuevaMesaCapacidad + delta);
  }

  guardarNuevaMesa(): void {
    console.log("Guardando mesa con capacidad:", this.nuevaMesaCapacidad);
    // Aquí podrías agregar la lógica POST a tu base de datos
    this.closeNuevaMesaModal();
  }
}