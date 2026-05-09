import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-combos_promociones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './combos_promociones.component.html',
  styleUrl: './combos_promociones.component.scss'
})
export class CombosyPromocionesComponent implements OnInit {
  // Controladores de Vistas y Filtros
  public currentTab: string = 'combos';
  public filtroActual: string = 'todos';
  public searchTerm: string = '';

  // Listas de datos principales
  public combos: any[] = [];
  public promos: any[] = [];
  
  // Listas de datos para renderizar (post-filtros)
  public combosFiltrados: any[] = [];
  public promosFiltradas: any[] = [];

  // Controladores de panel de detalles y modal
  public selectedCard: any = null;
  public showModal: boolean = false;

  // Modelos para los formularios del Modal
  public nuevoCombo: any = { nombre: '', descripcion: '', precio_normal: null, precio_combo: null, emoji: '', estado: 1, items: [] };
  public nuevaPromo: any = { nombre: '', descripcion: '', tipo: '', descuento: '', emoji: '', estado: 1 };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarCombos();
    this.cargarPromos();
  }

  // ==========================================
  // LLAMADAS HTTP (GET) A LA BASE DE DATOS
  // ==========================================

  cargarCombos(): void {
    this.http.get<any[]>('http://178.105.36.117:8080/api/combos').subscribe({
      next: (data) => {
        this.combos = data || [];
        // Si la base de datos está vacía, cargamos unos datos de prueba para visualizar el mockup
        if (this.combos.length === 0) {
          this.cargarCombosDePrueba();
        }
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error al cargar los combos:', err);
        this.cargarCombosDePrueba(); // Fallback temporal al mockup original para que veas el diseño
        this.aplicarFiltros();
      }
    });
  }

  cargarPromos(): void {
    this.http.get<any[]>('http://178.105.36.117:8080/api/promociones').subscribe({
      next: (data) => {
        this.promos = data || [];
        if (this.promos.length === 0) {
          this.cargarPromosDePrueba();
        }
        this.aplicarFiltros();
      },
      error: (err) => {
        console.error('Error al cargar promociones:', err);
        this.cargarPromosDePrueba(); // Fallback temporal al mockup original
        this.aplicarFiltros();
      }
    });
  }

  // ==========================================
  // LÓGICA DE INTERFAZ Y FILTROS
  // ==========================================

  switchTab(tab: string): void {
    this.currentTab = tab;
    this.cerrarDetalle();
    this.aplicarFiltros();
  }

  filtrar(estado: string): void {
    this.filtroActual = estado;
    this.aplicarFiltros();
  }

  onSearch(termino: string): void {
    this.searchTerm = termino;
    this.aplicarFiltros();
  }

  aplicarFiltros(): void {
    const termino = this.searchTerm.toLowerCase().trim();
    
    // Filtrado de Combos
    this.combosFiltrados = this.combos.filter(c => {
      const matchTerm = (c.nombre || '').toLowerCase().includes(termino) || (c.descripcion || '').toLowerCase().includes(termino);
      const matchEstado = this.filtroActual === 'todos' 
                       || (this.filtroActual === 'activo' && c.estado === 1)
                       || (this.filtroActual === 'inactivo' && c.estado === 0);
      return matchTerm && matchEstado;
    });

    // Filtrado de Promociones
    this.promosFiltradas = this.promos.filter(p => {
      const matchTerm = (p.nombre || '').toLowerCase().includes(termino) || (p.descripcion || '').toLowerCase().includes(termino);
      const matchEstado = this.filtroActual === 'todos' 
                       || (this.filtroActual === 'activo' && p.estado === 1)
                       || (this.filtroActual === 'inactivo' && p.estado === 0);
      return matchTerm && matchEstado;
    });
  }

  selectCard(item: any): void {
    if (this.selectedCard?.id === item.id) {
      this.cerrarDetalle(); // Si toca el mismo que está abierto, se cierra.
    } else {
      this.selectedCard = item;
    }
  }

  cerrarDetalle(): void {
    this.selectedCard = null;
  }

  toggleEstado(item: any): void {
    const nuevoEstado = item.estado === 1 ? 0 : 1;
    item.estado = nuevoEstado;
    
    // Aquí enviarás el PUT a la base de datos para guardar el cambio
    // let url = this.currentTab === 'combos' ? `http://178.105.36.117:8080/api/combos/${item.id}` : `http://178.105.36.117:8080/api/promociones/${item.id}`;
    // this.http.put(url, item).subscribe(...)
    
    this.aplicarFiltros();
  }

  agregarAlPedido(combo: any): void {
    // Lógica para enviar este combo a la caja / TPV actual
    alert(`Combo "${combo.nombre}" agregado al pedido activo.`);
  }

  eliminarSeleccionado(): void {
    if (confirm(`¿Estás seguro de eliminar permanentemente ${this.selectedCard.nombre}?`)) {
      // this.http.delete(...)
      this.cerrarDetalle();
    }
  }

  openModal(item?: any): void {
    this.showModal = true;
    if (item) {
      console.log('Modo edición para:', item);
      this.selectedCard = item;
      if (this.currentTab === 'combos') {
        this.nuevoCombo = { ...item };
      } else {
        this.nuevaPromo = { ...item };
      }
    } else {
      console.log('Modo creación');
      this.selectedCard = null;
      this.resetForms();
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.resetForms();
  }

  resetForms(): void {
    this.nuevoCombo = { nombre: '', descripcion: '', precio_normal: null, precio_combo: null, emoji: '', estado: 1, items: [] };
    this.nuevaPromo = { nombre: '', descripcion: '', tipo: '', descuento: '', emoji: '', estado: 1 };
  }

  guardarCombo(): void {
    if (!this.nuevoCombo.nombre || !this.nuevoCombo.precio_combo) {
      alert('El nombre y el precio del combo son obligatorios.');
      return;
    }
    
    // Simulamos guardado agregándolo a la lista temporal
    const comboGuardar = { ...this.nuevoCombo, id: this.selectedCard ? this.selectedCard.id : 'c' + Date.now() };
    if (!this.selectedCard) this.combos.unshift(comboGuardar); // Agrega al inicio si es nuevo
    
    this.aplicarFiltros();
    this.closeModal();
  }

  guardarPromo(): void {
    if (!this.nuevaPromo.nombre || !this.nuevaPromo.descuento) {
      alert('El nombre y el descuento de la promoción son obligatorios.');
      return;
    }

    // Simulamos guardado agregándolo a la lista temporal
    const promoGuardar = { ...this.nuevaPromo, id: this.selectedCard ? this.selectedCard.id : 'p' + Date.now() };
    if (!this.selectedCard) this.promos.unshift(promoGuardar);

    this.aplicarFiltros();
    this.closeModal();
  }

  // ==========================================
  // DATOS MOCK DE FALLBACK (Para ver el diseño mientras conectas la DB)
  // ==========================================
  cargarCombosDePrueba(): void {
    this.combos = [
      {
        id: 'c1', estado: 1, bannerBg: 'linear-gradient(135deg,rgba(232,52,42,.2),rgba(245,200,66,.1))', emoji: '🍕🍔🥤',
        etiqueta: '🔥 Más vendido', nombre: 'Familiar Supremo', descripcion: 'Pizza grande a elección + 2 burgers dobles + 4 gaseosas.',
        precio_normal: 98600, precio_combo: 79900,
        items: [ { cantidad: 1, nombre: 'Pizza Grande' }, { cantidad: 2, nombre: 'Burger Doble' }, { cantidad: 4, nombre: 'Gaseosa 350ml' } ]
      },
      {
        id: 'c2', estado: 1, bannerBg: 'linear-gradient(135deg,rgba(46,204,113,.15),rgba(52,152,219,.1))', emoji: '🌭🍟🥤',
        etiqueta: '✨ Nuevo', nombre: 'Combo Hot Snack', descripcion: 'Hot dog ranchero + papas medianas + gaseosa 350ml.',
        precio_normal: 28800, precio_combo: 23900,
        items: [ { cantidad: 1, nombre: 'Hot Dog Ranchero' }, { cantidad: 1, nombre: 'Papas Medianas' }, { cantidad: 1, nombre: 'Gaseosa 350ml' } ]
      }
    ];
  }

  cargarPromosDePrueba(): void {
    this.promos = [
      {
        id: 'p1', estado: 1, bannerBg: 'linear-gradient(135deg,rgba(245,200,66,.18),rgba(243,156,18,.1))', emoji: '🍺',
        nombre: 'Happy Hour', descripcion: '30% de descuento en bebidas alcohólicas. Aplica en mesa.', tipo: 'Descuento', descuento: '30% OFF'
      }
    ];
  }
}
