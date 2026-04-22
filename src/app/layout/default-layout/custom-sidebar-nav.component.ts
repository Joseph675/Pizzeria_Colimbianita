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
    <div class="custom-nav-container">
      @for (item of navItems; track item.url || item.name) {
        @if (item.title) {
          <div class="side-label" [style.marginTop]="$index > 0 ? '1.5rem' : '0'">{{ item.name }}</div>
        } @else {
          <a [routerLink]="item.url" routerLinkActive="active" class="side-link">
            @if (item.materialIcon) {
              <mat-icon class="side-icon">{{ item.materialIcon }}</mat-icon>
            } @else if (item.iconComponent) {
              <svg cIcon [name]="item.iconComponent.name" class="side-icon"></svg>
            } @else {
              <span class="nav-icon-fallback"></span>
            }
            {{ item.name }}
          </a>
          
          @if (item.children && item.children.length > 0) {
            <div class="side-children">
              @for (child of item.children; track child.url) {
                <a [routerLink]="child.url" routerLinkActive="active" class="side-link child-link">
                  <span class="child-bullet"></span>
                  {{ child.name }}
                </a>
              }
            </div>
          }
        }
      }
    </div>
  `,
  styles: [`
    .custom-nav-container {
      display: flex;
      flex-direction: column;
    }
    .side-icon {
      width: 18px;
      height: 18px;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.7;
      transition: opacity 0.18s;
    }
    .side-link:hover .side-icon, .side-link.active .side-icon {
      opacity: 1;
    }
    .nav-icon-fallback {
      width: 18px;
      height: 18px;
    }
    .side-children {
      display: flex;
      flex-direction: column;
      background: rgba(0,0,0,0.15);
      border-radius: 0.4rem;
      margin: 0.3rem 0.6rem;
      overflow: hidden;
    }
    .child-link {
      padding-left: 2.8rem !important;
      font-size: 0.76rem !important;
      padding-top: 0.45rem !important;
      padding-bottom: 0.45rem !important;
    }
    .child-bullet {
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background-color: currentColor;
      opacity: 0.4;
      margin-right: 0.5rem;
    }
  `]
})
export class CustomSidebarNavComponent {
  @Input() navItems: CustomNavData[] = [];
}
