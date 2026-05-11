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
  public filtroActual: string = 'todos';
  public searchTerm: string = '';

  // Listas de datos principales
  public combos: any[] = [];
  
  // Listas de datos para renderizar (post-filtros)
  public combosFiltrados: any[] = [];

  // Controladores de panel de detalles y modal
  public isLoadingCombos: boolean = false;
  public selectedCard: any = null;
  public showModal: boolean = false;
  public showEliminarModal: boolean = false;

  // Modelos para los formularios del Modal
  public nuevoCombo: any = { nombre: '', descripcion: '', precioFijo: null, estado: 1, detalles: [] };

  // Variables para la selección de productos (detalles_combo)
  public presentacionesDisponibles: any[] = [];
  public searchProdTerm: string = '';
  public productosSugeridos: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarPresentaciones(); // Al terminar de cargar presentaciones, llamará automáticamente a cargarCombos()
  }

  // ==========================================
  // LLAMADAS HTTP (GET) A LA BASE DE DATOS
  // ==========================================

  cargarCombos(): void {
    this.http.get<any[]>('http://178.105.36.117:8080/api/combos').subscribe({
      next: (combosData) => {
        // Intentamos obtener los detalles por separado por si el backend no los trae anidados
        this.http.get<any[]>('http://178.105.36.117:8080/api/detalles-combo').subscribe({
          next: (detallesData) => {
            this.procesarCombos(combosData || [], detallesData || []);
          },
          error: (err) => {
            console.warn('No se pudo cargar /api/detalles-combo. Usando solo datos de /api/combos', err);
            this.procesarCombos(combosData || [], []);
          }
        });
      },
      error: (err) => {
        console.error('Error al cargar los combos:', err);
        this.isLoadingCombos = false;
        this.cargarCombosDePrueba(); 
        this.aplicarFiltros();
      }
    });
  }

  procesarCombos(combosData: any[], todosLosDetalles: any[]): void {
    this.combos = combosData.map(c => {
      const idComboReal = c.id_combo || c.idCombo;

      // Buscamos los detalles que le pertenecen a este combo (Si el backend no los trajo anidados)
      let detallesDelCombo = c.detalles && c.detalles.length > 0 
        ? c.detalles 
        : todosLosDetalles.filter(d => (d.combo?.idCombo || d.combo?.id_combo || d.idCombo || d.id_combo) === idComboReal);

      return {
        idCombo: idComboReal,
        id: idComboReal,
        nombre: c.nombre,
        descripcion: c.descripcion,
        precio_combo: c.precio_fijo || c.precioFijo,
        estado: c.estado,
        emoji: '📦',

        precio_normal: detallesDelCombo.reduce((sum: number, d: any) => {
          const idPres = d.idPresentacion || d.id_presentacion || d.presentacion?.idPresentacion || d.presentacion?.id_presentacion;
          const localPres = this.presentacionesDisponibles.find(p => (p.idPresentacion || p.id_presentacion) === idPres);
          const precioItem = localPres ? localPres.precio : (d.presentacion?.precio || 0);
          return sum + (precioItem * d.cantidad);
        }, 0),

        items: detallesDelCombo.map((d: any) => {
          const idPres = d.idPresentacion || d.id_presentacion || d.presentacion?.idPresentacion || d.presentacion?.id_presentacion;
          const localPres = this.presentacionesDisponibles.find(p => (p.idPresentacion || p.id_presentacion) === idPres);
          
          let pNombre = '';
          if (localPres) {
              pNombre = `${localPres.producto?.nombre} (${localPres.nombrePresentacion || localPres.nombre_presentacion})`;
          } else if (d.presentacion?.producto?.nombre) {
              pNombre = `${d.presentacion.producto.nombre} (${d.presentacion.nombre_presentacion || d.presentacion.nombrePresentacion})`;
          } else if (d.presentacion?.nombre_presentacion || d.presentacion?.nombrePresentacion) {
              pNombre = d.presentacion.nombre_presentacion || d.presentacion.nombrePresentacion;
          } else {
              pNombre = `Producto #${idPres || 'Desconocido'}`;
          }
          
          return { cantidad: d.cantidad, nombre: pNombre };
        }),
        detallesOriginales: detallesDelCombo
      };
    });

    this.isLoadingCombos = false;

    if (this.combos.length === 0) {
      this.cargarCombosDePrueba();
    }
    this.aplicarFiltros();
  }

  cargarPresentaciones(): void {
    this.isLoadingCombos = true;
    this.http.get<any[]>('http://178.105.36.117:8080/api/presentaciones').subscribe({
      next: (data) => {
        // Guardamos TODAS las presentaciones (incluso inactivas) para poder mapear los nombres 
        // de productos en combos viejos que aún los incluyan
        this.presentacionesDisponibles = data || []; 
        this.cargarCombos(); // Ya con el catálogo listo, podemos armar los combos
      },
      error: (err) => { console.error('Error al cargar presentaciones', err); this.cargarCombos(); }
    });
  }

  // ==========================================
  // LÓGICA DE INTERFAZ Y FILTROS
  // ==========================================

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
    
    // Petición para actualizar estado en BD
    if (item.idCombo) {
      const payload = {
        nombre: item.nombre,
        descripcion: item.descripcion,
        precioFijo: item.precio_combo,
        estado: nuevoEstado
      };
      
      this.http.put(`http://178.105.36.117:8080/api/combos/${item.idCombo}`, payload).subscribe({
        next: () => console.log('Estado actualizado correctamente'),
        error: (err) => console.error('Error actualizando estado', err)
      });
    }

    this.aplicarFiltros();
  }

  openEliminarModal(): void {
    this.showEliminarModal = true;
  }

  closeEliminarModal(): void {
    this.showEliminarModal = false;
  }

  confirmarEliminacion(): void {
    if (this.selectedCard && this.selectedCard.idCombo) {
      this.http.delete(`http://178.105.36.117:8080/api/combos/${this.selectedCard.idCombo}`).subscribe({
        next: () => {
          alert('Combo eliminado con éxito');
          this.cargarCombos();
          this.cerrarDetalle();
          this.closeEliminarModal();
        },
        error: (err) => {
          console.error('Error al eliminar el combo', err);
          alert('No se pudo eliminar el combo. Asegúrate de que no esté asociado a facturas pasadas.');
          this.closeEliminarModal();
        }
      });
    } else {
      this.cerrarDetalle();
      this.closeEliminarModal();
    }
  }

  openModal(item?: any): void {
    this.showModal = true;
    if (item) {
      console.log('Modo edición para:', item);
      this.selectedCard = item;
      this.nuevoCombo = { ...item };
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
    this.nuevoCombo = { nombre: '', descripcion: '', precioFijo: null, estado: 1, detalles: [] };
    this.searchProdTerm = '';
    this.productosSugeridos = [];
  }

  // ==========================================
  // LÓGICA PARA AGREGAR PRODUCTOS AL COMBO
  // ==========================================

  filtrarProductos(): void {
    if (!this.searchProdTerm.trim()) {
      this.productosSugeridos = [];
      return;
    }
    const term = this.searchProdTerm.toLowerCase();
    this.productosSugeridos = this.presentacionesDisponibles.filter(p => 
      p.estado === 1 && // Solo sugerimos productos activos para agregar a nuevos combos
      (p.producto?.nombre || '').toLowerCase().includes(term) ||
      (p.nombrePresentacion || p.nombre_presentacion || '').toLowerCase().includes(term)
    );
  }

  agregarItemAlCombo(presentacion: any): void {
    if (!this.nuevoCombo.detalles) this.nuevoCombo.detalles = [];
    
    const idPresAgregada = presentacion.idPresentacion || presentacion.id_presentacion;
    const existente = this.nuevoCombo.detalles.find((d: any) => (d.presentacion.idPresentacion || d.presentacion.id_presentacion) === idPresAgregada);
    
    if (existente) {
      existente.cantidad += 1;
    } else {
      this.nuevoCombo.detalles.push({
        presentacion: presentacion,
        cantidad: 1
      });
    }
    
    this.searchProdTerm = '';
    this.productosSugeridos = [];
  }

  cambiarCantidadItem(index: number, delta: number): void {
    const item = this.nuevoCombo.detalles[index];
    item.cantidad += delta;
    if (item.cantidad < 1) {
      this.removerItem(index);
    }
  }

  removerItem(index: number): void {
    this.nuevoCombo.detalles.splice(index, 1);
  }

  calcularPrecioNormal(): number {
    if (!this.nuevoCombo.detalles || this.nuevoCombo.detalles.length === 0) return 0;
    return this.nuevoCombo.detalles.reduce((total: number, d: any) => total + ((d.presentacion?.precio || 0) * d.cantidad), 0);
  }

  guardarCombo(): void {
    if (!this.nuevoCombo.nombre || !this.nuevoCombo.precioFijo) {
      alert('El nombre y el precio del combo son obligatorios.');
      return;
    }
    if (!this.nuevoCombo.detalles || this.nuevoCombo.detalles.length === 0) {
      alert('Debes agregar al menos un producto al combo.');
      return;
    }
    
    const payload = {
      nombre: this.nuevoCombo.nombre,
      descripcion: this.nuevoCombo.descripcion,
      precioFijo: this.nuevoCombo.precioFijo,
      estado: this.nuevoCombo.estado || 1
    };
    
    if (this.selectedCard && this.selectedCard.idCombo) {
      // PUT - Editar
      this.http.put<any>(`http://178.105.36.117:8080/api/combos/${this.selectedCard.idCombo}`, payload).subscribe({
        next: () => {
          this.sincronizarDetallesCombo(this.selectedCard.idCombo);
        },
        error: (err) => {
          console.error(err);
          alert('Error al actualizar el combo');
        }
      });
    } else {
      // POST - Crear
      this.http.post<any>('http://178.105.36.117:8080/api/combos', payload).subscribe({
        next: (res) => {
          const newComboId = res.idCombo || res.id_combo;
          if (newComboId) {
            this.sincronizarDetallesCombo(newComboId);
          } else {
            alert('Combo creado, pero no se pudo obtener el ID para guardar los productos.');
            this.cargarCombos();
            this.closeModal();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Error al crear el combo');
        }
      });
    }
  }

  sincronizarDetallesCombo(idCombo: number): void {
    // 1. Eliminar detalles viejos si es una edición
    const detallesViejos = this.selectedCard?.detallesOriginales || [];
    
    // Extraemos los IDs de los detalles a eliminar
    const idsAEliminar = detallesViejos
      .map((dv: any) => dv.idDetalleCombo || dv.id_detalle_combo || dv.id)
      .filter((id: any) => id != null);

    const ejecutarInserciones = () => {
      const detallesNuevos = this.nuevoCombo.detalles;
      if (detallesNuevos.length === 0) {
        this.finalizarGuardado();
        return;
      }

      let completados = 0;
      let conErrores = false;

      detallesNuevos.forEach((d: any) => {
        const payloadDetalle = {
          combo: { idCombo: idCombo },
          presentacion: { idPresentacion: d.presentacion.idPresentacion || d.presentacion.id_presentacion },
          cantidad: d.cantidad
        };

        this.http.post('http://178.105.36.117:8080/api/detalles-combo', payloadDetalle).subscribe({
          next: () => { completados++; if (completados === detallesNuevos.length) this.finalizarGuardado(conErrores); },
          error: (err) => { console.error('Error insertando detalle:', err); conErrores = true; completados++; if (completados === detallesNuevos.length) this.finalizarGuardado(conErrores); }
        });
      });
    };

    if (idsAEliminar.length > 0) {
      let eliminados = 0;
      idsAEliminar.forEach((id: any) => {
        this.http.delete(`http://178.105.36.117:8080/api/detalles-combo/${id}`).subscribe({
          next: () => { eliminados++; if (eliminados === idsAEliminar.length) ejecutarInserciones(); },
          error: () => { eliminados++; if (eliminados === idsAEliminar.length) ejecutarInserciones(); }
        });
      });
    } else {
      ejecutarInserciones();
    }
  }

  finalizarGuardado(conErrores: boolean = false): void {
    alert(conErrores ? 'El combo se guardó, pero hubo un error con algunos productos.' : 'Combo guardado correctamente con sus productos');
    this.cargarCombos();
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
}
