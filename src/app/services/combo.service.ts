import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ItemCombo {
  idPresentacion: number;
  cantidad: number;
}

export interface ComboPayload {
  nombre: string;
  descripcion: string;
  precioFijo: number;
  fechaInicio?: string;
  fechaFin?: string;
  diasAplica: string;
  items: ItemCombo[];
}

// Interfaces para la Generación Masiva
export interface ComboMasivoRequestDto {
  nombreBase: string;
  descripcion: string;
  precioFijo: number;
  fechaInicio?: string | null;
  fechaFin?: string | null;
  diasAplica: string;
  idPresentacionesVariables: number[];
  itemsFijos: ItemCombo[]; // Reutilizamos ItemCombo ya que tiene idPresentacion y cantidad
}

@Injectable({
  providedIn: 'root'
})
export class ComboService {

  constructor(private http: HttpClient) { }

  crearComboCompleto(payload: ComboPayload): Observable<any> {
    // Apunta al endpoint expuesto en tu controlador Spring Boot
    return this.http.post(`${environment.apiUrl}/api/combos/crear-completo`, payload);
  }

  generarCombosMasivos(payload: ComboMasivoRequestDto): Observable<any> {
    return this.http.post('http://localhost:8080/api/combos/generar-masivo', payload);
  }
}