import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-redireccion-tab',
    template: ''
})
export class RedireccionTab implements OnInit {
    private readonly router = inject(Router);

    ngOnInit() {
        this.router.navigateByUrl('/habitos?tab=estadisticas');
    }
}
