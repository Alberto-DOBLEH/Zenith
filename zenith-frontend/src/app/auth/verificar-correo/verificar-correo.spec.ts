import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { VerificarCorreo } from './verificar-correo';

describe('VerificarCorreo', () => {
  let component: VerificarCorreo;
  let fixture: ComponentFixture<VerificarCorreo>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerificarCorreo],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => 'test-token'
              }
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(VerificarCorreo);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
