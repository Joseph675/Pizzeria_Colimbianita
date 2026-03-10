import { Component, Input } from '@angular/core';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { CustomNavData } from './CustomNavData';
import { IconDirective } from '@coreui/icons-angular';

@Component({
  selector: 'app-custom-sidebar-nav',
  standalone: true,
  imports: [NgForOf, NgIf, RouterLink, RouterLinkActive, MatIcon, IconDirective],
  template: `
    <ul class="sidebar-nav">
      @for (item of navItems; track item.url) {
        <!-- section title -->
        @if (item.title) {
          <li class="nav-section">
            <span class="nav-section-text">{{ item.name }}</span>
          </li>
        }
        @else {
          <li class="nav-item">
            <a 
              [routerLink]="item.url"
              routerLinkActive="active"
              class="nav-link"
            >
              <!-- Material Icon -->
              @if (item.materialIcon) {
                <mat-icon class="nav-icon">{{ item.materialIcon }}</mat-icon>
              }
              <!-- CoreUI Icon -->
              @else if (item.iconComponent) {
                <svg cIcon [name]="item.iconComponent.name" class="nav-icon" />
              }
              <span class="nav-text">{{ item.name }}</span>
            </a>
            
            <!-- Subitems -->
            @if (item.children && item.children.length > 0) {
              <ul class="sidebar-nav-sub">
                @for (child of item.children; track child.url) {
                  <li class="nav-item">
                    <a 
                      [routerLink]="child.url"
                      routerLinkActive="active"
                      class="nav-link"
                    >
                      <span class="nav-icon nav-icon-bullet"></span>
                      <span class="nav-text">{{ child.name }}</span>
                    </a>
                  </li>
                }
              </ul>
            }
          </li>
        }
      }
    </ul>
  `,
  styles: [`
    :host ::ng-deep {
      .sidebar-nav {
        list-style: none;
        padding: 0;
        margin: 0;
      }
      
      .nav-section {
        padding: 0.75rem 1rem 0.25rem;
      }
      .nav-section-text {
        font-size: 0.75rem;
        font-weight: 600;
        text-transform: uppercase;
        color: rgba(255,255,255,0.6);
      }
      
      .nav-item {
        position: relative;
      }
      
      .nav-link {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.75rem 1rem;
        color: inherit;
        text-decoration: none;
        transition: all 0.2s ease;
        
        &.active {
          background-color: rgba(255, 255, 255, 0.15);
          font-weight: 500;
          border-left: 3px solid currentColor;
        }
        
        &:hover:not(.active) {
          background-color: rgba(255, 255, 255, 0.08);
        }
      }
      
      .nav-icon {
        width: 20px;
        height: 20px;
        min-width: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        
        &.nav-icon-bullet {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background-color: currentColor;
          opacity: 0.5;
        }
      }
      
      .nav-text {
        flex: 1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      
      .sidebar-nav-sub {
        list-style: none;
        padding: 0;
        margin: 0;
        background-color: rgba(0, 0, 0, 0.1);
        
        .nav-link {
          padding-left: 3.5rem;
          font-size: 0.875rem;
          
          &.active {
            background-color: rgba(255, 255, 255, 0.1);
          }
        }
      }
    }
  `]
})
export class CustomSidebarNavComponent {
  @Input() navItems: CustomNavData[] = [];
}
