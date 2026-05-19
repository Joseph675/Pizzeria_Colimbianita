import { RouterLink, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { AuthService } from '../../services/auth.service';
import { INavData } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import {
  ContainerComponent,
  ShadowOnScrollDirective,
  SidebarBrandComponent,
  SidebarComponent,
  SidebarFooterComponent,
  SidebarHeaderComponent,
  SidebarNavComponent,
  SidebarToggleDirective,
  SidebarTogglerDirective
} from '@coreui/angular';

import { DefaultFooterComponent, DefaultHeaderComponent } from './';
import { CustomSidebarNavComponent } from './custom-sidebar-nav.component';
import { navItems } from './_nav';

function isOverflown(element: HTMLElement) {
  return (
    element.scrollHeight > element.clientHeight ||
    element.scrollWidth > element.clientWidth
  );
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './default-layout.component.html',
  styleUrls: ['./default-layout.component.scss'],
  imports: [

    SidebarComponent,
    SidebarHeaderComponent,
    SidebarBrandComponent,
    SidebarNavComponent,
    SidebarFooterComponent,
    SidebarToggleDirective,
    SidebarTogglerDirective,
    ContainerComponent,
    DefaultFooterComponent,
    DefaultHeaderComponent,
    CustomSidebarNavComponent,
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayoutComponent implements OnInit, OnDestroy {
  public navItems = [...navItems];
  public sidebarOpen = false;
  public isMobile = window.innerWidth <= 900;
  private routerSub?: Subscription;

  @HostListener('window:resize')
  onResize() {
    this.isMobile = window.innerWidth <= 900;
    if (!this.isMobile) this.sidebarOpen = false;
  }

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    const user = this.authService.getUser(); // Recuperar el usuario desde localStorage
    const userType = user?.rol?.nombre || ''; // Obtener el nombre del rol (ej. 'Admin')

    // Filtrar el menú según el tipo de usuario
    this.navItems = navItems.filter((item) => {
      if (!item.allowedFor) return true;
      return item.allowedFor.includes(userType);
    });

    // Cierra el sidebar al navegar (útil en móvil)
    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => this.closeSidebar());
  }

  ngOnDestroy(): void {
    this.routerSub?.unsubscribe();
  }

  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  closeSidebar(): void {
    this.sidebarOpen = false;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
