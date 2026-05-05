import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe, LowerCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-facturacion',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe, LowerCasePipe, FormsModule],
  templateUrl: './facturacion.component.html',
  styleUrl: './facturacion.component.scss'
})
export class FacturacionComponent implements OnInit {
  public vistaActual: 'FACTURAS' | 'CIERRES' = 'FACTURAS';

  // Filtros de Facturas
  public fechaHoy: string = '';
  public filtroFecha: string = '';
  public filtroMetodo: string = 'TODOS';
  public filtroCliente: string = '';

  // Datos
  public facturas: any[] = [];
  public facturasFiltradas: any[] = [];
  public cierres: any[] = [];

  // Estadísticas del Dashboard
  public totalVentas: number = 0;
  public totalEfectivo: number = 0;
  public totalTransferencias: number = 0;
  public totalTarjetas: number = 0;

  // Modales y Formularios
  public modalApertura: boolean = false;
  public nuevaBaseInicial: number = 0;

  public modalCierre: boolean = false;
  public turnoSeleccionado: any = null;
  public efectivoDeclarado: number = 0;
  public observacionesCierre: string = '';

  // Variables para arqueo de caja detallado
  public efectivoEsperado: number = 0;
  public diferenciaCalculada: number = 0;
  public denominaciones = [
    { valor: 100000, cantidad: null as number | null },
    { valor: 50000, cantidad: null as number | null },
    { valor: 20000, cantidad: null as number | null },
    { valor: 10000, cantidad: null as number | null },
    { valor: 5000, cantidad: null as number | null },
    { valor: 2000, cantidad: null as number | null },
    { valor: 1000, cantidad: null as number | null },
    { valor: 500, cantidad: null as number | null },
    { valor: 200, cantidad: null as number | null },
    { valor: 100, cantidad: null as number | null },
    { valor: 50, cantidad: null as number | null }
  ];

  // Modales de Detalles (Ojito)
  public modalDetalleFactura: boolean = false;
  public modalDetalleCierre: boolean = false;
  public facturaSeleccionada: any = null;
  public modalAnularFactura: boolean = false;
  public facturaAAnular: any = null;

  public notificacion = { mostrar: false, titulo: '', mensaje: '', esError: false };

