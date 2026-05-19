import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ComboService, ComboPayload } from './combo.service';

@Component({
  selector: 'app-crear-combo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-combo.component.html',
  styleUrls: ['./crear-combo.component.scss']
})
export class CrearComboComponent implements OnInit {
  comboForm!: FormGroup;
  presentacionesDisponibles: any[] = [];

  constructor(
    private fb: FormBuilder,
    private comboService: ComboService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.cargarPresentaciones();
  }

  initForm(): void {
    this.comboForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: [''],
      precioFijo: [null, [Validators.required, Validators.min(1)]],
      fechaInicio: [null],
      fechaFin: [null],
      diasAplica: ['TODOS', Validators.required],
      items: this.fb.array([], Validators.required)
    });
  }

  // Getter rápido para acceder al FormArray en el HTML
  get items(): FormArray {
    return this.comboForm.get('items') as FormArray;
  }

  agregarProducto(): void {
    const itemForm = this.fb.group({
      idPresentacion: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.items.push(itemForm);
  }

  removerProducto(index: number): void {
    this.items.removeAt(index);
  }

  cargarPresentaciones(): void {
    // Cargar las presentaciones reales desde tu API
    this.http.get<any[]>('http://212.56.33.183:8080/api/presentaciones').subscribe({
      next: (data) => this.presentacionesDisponibles = data || [],
      error: (err) => console.error('Error cargando presentaciones:', err)
    });
  }

  guardarPromocion(): void {
    if (this.comboForm.invalid || this.items.length === 0) {
      this.comboForm.markAllAsTouched();
      return;
    }

    const payload: ComboPayload = this.comboForm.value;

    this.comboService.crearComboCompleto(payload).subscribe({
      next: (res) => {
        alert('¡Combo creado con éxito!');
        this.comboForm.reset({ diasAplica: 'TODOS' });
        this.items.clear();
      },
      error: (err) => alert('Ocurrió un error al guardar el combo.')
    });
  }
}