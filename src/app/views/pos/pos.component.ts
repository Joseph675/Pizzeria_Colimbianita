﻿﻿﻿import { Component, OnInit, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf, NgClass, NgStyle, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  templateUrl: 'pos.component.html',
  styleUrls: ['pos.component.scss'],
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, NgStyle, CurrencyPipe, UpperCasePipe, FormsModule]
})
export class PosComponent implements OnInit {
  public presentaciones: any[] = [];
  public presentacionesFiltrados: any[] = [];
  
  public searchTerm: string = '';
  public activeCategory: string = 'todo';
  
  // Loading state
  public isLoadingPresentaciones = false;

  // Order state
  public orderItems: any[] = [];
  public orderType: string = 'mesa';
  public paymentMethod: string = 'Efectivo';
  public orderSubtotal: number = 0;
  public orderTotal: number = 0;

  // Modals state
  public showItemModal = false;
  public selectedItemModal: any = null;
  public modalQty = 1;
  public modalNotas: string = ''; // Nuevo: Almacena la nota escrita en el modal
  public direccionEntrega: string = ''; // Nuevo: Almacena la dirección del domicilio

  // Cliente Modal state
  public showClienteModal = false;
  public clientesRegistrados: any[] = [];
  public clientesFiltrados: any[] = [];
  public clienteSearchTerm: string = '';
  public selectedCliente: any = null;
  public creandoCliente = false; // Alterna entre pestaña buscar/crear
  public nuevoCliente = { celular: '', nombres: '', direccionPredeterminada: '' };

  public showMesaModal = false;
  public mesasDisponibles: any[] = [];
  public todasLasMesas: any[] = []; // Lista maestra para buscar la info completa de cualquier mesa
  public selectedMesa: any = null;

  public showNumpadModal = false;
  public numpadValue = '';
  public changeAmount = 0;

  public showSuccessModal = false;
  public modalTop: string = '50%';

  // Mitad y Mitad Modal state
  public showMitadModal = false;
  public mitadTamano: 'Mediana' | 'Familiar' = 'Mediana';
  public mitadSabor1Id: string = '';
  public mitadSabor2Id: string = '';

  // Estado de Edición
  public isEditMode = signal(false);
  public editOrderId: number | null = null;
  public originalFechaHora: string | null = null;
  public originalEstado: string | null = null;
  public deletedDetalles: number[] = []; // Array para registrar los detalles eliminados

