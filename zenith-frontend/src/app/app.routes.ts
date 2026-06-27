import { Routes } from '@angular/router';
import { Autenticacion } from './auth/autenticacion/autenticacion';

export const routes: Routes = [
    {
        path: 'autenticacion',
        component: Autenticacion
    },
    {
        path: '',
        redirectTo: '/autenticacion',
        pathMatch: 'full'

    }

];
