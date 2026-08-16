import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UiService {
    readonly sidebarAbierta = signal(false);
}