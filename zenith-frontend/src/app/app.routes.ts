import { Routes } from '@angular/router';
import { authGuard } from './core/guardias/auth.guard';

export const routes: Routes = [
    {
        path: 'autenticacion',
        loadComponent: () => import('./auth/autenticacion/autenticacion').then(m => m.Autenticacion)
    },
    {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./principales/layout-principal/layout-principal').then(m => m.LayoutPrincipal),
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./principales/dashboard/dashboard').then(m => m.Dashboard)
            },
            {
                path: 'habitos',
                loadComponent: () => import('./principales/habitos/habitos').then(m => m.Habitos)
            },
            {
                path: 'notas',
                loadComponent: () => import('./principales/notas/notas').then(m => m.Notas)
            },
            {
                path: 'eventos',
                loadComponent: () => import('./principales/eventos/eventos').then(m => m.Eventos)
            },
            {
                path: 'pomodoro',
                loadComponent: () => import('./principales/pomodoro/pomodoro').then(m => m.Pomodoro)
            },
            {
                path: 'perfil',
                loadComponent: () => import('./principales/perfil/perfil').then(m => m.Perfil)
            }
        ]
    },
    {
        path: '**',
        loadComponent: () => import('./principales/no-encontrado/no-encontrado').then(m => m.NoEncontrado)
    }
];