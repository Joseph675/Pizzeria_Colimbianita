import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CombosyPromocionesComponent } from './combos_promociones.component';

describe('CombosyPromocionesComponent', () => {
  let component: CombosyPromocionesComponent;
  let fixture: ComponentFixture<CombosyPromocionesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CombosyPromocionesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CombosyPromocionesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
