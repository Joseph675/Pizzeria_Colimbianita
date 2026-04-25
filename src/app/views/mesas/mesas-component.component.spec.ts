import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MesasComponentComponent } from './mesas-component.component';

describe('MesasComponentComponent', () => {
  let component: MesasComponentComponent;
  let fixture: ComponentFixture<MesasComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MesasComponentComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MesasComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
