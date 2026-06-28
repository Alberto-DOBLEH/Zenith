import { Routes } from '@angular/router';
import { Autenticacion } from './auth/autenticacion/autenticacion';
import { Dashboard } from './principales/dashboard/dashboard';

export const routes: Routes = [
    {
        path: 'autenticacion',
        component: Autenticacion
    },
    {
        path: '',
        redirectTo: '/autenticacion',
        pathMatch: 'full'

    },
    {
        path: 'dashboard',
        component: Dashboard
    }
];
