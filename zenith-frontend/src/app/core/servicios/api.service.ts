import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = environment.apiUrl;

    get<T>(ruta: string, params?: Record<string, string | number | undefined>): Observable<T> {
        let httpParams = new HttpParams();
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    httpParams = httpParams.set(key, String(value));
                }
            });
        }
        return this.http.get<T>(`${this.baseUrl}${ruta}`, { params: httpParams });
    }

    post<T>(ruta: string, body?: unknown): Observable<T> {
        return this.http.post<T>(`${this.baseUrl}${ruta}`, body ?? {});
    }

    put<T>(ruta: string, body?: unknown): Observable<T> {
        return this.http.put<T>(`${this.baseUrl}${ruta}`, body ?? {});
    }

    delete<T>(ruta: string): Observable<T> {
        return this.http.delete<T>(`${this.baseUrl}${ruta}`);
    }
}
