import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Subscription, interval } from 'rxjs';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.component.html',
  styleUrls: ['dashboard.component.scss'],
  imports: [CommonModule],
  standalone: true
})
export class DashboardComponent implements OnInit, OnDestroy {

  public cargando: boolean = true;
  public fechaActual = new Date();
  public usuarioNombre = 'Admin'; 
  private autoRefreshSub?: Subscription;

  // Variables para almacenar la respuesta de los Endpoints
  public ventasDia: any = {};
  public mesas: any[] = [];
  public mesasOcupadas: number = 0;
  public mesasLibres: number = 0;
  public pedidosActivos: any[] = [];
  public topProductos: any[] = [];
  public alertasInventario: any[] = [];
  public cajaActiva: any = {};
  public clientesRanking: any[] = [];

  constructor(private http: HttpClient, private authService: AuthService) {
  }

  ngOnInit(): void {
    const user = this.authService.getUser(); 
    this.usuarioNombre = user.nombres || 'Admin';
    this.cargarDatosDashboard();
    
    // Refrescar automáticamente cada 30 segundos
    this.autoRefreshSub = interval(30000).subscribe(() => this.cargarDatosDashboard(true));
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSub) {
      this.autoRefreshSub.unsubscribe();
    }
  }

  cargarDatosDashboard(silencioso = false): void {
    if (!silencioso) this.cargando = true;
    
    const baseUrl = 'http://212.56.33.183:8080/api/dashboard';
    const idSucursal = 1; // Ajustar dinámicamente si tienes múltiples sucursales

    // Disparamos todas las peticiones a Spring Boot en paralelo
    Promise.all([
      this.http.get<any>(`${baseUrl}/ventas-dia?idSucursal=${idSucursal}`).toPromise().catch(() => ({})),
      this.http.get<any[]>(`${baseUrl}/mesas?idSucursal=${idSucursal}`).toPromise().catch(() => []),
      this.http.get<any[]>(`${baseUrl}/pedidos-activos?idSucursal=${idSucursal}`).toPromise().catch(() => []),
      this.http.get<any[]>(`${baseUrl}/top-productos?idSucursal=${idSucursal}`).toPromise().catch(() => []),
      this.http.get<any[]>(`${baseUrl}/alertas-inventario?idSucursal=${idSucursal}`).toPromise().catch(() => []),
      this.http.get<any>(`${baseUrl}/caja-activa?idSucursal=${idSucursal}`).toPromise().catch(() => ({})),
      this.http.get<any[]>(`${baseUrl}/clientes-ranking?idSucursal=${idSucursal}`).toPromise().catch(() => [])
    ]).then(([ventas, mesas, pedidos, top, alertas, caja, clientes]) => {
      // Extraemos el primer objeto del arreglo
      this.ventasDia = (ventas && ventas.length > 0) ? ventas[0] : {};
      this.mesas = mesas || [];
      this.pedidosActivos = pedidos || [];
      this.topProductos = top || [];
      this.alertasInventario = (alertas || []).filter((a: any) => a.nivelAlerta !== 'OK');
      this.cajaActiva = (caja && caja.length > 0) ? caja[0] : {};
      this.clientesRanking = clientes || [];
      
      this.mesasOcupadas = this.mesas.filter(m => (m.estado || '').toUpperCase() !== 'LIBRE').length;
      this.mesasLibres = this.mesas.filter(m => (m.estado || '').toUpperCase() === 'LIBRE').length;

      this.cargando = false;
    });
  }

  // Utilidades para el HTML
  getInitials(nombre: string): string {
    if (!nombre) return 'CL';
    const parts = nombre.trim().split(' ');
    return parts.length >= 2 ? (parts[0][0] + parts[1][0]).toUpperCase() : nombre.substring(0, 2).toUpperCase();
  }

  getPorcentajeStock(actual: number, maximo: number): number {
    if (!maximo || maximo === 0) return 100;
    return Math.min(100, Math.round((actual / maximo) * 100));
  }
}
