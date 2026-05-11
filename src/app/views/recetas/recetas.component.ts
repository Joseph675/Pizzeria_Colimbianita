import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-recetas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recetas.component.html',
  styleUrl: './recetas.component.scss'
})
export class RecetasComponent implements OnInit {
  private apiUrl = 'http://178.105.36.117:8080/api';

  // ═══ STATE ═══
  searchTerm: string = '';
  activeCat: string = 'todas';
  
  productosFiltrados: any[] = [];
  activeProd: any = null;
  activePres: string = '';
  activeReceta: any[] = [];

  // ═══ MODAL STATE ═══
  showModal: boolean = false;
  modalTipo: string = '';
  modalConfig: any = {};
  
  nuevoIngredienteId: any = '';
  nuevoIngredienteCant: number = 1;
  nuevaPresNombre: string = '';
  nuevaPresPrecio: number = 0;
  nuevaPresEmoji: string = '🔴';

  // ═══ TOAST STATE ═══
  toastMsg: string = '';
  toastColor: string = 'var(--green)';
  showToastMsg: boolean = false;
  private toastTimeout: any;

  // ═══ LISTAS COMPLEMENTARIAS ═══
  ingredientesList: any[] = [];

  // ═══ ESTRUCTURA DE LA BASE DE DATOS ═══
  DB: any = {
    ingredientes: {},
    productos: [],
    presentaciones: {},
    recetas: {}
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.cargarDatosBD();
  }

  // ═══ CARGA DE DATOS DESDE EL BACKEND ═══
  private cargarDatosBD(): void {
    // Solicitamos todas las entidades necesarias al backend
    forkJoin({
      ingredientes: this.http.get<any>(`${this.apiUrl}/ingredientes`).pipe(catchError(() => of([]))),
      inventario: this.http.get<any>(`${this.apiUrl}/inventario-sucursal`).pipe(catchError(() => this.http.get<any>(`${this.apiUrl}/inventario`).pipe(catchError(() => of([]))))),
      productos: this.http.get<any>(`${this.apiUrl}/productos`).pipe(catchError(() => of([]))),
      presentaciones: this.http.get<any>(`${this.apiUrl}/presentaciones`).pipe(catchError(() => this.http.get<any>(`${this.apiUrl}/presentacion-producto`).pipe(catchError(() => of([]))))),
      recetas: this.http.get<any>(`${this.apiUrl}/recetas`).pipe(catchError(() => this.http.get<any>(`${this.apiUrl}/receta`).pipe(catchError(() => of([])))))
    }).subscribe(({ ingredientes, inventario, productos, presentaciones, recetas }) => {
      
      this.DB = { ingredientes: {}, productos: [], presentaciones: {}, recetas: {} };

      // 1. Procesar Ingredientes y Stock
      const ingArray = Array.isArray(ingredientes) ? ingredientes : (ingredientes?.data || ingredientes?.content || []);
      const invArray = Array.isArray(inventario) ? inventario : (inventario?.data || inventario?.content || []);

      ingArray.forEach((ing: any) => {
        const id = ing.id_ingrediente || ing.idIngrediente || ing.id;
        const invItem = invArray.find((inv: any) => (inv.id_ingrediente || inv.idIngrediente || inv.ingrediente?.id_ingrediente) === id);
        const stockActual = invItem ? (invItem.cantidad || invItem.cantidad_actual || invItem.cantidadActual || 0) : 0;

        this.DB.ingredientes[id] = {
          id: id,
          emoji: '📦',
          nombre: ing.nombre || `Ingrediente ${id}`,
          sku: `ING-${id}`,
          costo: ing.costoUnitario || ing.costo_unitario || 0,
          unidad: ing.unidadMedida || ing.unidad_medida || 'und',
          stock: stockActual
        };
      });

      // 2. Procesar Productos
      const prodArray = Array.isArray(productos) ? productos : (productos?.data || productos?.content || []);
      prodArray.forEach((p: any) => {
        const idProd = p.id_producto || p.idProducto || p.id;
        this.DB.productos.push({
          id: idProd,
          cat: p.categoria || p.cat || 'todas',
          emoji: p.emoji || '🍕',
          nombre: p.nombre || `Producto ${idProd}`,
          presentaciones: []
        });
      });

      // 3. Procesar Presentaciones
      const presArray = Array.isArray(presentaciones) ? presentaciones : (presentaciones?.data || presentaciones?.content || []);
      presArray.forEach((pres: any) => {
        const idPres = pres.id_presentacion || pres.idPresentacion || pres.id;
        const idProd = pres.id_producto || pres.idProducto || (pres.producto && pres.producto.id_producto);
        
        this.DB.presentaciones[idPres] = {
          nombre: pres.nombre || `Pres. ${idPres}`,
          emoji: pres.emoji || '🔸',
          precio: pres.precio || 0,
          idProducto: idProd
        };

        // Vincular al producto correspondiente
        const prod = this.DB.productos.find((p: any) => p.id === idProd);
        if (prod) {
          prod.presentaciones.push(idPres);
        }
      });

      // 4. Procesar Recetas
      const recArray = Array.isArray(recetas) ? recetas : (recetas?.data || recetas?.content || []);
      recArray.forEach((r: any) => {
        const idPres = r.id_presentacion || r.idPresentacion || (r.presentacion && r.presentacion.id_presentacion);
        if (!this.DB.recetas[idPres]) {
          this.DB.recetas[idPres] = [];
        }
        this.DB.recetas[idPres].push({
          id_receta: r.id_receta || r.idReceta || r.id,
          id_presentacion: idPres,
          id_ingrediente: r.id_ingrediente || r.idIngrediente || (r.ingrediente && r.ingrediente.id_ingrediente),
          cantidad_necesaria: r.cantidad_necesaria || r.cantidadNecesaria || r.cantidad || 0
        });
      });

      this.updateIngredientesList();
      this.initView();
    });
  }

