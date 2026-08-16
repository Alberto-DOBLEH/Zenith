import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { Header } from './header';
import { AuthService } from '../../core/servicios/auth.service';

describe('Header', () => {
  let component: Header;
  let fixture: ComponentFixture<Header>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Header],
      providers: [provideRouter([])],
    }).compileComponents();

    const authService = TestBed.inject(AuthService);
    authService.usuario.set({
      id_usuario: 1,
      nombre: 'Alberto',
      primer_apellido: 'Doble',
      correo: '',
      telefono: '',
      username: '',
      estado: 'ACTIVO'
    });

    fixture = TestBed.createComponent(Header);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('devuelve las iniciales del usuario', () => {
    expect(component.iniciales()).toBe('AD');
  });
});
