import { HttpInterceptorFn } from '@angular/common/http';

const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
    const token = localStorage.getItem('zenith_token');

    const headers: Record<string, string> = {
        'X-Timezone': timezone
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    return next(req.clone({ setHeaders: headers }));
};
