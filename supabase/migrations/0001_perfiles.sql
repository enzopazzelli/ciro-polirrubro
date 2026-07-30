-- Extensión para gen_random_uuid(); Supabase la trae, esto es solo por las dudas.
create extension if not exists pgcrypto;

create table public.perfiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  nombre            text not null,
  rol               text not null check (rol in ('admin', 'operador')),
  activo            boolean not null default true,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz not null default now()
);

comment on table public.perfiles is 'Extiende auth.users. Un registro por usuario del sistema (dueña u operadora).';