  constructor(private http: HttpClient, private authService: AuthService) {
    this.fechaHoy = this.obtenerFechaHoy();
    this.filtroFecha = this.fechaHoy;
  }

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarCierres();
  }

  obtenerFechaHoy(): string {
    const fechaObjeto = new Date();
    const anio = fechaObjeto.getFullYear();
    const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObjeto.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  cambiarVista(vista: 'FACTURAS' | 'CIERRES'): void {
    this.vistaActual = vista;
  }

  // === LÓGICA DE FACTURAS ===

  cargarFacturas(): void {
    // Construimos los parámetros de búsqueda por fecha (Start of Day to End of Day)
    const startOfDay = `${this.filtroFecha}T00:00:00`;
    const endOfDay = `${this.filtroFecha}T23:59:59`;

    this.http.get<any[]>(`http://localhost:8080/api/facturas/buscar?fechaInicio=${startOfDay}&fechaFin=${endOfDay}`).subscribe({
      next: (data) => {
        this.facturas = data || [];
        this.aplicarFiltroFacturasLocal();
      },
      error: (err) => {
        console.error('Error al cargar facturas:', err);
        this.mostrarToast('Error', 'No se pudieron cargar las facturas.', true);
      }
    });
  }

  aplicarFiltroFacturasLocal(): void {
    this.facturasFiltradas = this.facturas.filter(f => {
      const metodo = (f.metodo_pago || f.metodoPago || '').toUpperCase();
      const coincideMetodo = this.filtroMetodo === 'TODOS' || metodo === this.filtroMetodo;

      // Búsqueda por texto (Cliente, ID Factura o ID Pedido)
      const texto = (this.filtroCliente || '').toLowerCase().trim();
      let coincideTexto = true;
      if (texto) {
        const nombreCliente = (f.pedido?.cliente?.nombres || f.pedido?.cliente?.nombre || '').toLowerCase();
        const idFactura = String(f.id_factura || f.idFactura || '');
        const idPedido = String(f.id_pedido || f.idPedido || f.pedido?.idPedido || f.pedido?.id_pedido || '');
        
        coincideTexto = nombreCliente.includes(texto) || idFactura.includes(texto) || idPedido.includes(texto);
      }

      return coincideMetodo && coincideTexto;
    });
    this.calcularEstadisticas();
  }

  limpiarFiltrosFacturas(): void {
    this.filtroFecha = this.fechaHoy;
    this.filtroMetodo = 'TODOS';
    this.filtroCliente = '';
    this.cargarFacturas(); // Recarga la info de hoy
  }

  calcularEstadisticas(): void {
    this.totalVentas = 0;
    this.totalEfectivo = 0;
    this.totalTransferencias = 0;
    this.totalTarjetas = 0;

    this.facturasFiltradas.forEach(f => {
      const total = Number(f.total) || 0;
      const metodo = (f.metodo_pago || f.metodoPago || '').toUpperCase();

      this.totalVentas += total;
      if (metodo === 'EFECTIVO') this.totalEfectivo += total;
      else if (metodo === 'NEQUI' || metodo === 'DAVIPLATA') this.totalTransferencias += total;
      else if (metodo === 'TARJETA') this.totalTarjetas += total;
    });
  }

  abrirModalAnularFactura(factura: any): void {
    this.facturaAAnular = factura;
    this.modalAnularFactura = true;
  }

  cerrarModalAnularFactura(): void {
    this.modalAnularFactura = false;
    this.facturaAAnular = null;
  }

  confirmarAnularFactura(): void {
    if (!this.facturaAAnular) return;
    const id = this.facturaAAnular.id_factura || this.facturaAAnular.idFactura;
    
    this.http.delete(`http://localhost:8080/api/facturas/${id}`).subscribe({
      next: () => {
        this.mostrarToast('Factura Anulada', 'La factura fue eliminada con éxito.', false);
        this.cargarFacturas();
        this.cerrarModalAnularFactura();
      },
      error: () => {
        this.mostrarToast('Error', 'No se pudo anular la factura.', true);
        this.cerrarModalAnularFactura();
      }
    });
  }

  abrirDetalleFactura(factura: any): void {
    this.facturaSeleccionada = factura;
    this.modalDetalleFactura = true;
  }

  cerrarDetalleFactura(): void {
    this.modalDetalleFactura = false;
    this.facturaSeleccionada = null;
  }

  // === LÓGICA DE CIERRES DE CAJA (TURNOS) ===

  cargarCierres(): void {
    this.http.get<any[]>('http://localhost:8080/api/cierres-caja').subscribe({
      next: (data) => {
        this.cierres = (data || []).sort((a,b) => {
          const idA = a.idCierre || a.id_cierre || 0;
          const idB = b.idCierre || b.id_cierre || 0;
          return idB - idA; // Más recientes primero
        });
      }
    });
  }

  abrirModalApertura(): void {
    this.nuevaBaseInicial = 0;
    this.modalApertura = true;
  }

  procesarApertura(): void {
    // Recuperamos el usuario logueado usando tu servicio
    const user = this.authService.getUser();
    
    // Extraemos su ID (soporta si viene como idUsuario o id_usuario)
    const ID_USUARIO_VALIDO = user?.idUsuario || user?.id_usuario; 

    if (!ID_USUARIO_VALIDO) {
      this.mostrarToast('Error', 'No se pudo identificar al usuario logueado.', true);
      return;
    }

    const ID_SUCURSAL_VALIDA = 1; // Cambia este número por un ID real de tu tabla sucursal

    const payload = {
      sucursal: { idSucursal: ID_SUCURSAL_VALIDA }, 
      usuario: { idUsuario: ID_USUARIO_VALIDO },
      baseInicial: this.nuevaBaseInicial
    };

    this.http.post('http://localhost:8080/api/cierres-caja', payload).subscribe({
      next: () => {
        this.mostrarToast('Turno Abierto', 'Caja abierta exitosamente.', false);
        this.modalApertura = false;
        this.cargarCierres();
      },
      error: () => this.mostrarToast('Error', 'No se pudo abrir el turno.', true)
    });
  }

  abrirModalCierre(turno: any): void {
    this.turnoSeleccionado = turno;
    this.efectivoDeclarado = 0;
    this.observacionesCierre = '';
    
    // Limpiamos el contador de billetes
    this.denominaciones.forEach(d => d.cantidad = null);
    
    const idTurno = turno.id_cierre || turno.idCierre;
    const base = turno.base_inicial || turno.baseInicial || 0;
    let ventasEfectivo = turno.total_efectivo || turno.totalEfectivo || 0;

    // Si la base de datos dice que hay 0 en efectivo, lo calculamos nosotros manualmente
    // cruzando la información con las facturas cobradas en ese mismo turno
    if (ventasEfectivo === 0) {
      ventasEfectivo = this.facturas
        .filter(f => {
          const fCierreId = f.cierreCaja?.idCierre || f.cierreCaja?.id_cierre || f.id_cierre || f.idCierre;
          const metodo = (f.metodo_pago || f.metodoPago || '').toUpperCase();
          return fCierreId === idTurno && metodo === 'EFECTIVO';
        })
        .reduce((sum, f) => sum + Number(f.total || 0), 0);
    }

    this.efectivoEsperado = base + ventasEfectivo;
    this.diferenciaCalculada = -this.efectivoEsperado; // Al inicio faltaría todo

    this.modalCierre = true;
  }

  calcularEfectivo(): void {
    this.efectivoDeclarado = this.denominaciones.reduce((total, den) => total + (den.valor * (den.cantidad || 0)), 0);
    this.diferenciaCalculada = this.efectivoDeclarado - this.efectivoEsperado;
  }

  procesarCierre(): void {
    const idTurno = this.turnoSeleccionado.id_cierre || this.turnoSeleccionado.idCierre;
    
    // Calculamos todos los totales cruzando la información con las facturas
    let totalEfectivo = 0;
    let totalTarjetas = 0;
    let totalTransferencias = 0;

    this.facturas.forEach(f => {
      const fCierreId = f.cierreCaja?.idCierre || f.cierreCaja?.id_cierre || f.id_cierre || f.idCierre;
      if (fCierreId === idTurno) {
        const metodo = (f.metodo_pago || f.metodoPago || '').toUpperCase();
        const total = Number(f.total || 0);
        if (metodo === 'EFECTIVO') totalEfectivo += total;
        else if (metodo === 'TARJETA') totalTarjetas += total;
        else if (metodo === 'NEQUI' || metodo === 'DAVIPLATA') totalTransferencias += total;
      }
    });

    const payload = {
      efectivoDeclarado: this.efectivoDeclarado, // CamelCase para Spring Boot
      totalEfectivo: totalEfectivo,
      totalTarjetas: totalTarjetas,
      totalTransferencias: totalTransferencias,
      diferencia: this.diferenciaCalculada,
      observaciones: this.observacionesCierre
    };

    this.http.put(`http://localhost:8080/api/cierres-caja/${idTurno}/cerrar`, payload).subscribe({
      next: () => {
        this.mostrarToast('Turno Cerrado', 'La caja ha sido cerrada y calculada.', false);
        this.modalCierre = false;
        this.cargarCierres();
      },
      error: () => this.mostrarToast('Error', 'No se pudo cerrar el turno.', true)
    });
  }

  abrirDetalleCierre(turno: any): void {
    this.turnoSeleccionado = turno;
    this.modalDetalleCierre = true;
  }

  cerrarDetalleCierre(): void {
    this.modalDetalleCierre = false;
  }

  // === UTILIDADES ===
  mostrarToast(titulo: string, mensaje: string, esError: boolean): void {
    this.notificacion = { mostrar: true, titulo, mensaje, esError };
    setTimeout(() => {
      this.notificacion.mostrar = false;
    }, 4000);
  }
}