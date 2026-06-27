import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Autenticacion } from './autenticacion';

describe('Autenticacion', () => {
  let component: Autenticacion;
  let fixture: ComponentFixture<Autenticacion>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Autenticacion],
    }).compileComponents();

    fixture = TestBed.createComponent(Autenticacion);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
