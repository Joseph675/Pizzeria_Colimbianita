import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Subscription, interval } from 'rxjs';

interface PedidoItem {
  e: string;
  n: string;
  q: string;
  p: string;
  s: 'done' | 'prep' | 'pend';
}

interface Pedido {
  id: number;
  num: string;
  estado: 'nuevo' | 'en-preparacion' | 'listo' | 'entregado' | 'cancelado' | 'urgente';
  zona: string;
  timer: string;
  canal: 'mesa' | 'delivery' | 'mostrador' | 'telefono';
  canalLabel: string;
  cliente: string;
  avatar: string;
  avatarBg: string;
  csub: string;
  steps: string[];
  stepActivo: number;
  items: PedidoItem[];
  nota: string | null;
  sub: string;
  desc: string;
  total: string;
}

@Component({
  selector: 'app-cocina',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cocina.component.html',
  styleUrl: './cocina.component.scss'
})
export class CocinaComponent implements OnInit, OnDestroy {
  pedidos: Pedido[] = [];
  filtro: string = 'todos';
  pedidoSeleccionado: Pedido | null = null;

  public cargando: boolean = false;
  public mostrarNotificacion: boolean = false;
  private pollingSubscription?: Subscription;
  private ultimoIdPedido: number = 0;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarPedidos();

