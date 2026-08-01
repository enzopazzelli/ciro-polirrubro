# Ciro Polirrubro — Sistema de gestión

Sistema de gestión interno para un local de maquillaje, regalería y marroquinería: stock, clientes y cuenta corriente, punto de venta con lectura de código de barras, caja, y un panel en vivo para seguimiento remoto. Funciona como PWA instalable y el punto de venta sobrevive cortes de conexión.

Incluye, además de las 7 etapas originales: anulación de ventas con reversión automática, historial de ventas buscable, permisos granulares configurables por usuario (la dueña decide qué puede hacer cada operadora, no un rol fijo), exportar/importar Stock, Clientes y Ventas a Excel, y eliminar (no solo desactivar) productos y clientes sin historial.

**¿Sos la dueña o vas a operar el mostrador?** La guía de uso está en [`GUIA_CLIENTA.md`](./GUIA_CLIENTA.md).

Mejoras post-entrega, con su estado, en [`ROADMAP.md`](./ROADMAP.md).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Supabase**: Postgres, Auth, Realtime, Row Level Security
- **Dexie.js** (IndexedDB) para el modo offline del punto de venta
- **ExcelJS** para exportar/importar planillas (`lib/excel/`, corre del lado del servidor)
- PWA instalable (`app/manifest.ts`, `app/icon.tsx`)

## Requisitos

