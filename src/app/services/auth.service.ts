import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/auth'; // URL del endpoint de autenticación

  constructor(private http: HttpClient) {}

  // Método para iniciar sesión
  login(email: string, password: string): Observable<{ token: string; user: any }> {
    return this.http.post<{ token: string; user: any }>(this.apiUrl, { email, password });
  }

  // Método para guardar el token en localStorage
  saveToken(token: string): void {
    localStorage.setItem('token', token);
  }

  // Método para obtener el token desde localStorage
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  // Método para eliminar el token (logout)
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  // Método para verificar si el usuario está autenticado
  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token; // Retorna true si el token existe, false si no
  }

  // Método para guardar la información del usuario en localStorage
saveUser(user: any): void {
  localStorage.setItem('user', JSON.stringify(user));
}

// Método para obtener la información del usuario desde localStorage
getUser(): any {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Método para eliminar la información del usuario (logout)
clearUser(): void {
  localStorage.removeItem('user');
}
}