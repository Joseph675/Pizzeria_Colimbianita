﻿import { Component, OnInit, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf, NgClass, NgStyle, CurrencyPipe, UpperCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

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

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPresentaciones();
    this.loadMesas();
    this.loadClientes();
  }

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

  loadClientes(): void {
    this.http.get<any[]>('http://localhost:8080/api/clientes').subscribe({
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
    this.http.get<any[]>('http://localhost:8080/api/mesas').subscribe({
      next: (data) => {
        // Filtramos solo las mesas con estado 'LIBRE' y las ordenamos
        this.mesasDisponibles = (data || [])
          .filter((mesa: any) => mesa.estado && mesa.estado.toUpperCase() === 'LIBRE')
          .sort((a, b) => (a.numeroMesa || 0) - (b.numeroMesa || 0));
        console.log('Mesas libres cargadas en POS:', this.mesasDisponibles);
      },
      error: (err) => {
        console.error('Error al cargar mesas en POS:', err);
      }
    });
  }

  loadPresentaciones(): void {
    this.http
      .get<any[]>('http://localhost:8080/api/presentaciones')
      .subscribe(
        (data) => {
          // Solo cargar presentaciones activas para la venta
          this.presentaciones = (data || []).filter(p => p.estado === 1);
          this.applyFilters();
        },
        (error) => {
          console.error('Error al cargar presentaciones:', error);
        }
      );
  }

  applyFilters(): void {
    let filtered = [...this.presentaciones];

    if (this.activeCategory !== 'todo') {
      // CORRECCIÓN: Filtrar por el nombre de la categoría del producto, no por el nombre del producto.
      const categoryToFilter = this.activeCategory.toLowerCase();
      filtered = filtered.filter(p => p.producto?.categoria?.nombre?.toLowerCase() === categoryToFilter);
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
    this.http.post('http://localhost:8080/api/clientes', this.nuevoCliente).subscribe({
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
      this.orderItems.splice(index, 1);
    }
    this.calculateTotals();
  }

  clearOrder(): void {
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
  enviarPedido(): void {
    if (this.orderItems.length === 0) {
      alert('Por favor, agrega al menos un producto al pedido.');
      return;
    }

    if (this.orderType === 'mesa' && !this.selectedMesa) {
      alert('Por favor, selecciona una mesa para este pedido.');
      this.openMesaModal();
      return;
    }

    console.log('Enviando pedido a cocina...', {
      orderType: this.orderType,
      selectedMesa: this.selectedMesa,
      orderItems: this.orderItems,
      orderTotal: this.orderTotal
    });

    // 1. Mapeamos los items del carrito al formato DetallePedidoDTO
    const detalles = this.orderItems.map(item => ({
      idPresentacion: item.idPresentacion,
      fraccion: item.qty,
      precioCobrado: item.precio,
      notas: item.notas || null // Se adjuntan las notas específicas del producto
    }));

    // 2. Construimos el objeto JSON (Cabecera + Detalles)
    const payload = {
      sucursal: { idSucursal: 1 }, // El backend espera el objeto anidado 'sucursal'
      tipoPedido: this.orderType.toUpperCase(),
      mesa: this.orderType === 'mesa' && this.selectedMesa 
              ? { idMesa: this.selectedMesa.idMesa || this.selectedMesa.id_mesa } 
              : null, // Lo mismo para la mesa, espera un objeto anidado 'mesa'
      cliente: this.selectedCliente ? { idCliente: this.selectedCliente.idCliente || this.selectedCliente.id_cliente } : null, // Mapeo del cliente
      direccionEntrega: (this.orderType === 'delivery' || this.orderType === 'domicilio') ? (this.direccionEntrega || 'Dirección por definir') : null, // Envia lo que escribimos
      total: this.orderTotal,
      estado: 'PENDIENTE',
      detalles: detalles
    };

    console.log('Enviando a Spring Boot:', payload);

    this.http.post('http://localhost:8080/api/pedidos/crear', payload).subscribe({
      next: (res) => {
        this.showSuccessModal = true; // Abre el modal de éxito animado
        this.loadMesas(); // Recargamos las mesas libres (la seleccionada desaparecerá porque pasó a OCUPADA)
      },
      error: (err) => {
        console.error('Error al enviar el pedido:', err);
        alert('Ocurrió un error al enviar el pedido a cocina.');
      }
    });
  }

  // ----- NUMPAD MODAL LOGIC -----
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
    this.selectedMesa = null;
    this.orderType = 'mesa';
    this.selectedCliente = null; // Limpiar cliente para el próximo pedido
    this.direccionEntrega = ''; // Limpiamos la dirección en un pedido nuevo
    this.clearOrder();
  }

}