  constructor(private http: HttpClient, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      const orderId = params['editOrderId'];
      if (orderId) {
        this.isEditMode.set(true);
        this.editOrderId = Number(orderId);
        
        // Limpiamos el estado actual antes de cargar el pedido a editar
        this.clearOrder();
        this.selectedCliente = null;
        this.selectedMesa = null;
        this.direccionEntrega = '';
        this.originalFechaHora = null;
        this.originalEstado = null;
        this.deletedDetalles = [];
        
        this.loadOrderForEdit(this.editOrderId);

        // Limpiamos el parámetro de la URL para evitar recargas en modo edición
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { editOrderId: null },
          queryParamsHandling: 'merge',
        });
      }
    });

    this.loadPresentaciones();
    this.loadMesas();
    this.loadClientes();
  }

  // ----- LÓGICA DE EDICIÓN DE PEDIDO -----


  calcularPosicionModal(): void {
    setTimeout(() => {
      const container = document.querySelector('.pos-wrap') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;
        const positionY = viewportCenterY - rect.top;
        this.modalTop = `${positionY}px`;
      }
    }, 0);
  }

  loadOrderForEdit(orderId: number): void {
    this.http.get<any>(`http://178.105.36.117:8080/api/pedidos/${orderId}`).subscribe({
      next: (pedido) => {
        if (!pedido || !pedido.detalles) {
          alert('No se pudo cargar el pedido para editar o no tiene detalles.');
          this.router.navigate(['/pedidos']); // Volver si el pedido es inválido
          return;
        }

        // Mapeamos los detalles del pedido al formato que usa el POS (orderItems)
        this.orderItems = pedido.detalles.map((det: any) => ({
          idDetalle: det.idDetalle || det.id_detalle, // <- Guardamos el ID del detalle
          idPresentacion: det.presentacion.idPresentacion || det.presentacion.id_presentacion,
          emoji: this.getEmoji(det.presentacion.producto?.nombre),
          nombreProducto: det.presentacion.producto?.nombre,
          nombrePresentacion: det.presentacion.nombrePresentacion || det.presentacion.nombre_presentacion,
          precio: det.precioCobrado || det.precio_cobrado,
          qty: det.fraccion,
          notas: det.notas || null
        }));

        // Establecemos las otras propiedades del pedido
        const tipoRaw = (pedido.tipoPedido || pedido.tipo_pedido || 'mesa').toLowerCase();
        this.orderType = tipoRaw.includes('mesa') ? 'mesa' : tipoRaw;

        // Extraemos de forma robusta el ID de la mesa
        const mesaId = pedido.mesa?.idMesa || pedido.mesa?.id_mesa || pedido.idMesa || pedido.id_mesa || (typeof pedido.mesa === 'number' || typeof pedido.mesa === 'string' ? pedido.mesa : null);
        const mesaNum = pedido.mesa?.numeroMesa || pedido.mesa?.numero_mesa || pedido.numeroMesa || pedido.numero_mesa || mesaId;

        if (mesaId) {
          this.selectedMesa = { idMesa: mesaId, numeroMesa: mesaNum };
          
          // Si ya cargamos la lista maestra de mesas, enriquecemos los datos inmediatamente
          if (this.todasLasMesas && this.todasLasMesas.length > 0) {
            const realMesa = this.todasLasMesas.find(m => (m.idMesa || m.id_mesa) == mesaId);
            if (realMesa) {
              this.selectedMesa = realMesa;
            }
          }
        } else {
          this.selectedMesa = null;
        }

        this.selectedCliente = pedido.cliente;
        this.direccionEntrega = pedido.direccionEntrega || pedido.direccion_entrega || '';
        this.originalFechaHora = pedido.fechaHora || pedido.fecha_hora; // <- Guardamos la fecha original
        this.originalEstado = pedido.estado; // <- Guardamos el estado original
        
        this.calculateTotals();
      },
      error: (err) => {
        console.error(`Error al cargar el pedido #${orderId} para editar:`, err);
        alert('Error al cargar la información del pedido. Volviendo a la lista.');
        this.router.navigate(['/pedidos']);
      }
    });
  }

  cancelEdit(): void {
    this.router.navigate(['/pedidos']);
  }

  loadClientes(): void {
    this.http.get<any[]>('http://178.105.36.117:8080/api/clientes').subscribe({
      next: (data) => {
        // Traemos solo clientes activos
        this.clientesRegistrados = (data || []).filter(c => c.estado === 1);
        this.clientesFiltrados = [...this.clientesRegistrados];
      },
      error: (err) => {
        console.error('Error al cargar clientes:', err);
      }
    });
  }

  loadMesas(): void {
    // 1. Cargar desde caché (Respuesta instantánea)
    const cached = localStorage.getItem('pos_mesas');
    if (cached) {
      try {
        this.todasLasMesas = JSON.parse(cached);
        this.mesasDisponibles = this.todasLasMesas
          .filter((mesa: any) => mesa.estado && mesa.estado.toUpperCase() === 'LIBRE')
          .sort((a, b) => (a.numeroMesa || 0) - (b.numeroMesa || 0));
          
        if (this.isEditMode() && this.selectedMesa) {
          const currentId = this.selectedMesa.idMesa || this.selectedMesa.id_mesa;
          const realMesa = this.todasLasMesas.find(m => (m.idMesa || m.id_mesa) == currentId);
          if (realMesa) {
            this.selectedMesa = realMesa;
          }
        }
      } catch (e) { console.error(e); }
    }

    // 2. Actualizar en segundo plano
    this.http.get<any[]>('http://178.105.36.117:8080/api/mesas').subscribe({
      next: (data) => {
        this.todasLasMesas = data || []; // Guardamos TODAS las mesas sin importar su estado
        localStorage.setItem('pos_mesas', JSON.stringify(this.todasLasMesas));

        // Filtramos solo las mesas con estado 'LIBRE' y las ordenamos
        this.mesasDisponibles = this.todasLasMesas
          .filter((mesa: any) => mesa.estado && mesa.estado.toUpperCase() === 'LIBRE')
          .sort((a, b) => (a.numeroMesa || 0) - (b.numeroMesa || 0));
          
        // Si estamos editando, buscamos la info completa de la mesa actual para que no muestre "IDs random"
        if (this.isEditMode() && this.selectedMesa) {
          const currentId = this.selectedMesa.idMesa || this.selectedMesa.id_mesa;
          const realMesa = this.todasLasMesas.find(m => (m.idMesa || m.id_mesa) == currentId);
          if (realMesa) {
            this.selectedMesa = realMesa;
          }
        }
        console.log('Mesas libres cargadas en POS:', this.mesasDisponibles);
      },
      error: (err) => {
        console.error('Error al cargar mesas en POS:', err);
      }
    });
  }

  loadPresentaciones(): void {
    this.isLoadingPresentaciones = true;
    this.http
      .get<any[]>('http://178.105.36.117:8080/api/presentaciones')
      .subscribe({
        next: (data) => {
          // Solo cargar presentaciones activas para la venta
          this.presentaciones = (data || []).filter(p => p.estado === 1);
          this.applyFilters();
          this.isLoadingPresentaciones = false;
        },
        error: (error) => {
          console.error('Error al cargar presentaciones:', error);
          this.isLoadingPresentaciones = false;
        }
      });
  }

  applyFilters(): void {
    let filtered = [...this.presentaciones];

    if (this.activeCategory !== 'todo') {
      const categoryToFilter = this.activeCategory.toLowerCase();
      
      // Mapeo flexible para lidiar con plurales y diferencias de nombres en la base de datos
      let searchTerms = [categoryToFilter];
      if (categoryToFilter.includes('pizza')) {
        searchTerms = ['pizza', 'pizzas'];
      } else if (categoryToFilter.includes('hamburguesa') || categoryToFilter.includes('burger')) {
        searchTerms = ['hamburguesa', 'hamburguesas', 'burger', 'burgers'];
      } else if (categoryToFilter.includes('dog') || categoryToFilter.includes('perro')) {
        searchTerms = ['perro caliente', 'perros calientes', 'hot dog', 'hot dogs', 'perro', 'perros'];
      } else if (categoryToFilter.includes('sandwich') || categoryToFilter.includes('sándwich')) {
        searchTerms = ['sandwich', 'sandwiches', 'sándwich', 'sándwiches', 'sanduche', 'sanduches'];
      } else if (categoryToFilter.includes('salchipapa')) {
        searchTerms = ['salchipapa', 'salchipapas'];
      } else if (categoryToFilter.includes('bebida') || categoryToFilter.includes('gaseosa')) {
        searchTerms = ['bebida', 'bebidas', 'gaseosa', 'gaseosas', 'jugo', 'jugos', 'agua'];
      } else if (categoryToFilter.includes('mazorcada')) {
        searchTerms = ['mazorcada', 'mazorcadas'];
      } else if (categoryToFilter.includes('panzerotti')) {
        searchTerms = ['panzerotti', 'panzerottis'];
      } else if (categoryToFilter.includes('lasagna') || categoryToFilter.includes('lasaña')) {
        searchTerms = ['lasagna', 'lasagnas', 'lasaña', 'lasañas'];
      }

      filtered = filtered.filter(p => {
        const catName = p.producto?.categoria?.nombre?.toLowerCase() || '';
        const prodName = p.producto?.nombre?.toLowerCase() || '';
        // Buscamos coincidencia tanto en el nombre de la categoría como en el del producto por seguridad
        return searchTerms.some(term => catName.includes(term) || prodName.includes(term));
      });
    }

    if (this.searchTerm.trim() !== '') {
      const term = this.searchTerm.trim().toLowerCase();
      filtered = filtered.filter((p) =>
        (p.nombrePresentacion || p.nombre_presentacion || '').toLowerCase().includes(term) ||
        (p.producto?.nombre || '').toLowerCase().includes(term)
      );
    }

    this.presentacionesFiltrados = filtered;
  }

  setCategory(cat: string): void {
    this.activeCategory = cat;
    this.applyFilters();
    console.log('Categoría seleccionada:', cat, 'Presentaciones filtradas:', this.presentacionesFiltrados);
  }

  onSearch(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  // Mock de emojis para que se vea igual al diseño visual
  getEmoji(nombreProducto: string | null = ''): string {
    const name = (nombreProducto || '').toLowerCase();
    if (name.includes('pizza')) return '🍕';
    if (name.includes('burger') || name.includes('hamburguesa')) return '🍔';
    if (name.includes('perro') || name.includes('dog')) return '🌭';
    if (name.includes('papa') || name.includes('snack')) return '🍟';
    if (name.includes('gaseosa') || name.includes('jugo') || name.includes('agua')) return '🥤';
    if (name.includes('postre') || name.includes('helado')) return '🍰';
    return '🍽️';
  }

  setType(type: string): void {
    this.orderType = type;
    if (type !== 'mesa') {
      this.selectedMesa = null; // Limpiamos la mesa si elige domicilio o llevar
    }
    // Si pasamos a domicilio y hay cliente seleccionado, autocompletamos su dirección (si no hay una escrita ya)
    if ((type === 'domicilio' || type === 'delivery') && this.selectedCliente) {
      if (!this.direccionEntrega || this.direccionEntrega.trim() === '') {
        this.direccionEntrega = this.selectedCliente.direccion_predeterminada || this.selectedCliente.direccionPredeterminada || '';
      }
    }
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  // ----- MESA MODAL LOGIC -----
  openMesaModal(): void {
    this.showMesaModal = true;
  }

  closeMesaModal(): void {
    this.showMesaModal = false;
  }

  selectMesa(mesa: any): void {
    this.selectedMesa = mesa;
    this.orderType = 'mesa'; // Forzamos el tipo a "mesa" si selecciona una
    this.closeMesaModal();
  }

  // ----- CLIENTE MODAL LOGIC -----
  openClienteModal(): void {
    this.showClienteModal = true;
    this.creandoCliente = false;
    this.clienteSearchTerm = '';
    this.clientesFiltrados = [...this.clientesRegistrados];
    this.calcularPosicionModal();
  }

  closeClienteModal(): void {
    this.showClienteModal = false;
  }

  onClienteSearch(term: string): void {
    this.clienteSearchTerm = term;
    const lowerTerm = term.toLowerCase().trim();
    if (!lowerTerm) {
      this.clientesFiltrados = [...this.clientesRegistrados];
      return;
    }
    this.clientesFiltrados = this.clientesRegistrados.filter(c => 
      (c.nombres && c.nombres.toLowerCase().includes(lowerTerm)) ||
      (c.celular && c.celular.includes(lowerTerm))
    );
  }

  selectCliente(cliente: any): void {
    this.selectedCliente = cliente;
    // Si el pedido actual es a domicilio y no hay dirección escrita, usamos la predeterminada del cliente
    if ((this.orderType === 'domicilio' || this.orderType === 'delivery') && (!this.direccionEntrega || this.direccionEntrega.trim() === '')) {
      this.direccionEntrega = cliente.direccion_predeterminada || cliente.direccionPredeterminada || '';
    }
    this.closeClienteModal();
  }

  removeCliente(): void {
    this.selectedCliente = null;
  }

  guardarNuevoCliente(): void {
    if (!this.nuevoCliente.celular || !this.nuevoCliente.nombres) {
      alert('El celular y los nombres son obligatorios.');
      return;
    }
    this.http.post('http://178.105.36.117:8080/api/clientes', this.nuevoCliente).subscribe({
      next: (res: any) => {
        this.loadClientes(); // Refrescamos lista maestra
        this.selectCliente(res); // Seleccionamos directamente el que acabamos de crear
        this.nuevoCliente = { celular: '', nombres: '', direccionPredeterminada: '' }; // Limpiamos formulario
      },
      error: (err) => {
        console.error('Error al crear cliente desde POS:', err);
        alert('Ocurrió un error al crear el cliente (¿el celular ya está registrado?).');
      }
    });
  }

  // ----- ITEM MODAL LOGIC -----
  openItemModal(presentacion: any): void {
    this.selectedItemModal = presentacion;
    this.modalQty = 1;
    this.modalNotas = ''; // Resetear las notas cada vez que abramos un producto
    this.showItemModal = true;
    this.calcularPosicionModal();
  }

  closeItemModal(): void {
    this.showItemModal = false;
    this.selectedItemModal = null;
  }

  changeModalQty(delta: number): void {
    this.modalQty = Math.max(1, this.modalQty + delta);
  }

  addToOrder(): void {
    if (!this.selectedItemModal) return;

    // Creamos el objeto de la orden
    const item = {
      idPresentacion: this.selectedItemModal.idPresentacion || this.selectedItemModal.id_presentacion,
      emoji: this.getEmoji(this.selectedItemModal.producto?.nombre),
      nombreProducto: this.selectedItemModal.producto?.nombre,
      nombrePresentacion: this.selectedItemModal.nombrePresentacion || this.selectedItemModal.nombre_presentacion,
      precio: this.selectedItemModal.precio,
      qty: this.modalQty,
      notas: this.modalNotas.trim() !== '' ? this.modalNotas.trim() : null // Capturamos la nota si la hay
    };

    this.orderItems.push(item);
    this.calculateTotals();
    this.closeItemModal();
  }

  // Getter para filtrar las pizzas elegibles en el modal Mitad y Mitad
  get pizzasParaMitad(): any[] {
    if (!this.presentaciones) return [];
    const tamano = this.mitadTamano ? this.mitadTamano.toLowerCase() : 'mediana';
    
    return this.presentaciones.filter(p => {
      const catName = (p.producto?.categoria?.nombre || '').toLowerCase();
      const presName = (p.nombrePresentacion || p.nombre_presentacion || '').toLowerCase();
      // .includes permite emparejar "Pizza", "Pizzas", "Pizzas Tradicionales", etc.
      return catName.includes('pizza') && presName.includes(tamano);
    });
  }

  // ----- ORDER PANEL LOGIC -----
  changeOrderQty(index: number, delta: number): void {
    const item = this.orderItems[index];
    
    // Bloqueo para evitar sumar unidades enteras a las mitades de pizza (qty fraccionado)
    if (item.qty % 1 !== 0 && delta > 0) {
      alert('No puedes aumentar la cantidad de una mitad individualmente. Elimínala y vuelve a agregar la pizza Mitad y Mitad.');
      return;
    }
    
    item.qty += delta;
    if (item.qty < 1) {
      // Si el item se elimina por completo y estamos en modo edición, guardamos su ID
      if (this.isEditMode() && item.idDetalle) {
        this.deletedDetalles.push(item.idDetalle);
      }

      this.orderItems.splice(index, 1);
    }
    this.calculateTotals();
  }

  clearOrder(): void {
    // Si se limpia todo el carrito en modo edición, marcamos todos los IDs existentes para eliminar
    if (this.isEditMode()) {
      this.orderItems.forEach(item => {
        if (item.idDetalle) {
          this.deletedDetalles.push(item.idDetalle);
        }
      });
    }

    this.orderItems = [];
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.orderSubtotal = this.orderItems.reduce((sum, item) => {
      // Si el item es una fracción (ej. 0.5 de pizza), el precio ya representa su valor real cobrado.
      const itemTotal = (item.qty % 1 !== 0) ? item.precio : (item.precio * item.qty);
      return sum + itemTotal;
    }, 0);
    // Descuentos o impuestos si aplican
    this.orderTotal = this.orderSubtotal; 
  }

  // ----- LÓGICA PIZZA MITAD Y MITAD -----
  openMitadModal(): void {
    this.showMitadModal = true;
    this.mitadTamano = 'Mediana';
    this.mitadSabor1Id = '';
    this.mitadSabor2Id = '';
    this.calcularPosicionModal();
  }

  closeMitadModal(): void {
    this.showMitadModal = false;
  }

  agregarPizzaMitadYMitad(): void {
    if (!this.mitadSabor1Id || !this.mitadSabor2Id) {
      alert('Por favor selecciona ambos sabores.');
      return;
    }
    if (this.mitadSabor1Id === this.mitadSabor2Id) {
      alert('Selecciona sabores diferentes. Si deseas un solo sabor, agrégala normalmente desde el catálogo.');
      return;
    }

    const s1 = this.presentaciones.find(p => (p.idPresentacion || p.id_presentacion).toString() === this.mitadSabor1Id);
    const s2 = this.presentaciones.find(p => (p.idPresentacion || p.id_presentacion).toString() === this.mitadSabor2Id);

    if (!s1 || !s2) return;

    // Regla de Negocio: Se cobra el precio mayor
    const precioMayor = Math.max(s1.precio, s2.precio);
    const precioCobrado = precioMayor / 2; // Cobramos la mitad exacta del mayor valor a cada parte

    const nom1 = `${s1.producto?.nombre} (${s1.nombrePresentacion || s1.nombre_presentacion})`;
    const nom2 = `${s2.producto?.nombre} (${s2.nombrePresentacion || s2.nombre_presentacion})`;

    const createMitadItem = (sabor: any, otraMitad: string, numMitad: string) => ({
      idPresentacion: sabor.idPresentacion || sabor.id_presentacion,
      emoji: '🍕',
      nombreProducto: '½ ' + sabor.producto?.nombre,
      nombrePresentacion: sabor.nombrePresentacion || sabor.nombre_presentacion,
      precio: precioCobrado,
      qty: 0.5, // Importante: Se envía como 0.5, lo cual luego se transfiere a 'fraccion' en enviarPedido
      notas: `Mitad ${numMitad}. Combinada con ${otraMitad}`
    });

    // Agregamos ambos objetos (detalles) a la orden actual
    this.orderItems.push(createMitadItem(s1, nom2, '1/2'));
    this.orderItems.push(createMitadItem(s2, nom1, '2/2'));

    this.calculateTotals();
    this.closeMitadModal();
  }

  // ----- ENVIAR PEDIDO -----
  submitOrder(): void {
    if (this.orderItems.length === 0) {
      alert('Por favor, agrega al menos un producto al pedido.');
      return;
    }

    if (this.orderType === 'mesa' && !this.selectedMesa) {
      alert('Por favor, selecciona una mesa para este pedido.');
      this.openMesaModal();
      return;
    }

    // 1. Mapeamos los items del carrito al formato DetallePedidoDTO
    const detalles = this.orderItems.map(item => {
      const detalle: any = {
        idPresentacion: item.idPresentacion,
        fraccion: item.qty,
        precioCobrado: (item.qty % 1 !== 0) ? item.precio : (item.precio * item.qty), // Aseguramos el precio correcto
        notas: item.notas || null // Se adjuntan las notas específicas del producto
      };
      if (this.isEditMode() && item.idDetalle) {
        detalle.idDetalle = item.idDetalle; // <- Mandamos el ID para que Spring Boot sepa cuál actualizar
        detalle.id_detalle = item.idDetalle; // Aseguramos formato alternativo
      }
      return detalle;
    });

    // 2. Construimos el objeto JSON (Cabecera + Detalles)
    const payload = {
      sucursal: { idSucursal: 1 }, // El backend espera el objeto anidado 'sucursal'
      tipoPedido: this.orderType.toUpperCase(),
      // Solo enviamos los IDs para evitar que Spring Boot/Hibernate rechace el objeto por conflictos de entidades anidadas
      mesa: this.orderType === 'mesa' && this.selectedMesa ? { 
        idMesa: this.selectedMesa.idMesa || this.selectedMesa.id_mesa,
        id_mesa: this.selectedMesa.idMesa || this.selectedMesa.id_mesa
      } : null,
      // Igual para el cliente, solo enviamos los IDs
      cliente: this.selectedCliente ? { 
        idCliente: this.selectedCliente.idCliente || this.selectedCliente.id_cliente,
        id_cliente: this.selectedCliente.idCliente || this.selectedCliente.id_cliente
      } : null,
      direccionEntrega: (this.orderType === 'delivery' || this.orderType === 'domicilio') ? (this.direccionEntrega || 'Dirección por definir') : null, // Envia lo que escribimos
      total: this.orderTotal,
      estado: 'PENDIENTE',
      detalles: detalles
    };

    if (this.isEditMode() && this.editOrderId) {
      // --- MODO EDICIÓN: Actualizamos el pedido existente con PUT ---
      const updatePayload = { 
        ...payload, 
        idPedido: this.editOrderId, 
        id_pedido: this.editOrderId, // Aseguramos formato alternativo
        estado: this.originalEstado || 'PENDIENTE', // Mantenemos el estado actual en lugar de resetear a pendiente
        fechaHora: this.originalFechaHora, // <- Reenviamos la fecha para que no se pierda
        fecha_hora: this.originalFechaHora // Aseguramos formato alternativo
      };
      console.log('Actualizando pedido en Spring Boot:', updatePayload);
      
      // Ejecutamos las eliminaciones pendientes hacia el endpoint DELETE
      if (this.deletedDetalles.length > 0) {
        this.deletedDetalles.forEach(idDetalle => {
          this.http.delete(`http://178.105.36.117:8080/api/detalles-pedido/${idDetalle}`).subscribe({
            next: () => console.log(`Detalle ${idDetalle} eliminado correctamente de la base de datos.`),
            error: (err) => console.error(`Error al eliminar detalle ${idDetalle}:`, err)
          });
        });
      }

      this.http.put(`http://178.105.36.117:8080/api/pedidos/${this.editOrderId}`, updatePayload).subscribe({
          next: (res) => {
              this.showSuccessModal = true;
              this.loadMesas(); // Recargamos mesas por si se liberó o cambió una
          },
          error: (err) => {
              console.error('Error al actualizar el pedido:', err);
              alert('Ocurrió un error al actualizar el pedido.');
          }
      });

    } else {
      // --- MODO CREACIÓN: Creamos un nuevo pedido con POST (Lógica existente) ---
      console.log('Creando nuevo pedido en Spring Boot:', payload);
      this.http.post('http://178.105.36.117:8080/api/pedidos/crear', payload).subscribe({
        next: (res) => {
          this.showSuccessModal = true; // Abre el modal de éxito animado
          this.loadMesas(); // Recargamos las mesas libres (la seleccionada desaparecerá porque pasó a OCUPADA)
        },
        error: (err) => {
          console.error('Error al crear el pedido:', err);
          alert('Ocurrió un error al enviar el pedido a cocina.');
        }
      });
    }
  }

  // ----- NUMPAD MODAL LOGIC -----
  // (Sin cambios en esta sección)

  openNumpad(): void {
    if (this.orderItems.length === 0) return;
    this.numpadValue = '';
    this.changeAmount = 0;
    this.showNumpadModal = true;
    this.calcularPosicionModal();
  }

  closeNumpad(): void {
    this.showNumpadModal = false;
  }

  npInput(val: string): void {
    this.numpadValue += val;
    this.calcChange();
  }

  npDel(): void {
    this.numpadValue = this.numpadValue.slice(0, -1);
    this.calcChange();
  }

  quickAmt(val: number): void {
    this.numpadValue = val.toString();
    this.calcChange();
  }

  calcChange(): void {
    const received = parseInt(this.numpadValue || '0', 10);
    this.changeAmount = received - this.orderTotal;
  }

  confirmPayment(): void {
    const received = parseInt(this.numpadValue || '0', 10);
    if (received < this.orderTotal) {
      alert('El monto recibido es insuficiente.');
      return;
    }
    this.closeNumpad();
    this.showSuccessModal = true;
  }

  // ----- SUCCESS MODAL LOGIC -----
  closeSuccess(): void {
    this.showSuccessModal = false;

    if (this.isEditMode()) {
      // Si estábamos editando, volvemos a la lista de pedidos
      this.isEditMode.set(false);
      this.editOrderId = null;
      this.deletedDetalles = [];
      this.router.navigate(['/pedidos']);
    } else {
      // Si estábamos creando, reseteamos el POS para un nuevo pedido
      this.selectedMesa = null;
      this.orderType = 'mesa';
      this.selectedCliente = null;
      this.direccionEntrega = '';
      this.clearOrder();
    }
  }
}