  private updateIngredientesList(): void {
    this.ingredientesList = Object.keys(this.DB.ingredientes).map(key => ({
      id: key,
      ...this.DB.ingredientes[key]
    }));
  }

  private initView(): void {
    this.filterProdCat('todas');
    if (this.productosFiltrados.length > 0) {
      this.selectProd(this.productosFiltrados[0]);
    }
  }

  // ═══ INTERACCIÓN Y FILTROS ═══
  filterProdCat(cat: string): void {
    this.activeCat = cat;
    this.searchProds();
  }

  searchProds(): void {
    let base = this.activeCat === 'todas' 
      ? this.DB.productos 
      : this.DB.productos.filter((p: any) => p.cat === this.activeCat);

    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      base = base.filter((p: any) => p.nombre.toLowerCase().includes(q));
    }
    
    this.productosFiltrados = base;
  }

  selectProd(p: any): void {
    this.activeProd = p;
    if (p.presentaciones && p.presentaciones.length > 0) {
      this.selectPres(p.presentaciones[0]);
    } else {
      this.activePres = '';
      this.activeReceta = [];
    }
  }

  selectPres(pid: string): void {
    this.activePres = pid;
    this.activeReceta = this.DB.recetas[this.activePres] || [];
  }

  // ═══ GETTERS DE DATOS DE RECETA ═══
  getPresentacion(pid: string): any {
    return this.DB.presentaciones[pid] || null;
  }

  getIngrediente(id: string | number): any {
    return this.DB.ingredientes[id] || { emoji: '❓', nombre: 'Desconocido', unidad: '-', costo: 0, stock: 0, sku: 'N/A' };
  }

  // ═══ CÁLCULOS ═══
  getCostoTotalIngrediente(r: any): number {
    const ing = this.getIngrediente(r.id_ingrediente);
    const unitCost = ing.costo || 0;
    return (unitCost * r.cantidad_necesaria) / (ing.unidad === 'g' || ing.unidad === 'ml' ? 1000 : 1);
  }

  getTotalCosto(): number {
    if (!this.activeReceta) return 0;
    return this.activeReceta.reduce((sum, r) => sum + this.getCostoTotalIngrediente(r), 0);
  }

  getMargenBruto(): number {
    const pres = this.getPresentacion(this.activePres);
    if (!pres) return 0;
    return pres.precio - this.getTotalCosto();
  }

  getMargenPct(): number {
    const pres = this.getPresentacion(this.activePres);
    if (!pres || pres.precio <= 0) return 0;
    return Math.round((this.getMargenBruto() / pres.precio) * 100);
  }

  getStockPct(r: any): number {
    const ing = this.getIngrediente(r.id_ingrediente);
    const limit = (ing.unidad === 'g' || ing.unidad === 'ml') ? 5000 : 50; 
    return Math.min(100, Math.round((ing.stock / limit) * 100));
  }

  getStockColor(r: any): string {
    const pct = this.getStockPct(r);
    if (pct < 20) return 'var(--red)';
    if (pct < 40) return 'var(--orange)';
    return 'var(--green)';
  }

  getPorcionesDisponibles(r: any): number {
    const ing = this.getIngrediente(r.id_ingrediente);
    if (!ing || !r.cantidad_necesaria) return 0;
    return Math.floor(ing.stock / r.cantidad_necesaria);
  }

  getPorcionesPosibles(): number {
    if (!this.activeReceta || this.activeReceta.length === 0) return 0;
    const porciones = this.activeReceta.map(r => this.getPorcionesDisponibles(r));
    return Math.min(...porciones);
  }

  getCostBreakdown(): any[] {
    if (!this.activeReceta) return [];
    const totalCosto = this.getTotalCosto();
    
    const conCosto = this.activeReceta.map(r => {
      const ing = this.getIngrediente(r.id_ingrediente);
      const costo = this.getCostoTotalIngrediente(r);
      const pctCosto = totalCosto > 0 ? Math.round((costo / totalCosto) * 100) : 0;
      return { ...r, ing, costo, pctCosto };
    });

    return conCosto.sort((a, b) => b.costo - a.costo).slice(0, 5);
  }

  // ═══ ACCIONES EN TABLA ═══
  adjustQty(idReceta: number, delta: number): void {
    const r = this.activeReceta.find(x => x.id_receta === idReceta);
    if (r) {
      r.cantidad_necesaria = Math.max(1, r.cantidad_necesaria + delta);
    }
  }

  removeIng(idReceta: number): void {
    this.activeReceta = this.activeReceta.filter(r => r.id_receta !== idReceta);
    // Sincronizar con DB temporal
    if (this.DB.recetas[this.activePres]) {
      this.DB.recetas[this.activePres] = this.activeReceta;
    }
    this.showToast('Ingrediente eliminado', 'var(--red)');
  }

  // ═══ ACCIONES GLOBALES ═══
  guardarReceta(): void {
    // En un entorno real aquí se haría un PUT/POST al backend con this.activeReceta
    this.showToast('Receta guardada exitosamente en la base de datos', 'var(--green)');
  }

  exportarPDF(): void {
    this.showToast('Generando PDF de la ficha técnica...', 'var(--blue)');
  }

  enviarCocina(): void {
    this.showToast('Ficha enviada al sistema de cocina', 'var(--gold)');
  }

  // ═══ MODALES ═══
  openModal(tipo: string): void {
    this.modalTipo = tipo;
    
    if (tipo === 'ing') {
      this.modalConfig = { title: 'Agregar <span>Ingrediente</span>', btn: 'Agregar a receta' };
      this.nuevoIngredienteId = this.ingredientesList.length > 0 ? this.ingredientesList[0].id : '';
      this.nuevoIngredienteCant = 1;
    } else if (tipo === 'pres') {
      this.modalConfig = { title: 'Nueva <span>Presentación</span>', btn: 'Crear presentación' };
      this.nuevaPresNombre = '';
      this.nuevaPresPrecio = 0;
      this.nuevaPresEmoji = '🔴';
    }
    
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveModal(): void {
    if (this.modalTipo === 'ing') {
      if (!this.nuevoIngredienteId || this.nuevoIngredienteCant < 1) {
        this.showToast('Cantidad o ingrediente inválido', 'var(--red)');
        return;
      }

      // Calcular nuevo ID simulado
      const nextId = this.activeReceta.length > 0 ? Math.max(...this.activeReceta.map(r => r.id_receta)) + 1 : 1;
      
      this.activeReceta.push({
        id_receta: nextId,
        id_presentacion: this.activePres,
        id_ingrediente: this.nuevoIngredienteId,
        cantidad_necesaria: this.nuevoIngredienteCant
      });
      
      if (!this.DB.recetas[this.activePres]) {
        this.DB.recetas[this.activePres] = this.activeReceta;
      }
      
      this.showToast('Ingrediente agregado a la receta', 'var(--green)');
      
    } else if (this.modalTipo === 'pres') {
      if (!this.nuevaPresNombre || this.nuevaPresPrecio <= 0) {
        this.showToast('Revisa los datos de la presentación', 'var(--red)');
        return;
      }

      // Generar nuevo ID de presentación
      const newPresId = `PRES-${Math.floor(Math.random() * 1000) + 100}`;
      
      this.DB.presentaciones[newPresId] = {
        nombre: this.nuevaPresNombre,
        precio: this.nuevaPresPrecio,
        emoji: this.nuevaPresEmoji,
        idProducto: this.activeProd.id
      };

      this.activeProd.presentaciones.push(newPresId);
      this.activePres = newPresId; // seleccionarla automáticamente
      this.activeReceta = []; // receta vacía
      
      this.showToast('Presentación creada', 'var(--green)');
    }
    
    this.closeModal();
  }

  // ═══ TOAST COMPONENT ═══
  showToast(msg: string, color: string = 'var(--green)'): void {
    this.toastMsg = msg;
    this.toastColor = color;
    this.showToastMsg = true;
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.showToastMsg = false;
    }, 3000);
  }
}
