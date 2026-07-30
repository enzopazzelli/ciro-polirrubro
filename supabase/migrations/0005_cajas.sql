create table public.cajas (
  id                      uuid primary key default gen_random_uuid(),
  abierta_en              timestamptz not null,
  monto_apertura          int not null,
  cerrada_en              timestamptz,
  monto_cierre_declarado  int,                   -- lo que contó la persona
  monto_cierre_calculado  int,                   -- lo que dice el sistema
  diferencia              int,                   -- declarado − calculado
  usuario_apertura_id     uuid references public.perfiles(id),
  usuario_cierre_id       uuid references public.perfiles(id),
  estado                  text not null check (estado in ('abierta', 'cerrada'))
);

create index cajas_estado_idx on public.cajas (estado);