    // Consultar nuevos pedidos automáticamente cada 10 segundos
    this.pollingSubscription = interval(10000).subscribe(() => {
      this.cargarPedidos(true); // Petición silenciosa
    });
  }

  ngOnDestroy() {
    // Limpiar el temporizador al salir
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  filtrar(estado: string) {
    this.filtro = estado;
    this.pedidoSeleccionado = null; // Cierra el detalle al cambiar de pestaña
  }

  get pedidosFiltrados() {
    if (this.filtro === 'todos') {
      return this.pedidos;
    }
    return this.pedidos.filter(p => p.estado === this.filtro || (this.filtro === 'en-preparacion' && p.estado === 'urgente'));
  }

  countByEstado(estado: string): number {
    if (estado === 'en-preparacion') {
      return this.pedidos.filter(p => p.estado === 'en-preparacion' || p.estado === 'urgente').length;
    }
    return this.pedidos.filter(p => p.estado === estado).length;
  }

  abrirDetalle(pedido: Pedido) {
    this.pedidoSeleccionado = pedido;
  }

  cerrarDetalle() {
    this.pedidoSeleccionado = null;
  }

  // Helpers de UI para iconos y estados
  getCanalIcon(canal: string): string {
    switch (canal) {
      case 'mesa': return '🍽';
      case 'delivery': return '🛵';
      case 'mostrador': return '🏪';
      case 'telefono': return '📞';
      default: return '🍽';
    }
  }

  getBadgeLabel(estado: string): string {
    switch (estado) {
      case 'nuevo': return 'Nuevo';
      case 'en-preparacion': return 'En preparación';
      case 'listo': return '✓ Listo';
      case 'entregado': return 'Entregado';
      case 'cancelado': return 'Cancelado';
      case 'urgente': return '⚠ Urgente';
      default: return estado;
    }
  }

  getTimerFill(estado: string): string {
    switch (estado) {
      case 'nuevo': return '5%';
      case 'en-preparacion': return '60%';
      case 'listo': return '100%';
      case 'urgente': return '100%';
      default: return '0%';
    }
  }

  getTimerLabel(estado: string): string {
    switch (estado) {
      case 'nuevo': return 'nuevo';
      case 'en-preparacion': return 'preparando';
      case 'listo': return 'listo';
      case 'urgente': return 'urgente';
      case 'entregado': return 'total';
      case 'cancelado': return 'cancelado';
      default: return '';
    }
  }

  cargarPedidos(esPolling: boolean = false): void {
    if (!esPolling) this.cargando = true;

    this.http.get<any[]>('http://localhost:8080/api/pedidos').subscribe({
      next: (data) => {
        const pedidosRecibidos = data || [];
        
        if (pedidosRecibidos.length > 0) {
          const maxIdActual = Math.max(...pedidosRecibidos.map(p => p.idPedido || p.id_pedido || 0));
          if (this.ultimoIdPedido > 0 && maxIdActual > this.ultimoIdPedido) {
            this.lanzarNotificacion();
          }
          this.ultimoIdPedido = maxIdActual;
        }

        // Formatear desde el backend a los campos estéticos que espera la vista
        this.pedidos = pedidosRecibidos
          .map(p => this.mapearPedidoVisual(p))
          .sort((a, b) => b.id - a.id);

        // Mantener actualizado el pedido que el usuario tenga abierto
        if (this.pedidoSeleccionado) {
          this.pedidoSeleccionado = this.pedidos.find(p => p.id === this.pedidoSeleccionado!.id) || null;
        }

        if (!esPolling) this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar los pedidos en la cocina:', err);
        if (!esPolling) this.cargando = false;
      }
    });
  }

  // Adapta un pedido crudo del backend al formato impecable del mockup
  private mapearPedidoVisual(p: any): Pedido {
    let estadoDB = p.estado?.toLowerCase() || 'nuevo';
    let estadoUI: any = 'nuevo';
    if (estadoDB === 'pendiente') estadoUI = 'nuevo';
    else if (estadoDB === 'preparando' || estadoDB === 'en preparación') estadoUI = 'en-preparacion';
    else if (estadoDB === 'listo' || estadoDB === 'entregado' || estadoDB === 'cancelado' || estadoDB === 'urgente') estadoUI = estadoDB;
    else estadoUI = estadoDB; // Fallback

    let canalUI: any = p.tipoPedido?.toLowerCase() || p.tipo_pedido?.toLowerCase() || 'mesa';
    if (canalUI.includes('domicilio') || canalUI.includes('delivery')) canalUI = 'delivery';
    if (canalUI.includes('llevar') || canalUI.includes('mostrador')) canalUI = 'mostrador';
    if (canalUI.includes('telefono')) canalUI = 'telefono';

    // Extrayendo items
    let itemsUI: PedidoItem[] = [];
    if (p.detalles && Array.isArray(p.detalles)) {
      itemsUI = p.detalles.map((d: any) => ({
        e: '🍽',
        n: d.presentacion?.producto?.nombre 
            ? `${d.presentacion.producto.nombre} ${d.presentacion.nombre_presentacion || d.presentacion.nombrePresentacion || ''}`.trim()
            : 'Producto Desconocido',
        q: `×${d.fraccion || 1}`,
        p: `$${d.precio_cobrado || d.precioCobrado || 0}`,
        s: estadoUI === 'nuevo' ? 'pend' : (estadoUI === 'listo' || estadoUI === 'entregado' ? 'done' : 'prep')
      }));
    }

    const numMesa = p.mesa?.numero_mesa || p.mesa?.numeroMesa || p.id_mesa || p.idMesa;
    const clienteNombre = p.cliente?.nombre || p.nombreCliente || (numMesa ? `Mesa ${numMesa}` : 'Mostrador');
    const iniciales = clienteNombre.substring(0, 2).toUpperCase();
    const isDel = canalUI === 'delivery';
    const totalVal = p.total || 0;

    return {
      id: p.idPedido || p.id_pedido || p.id || 0,
      num: `#${(p.idPedido || p.id_pedido || p.id || 0).toString().padStart(3, '0')}`,
      estado: estadoUI,
      zona: numMesa ? `Mesa ${numMesa}` : (isDel ? 'Domicilio' : 'Para llevar'),
      timer: this.calcularTiempoTranscurrido(p.fecha_hora || p.fechaHora || p.fecha || p.fechaCreacion),
      canal: canalUI,
      canalLabel: canalUI.charAt(0).toUpperCase() + canalUI.slice(1),
      cliente: clienteNombre,
      avatar: iniciales,
      avatarBg: this.generarColorAvatar(iniciales),
      csub: p.notas || p.observaciones || (isDel ? 'Dirección por definir' : 'Sin observaciones extra'),
      steps: isDel ? ['Recibido', 'Confirmado', 'En cocina', 'En camino', 'Entregado'] : ['Recibido', 'Confirmado', 'En cocina', 'Listo', 'Entregado'],
      stepActivo: estadoUI === 'nuevo' ? 0 : estadoUI === 'en-preparacion' ? 2 : estadoUI === 'listo' ? 3 : estadoUI === 'entregado' ? 4 : -1,
      items: itemsUI.length > 0 ? itemsUI : [{ e: '🛒', n: 'Sin items registrados', q: '-', p: `$${totalVal}`, s: 'pend' }],
      nota: p.notas || null,
      sub: `$${totalVal}`,
      desc: '$0',
      total: `$${totalVal}`,
      _originalBackendObj: p // Referencia para enviar por PUT al cambiar estado
    } as Pedido & { _originalBackendObj: any };
  }

  cambiarEstado(pedido: Pedido, nuevoEstadoVisual: string): void {
    // Convertir de formato visual a lo que acepta el backend (ej: 'en-preparacion' -> 'PREPARANDO')
    let nuevoEstadoDB = nuevoEstadoVisual;
    if (nuevoEstadoVisual === 'en-preparacion') nuevoEstadoDB = 'PREPARANDO';
    else if (nuevoEstadoVisual === 'nuevo') nuevoEstadoDB = 'PENDIENTE';
    else nuevoEstadoDB = nuevoEstadoVisual.toUpperCase();

    const originalData = (pedido as any)._originalBackendObj;
    const payload = { ...originalData, estado: nuevoEstadoDB };
    
    // Actualización visual anticipada (optimistic UI)
    const estadoAnterior = pedido.estado;
    pedido.estado = nuevoEstadoVisual as any;
    if (this.pedidoSeleccionado && this.pedidoSeleccionado.id === pedido.id) {
      this.pedidoSeleccionado.estado = nuevoEstadoVisual as any;
    }

    this.http.put(`http://localhost:8080/api/pedidos/${pedido.id}`, payload).subscribe({
      next: () => {
        this.cargarPedidos(true); // Se refresca en segundo plano para estar en sintonía
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        pedido.estado = estadoAnterior; // Revertir a la normalidad en caso de error
        if (this.pedidoSeleccionado && this.pedidoSeleccionado.id === pedido.id) {
          this.pedidoSeleccionado.estado = estadoAnterior;
        }
        alert('No se pudo actualizar el estado en la base de datos.');
      }
    });
  }

  lanzarNotificacion(): void {
    this.mostrarNotificacion = true;
    this.reproducirSonido();
    setTimeout(() => { this.mostrarNotificacion = false; }, 5000);
  }

  reproducirSonido(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
      oscillator.start();
      setTimeout(() => oscillator.stop(), 300);
    } catch(e) { }
  }

  private calcularTiempoTranscurrido(fechaIso: string | undefined): string {
    if (!fechaIso) return '0 min';
    const ms = new Date().getTime() - new Date(fechaIso).getTime();
    const min = Math.floor(ms / 60000);
    return min < 1 ? 'Recién' : min > 120 ? '+2 hrs' : `${min} min`;
  }

  private generarColorAvatar(txt: string): string {
    const colors = [
      'linear-gradient(135deg, #1a6b3a, #27ae60)', 'linear-gradient(135deg, #1a3a6b, #2a6bc0)',
      'linear-gradient(135deg, #6b1a1a, #c02a2a)', 'linear-gradient(135deg, #6b3a1a, #c0892a)',
      'linear-gradient(135deg, #4a1a6b, #8b2ac0)'
    ];
    let sum = 0;
    for (let i = 0; i < txt.length; i++) sum += txt.charCodeAt(i);
    return colors[sum % colors.length];
  }
}
