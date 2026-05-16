import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { ComboService, ComboMasivoRequestDto } from './combo.service';

@Component({
  selector: 'app-generar-masivo',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './generar-masivo.component.html',
  styleUrls: ['./generar-masivo.component.scss']
})
export class GenerarMasivoComponent implements OnInit {
  formMasivo!: FormGroup;
  isLoading = false;

  // Simulación de datos que normalmente traerías de tu API (ej. /api/presentaciones)
  pizzasSimuladas = [
    { id: 10, nombre: 'Pizza Hawaiana Mediana' },
    { id: 11, nombre: 'Pizza Mexicana Mediana' },
    { id: 12, nombre: 'Pizza Carnes Mediana' },
    { id: 13, nombre: 'Pizza Pollo Champiñones Mediana' }
  ];

  productosFijosSimulados = [
    { id: 5, nombre: 'Gaseosa 1Lt' },
    { id: 6, nombre: 'Gaseosa 1.5Lt' },
    { id: 7, nombre: 'Porción Pan de Ajo' }
  ];

  constructor(private fb: FormBuilder, private comboService: ComboService) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.formMasivo = this.fb.group({
      nombreBase: ['Combo {sabor} + Gaseosa 1Lt', Validators.required],
      descripcion: ['Disfruta de la mejor pizza con tu bebida'],
      precioFijo: [35000, [Validators.required, Validators.min(1)]],
      fechaInicio: [null],
      fechaFin: [null],
      diasAplica: ['LUN,MAR,MIE,JUE,VIE,SAB,DOM', Validators.required],
      idPresentacionesVariables: this.fb.array([], Validators.required),
      itemsFijos: this.fb.array([], Validators.required)
    });
  }

  // Getters para acceso rápido a los FormArrays
  get idPresentacionesVariables(): FormArray {
    return this.formMasivo.get('idPresentacionesVariables') as FormArray;
  }

  get itemsFijos(): FormArray {
    return this.formMasivo.get('itemsFijos') as FormArray;
  }

  // Manejador de eventos para los checkboxes de las pizzas
  onCheckboxChange(e: any): void {
    const idSeleccionado = parseInt(e.target.value, 10);
    
    if (e.target.checked) {
      this.idPresentacionesVariables.push(new FormControl(idSeleccionado));
    } else {
      let i: number = 0;
      this.idPresentacionesVariables.controls.forEach((item: any) => {
        if (item.value === idSeleccionado) {
          this.idPresentacionesVariables.removeAt(i);
          return;
        }
        i++;
      });
    }
  }

  // Métodos para manejar los productos fijos dinámicos (Gaseosas, etc)
  agregarItemFijo(): void {
    const itemFijoForm = this.fb.group({
      idPresentacion: ['', Validators.required],
      cantidad: [1, [Validators.required, Validators.min(1)]]
    });
    this.itemsFijos.push(itemFijoForm);
  }

  removerItemFijo(index: number): void {
    this.itemsFijos.removeAt(index);
  }

  enviarGeneracionMasiva(): void {
    if (this.formMasivo.invalid || this.idPresentacionesVariables.length === 0 || this.itemsFijos.length === 0) {
      alert('El formulario es inválido. Selecciona al menos una pizza y un producto fijo.');
      this.formMasivo.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    const payload: ComboMasivoRequestDto = this.formMasivo.value;

    this.comboService.generarCombosMasivos(payload).subscribe({
      next: (res) => {
        alert(`¡Combos generados con éxito!`);
        this.isLoading = false;
        this.formMasivo.reset();
        this.idPresentacionesVariables.clear();
        this.itemsFijos.clear();
      },
      error: (err) => {
        alert('Ocurrió un error al generar los combos.');
        console.error(err);
        this.isLoading = false;
      }
    });
  }
}