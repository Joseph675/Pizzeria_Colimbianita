import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss'
})
export class PedidosComponent implements OnInit, OnDestroy {
  public pedidos: any[] = [];
  public pedidosFiltrados: any[] = [];
  public cargando: boolean = false;
  public pedidoSeleccionado: any = null;
  public modalTop: string = '50%'; // Posición vertical dinámica
  private pollingSubscription?: Subscription;
  private ultimoIdPedido: number = 0;
  public mostrarNotificacion: boolean = false;

  // Filtros
  public fechaHoy: string = '';
  public filtroFecha: string = '';
  public filtroEstado: string = 'TODOS';
  public filtroTipo: string = 'TODOS';

  // Variables para el proceso de Cobro
  public showCobrarModal: boolean = false;
  public metodoPago: string = 'EFECTIVO';
  public montoRecibido: number = 0;

  public autoOpenMesaId: number | null = null;

  constructor(private http: HttpClient, private authService: AuthService, private route: ActivatedRoute) {
    this.fechaHoy = this.obtenerFechaHoy();
    this.filtroFecha = this.fechaHoy;
  }

  obtenerFechaHoy(): string {
    const fechaObjeto = new Date();
    const anio = fechaObjeto.getFullYear();
    const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
    const dia = String(fechaObjeto.getDate()).padStart(2, '0');
    return `${anio}-${mes}-${dia}`;
  }
  
  ngOnInit(): void {
    // Detectamos si venimos redirigidos desde el plano de mesas
    this.route.queryParams.subscribe(params => {
      if (params['mesaId']) {
        this.autoOpenMesaId = Number(params['mesaId']);
        this.filtroTipo = 'MESA'; // Auto-filtramos para ver principalmente las mesas
      }
    });

    this.cargarPedidos();

    // Consultar nuevos pedidos de forma automática cada 10 segundos (10000ms)
    this.pollingSubscription = interval(10000).subscribe(() => {
      this.cargarPedidos(true); // Se envía "true" para indicar que es una petición silenciosa
    });
  }