- Node.js 20.9+
- Una cuenta y proyecto en [Supabase](https://supabase.com)
- El [Supabase CLI](https://supabase.com/docs/guides/cli) para aplicar migraciones (`npx supabase`, no hace falta instalarlo global)

## Puesta en marcha

### 1. Variables de entorno

```bash
cp .env.local.example .env.local
```

Completar con los datos del proyecto Supabase (Project Settings → API):

| Variable | De dónde sale |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | API → `anon` `public` |
| `SUPABASE_SERVICE_ROLE_KEY` | API → `service_role` — **nunca** con prefijo `NEXT_PUBLIC_`, nunca en el navegador |

`.env.local` está en `.gitignore`. No debería llegar a un commit nunca.

### 2. Migraciones

Todo el esquema (tablas, triggers, funciones, políticas RLS) vive en `supabase/migrations/`, en SQL plano, comentado, y numerado en el orden en que se aplicó. Se aplican con el Supabase CLI:

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

Esto corre las migraciones de cero contra el proyecto linkeado. Reflejan el estado final esperado del esquema; no están pensadas para reordenarse ni saltearse. Para agregar una funcionalidad nueva, se agrega una migración nueva — no se edita una ya aplicada en producción.

### 3. Usuario inicial

```bash
node --env-file=.env.local scripts/seed-usuarios.mjs
```

Crea únicamente la cuenta admin en Supabase Auth, con su perfil correspondiente — a propósito no crea ninguna otra cuenta: el resto (operadoras, etc.) se da de alta después desde `/usuarios`, ya logueado como admin. La contraseña se genera al azar y se imprime **una sola vez** en la consola — no queda guardada en ningún archivo. Guardala en un gestor de contraseñas apenas la veas.

Para fijar el email, nombre o contraseña en vez de los valores por defecto:

```bash
SEED_ADMIN_EMAIL="..." SEED_ADMIN_NOMBRE="..." SEED_ADMIN_PASSWORD="..." node --env-file=.env.local scripts/seed-usuarios.mjs
```

El resto de los datos de ejemplo (categorías, ~20 productos con código de barras, ~6 clientes) se cargan solos como parte de la migración `0011_seed.sql`. Para un proyecto que va a producción real, conviene revisar esa migración: probablemente convenga no aplicarla, o borrar los datos de ejemplo después de la puesta en marcha.

### 4. Desarrollo

```bash
npm install
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000).

### 5. Build de producción

```bash
npm run build
npm start
```

Para deployar (Vercel es lo natural para Next.js): crear el proyecto, importar el repo, cargar las 3 variables de entorno de la sección anterior, deploy. Después, probar login, una venta de punta a punta, y que la PWA se pueda instalar desde el celular (Chrome/Safari → "Agregar a la pantalla de inicio").

## Estructura del proyecto

```
app/                    -- rutas (App Router). (app)/ es el layout autenticado
components/             -- un subdirectorio por módulo (stock, clientes, ventas, caja, panel, usuarios)
lib/                    -- lógica de datos, Supabase clients, Dexie, sincronización
  supabase/             -- client.ts (browser), server.ts (RSC/Route Handlers), admin.ts (service_role, server-only)
  sync/                 -- motor de la outbox offline y descarga de catálogo
  dexie/db.ts           -- esquema local (IndexedDB)
proxy.ts                -- protección de rutas por sesión y rol (reemplaza a middleware.ts en Next 16)
supabase/migrations/    -- todo el esquema de la base, en SQL plano, numerado y en orden
scripts/seed-usuarios.mjs -- crea la cuenta admin inicial vía la Auth Admin API
```

## Arquitectura, en dos ideas

- **El stock y las cuentas corrientes son tablas de movimientos inmutables** (`movimientos_stock`, `movimientos_cuenta`), no un campo que cada quien pisa. `productos.stock_actual` y `clientes.saldo` son cachés de solo lectura mantenidas por triggers de Postgres — la aplicación nunca los escribe directo. Se puede responder "¿por qué este producto tiene 3 unidades?" recorriendo el historial, en vez de mirar un número sin explicación.
- **El punto de venta es offline-first.** Escribe primero en Dexie (IndexedDB) y encola la operación en una outbox local; un motor de sincronización (`lib/sync/`) la sube a Supabase apenas hay conexión, con reintentos de espera creciente e idempotencia vía `ON CONFLICT DO NOTHING`. La venta completa (items, pagos, stock, cuenta corriente, caja) se aplica en una sola transacción atómica del lado del servidor, vía la función `confirmar_venta()`: si algo falla, no se guarda nada.

Los IDs se generan en el dispositivo (`uuid`), no en el servidor — necesario para que una venta offline tenga su identidad definitiva desde el primer momento, y para que un reintento no duplique nada. Productos y clientes se pueden desactivar (`activo = false`) o eliminar de verdad; el `DELETE` solo tiene efecto si no tienen historial (ventas, movimientos de stock, cuenta corriente) — si lo tienen, la foreign key lo bloquea sola. Usuarios solo se desactivan, nunca se eliminan.

## Permisos

Hay dos roles: `admin` (la dueña, sin restricciones) y `operador` (mostrador). Por default el operador tiene el alcance mínimo — vende, cobra, carga clientes — pero la dueña puede habilitarle, persona por persona, cualquiera de estos 7 permisos desde `/usuarios`:

- Modificar precios de venta de productos ya cargados
- Ver precio de costo y márgenes
- Ingresar mercadería / ajustar stock manualmente (incluye la importación por Excel)
- Editar límites de crédito de clientes
- Anular ventas
- Vender a crédito por encima del límite del cliente
- Desactivar o eliminar productos y clientes

Los permisos viven en `perfiles.permisos` (`jsonb`, claves booleanas) y se leen con la función `auth_permiso(clave)`. Cada política RLS que antes decía "solo admin" ahora dice `auth_rol() = 'admin' or auth_permiso('clave')`. **Las restricciones están en la base de datos** (Row Level Security + triggers + funciones `security definer` en Postgres), no solo en la interfaz — ocultar un botón en el frontend no es, por sí solo, una medida de seguridad acá.

Ojo con un detalle si se agrega una función nueva que un operador con permiso deba poder ejecutar sobre `productos`: la tabla base tiene el `SELECT` restringido a admin (para que `precio_costo` no se filtre fuera de la vista `productos_lista`), así que un `UPDATE`/`DELETE` directo de un operador afecta 0 filas en silencio, sin error — hace falta pasar por una función `security definer` (ver `actualizar_producto`, `alternar_activo_producto`, `eliminar_producto` en `supabase/migrations/0018` y `0020` como referencia).

La gestión de usuarios (`/usuarios`, solo admin) pasa por un Route Handler del servidor que valida el rol de quien llama antes de usar la `service_role key` — esa clave nunca se expone al navegador.

## Backups

El plan gratuito de Supabase no incluye backups. Hay un workflow de GitHub Actions (`.github/workflows/backup.yml`) que corre `pg_dump` a diario, cifra el resultado (GPG, simétrico) y lo sube a Cloudflare R2, con rotación de 30 días. Para activarlo hace falta cargar estos secrets en GitHub → Settings → Secrets and variables → Actions:

| Secret | Qué es |
|---|---|
| `SUPABASE_DB_URL` | Connection string directa a Postgres (Supabase → Project Settings → Database → Connection string → URI, no la del pooler) |
| `BACKUP_ENCRYPTION_KEY` | Passphrase del cifrado. Generarla una vez con `openssl rand -base64 32` y guardarla fuera de GitHub — sin ella, los backups son irrecuperables |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | Credenciales del bucket de Cloudflare R2 |
| `R2_ENDPOINT` | Endpoint S3-compatible del bucket |
| `R2_BUCKET` | Nombre del bucket |

Antes de confiar en esto para un caso real, conviene restaurar un backup una vez contra un proyecto Supabase limpio y confirmar que los datos quedan enteros.

## Qué no hace este sistema

Decidido así a propósito, para mantenerlo simple y rápido — no son bugs si faltan:

- No imprime tickets ni genera comprobantes en PDF.
- No emite factura electrónica; es de uso interno del local.
- No tiene módulo de compras/proveedores; la mercadería que entra se carga a mano en Stock.
- No arma reportes ni comparaciones históricas o de rentabilidad; el Panel muestra el estado actual, no tendencias.

## Convenciones

- Todo el código (tablas, columnas, variables, componentes, rutas) en español.
- Colores solo por token, definidos en `:root` de `app/globals.css`. Ningún color se escribe a mano en un componente — cambiar la marca es cambiar un solo archivo.
- Celular primero en todas las pantallas: la dueña consulta desde el celular, la operadora vende parada.
- Objetivos táctiles de 44px como mínimo.
- Montos en enteros (pesos, sin centavos).
- Sin librerías de componentes pesadas — Tailwind directo.
