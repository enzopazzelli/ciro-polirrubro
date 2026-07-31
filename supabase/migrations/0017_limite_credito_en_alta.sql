-- ============================================================
-- Cierra un hueco preexistente: clientes_verificar_permisos (0008)
-- solo corría en UPDATE, así que limite_credito nunca estuvo
-- protegido al CREAR un cliente — cualquier operador podía mandar
-- un límite de crédito por insert directo, aunque el formulario lo
-- ocultara. Al implementar el permiso editar_limite_credito (0016)
-- conviene cerrarlo: ahora la misma función corre también antes de
-- insertar.
-- ============================================================
create or replace function public.clientes_verificar_permisos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if TG_OP = 'UPDATE' and new.saldo is distinct from old.saldo and pg_trigger_depth() <= 1 then
    raise exception 'clientes.saldo es una caché mantenida por trigger; no se escribe directamente';
  end if;

  if auth.role() = 'service_role' or public.auth_rol() = 'admin' then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    if new.limite_credito <> 0 and not public.auth_permiso('editar_limite_credito') then
      raise exception 'Solo un administrador puede asignar un límite de crédito';
    end if;
    return new;
  end if;

  if new.limite_credito is distinct from old.limite_credito and not public.auth_permiso('editar_limite_credito') then
    raise exception 'Solo un administrador puede modificar el límite de crédito';
  end if;

  if new.activo is distinct from old.activo and not public.auth_permiso('desactivar') then
    raise exception 'No tenés permiso para desactivar clientes';
  end if;

  return new;
end;
$$;

create trigger trg_clientes_verificar_permisos_insert
  before insert on public.clientes
  for each row execute function public.clientes_verificar_permisos();