  ngOnDestroy(): void {
    // Limpiar el temporizador al salir de esta vista para no saturar el navegador
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  cargarPedidos(esPolling: boolean = false): void {
    // Solo activamos el estado "cargando" si NO es una petición automática de fondo
    if (!esPolling) {
      this.cargando = true;
    }
    
    // Se asume que el backend (Spring Boot) devuelve la lista de pedidos y, 
    // gracias a las relaciones, cada pedido incluye su lista de detalles
    this.http.get<any[]>('http://localhost:8080/api/pedidos').subscribe({
      next: (data) => {
        const pedidosRecibidos = data || [];
        
        if (pedidosRecibidos.length > 0) {
          const maxIdActual = Math.max(...pedidosRecibidos.map(p => p.idPedido || p.id_pedido || 0));
          
          // Si ya teníamos registros y el nuevo ID es mayor, significa que entró un pedido nuevo
          if (this.ultimoIdPedido > 0 && maxIdActual > this.ultimoIdPedido) {
            this.lanzarNotificacion();
          }
          this.ultimoIdPedido = maxIdActual;
        }

        // Ordenamos los pedidos para que los más recientes (mayor ID) salgan primero
        this.pedidos = pedidosRecibidos.sort((a, b) => {
           const idA = a.idPedido || a.id_pedido || 0;
           const idB = b.idPedido || b.id_pedido || 0;
           return idB - idA; // Orden descendente
        });

        // Aplicamos los filtros actuales a la nueva data
        this.aplicarFiltros();

        // Lógica de auto-apertura si venimos de la vista de Mesas
        if (this.autoOpenMesaId && !esPolling) {
          // Buscamos el pedido activo (que no esté pagado o cancelado) para esta mesa
          const pedidoMesa = this.pedidos.find(p => 
            (p.estado !== 'PAGADO' && p.estado !== 'CANCELADO') && 
            (p.mesa?.idMesa === this.autoOpenMesaId || p.mesa?.id_mesa === this.autoOpenMesaId)
          );

          if (pedidoMesa) {
            this.abrirDetalles(pedidoMesa);
            this.abrirModalCobrar();
          } else {
            alert('Esta mesa no tiene pedidos activos pendientes por cobrar en este momento.');
          }
          this.autoOpenMesaId = null; // Lo reiniciamos para que no se auto-abra en cada polling
        }

        if (!esPolling) {
          this.cargando = false;
        }
      },
      error: (err) => {
        console.error('Error al cargar los pedidos:', err);
        if (!esPolling) {
          this.cargando = false;
        }
      }
    });
  }

  aplicarFiltros(): void {
    this.pedidosFiltrados = this.pedidos.filter(p => {
      // Filtro por Estado
      const estadoPedido = (p.estado || '').toUpperCase();
      const coincideEstado = this.filtroEstado === 'TODOS' || estadoPedido === this.filtroEstado;

      // Filtro por Tipo de Pedido (Mesa, Llevar, Domicilio)
      const tipoPedido = (p.tipo_pedido || p.tipoPedido || '').toUpperCase();
      const coincideTipo = this.filtroTipo === 'TODOS' || tipoPedido.includes(this.filtroTipo);

      // Filtro por Fecha
      let coincideFecha = true;
      if (this.filtroFecha) {
        const fechaObjeto = new Date(p.fecha_hora || p.fechaHora);
        // Formateamos a YYYY-MM-DD usando la zona horaria local
        const anio = fechaObjeto.getFullYear();
        const mes = String(fechaObjeto.getMonth() + 1).padStart(2, '0');
        const dia = String(fechaObjeto.getDate()).padStart(2, '0');
        const strFechaPedido = `${anio}-${mes}-${dia}`;
        
        coincideFecha = strFechaPedido === this.filtroFecha;
      }

      return coincideEstado && coincideTipo && coincideFecha;
    });
  }

  limpiarFiltros(): void {
    this.filtroFecha = this.fechaHoy; 
    this.filtroEstado = 'TODOS';
    this.filtroTipo = 'TODOS';
    this.aplicarFiltros();
  }

  lanzarNotificacion(): void {
    this.mostrarNotificacion = true;
    this.reproducirSonido();
    
    // Ocultar la notificación flotante después de 5 segundos
    setTimeout(() => {
      this.mostrarNotificacion = false;
    }, 5000);
  }

  // Generamos un sonido "Ding" nativo usando la Web Audio API (Sin necesidad de mp3)
  reproducirSonido(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine'; // Sonido de tipo campana suave
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Frecuencia/Tono
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime); // Volumen
      oscillator.start();
      setTimeout(() => oscillator.stop(), 300); // Duración de 300ms
    } catch(e) {
      console.log('El navegador no permitió reproducir el sonido automáticamente', e);
    }
  }

  abrirDetalles(pedido: any): void {
    this.pedidoSeleccionado = pedido;
    
    // Calculamos el centro visual de la pantalla para evitar que el framework bloquee el "fixed"
    setTimeout(() => {
      const container = document.querySelector('.pedidos-wrap') as HTMLElement;
      if (container) {
        const rect = container.getBoundingClientRect();
        const viewportCenterY = window.innerHeight / 2;
        // Calculamos la distancia desde el top del contenedor hasta el centro de tu pantalla visual
        const positionY = viewportCenterY - rect.top;
        this.modalTop = `${positionY}px`;
      }
    }, 0);
  }

  cerrarDetalles(): void {
    this.pedidoSeleccionado = null;
  }

  cambiarEstado(pedido: any, nuevoEstado: string): void {
    const estadoAnterior = pedido.estado;
    pedido.estado = nuevoEstado;
    
    const id = pedido.idPedido || pedido.id_pedido;
    
    // Petición PUT para actualizar el pedido.
    // Nota: Asegúrate de que el backend soporte PUT en este endpoint (o ajústalo a tu API).
    this.http.put(`http://localhost:8080/api/pedidos/${id}`, pedido).subscribe({
      next: () => {
        console.log(`Estado del pedido #${id} actualizado a ${nuevoEstado}`);
      },
      error: (err) => {
        console.error('Error al actualizar el estado', err);
        pedido.estado = estadoAnterior; // Revertir visualmente si el server falla
        alert('No se pudo actualizar el estado en el servidor.');
      }
    });
  }

  // === LÓGICA DE COBRO Y FACTURACIÓN ===

  abrirModalCobrar(): void {
    this.showCobrarModal = true;
    this.metodoPago = 'EFECTIVO';
    this.montoRecibido = this.pedidoSeleccionado?.total || 0;
  }

  cerrarModalCobrar(): void {
    this.showCobrarModal = false;
  }

  get calcularCambio(): number {
    const total = this.pedidoSeleccionado?.total || 0;
    return this.montoRecibido > total ? this.montoRecibido - total : 0;
  }

  procesarPago(): void {
    const user = this.authService.getUser();
    const ID_USUARIO_VALIDO = user?.idUsuario || user?.id_usuario;

    if (!ID_USUARIO_VALIDO) {
      alert('Error: No se pudo identificar al cajero para emitir la factura.');
      return;
    }

    // 1. Consultamos si hay un turno de caja abierto dinámicamente
    this.http.get<any[]>('http://localhost:8080/api/cierres-caja').subscribe({
      next: (cierres) => {
        const turnoAbierto = cierres.find(c => c.estado === 'ABIERTA');
        
        if (!turnoAbierto) {
          alert('Error: No hay ningún turno de caja abierto. Ve a la sección "Facturación" y abre un nuevo turno antes de cobrar.');
          return;
        }

        const ID_TURNO_ACTIVO = turnoAbierto.id_cierre || turnoAbierto.idCierre;

        // 2. Armamos el JSON con el ID real del turno abierto
        const payloadFactura = {
          pedido: { idPedido: this.pedidoSeleccionado.id_pedido || this.pedidoSeleccionado.idPedido },
          usuario: { idUsuario: ID_USUARIO_VALIDO },
          cierreCaja: { idCierre: ID_TURNO_ACTIVO },
          metodoPago: this.metodoPago,
          subtotal: this.pedidoSeleccionado.total,
          total: this.pedidoSeleccionado.total
        };

        // 3. Registramos la factura
        this.http.post('http://localhost:8080/api/facturas', payloadFactura).subscribe({
          next: () => {
            this.cambiarEstado(this.pedidoSeleccionado, 'PAGADO');
            
            // Liberar la mesa automáticamente en la base de datos
            if (this.pedidoSeleccionado.mesa) {
              const mesaActualizada = { ...this.pedidoSeleccionado.mesa, estado: 'LIBRE' };
              const idMesa = mesaActualizada.idMesa || mesaActualizada.id_mesa;
              this.http.put(`http://localhost:8080/api/mesas/${idMesa}`, mesaActualizada).subscribe({
                next: () => console.log(`Mesa #${idMesa} liberada exitosamente.`),
                error: (err) => console.error(`Error al liberar la mesa #${idMesa}:`, err)
              });
            }

            this.showCobrarModal = false;
            setTimeout(() => window.print(), 500);
          },
          error: (err) => {
            console.error('Error al registrar la factura:', err);
            alert('Error: No se pudo generar la factura en base de datos.');
          }
        });
      },
      error: (err) => {
        console.error('Error al verificar turnos de caja:', err);
        alert('Error al verificar la caja. Asegúrate de tener conexión al servidor.');
      }
    });
  }
}
