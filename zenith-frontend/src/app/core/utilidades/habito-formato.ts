export const NOMBRES_DIAS: Record<string, string> = {
    LUNES: 'Lunes',
    MARTES: 'Martes',
    MIERCOLES: 'Miércoles',
    JUEVES: 'Jueves',
    VIERNES: 'Viernes',
    SABADO: 'Sábado',
    DOMINGO: 'Domingo'
};

export function textoFrecuencia(
    frecuencia: string | null | undefined,
    dias: string[] | null | undefined,
    diaDelMes: number | null | undefined
): string {
    switch (frecuencia) {
        case 'SEMANAL': {
            const lista = (dias ?? []).map(d => NOMBRES_DIAS[d] || d).join(', ');
            return `Semanal (${lista})`;
        }
        case 'MENSUAL':
            return `Mensual (día ${diaDelMes ?? '-'})`;
        default:
            return 'Diario';
    }
}

export function textoTiempo(meta: number | string | null | undefined): string {
    if (meta === null || meta === undefined || meta === '') return '';
    const minutos = Number(meta);
    if (Number.isNaN(minutos) || minutos <= 0) return '';
    if (minutos >= 60 && minutos % 60 === 0) return `${minutos / 60} h`;
    return `${minutos} min`;
}

export function textoObjetivo(
    meta: number | string | null | undefined,
    unidad: string | null | undefined,
    esTiempo = false
): string {
    if (esTiempo) return textoTiempo(meta);
    if (meta === null || meta === undefined || meta === '') return '';
    const valor = Number(meta);
    if (Number.isNaN(valor)) return '';
    const u = (unidad ?? '').trim();
    return u ? `${valor} ${u}` : String(valor);
}
