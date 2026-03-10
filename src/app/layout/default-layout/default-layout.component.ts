import { RouterLink, RouterOutlet } from '@angular/router';
import { NgScrollbar } from 'ngx-scrollbar';
import { AuthService } from '../../services/auth.service';
import { INavData } from '@coreui/angular';
import { IconDirective } from '@coreui/icons-angular';
import { Component, OnInit } from '@angular/core';

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
    IconDirective,
    NgScrollbar,
    RouterOutlet,
    RouterLink,
    ShadowOnScrollDirective
  ]
})
export class DefaultLayoutComponent implements OnInit{
  public navItems = [...navItems];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    const user = this.authService.getUser(); // Recuperar el usuario desde localStorage
    const userType = user?.tipo || ''; // Obtener el tipo de usuario

    // Filtrar el menú según el tipo de usuario
    this.navItems = navItems.filter((item) => {
      // Si no tiene la propiedad `allowedFor`, mostrarlo para todos
      if (!item.allowedFor) {
        return true;
      }
      // Mostrar solo si el tipo de usuario está en `allowedFor`
      return item.allowedFor.includes(userType);
    });
  }
}
