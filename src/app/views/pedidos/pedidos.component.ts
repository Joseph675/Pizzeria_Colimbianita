import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';

@Component({
  selector: 'app-pedidos',
  standalone: true,
  imports: [NgIf, NgForOf, NgClass, DatePipe, CurrencyPipe, FormsModule],
  templateUrl: './pedidos.component.html',
  styleUrl: './pedidos.component.scss'
})
export class PedidosComponent implements OnInit, OnDestroy {
  public pedidos: any[] = [];
  public cargando: boolean = false;
  public pedidoSeleccionado: any = null;
  private pollingSubscription?: Subscription;
  private ultimoIdPedido: number = 0;
  public mostrarNotificacion: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
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
}
