-- Keep-alive: re-agendar el ping a Render con la firma correcta de pg_net.
--
-- El job original (20260929000000_keep_awake_ping.sql) agendaba
--   select net.http_get(url := '...', timeout := '120s')
-- pero pg_net no tiene parámetro `timeout`: la firma real es
--   net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds int)
-- Así que cada ejecución de cron fallaba con
--   "function net.http_get(url => unknown, timeout => unknown) does not exist"
-- (verificado en cron.job_run_details) y Render seguía durmiendo por los cold starts.
--
-- Se re-agenda con `timeout_milliseconds` cada 5 min (margen ante un fallo
-- aislado dentro de la ventana de 15 min de Render) y se dispara una vez aquí
-- mismo: si la firma volviera a cambiar, el push falla en este punto.

select cron.unschedule(jobid)
from cron.job
where jobname = 'zenith-keep-awake';

select cron.schedule(
  'zenith-keep-awake',
  '*/5 * * * *',
  $$
  select net.http_get(
    url := 'https://zenith-5sdh.onrender.com/health',
    timeout_milliseconds := 120000
  )
  $$
);

-- Prueba inmediata (pg_net ejecuta la request al confirmar la transacción).
select net.http_get(
  url := 'https://zenith-5sdh.onrender.com/health',
  timeout_milliseconds := 120000
);
