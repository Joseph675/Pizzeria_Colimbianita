import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot,RouterStateSnapshot,Router } from '@angular/router';
import { AuthService } from './services/auth.service'; // Asegúrate de que la ruta sea correcta

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // Verificar si el usuario está autenticado
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']); // Redirigir al login si no está autenticado
      return false;
    }

    // Obtener el usuario y su tipo desde el AuthService
    const user = this.authService.getUser();
    const userType = user?.tipo || ''; // Obtener el tipo de usuario

    // Verificar si la ruta tiene roles permitidos
    const allowedRoles = route.data['allowedRoles'] as string[];
    if (allowedRoles && !allowedRoles.includes(userType)) {
      this.router.navigate(['/unauthorized']); // Redirigir si no tiene permiso
      return false;
    }

    return true; // Permitir acceso si pasa todas las verificaciones
  }
}