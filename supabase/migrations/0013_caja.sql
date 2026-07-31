-- ============================================================
-- No se puede abrir una caja si ya hay otra abierta. Se dejó
-- pendiente a propósito desde la Etapa 1 (sección 4.4 y el propio
-- comentario en 0009_rls_policies.sql): es una regla de negocio de
-- esta pantalla, no un permiso de la base.
-- ============================================================
create or replace function public.cajas_validar_apertura_unica()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.estado = 'abierta' and exists (
    select 1 from public.cajas where estado = 'abierta'
  ) then
    raise exception 'Ya hay una caja abierta';
  end if;
  return new;
end;
$$;

create trigger trg_cajas_validar_apertura_unica
  before insert on public.cajas
  for each row execute function public.cajas_validar_apertura_unica();

-- ============================================================
-- Una caja cerrada no se modifica. OLD.estado = 'abierta' cuando
-- cerrar_caja() hace el UPDATE que la cierra, así que ese cambio
-- puntual pasa; cualquier otro intento sobre una fila ya cerrada
-- queda bloqueado.
-- ============================================================
create or replace function public.cajas_verificar_permisos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.estado = 'cerrada' then
    raise exception 'Una caja cerrada no se modifica';
  end if;
  return new;
end;
$$;

create trigger trg_cajas_verificar_permisos
  before update on public.cajas
  for each row execute function public.cajas_verificar_permisos();

-- ============================================================
-- cerrar_caja: calcula monto_calculado y diferencia del lado del
-- servidor — el cliente solo manda lo que declaró haber contado.
-- Confiar en un "calculado" que mande el cliente dejaría el arqueo
-- sin sentido. SECURITY INVOKER: el UPDATE sigue pasando por la
-- RLS de cajas de la Etapa 1 (ambos roles pueden cerrar caja).
-- ============================================================
create or replace function public.cerrar_caja(
  p_caja_id uuid,
  p_monto_declarado int
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_apertura  int;
  v_ingresos  int;
  v_egresos   int;
  v_calculado int;
begin
  select monto_apertura into v_apertura
  from public.cajas
  where id = p_caja_id and estado = 'abierta';

  if not found then
    raise exception 'La caja no existe o ya está cerrada';
  end if;

  select coalesce(sum(monto), 0) into v_ingresos
  from public.movimientos_caja
  where caja_id = p_caja_id and tipo = 'ingreso';

  select coalesce(sum(monto), 0) into v_egresos
  from public.movimientos_caja
  where caja_id = p_caja_id and tipo = 'egreso';

  v_calculado := v_apertura + v_ingresos - v_egresos;

  update public.cajas
  set estado = 'cerrada',
      cerrada_en = now(),
      monto_cierre_declarado = p_monto_declarado,
      monto_cierre_calculado = v_calculado,
      diferencia = p_monto_declarado - v_calculado,
      usuario_cierre_id = auth.uid()
  where id = p_caja_id;
end;
$$;

revoke all on function public.cerrar_caja(uuid, int) from public;
grant execute on function public.cerrar_caja(uuid, int) to authenticated;
