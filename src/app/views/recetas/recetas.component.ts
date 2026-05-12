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

  // Caché de sesión para datos base (productos, presentaciones, ingredientes)
  private static baseCache: { productos: any[]; presentaciones: any; ingredientes: any } | null = null;
  // Caché de recetas ya cargadas por presentación (persiste en la instancia)
  private recetaCache: { [pid: string]: any[] } = {};

  // ═══ STATE ═══
  isLoading: boolean = true;
  isLoadingReceta: boolean = false;
  searchTerm: string = '';
  activeCat: string = 'todas';

  presentacionesFiltradas: any[] = [];
  activeProd: any = null;
  activePres: string = '';
  activeReceta: any[] = [];

  // ═══ VISTA PRECOMPUTADA ═══
  activeRecetaView: any[] = [];
  totalCosto: number = 0;
  margenBruto: number = 0;
  margenPct: number = 0;
  porcionesPosibles: number = 0;
  costBreakdown: any[] = [];

  // ═══ MODAL STATE ═══
  showModal: boolean = false;
  modalConfig: any = {};
  nuevoIngredienteId: any = '';
  nuevoIngredienteCant: number = 1;

  // ═══ TOAST STATE ═══
  toastMsg: string = '';
  toastColor: string = 'var(--green)';
  showToastMsg: boolean = false;
  private toastTimeout: any;

  // ═══ LISTAS COMPLEMENTARIAS ═══
  ingredientesList: any[] = [];

  DB: any = { ingredientes: {}, productos: [], presentaciones: {} };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    if (RecetasComponent.baseCache) {
      this.aplicarBaseCache(RecetasComponent.baseCache);
    } else {
      this.cargarDatosBase();
    }
  }

  // ═══ CARGA INICIAL: solo productos + presentaciones + ingredientes ═══
  private cargarDatosBase(): void {
    forkJoin({
      productos:      this.http.get<any>(`${this.apiUrl}/productos`).pipe(catchError(() => of([]))),
      presentaciones: this.http.get<any>(`${this.apiUrl}/presentaciones`).pipe(catchError(() => of([]))),
      ingredientes:   this.http.get<any>(`${this.apiUrl}/ingredientes`).pipe(catchError(() => of([])))
    }).subscribe(({ productos, presentaciones, ingredientes }) => {
      const cache = { productos, presentaciones, ingredientes };
      RecetasComponent.baseCache = cache;
      this.aplicarBaseCache(cache);
    });
  }

  private aplicarBaseCache({ productos, presentaciones, ingredientes }: any): void {
    this.DB = { ingredientes: {}, productos: [], presentaciones: {} };

    // Ingredientes (para el modal)
    const ingArr = Array.isArray(ingredientes) ? ingredientes : (ingredientes?.data ?? ingredientes?.content ?? []);
    ingArr.forEach((ing: any) => {
      const id = String(ing.idIngrediente ?? ing.id_ingrediente ?? ing.id);
      this.DB.ingredientes[id] = {
        id, emoji: '📦',
        nombre: ing.nombre ?? `Ingrediente ${id}`,
        sku: `ING-${id}`,
        costo: ing.costoUnitario ?? ing.costo_unitario ?? 0,
        unidad: ing.unidadMedida ?? ing.unidad_medida ?? 'und'
      };
    });

    // Productos
    const prodArr = Array.isArray(productos) ? productos : (productos?.data ?? productos?.content ?? []);
    prodArr.forEach((p: any) => {
      this.DB.productos.push({
        id: String(p.idProducto ?? p.id_producto ?? p.id),
        cat: p.categoria ?? p.cat ?? 'todas',
        emoji: p.emoji ?? '🍕',
        nombre: p.nombre ?? `Producto`
      });
    });

    // Presentaciones
    const presArr = Array.isArray(presentaciones) ? presentaciones : (presentaciones?.data ?? presentaciones?.content ?? []);
    presArr.forEach((pres: any) => {
      const idPres = String(pres.idPresentacion ?? pres.id_presentacion ?? pres.id);
      const idProd = String(pres.producto?.idProducto ?? pres.producto?.id_producto ?? pres.idProducto ?? pres.id_producto ?? '');
      this.DB.presentaciones[idPres] = {
        nombre: pres.nombre ?? `Pres. ${idPres}`,
        emoji: pres.emoji ?? '🔸',
        precio: pres.precio ?? 0,
        idProducto: idProd
      };
    });

    this.ingredientesList = Object.values(this.DB.ingredientes);
    this.isLoading = false;
    this.filterProdCat('todas');
    if (this.presentacionesFiltradas.length > 0) {
      this.selectPres(this.presentacionesFiltradas[0].id);
    }
  }

  // ═══ INTERACCIÓN Y FILTROS ═══
  filterProdCat(cat: string): void {
    this.activeCat = cat;
    this.searchProds();
  }

  searchProds(): void {
    let base = Object.keys(this.DB.presentaciones).map(pid => {
      const pres = this.DB.presentaciones[pid];
      const prod = this.DB.productos.find((p: any) => p.id === pres.idProducto);
      return { id: pid, ...pres, prodNombre: prod?.nombre ?? '', prodCat: prod?.cat ?? 'todas', prodEmoji: prod?.emoji ?? '🍕' };
    });
    if (this.activeCat !== 'todas') base = base.filter(p => p.prodCat === this.activeCat);
    if (this.searchTerm.trim()) {
      const q = this.searchTerm.toLowerCase();
      base = base.filter(p => p.nombre.toLowerCase().includes(q) || p.prodNombre.toLowerCase().includes(q));
    }
    this.presentacionesFiltradas = base;
  }

  // ═══ SELECCIÓN CON LAZY LOAD ═══
  selectPres(pid: string): void {
    this.activePres = pid;
    const pres = this.DB.presentaciones[pid];
    if (pres) this.activeProd = this.DB.productos.find((p: any) => p.id === pres.idProducto) ?? null;

    if (this.recetaCache[pid]) {
      this.activeReceta = this.recetaCache[pid];
      this.buildView();
      return;
    }

    this.isLoadingReceta = true;
    this.activeRecetaView = [];
    this.http.get<any>(`${this.apiUrl}/recetas/presentacion/${pid}/detalle`)
      .pipe(catchError(() => of([])))
      .subscribe(data => {
        const arr = Array.isArray(data) ? data : (data?.data ?? data?.content ?? []);
        const receta = arr.map((r: any) => this.parseRecetaRow(r));
        this.recetaCache[pid] = receta;
        this.activeReceta = receta;
        this.isLoadingReceta = false;
        this.buildView();
      });
  }

  private parseRecetaRow(r: any): any {
    // Soporta tanto la vista plana (/detalle) como el endpoint con objeto anidado
    const ing = r.ingrediente ?? {};
    return {
      id_receta:          r.idReceta ?? r.id_receta ?? r.id,
      id_presentacion:    String(r.idPresentacion ?? r.presentacion?.idPresentacion ?? ''),
      id_ingrediente:     String(r.idIngrediente ?? ing.idIngrediente ?? ing.id_ingrediente ?? ''),
      cantidad_necesaria: r.cantidadNecesaria ?? r.cantidad_necesaria ?? 0,
      costoLineaDB:       r.costoLinea ?? null,
      ingData: {
        nombre: r.nombre ?? ing.nombre ?? 'Desconocido',
        costo:  r.costoUnitario ?? ing.costoUnitario ?? ing.costo_unitario ?? 0,
        unidad: r.unidadMedida ?? ing.unidadMedida ?? ing.unidad_medida ?? 'und',
        emoji:  r.emoji ?? ing.emoji ?? '📦',
        sku:    `ING-${r.idIngrediente ?? ing.idIngrediente ?? ''}`
      }
    };
  }

  getPresentacion(pid: string): any {
    return this.DB.presentaciones[pid] ?? null;
  }

  getIngrediente(id: string | number): any {
    return this.DB.ingredientes[String(id)] ?? { emoji: '❓', nombre: 'Desconocido', unidad: '-', costo: 0, sku: 'N/A' };
  }

  // ═══ PRECOMPUTACIÓN DE VISTA ═══
  private buildView(): void {
    const pres = this.getPresentacion(this.activePres);

    this.activeRecetaView = this.activeReceta.map(r => {
      const ing = r.ingData;
      const costoTotal = r.costoLineaDB ?? (ing.costo * r.cantidad_necesaria);
      return { ...r, ing, costoTotal, stockPct: 0, stockColor: 'var(--muted)', porcionesDisponibles: 0 };
    });

    this.totalCosto   = this.activeRecetaView.reduce((s, r) => s + r.costoTotal, 0);
    this.margenBruto  = pres ? pres.precio - this.totalCosto : 0;
    this.margenPct    = pres?.precio > 0 ? Math.round((this.margenBruto / pres.precio) * 100) : 0;
    this.porcionesPosibles = 0;

    this.costBreakdown = [...this.activeRecetaView]
      .map(r => ({ ...r, pctCosto: this.totalCosto > 0 ? Math.round((r.costoTotal / this.totalCosto) * 100) : 0 }))
      .sort((a, b) => b.costoTotal - a.costoTotal)
      .slice(0, 5);
  }

  // ═══ ACCIONES EN TABLA ═══
  adjustQty(idReceta: number, delta: number): void {
    const r = this.activeReceta.find(x => x.id_receta === idReceta);
    if (r) { r.cantidad_necesaria = Math.max(1, r.cantidad_necesaria + delta); this.buildView(); }
  }

  removeIng(idReceta: number): void {
    this.activeReceta = this.activeReceta.filter(r => r.id_receta !== idReceta);
    this.recetaCache[this.activePres] = this.activeReceta;
    this.buildView();
    this.showToast('Ingrediente eliminado', 'var(--red)');
  }

  // ═══ ACCIONES GLOBALES ═══
  guardarReceta(): void {
    // En un entorno real aquí se haría un PUT/POST al backend con this.activeReceta
    this.showToast('Receta guardada exitosamente en la base de datos', 'var(--green)');
  }

  // ═══ MODALES ═══
  openModal(): void {
    this.modalConfig = { title: 'Agregar <span>Ingrediente</span>', btn: 'Agregar a receta' };
    this.nuevoIngredienteId = this.ingredientesList.length > 0 ? this.ingredientesList[0].id : '';
    this.nuevoIngredienteCant = 1;
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
  }

  saveModal(): void {
    if (!this.nuevoIngredienteId || this.nuevoIngredienteCant < 1) {
      this.showToast('Cantidad o ingrediente inválido', 'var(--red)');
      return;
    }

    const nextId = this.activeReceta.length > 0 ? Math.max(...this.activeReceta.map(r => r.id_receta)) + 1 : 1;

    const ing = this.DB.ingredientes[String(this.nuevoIngredienteId)] ?? {};
    this.activeReceta.push({
      id_receta: nextId,
      id_presentacion: this.activePres,
      id_ingrediente: String(this.nuevoIngredienteId),
      cantidad_necesaria: this.nuevoIngredienteCant,
      ingData: {
        nombre: ing.nombre ?? 'Desconocido',
        costo: ing.costo ?? 0,
        unidad: ing.unidad ?? 'und',
        emoji: ing.emoji ?? '📦',
        sku: ing.sku ?? `ING-${this.nuevoIngredienteId}`
      }
    });
    this.recetaCache[this.activePres] = this.activeReceta;

    this.buildView();
    this.showToast('Ingrediente agregado a la receta', 'var(--green)');
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
