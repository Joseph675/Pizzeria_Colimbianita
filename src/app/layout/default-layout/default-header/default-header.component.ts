import { NgTemplateOutlet, NgIf, NgFor } from '@angular/common';
import { Component, computed, inject, input, OnInit, OnDestroy, HostListener, ElementRef, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { AuthService } from '../../../services/auth.service';

import {
  AvatarComponent,
  BadgeComponent,
  BreadcrumbRouterComponent,
  ColorModeService,
  ContainerComponent,
  DropdownComponent,
  DropdownDividerDirective,
  DropdownHeaderDirective,
  DropdownItemDirective,
  DropdownMenuDirective,
  DropdownToggleDirective,
  HeaderComponent,
  HeaderNavComponent,
  HeaderTogglerDirective,
  NavItemComponent,
  NavLinkDirective,
  SidebarToggleDirective
} from '@coreui/angular';

import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-default-header',
  templateUrl: './default-header.component.html',
  styleUrl: './default-header.component.scss',
  imports: [ContainerComponent, HeaderTogglerDirective, SidebarToggleDirective, IconDirective, HeaderNavComponent, NavItemComponent, NavLinkDirective, RouterLink, RouterLinkActive, NgTemplateOutlet, BreadcrumbRouterComponent, DropdownComponent, DropdownToggleDirective, AvatarComponent, DropdownMenuDirective, DropdownHeaderDirective, DropdownItemDirective, BadgeComponent, DropdownDividerDirective, NgIf, NgFor]
})
export class DefaultHeaderComponent extends HeaderComponent implements OnInit, OnDestroy {
  userName: string = '';
  userRol: string = '';

  // Variables para la campanita
  alertasNoLeidas: any[] = [];
  showNotifications = false;
  private pollingSubscription?: Subscription;

  readonly #colorModeService = inject(ColorModeService);
  readonly colorMode = this.#colorModeService.colorMode;

  readonly colorModes = [
    { name: 'light', text: 'Light', icon: 'cilSun' },
    { name: 'dark', text: 'Dark', icon: 'cilMoon' },
    { name: 'auto', text: 'Auto', icon: 'cilContrast' }
  ];

  readonly icons = computed(() => {
    const currentMode = this.colorMode();
    return this.colorModes.find(mode => mode.name === currentMode)?.icon ?? 'cilSun';
  });

  constructor(
    private authService: AuthService, 
    private router: Router,
    private http: HttpClient,
    private eRef: ElementRef,
    private cdr: ChangeDetectorRef
  ) {
    super();
  }

  ngOnInit(): void {
    const user = this.authService.getUser(); // Recuperar el usuario desde localStorage
    console.log('Usuario recuperado:', user);

    this.userName = user.nombres || 'Usuario'; // Asignar el nombre del usuario o un valor predeterminado
    this.userRol = user?.rol?.nombre || 'Rol predeterminado'; // Asignar el rol del usuario o un valor predeterminado

    console.log('Nombre del usuario:', this.userName);
    console.log('Rol del usuario:', this.userRol);

    this.iniciarPollingAlertas();
  }

  sidebarId = input('sidebar1');

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  ngOnDestroy() {
    // Al destruir el componente, evitamos fugas de memoria
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  // --- POLLING: Consulta a Spring Boot cada 15 segundos ---
  iniciarPollingAlertas() {
    this.pollingSubscription = timer(0, 15000).pipe(
      // switchMap cancela la petición anterior si hay un retraso en la red
      switchMap(() => this.http.get<any[]>('http://178.105.36.117:8080/api/alertas/no-leidas'))
    ).subscribe({
      next: (alertas) => {
        this.alertasNoLeidas = alertas || [];
        this.cdr.detectChanges(); // <-- Fuerza a Angular a repintar el globito rojo
      },
      error: (err) => console.error('Error cargando alertas:', err)
    });
  }

  toggleNotifications() {
    this.showNotifications = !this.showNotifications;
  }

  marcarComoLeidas() {
    this.http.put('http://178.105.36.117:8080/api/alertas/marcar-leidas', {}).subscribe({
      next: () => {
        this.alertasNoLeidas = []; // Limpiamos la campanita localmente
        this.showNotifications = false; // Cerramos el panel
        this.cdr.detectChanges(); // <-- Fuerza a Angular a ocultar el globito y cerrar panel
      },
      error: (err) => console.error('Error al marcar como leídas:', err)
    });
  }

  // Cierra el panel si el usuario hace clic en cualquier otro lado
  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.showNotifications = false;
    }
  }
}
