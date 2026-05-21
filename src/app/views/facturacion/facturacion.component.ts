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
  public vistaActual: 'FACTURAS' | 'CIERRES' | 'GASTOS' = 'FACTURAS';

  // Filtros de Facturas
  public fechaHoy: string = '';
  public filtroFecha: string = '';
  public filtroMetodo: string = 'TODOS';
  public filtroCliente: string = '';

  // Datos
  public facturas: any[] = [];
  public facturasFiltradas: any[] = [];
  public cierres: any[] = [];
  public gastos: any[] = [];

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
  public ventasEfectivoCierre: number = 0;
  public totalGastosCierre: number = 0;
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

  // Modales de Gastos
  public modalGasto: boolean = false;
  public nuevoGasto = { monto: null as number | null, descripcion: '' };

  // Modales de Detalles (Ojito)
  public modalDetalleFactura: boolean = false;
  public modalDetalleCierre: boolean = false;
  public facturaSeleccionada: any = null;
  public modalAnularFactura: boolean = false;
  public facturaAAnular: any = null;
  public facturaAReimprimir: any = null;
  public cierreAImprimir: any = null;
  public productosVendidosCierre: any[] = [];
  public totalVentasCierre: number = 0;

  public notificacion = { mostrar: false, titulo: '', mensaje: '', esError: false };

  constructor(private http: HttpClient, private authService: AuthService) {
    this.fechaHoy = this.obtenerFechaHoy();
    this.filtroFecha = this.fechaHoy;
  }

  ngOnInit(): void {
    this.cargarFacturas();
    this.cargarCierres();
    this.cargarGastos();
  }

  obtenerFechaHoy(): string {
    const fechaObjeto = new Date();
    const anio = fechaObjeto.getFullYear();
    const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObjeto.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }

  cambiarVista(vista: 'FACTURAS' | 'CIERRES' | 'GASTOS'): void {
    this.vistaActual = vista;
  }

  // === LÓGICA DE FACTURAS ===

  cargarFacturas(): void {
    // Construimos los parámetros de búsqueda por fecha (Start of Day to End of Day)
    const startOfDay = `${this.filtroFecha}T00:00:00`;
    const endOfDay = `${this.filtroFecha}T23:59:59`;

    this.http.get<any[]>(`http://212.56.33.183:8080/api/facturas/buscar?fechaInicio=${startOfDay}&fechaFin=${endOfDay}`).subscribe({
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
      this.totalVentas += Number(f.pedido?.total || f.total) || 0;

      const pagos: any[] = f.pagos || [];
      pagos.forEach(p => {
        const metodo = (p.metodo_pago || p.metodoPago || '').toUpperCase();
        const monto = Number(p.monto) || 0;
        if (metodo === 'EFECTIVO') this.totalEfectivo += monto;
        else if (metodo === 'NEQUI' || metodo === 'DAVIPLATA' || metodo === 'TRANSFERENCIA') this.totalTransferencias += monto;
        else if (metodo === 'TARJETA') this.totalTarjetas += monto;
      });
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
    
    this.http.delete(`http://212.56.33.183:8080/api/facturas/${id}`).subscribe({
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

  reimprimirFactura(factura: any): void {
    this.facturaAReimprimir = factura;
    
    // Damos un pequeño retraso para que Angular renderice el contenedor HTML en el DOM
    setTimeout(() => {
      const ticketElement = document.getElementById('ticket-impresion-factura');
      if (!ticketElement) {
        console.error('No se encontró el ticket para imprimir.');
        return;
      }
      const ticketHtml = ticketElement.innerHTML;

      const printWindow = window.open('', '_blank', 'height=600,width=400');
      if (!printWindow) {
        alert('Por favor, permite las ventanas emergentes (pop-ups) para reimprimir el ticket.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Reimprimir Ticket</title>
            <style>
              /* --- Configuración para Impresora de 80mm --- */
              @page {
                margin: 0; 
                size: 80mm auto; /* Ancho exacto de la impresora térmica */
              }

              body {
                font-family: 'Courier New', Courier, monospace;
                width: 72mm; /* Margen de seguridad */
                margin: 0 auto;
                padding: 4mm 0;
                color: #000;
                background: #fff;
                font-size: 12px;
                line-height: 1.2;
              }

              h2 { margin: 0 0 5px 0; font-size: 16px; text-align: center; }
              p { margin: 2px 0; }
              
              .ticket-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
              .ticket-info { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
              .ticket-items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              .ticket-items th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; font-size: 11px; }
              .ticket-items td { padding: 4px 0; vertical-align: top; }
              .qty { width: 15%; text-align: center; }
              .desc { width: 55%; }
              .amt { width: 30%; text-align: right; }
              .ticket-totals { border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 10px; }
              .t-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
              .grand-total { font-weight: bold; font-size: 14px; border-top: 1px solid #000; padding-top: 5px; margin-top: 5px; }
              .ticket-footer { text-align: center; border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; font-size: 11px; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${ticketHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }, 100);
  }

  // === LÓGICA DE CIERRES DE CAJA (TURNOS) ===

  cargarCierres(): void {
    this.http.get<any[]>('http://212.56.33.183:8080/api/cierres-caja').subscribe({
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

    this.http.post('http://212.56.33.183:8080/api/cierres-caja', payload).subscribe({
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

    // Prioridad 1: usar el total_efectivo ya calculado en la BD (disponible tras backend fix)
    let ventasEfectivo = Number(turno.total_efectivo || turno.totalEfectivo) || 0;

    // Prioridad 2: calcular desde pagos embebidos en las facturas (disponible tras @OneToMany pagos en Factura)
    if (ventasEfectivo === 0) {
      ventasEfectivo = this.facturas
        .filter(f => {
          const fCierreId = f.cierreCaja?.idCierre || f.cierreCaja?.id_cierre || f.id_cierre || f.idCierre;
          return fCierreId === idTurno;
        })
        .reduce((sum, f) => {
          const pagos: any[] = f.pagos || [];
          return sum + pagos
            .filter(p => (p.metodo_pago || p.metodoPago || '').toUpperCase() === 'EFECTIVO')
            .reduce((s, p) => s + Number(p.monto || 0), 0);
        }, 0);
    }

    this.ventasEfectivoCierre = ventasEfectivo;

    this.totalGastosCierre = this.gastos
      .filter(g => {
        const gCierreId = g.cierreCaja?.idCierre || g.cierreCaja?.id_cierre || g.id_cierre || g.idCierre;
        return gCierreId === idTurno;
      })
      .reduce((sum, g) => sum + Number(g.monto || 0), 0);

    this.efectivoEsperado = base + this.ventasEfectivoCierre - this.totalGastosCierre;
    this.diferenciaCalculada = -this.efectivoEsperado; // Al inicio faltaría todo

    this.modalCierre = true;
  }

  calcularEfectivo(): void {
    this.efectivoDeclarado = this.denominaciones.reduce((total, den) => total + (den.valor * (den.cantidad || 0)), 0);
    this.diferenciaCalculada = this.efectivoDeclarado - this.efectivoEsperado;
  }

  procesarCierre(): void {
    const idTurno = this.turnoSeleccionado.id_cierre || this.turnoSeleccionado.idCierre;

    // Los totales por método los recalcula el backend desde la tabla pagos.
    // Solo enviamos lo que el cajero declara y las observaciones.
    const payload = {
      efectivoDeclarado: this.efectivoDeclarado,
      diferencia: this.diferenciaCalculada,
      observaciones: this.observacionesCierre
    };

    this.http.put(`http://212.56.33.183:8080/api/cierres-caja/${idTurno}/cerrar`, payload).subscribe({
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
    
    const idTurno = turno.id_cierre || turno.idCierre;
    this.totalGastosCierre = this.gastos
      .filter(g => {
        const gCierreId = g.cierreCaja?.idCierre || g.cierreCaja?.id_cierre || g.id_cierre || g.idCierre;
        return gCierreId === idTurno;
      })
      .reduce((sum, g) => sum + Number(g.monto || 0), 0);
      
    this.modalDetalleCierre = true;
  }

  cerrarDetalleCierre(): void {
    this.modalDetalleCierre = false;
  }

  imprimirCierre(turno: any): void {
    this.cierreAImprimir = turno;
    const idTurno = turno.id_cierre || turno.idCierre;

    // 1. Agrupar los productos vendidos en este turno buscando en las facturas
    const facturasDelTurno = this.facturas.filter(f => {
      const fCierreId = f.cierreCaja?.idCierre || f.cierreCaja?.id_cierre || f.id_cierre || f.idCierre;
      return fCierreId === idTurno;
    });

    // Sumamos el total general de todas las facturas de este turno
    this.totalVentasCierre = facturasDelTurno.reduce((sum, f) => sum + Number(f.total || 0), 0);

    const aggregation = new Map<string, any>();
    
    facturasDelTurno.forEach(f => {
      if (f.pedido?.detalles) {
        f.pedido.detalles.forEach((det: any) => {
          const nombreProd = det.presentacion?.producto?.nombre || 'Producto';
          const nombrePres = det.presentacion?.nombre_presentacion || det.presentacion?.nombrePresentacion || '';
          const nombreCompleto = `${nombreProd} ${nombrePres}`.trim();
          
          const cantidad = Number(det.fraccion || 1);
          const subtotalLinea = Number(det.precio_cobrado || det.precioCobrado || 0) * cantidad;

          if (aggregation.has(nombreCompleto)) {
            const ex = aggregation.get(nombreCompleto);
            ex.cantidad += cantidad;
            ex.total += subtotalLinea;
          } else {
            aggregation.set(nombreCompleto, { nombre: nombreCompleto, cantidad, total: subtotalLinea });
          }
        });
      }
    });

    this.productosVendidosCierre = Array.from(aggregation.values());

    this.totalGastosCierre = this.gastos
      .filter(g => {
        const gCierreId = g.cierreCaja?.idCierre || g.cierreCaja?.id_cierre || g.id_cierre || g.idCierre;
        return gCierreId === idTurno;
      })
      .reduce((sum, g) => sum + Number(g.monto || 0), 0);

    // 2. Damos un pequeño retraso para que Angular dibuje el ticket oculto y lo mandamos a imprimir
    setTimeout(() => {
      const ticketElement = document.getElementById('ticket-impresion-cierre');
      if (!ticketElement) {
        console.error('No se encontró el ticket de cierre para imprimir.');
        return;
      }
      const ticketHtml = ticketElement.innerHTML;

      const printWindow = window.open('', '_blank', 'height=600,width=400');
      if (!printWindow) {
        alert('Permite las ventanas emergentes (pop-ups) para imprimir el reporte.');
        return;
      }

      printWindow.document.write(`
        <html>
          <head>
            <title>Reporte de Turno</title>
            <style>
              @page { margin: 0; size: 80mm auto; }
              body { font-family: 'Courier New', Courier, monospace; width: 72mm; margin: 0 auto; padding: 4mm 0; color: #000; background: #fff; font-size: 12px; line-height: 1.2; }
              h2 { margin: 0 0 5px 0; font-size: 16px; text-align: center; }
              p { margin: 2px 0; }
              .ticket-header { text-align: center; border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
              .ticket-info { border-bottom: 1px dashed #000; padding-bottom: 5px; margin-bottom: 10px; }
              .ticket-items { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
              .ticket-items th { border-bottom: 1px solid #000; text-align: left; padding: 4px 0; font-size: 11px; }
              .ticket-items td { padding: 4px 0; vertical-align: top; }
              .qty { width: 15%; text-align: center; }
              .desc { width: 55%; }
              .amt { width: 30%; text-align: right; }
              .ticket-totals { border-top: 1px dashed #000; padding-top: 5px; margin-bottom: 10px; }
              .t-row { display: flex; justify-content: space-between; margin-bottom: 3px; }
              .ticket-footer { text-align: center; border-top: 1px dashed #000; padding-top: 5px; margin-top: 10px; font-size: 11px; }
            </style>
          </head>
          <body onload="window.print(); window.close();">
            ${ticketHtml}
          </body>
        </html>
      `);
      printWindow.document.close();
    }, 100);
  }

  // === LÓGICA DE GASTOS DE CAJA ===

  cargarGastos(): void {
    this.http.get<any[]>('http://212.56.33.183:8080/api/gastos-caja').subscribe({
      next: (data) => {
        this.gastos = (data || []).sort((a,b) => {
          const idA = a.idGasto || a.id_gasto || 0;
          const idB = b.idGasto || b.id_gasto || 0;
          return idB - idA; // Más recientes primero
        });
      },
      error: (err) => console.error('Error al cargar gastos:', err)
    });
  }

  abrirModalGasto(): void {
    this.nuevoGasto = { monto: null, descripcion: '' };
    this.modalGasto = true;
  }

  cerrarModalGasto(): void {
    this.modalGasto = false;
  }

  procesarGasto(): void {
    if (!this.nuevoGasto.monto || this.nuevoGasto.monto <= 0 || !this.nuevoGasto.descripcion.trim()) {
      this.mostrarToast('Datos incompletos', 'Por favor ingresa un monto válido y una descripción.', true);
      return;
    }

    const turnoAbierto = this.cierres.find(c => c.estado === 'ABIERTA');
    if (!turnoAbierto) {
      this.mostrarToast('Caja Cerrada', 'Debes abrir un turno de caja antes de registrar un gasto.', true);
      return;
    }

    const user = this.authService.getUser();
    const ID_USUARIO_VALIDO = user?.idUsuario || user?.id_usuario;

    const payload = {
      cierreCaja: { idCierre: turnoAbierto.idCierre || turnoAbierto.id_cierre },
      usuario: { idUsuario: ID_USUARIO_VALIDO },
      monto: this.nuevoGasto.monto,
      descripcion: this.nuevoGasto.descripcion.trim()
    };

    this.http.post('http://212.56.33.183:8080/api/gastos-caja', payload).subscribe({
      next: () => {
        this.mostrarToast('Gasto Registrado', 'El gasto fue guardado exitosamente.', false);
        this.cerrarModalGasto();
        this.cargarGastos();
      },
      error: () => this.mostrarToast('Error', 'No se pudo registrar el gasto en el servidor.', true)
    });
  }

  // === UTILIDADES ===
  mostrarToast(titulo: string, mensaje: string, esError: boolean): void {
    this.notificacion = { mostrar: true, titulo, mensaje, esError };
    setTimeout(() => {
      this.notificacion.mostrar = false;
    }, 4000);
  }
}