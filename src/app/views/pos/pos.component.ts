import { Component, OnInit, signal  } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgForOf, NgIf, NgClass, NgStyle, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  templateUrl: 'pos.component.html',
  styleUrls: ['pos.component.scss'],
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, NgStyle, CurrencyPipe, FormsModule]
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

  public showNumpadModal = false;
  public numpadValue = '';
  public changeAmount = 0;

  public showSuccessModal = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPresentaciones();
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
      // Simulamos filtro de categoría buscando en el nombre del producto
      filtered = filtered.filter((p) => 
        (p.producto?.nombre || '').toLowerCase().includes(this.activeCategory)
      );
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
  }

  setPaymentMethod(method: string): void {
    this.paymentMethod = method;
  }

  // ----- ITEM MODAL LOGIC -----
  openItemModal(presentacion: any): void {
    this.selectedItemModal = presentacion;
    this.modalQty = 1;
    this.showItemModal = true;
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
      qty: this.modalQty
    };

    this.orderItems.push(item);
    this.calculateTotals();
    this.closeItemModal();
  }

  // ----- ORDER PANEL LOGIC -----
  changeOrderQty(index: number, delta: number): void {
    const item = this.orderItems[index];
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
    this.orderSubtotal = this.orderItems.reduce((sum, item) => sum + (item.precio * item.qty), 0);
    // Descuentos o impuestos si aplican
    this.orderTotal = this.orderSubtotal; 
  }

  // ----- NUMPAD MODAL LOGIC -----
  openNumpad(): void {
    if (this.orderItems.length === 0) return;
    this.numpadValue = '';
    this.changeAmount = 0;
    this.showNumpadModal = true;
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
    this.clearOrder();
  }

}
