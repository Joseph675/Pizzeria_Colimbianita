import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

interface Producto {
  id: number;
  emoji: string;
  name: string;
  sku: string;
  stock: number;
  min: number;
  max: number;
  unit: string;
  costo: number;
  costoStr: string;
  ubicacion: string;
}

interface InventarioSucursalItem {
  id_inventario?: number;
  idInventario?: number;
  id_ingrediente?: number;
  idIngrediente?: number;
  nombre?: string;
  cantidad?: number;
  cantidad_minima?: number;
  cantidadMinima?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.scss']
})
export class InventarioComponent implements OnInit {
  private apiUrl = 'http://178.105.36.117:8080/api';

  isLoading: boolean = true;

  searchTerm: string = '';
  filtroEstado: string = 'todas';
  ordenActual: string = 'nombre';

  selectedProducto: Producto | null = null;
  showModal: boolean = false;
  modalTipo: string = '';

  editCantidad: number = 0;
  editMinimo: number = 0;
  editTarget: Producto | null = null;

  inventarioSucursal: InventarioSucursalItem[] = [];

  toastMsg: string = '';
  toastColor: string = 'var(--green)';
  showToastMsg: boolean = false;
  private toastTimeout: any;

  productos: Producto[] = [];

  estadosFiltro = [
    { id: 'todas',    label: 'Todas',      color: '' },
    { id: 'ok',       label: 'Normal',     color: 'var(--green)' },
    { id: 'low',      label: 'Stock bajo', color: 'var(--orange)' },
    { id: 'critical', label: 'Crítico',    color: 'var(--red)' },
    { id: 'out',      label: 'Sin stock',  color: 'var(--muted)' }
  ];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarInventarioSucursal();
  }

  get productosFiltrados(): Producto[] {
    let filtered = this.productos;

    if (this.filtroEstado !== 'todas') {
      filtered = filtered.filter(p => this.getStockStatusTag(p) === this.filtroEstado);
    }

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      );
    }

    return [...filtered].sort((a, b) => {
      if (this.ordenActual === 'stock_asc')  return a.stock - b.stock;
      if (this.ordenActual === 'stock_desc') return b.stock - a.stock;
      if (this.ordenActual === 'costo')      return b.costo - a.costo;
      return a.name.localeCompare(b.name);
    });
  }

  getStockColor(prod: Producto): string {
    if (prod.stock === 0)              return 'var(--muted)';
    if (prod.stock <= prod.min * 0.5)  return 'var(--red)';
    if (prod.stock <= prod.min)        return 'var(--orange)';
    return 'var(--green)';
  }

  getStockValClass(prod: Producto): string {
    if (prod.stock === 0)             return 'muted';
    if (prod.stock <= prod.min * 0.5) return 'red';
    if (prod.stock <= prod.min)       return 'orange';
    return 'green';
  }

  getStockStatusTag(prod: Producto): string {
    if (prod.stock === 0)             return 'out';
    if (prod.stock <= prod.min * 0.5) return 'critical';
    if (prod.stock <= prod.min)       return 'low';
    return 'ok';
  }

  getStockStatusText(prod: Producto): string {
    if (prod.stock === 0)             return 'Sin stock';
    if (prod.stock <= prod.min * 0.5) return 'Crítico';
    if (prod.stock <= prod.min)       return 'Stock bajo';
    return 'Normal';
  }

  getStockPercent(prod: Producto): number {
    if (prod.max <= 0) return 0;
    return Math.min(100, Math.round((prod.stock / prod.max) * 100));
  }

  filtrarEstado(id: string) {
    this.filtroEstado = id;
  }

  seleccionar(prod: Producto) {
    this.selectedProducto = this.selectedProducto?.id === prod.id ? null : prod;
  }

  cerrarDetalle() {
    this.selectedProducto = null;
  }

  abrirEditar(prod: Producto) {
    this.editTarget = prod;
    this.editCantidad = prod.stock;
    this.editMinimo = prod.min;
    this.modalTipo = 'editar';
    this.showModal = true;
  }

  cerrarModal(event?: Event) {
    if (event) event.stopPropagation();
    this.showModal = false;
    this.modalTipo = '';
    this.editTarget = null;
  }

  getModalTitle(): string {
    if (this.modalTipo === 'editar') return 'Editar <span>Inventario</span>';
    return '';
  }

  guardarEdicion(): void {
    if (!this.editTarget) return;
    const id = this.editTarget.id;
    const body = { cantidad: this.editCantidad, cantidadMinima: this.editMinimo };
    this.http.put(`${this.apiUrl}/inventario-sucursal/${id}`, body)
      .pipe(catchError(() => {
        this.showToast('Error al guardar cambios', 'var(--red)');
        return of(null);
      }))
      .subscribe(res => {
        if (res === null) return;
        const prod = this.productos.find(p => p.id === id);
        if (prod) { prod.stock = this.editCantidad; prod.min = this.editMinimo; }
        const inv = this.inventarioSucursal.find(i => (i.id_inventario ?? i.idInventario) === id);
        if (inv) { inv['cantidad'] = this.editCantidad; inv['cantidad_minima'] = this.editMinimo; }
        this.showToast('Inventario actualizado', 'var(--green)');
        this.cerrarModal();
      });
  }

  eliminarProducto(prod: Producto): void {
    if (!confirm(`¿Eliminar "${prod.name}" del inventario?`)) return;
    this.http.delete(`${this.apiUrl}/inventario-sucursal/${prod.id}`)
      .pipe(catchError(() => {
        this.showToast('Error al eliminar', 'var(--red)');
        return of(null);
      }))
      .subscribe(res => {
        if (res === null) return;
        this.productos = this.productos.filter(p => p.id !== prod.id);
        this.inventarioSucursal = this.inventarioSucursal.filter(i => (i.id_inventario ?? i.idInventario) !== prod.id);
        if (this.selectedProducto?.id === prod.id) this.selectedProducto = null;
        this.showToast(`"${prod.name}" eliminado`, 'var(--red)');
      });
  }

  private cargarInventarioSucursal(): void {
    forkJoin({
      ingredientes: this.http.get<any>(`${this.apiUrl}/ingredientes`).pipe(
        catchError(() => { this.showToast('Error al cargar ingredientes', 'var(--red)'); return of([]); })
      ),
      inventario: this.http.get<any>(`${this.apiUrl}/inventario-sucursal`).pipe(
        catchError(() => this.http.get<any>(`${this.apiUrl}/inventario`)),
        catchError(() => this.http.get<any>(`${this.apiUrl}/inventarios`)),
        catchError(() => { this.showToast('Error al cargar inventario', 'var(--red)'); return of([]); })
      )
    }).subscribe(({ ingredientes, inventario }) => {
      const invArray: any[] = Array.isArray(inventario) ? inventario : (inventario?.data ?? inventario?.content ?? []);
      const ingArray: any[] = Array.isArray(ingredientes) ? ingredientes : (ingredientes?.data ?? ingredientes?.content ?? []);

      this.inventarioSucursal = [];
      this.productos = [];

      this.isLoading = false;

      if (!invArray.length) {
        this.showToast('El inventario está vacío', 'var(--orange)');
        return;
      }

      invArray.forEach((item: any) => {
        const idIng = item.id_ingrediente ?? item.idIngrediente
                   ?? item.ingrediente?.id_ingrediente ?? item.ingrediente?.idIngrediente ?? item.ingrediente?.id;

        const match = ingArray.find((ing: any) =>
          (ing.id_ingrediente ?? ing.idIngrediente ?? ing.id) == idIng
        );

        const nombre   = match?.nombre ?? item.nombre ?? item.ingrediente?.nombre ?? `ING-${idIng}`;
        const unidad   = match?.unidadMedida ?? match?.unidad_medida ?? item.unidadMedida ?? item.ingrediente?.unidadMedida ?? 'und';
        const costo    = Number(match?.costoUnitario ?? match?.costo_unitario ?? 0);
        const stock    = Number(item.cantidad ?? item.cantidad_actual ?? item.cantidadActual ?? 0);
        const min      = Number(item.cantidad_minima ?? item.cantidadMinima ?? 0);
        const idInv    = item.id_inventario ?? item.idInventario ?? idIng ?? 0;
        const idSuc    = item.id_sucursal ?? item.idSucursal ?? item.sucursal?.id_sucursal ?? 1;

        this.inventarioSucursal.push({ ...item, id_ingrediente: idIng, nombre, unidadMedida: unidad });

        this.productos.push({
          id: idInv,
          emoji: '📦',
          name: nombre,
          sku: `ING-${idIng ?? '00'}`,
          stock,
          min,
          max: min > 0 ? min * 5 : 100,
          unit: unidad,
          costo,
          costoStr: costo ? `$${costo.toLocaleString('es-CO')}` : '$0',
          ubicacion: `Bodega · Sucursal ${idSuc}`
        });
      });

      this.showToast(`${this.productos.length} registros cargados`, 'var(--green)');
    });
  }

  showToast(msg: string, color: string = 'var(--green)') {
    this.toastMsg = msg;
    this.toastColor = color;
    this.showToastMsg = true;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => { this.showToastMsg = false; }, 3000);
  }

  get totalActivos()  { return this.productos.filter(p => p.stock > 0).length; }
  get valorTotal()    {
    const total = this.productos.reduce((s, p) => s + p.costo * p.stock, 0);
    return total > 0 ? `$${total.toLocaleString('es-CO')}` : '$0';
  }
  get stockCritico()  { return this.productos.filter(p => p.stock > 0 && p.stock <= p.min * 0.5).length; }
  get stockBajo()     { return this.productos.filter(p => p.stock > p.min * 0.5 && p.stock <= p.min).length; }
  get sinStock()      { return this.productos.filter(p => p.stock === 0).length; }
}
