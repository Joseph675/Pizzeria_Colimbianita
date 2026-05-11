import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Historial {
  t: 'in' | 'out' | 'adj';
  desc: string;
  fecha: string;
  qty: string;
}

interface Producto {
  id: number;
  emoji: string;
  name: string;
  sub: string;
  sku: string;
  cat: string;
  stock: number;
  min: number;
  max: number;
  unit: string;
  costo: string;
  venta: string;
  proveedor: string;
  caducidad: string;
  ubicacion: string;
  historia: Historial[];
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit, OnDestroy {
  currentTime: string = '—';
  private clockInterval: any;

  searchTerm: string = '';
  catActual: string = 'todas';
  ordenActual: string = 'nombre';

  selectedProducto: Producto | null = null;
  showModal: boolean = false;
  modalTipo: string = '';

  toastMsg: string = '';
  toastColor: string = 'var(--green)';
  showToastMsg: boolean = false;
  private toastTimeout: any;

  // Mockup Data
  productos: Producto[] = [];

  categoriasFiltro = [
    { id: 'todas', label: 'Todas', color: '' },
    { id: 'Pizzas e Ingredientes', label: 'Pizzas', color: '#E8342A' },
    { id: 'Carnes', label: 'Carnes', color: '#F39C12' },
    { id: 'Bebidas', label: 'Bebidas', color: '#3498DB' },
    { id: 'Lácteos', label: 'Lácteos', color: '#F5C842' },
    { id: 'Empaque', label: 'Otros', color: '#9B59B6' }
  ];

  ngOnInit() {
    this.updateClock();
    this.clockInterval = setInterval(() => this.updateClock(), 10000);
  }

  ngOnDestroy() {
    if (this.clockInterval) {
      clearInterval(this.clockInterval);
    }
  }

  updateClock() {
    const n = new Date();
    let h = n.getHours();
    const m = n.getMinutes();
    const a = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    this.currentTime = `${h}:${m < 10 ? '0' : ''}${m} ${a}`;
  }

  get productosFiltrados(): Producto[] {
    let filtered = this.productos;
    
    if (this.catActual !== 'todas') {
      filtered = filtered.filter(p => p.cat === this.catActual);
    }
    
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.sub.toLowerCase().includes(q)
      );
    }

    filtered.sort((a, b) => {
      if (this.ordenActual === 'stock_asc') return a.stock - b.stock;
      if (this.ordenActual === 'stock_desc') return b.stock - a.stock;
      if (this.ordenActual === 'precio') {
        const pA = parseFloat(a.venta.replace(/[^0-9]/g, '')) || 0;
        const pB = parseFloat(b.venta.replace(/[^0-9]/g, '')) || 0;
        return pB - pA;
      }
      return a.name.localeCompare(b.name);
    });

    return filtered;
  }

  get productosAgrupados() {
    const filtrados = this.productosFiltrados;
    const categoriasUnicas = [...new Set(filtrados.map(p => p.cat))];
    return categoriasUnicas.map(cat => ({
      categoria: cat,
      productos: filtrados.filter(p => p.cat === cat)
    }));
  }

  getCatEmoji(cat: string): string {
    switch(cat) {
      case 'Pizzas e Ingredientes': return '🍕';
      case 'Carnes': return '🥩';
      case 'Bebidas': return '🥤';
      case 'Lácteos': return '🥛';
      case 'Empaque': return '📦';
      default: return '🏷️';
    }
  }

  getEmojiBg(cat: string): string {
    switch(cat) {
      case 'Pizzas e Ingredientes': return 'rgba(232,52,42,.1)';
      case 'Carnes': return 'rgba(243,156,18,.1)';
      case 'Bebidas': return 'rgba(52,152,219,.1)';
      case 'Lácteos': return 'rgba(245,200,66,.1)';
      case 'Empaque': return 'rgba(155,89,182,.1)';
      default: return 'rgba(255,255,255,.05)';
    }
  }

  getStockColor(prod: Producto): string {
    if (prod.stock === 0) return 'var(--muted)';
    if (prod.stock <= prod.min * 0.5) return 'var(--red)';
    if (prod.stock <= prod.min) return 'var(--orange)';
    return 'var(--green)';
  }

  getStockValClass(prod: Producto): string {
    if (prod.stock === 0) return 'muted';
    if (prod.stock <= prod.min * 0.5) return 'red';
    if (prod.stock <= prod.min) return 'orange';
    return 'green';
  }

  getStockStatusTag(prod: Producto): string {
    if (prod.stock === 0) return 'out';
    if (prod.stock <= prod.min * 0.5) return 'critical';
    if (prod.stock <= prod.min) return 'low';
    return 'ok';
  }

  getStockStatusText(prod: Producto): string {
    if (prod.stock === 0) return 'Sin stock';
    if (prod.stock <= prod.min * 0.5) return 'Crítico';
    if (prod.stock <= prod.min) return 'Stock bajo';
    return 'Normal';
  }

  getStockPercent(prod: Producto): number {
    return Math.min(100, Math.round((prod.stock / prod.max) * 100));
  }

  filtrarCat(catId: string) {
    this.catActual = catId;
  }

  ordenar(event: any) {
    this.showToast('Ordenado por: ' + this.ordenActual, 'var(--gold)');
  }

  seleccionar(prod: Producto) {
    if (this.selectedProducto?.id === prod.id) {
      this.cerrarDetalle();
    } else {
      this.selectedProducto = prod;
    }
  }

  cerrarDetalle() {
    this.selectedProducto = null;
  }

  abrirModal(tipo: string) {
    this.modalTipo = tipo;
    this.showModal = true;
  }

  cerrarModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showModal = false;
    this.modalTipo = '';
  }

  getModalTitle(): string {
    if (this.modalTipo === 'nuevo') return 'Nuevo <span>Producto</span>';
    if (this.modalTipo === 'entrada') return 'Registrar <span>Entrada</span>';
    if (this.modalTipo === 'ajuste') return 'Ajuste de <span>Inventario</span>';
    return '';
  }

  guardarModal(msg: string, color: string = 'var(--green)') {
    this.cerrarModal();
    this.showToast(msg, color);
  }

  showToast(msg: string, color: string = 'var(--green)') {
    this.toastMsg = msg;
    this.toastColor = color;
    this.showToastMsg = true;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.showToastMsg = false;
    }, 3000);
  }

  // Estadísticas rápidas
  get totalActivos() { return this.productos.filter(p => p.stock > 0).length; }
  get valorTotal() { return '$0'; /* Calculado basado en costo x stock en ambiente real */ }
  get stockCritico() { return this.productos.filter(p => p.stock > 0 && p.stock <= p.min * 0.5).length; }
  get stockBajo() { return this.productos.filter(p => p.stock > p.min * 0.5 && p.stock <= p.min).length; }
  get sinStock() { return this.productos.filter(p => p.stock === 0).length; }
}