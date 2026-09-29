-- Keep-alive: ping automático a Render cada 7 minutos.
-- Render (plan gratuito) apaga el servicio tras 15 min sin peticiones y el
-- cold start tarda ~50 s. pg_cron + pg_net golpean /health desde la propia BD.
-- (7 min deja margen ante posibles retrasos de pg_cron y la ventana de 15 min.)

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Idempotente: si el job ya existe, se reemplaza.
select cron.unschedule(jobid)
from cron.job
where jobname = 'zenith-keep-awake';

select cron.schedule(
  'zenith-keep-awake',
  '*/7 * * * *',
  $$
  select net.http_get(
    url := 'https://zenith-5sdh.onrender.com/health',
    timeout := '120s'
  )
  $$
);
