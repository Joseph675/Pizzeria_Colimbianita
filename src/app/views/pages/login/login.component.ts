import { Component } from '@angular/core';
import { NgStyle, CommonModule } from '@angular/common';
import { IconDirective } from '@coreui/icons-angular';
import { Router } from '@angular/router'; // Importar Router
import { AuthService } from '../../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, FormControlDirective, ButtonDirective, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent, ButtonCloseDirective } from '@coreui/angular';

@Component({
    selector: 'app-login',
    templateUrl: './login.component.html',
    styleUrls: ['./login.component.scss'],
    imports: [CommonModule, FormsModule, ContainerComponent, RowComponent, ColComponent, CardGroupComponent, TextColorDirective, CardComponent, CardBodyComponent, FormDirective, InputGroupComponent, InputGroupTextDirective, IconDirective, FormControlDirective, ButtonDirective, NgStyle, ToastBodyComponent, ToastComponent, ToasterComponent, ToastHeaderComponent, ButtonCloseDirective]
})
export class LoginComponent {
  email: string = '';
  password: string = '';

  // Variables para Toasts de CoreUI
  public position = 'top-end';
  public toasts: { id: number; message: string; type: 'success' | 'danger' | 'warning' | 'info' }[] = [];
  private nextToastId = 0;

  constructor(private authService: AuthService, private router: Router) {} // Inyectar Router

  addToast(message: string, type: 'success' | 'danger' | 'warning' | 'info' = 'success', duration = 3500) {
    const id = this.nextToastId++;
    this.toasts.push({ id, message, type });
    setTimeout(() => this.removeToast(id), duration);
  }

  removeToast(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  login(): void {
    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        // Guardar el token y la información del usuario
        this.authService.saveToken(response.token);
        this.authService.saveUser(response.user);
  
        console.log('Inicio de sesión exitoso. Usuario guardado:', response.user);
  
        // Redirigir al usuario al dashboard
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        console.error('Error al iniciar sesión:', err);
        // Capturar correctamente el mensaje dependiendo de si el backend manda un texto o un JSON
        const errorMessage = typeof err.error === 'string' ? err.error : (err.error?.message || err.error?.error || 'Credenciales incorrectas. Por favor, inténtalo de nuevo.');
        this.addToast(errorMessage, 'danger');
      }
    });
  }
}
