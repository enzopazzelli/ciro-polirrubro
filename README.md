# Ciro Polirrubro — Sistema de gestión

Sistema de gestión interno para un local de maquillaje, regalería y marroquinería en Santiago del Estero: stock, clientes y cuenta corriente, punto de venta con lectura de código de barras, caja, y un panel en vivo para seguimiento remoto. Funciona como PWA instalable y sobrevive cortes de conexión en el punto de venta.

La especificación completa del alcance (arquitectura, modelo de datos, reglas de negocio y criterios de aceptación de cada etapa) está en [`sistema-ciro-polirrubro-final.md`](./sistema-ciro-polirrubro-final.md). Es la fuente de verdad del proyecto — ante cualquier duda de "por qué está hecho así", la respuesta está ahí.

- **¿Sos la dueña o vas a operar el mostrador?** Empezá por [`GUIA_CLIENTA.md`](./GUIA_CLIENTA.md).
- **¿Vas a mantener o desplegar el sistema?** Seguí con [`GUIA_TECNICA_MANTENIMIENTO.md`](./GUIA_TECNICA_MANTENIMIENTO.md).

## Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS v4**
- **Supabase**: Postgres, Auth, Realtime, Row Level Security
- **Dexie.js** (IndexedDB) para el modo offline del punto de venta
- PWA instalable (`app/manifest.ts`, `app/icon.tsx`)

## Requisitos

- Node.js 20.9+ (recomendado: la misma versión mayor que Next.js 16 exige)
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

Todo el esquema (tablas, triggers, funciones, políticas RLS) vive en `supabase/migrations/`, en orden numerado. Se aplican con el Supabase CLI:

```bash
npx supabase link --project-ref <tu-project-ref>
npx supabase db push
```

Esto corre las migraciones de cero contra el proyecto linkeado. Reflejan el estado final esperado del esquema; no están pensadas para reordenarse ni saltearse.

### 3. Datos iniciales

```bash
node --env-file=.env.local scripts/seed-usuarios.mjs
```

Crea a la dueña (`admin`) y una operadora de ejemplo en Supabase Auth, con su perfil correspondiente. Las contraseñas se generan al azar y se imprimen **una sola vez** en la consola — no quedan guardadas en ningún archivo. Guardalas en un gestor de contraseñas apenas las veas.

Para fijar una contraseña propia en vez de que se genere sola:

```bash
SEED_ADMIN_PASSWORD="..." SEED_OPERADOR_PASSWORD="..." node --env-file=.env.local scripts/seed-usuarios.mjs
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

## Estructura del proyecto

```
app/                    -- rutas (App Router). (app)/ es el layout autenticado
components/             -- un subdirectorio por módulo (stock, clientes, ventas, caja, panel, usuarios)
lib/                    -- lógica de datos, Supabase clients, Dexie, sincronización
  supabase/             -- client.ts (browser), server.ts (RSC/Route Handlers), admin.ts (service_role, server-only)
  sync/                 -- motor de la outbox offline (Etapa 4) y descarga de catálogo
  dexie/db.ts           -- esquema local (IndexedDB)
proxy.ts                -- protección de rutas por sesión y rol (reemplaza a middleware.ts en Next 16)
supabase/migrations/    -- todo el esquema de la base, en SQL plano, numerado y en orden
scripts/seed-usuarios.mjs -- crea los usuarios iniciales vía la Auth Admin API
```

## Arquitectura, en dos ideas

- **El stock y las cuentas corrientes son tablas de movimientos inmutables** (`movimientos_stock`, `movimientos_cuenta`), no un campo que cada quien pisa. `productos.stock_actual` y `clientes.saldo` son cachés de solo lectura mantenidas por triggers de Postgres — la aplicación nunca los escribe directo.
- **El punto de venta es offline-first.** Escribe primero en Dexie (IndexedDB) y encola la operación en una outbox local; un motor de sincronización (`lib/sync/`) la sube a Supabase apenas hay conexión, con reintentos e idempotencia vía `ON CONFLICT DO NOTHING`. La venta completa (items, pagos, stock, cuenta corriente, caja) se aplica en una sola transacción atómica del lado del servidor, vía la función `confirmar_venta()`.

El resto de las decisiones de arquitectura y su justificación están en la sección 4 de `sistema-ciro-polirrubro-final.md`.

## Permisos

Hay dos roles: `admin` (la dueña, sin restricciones) y `operador` (mostrador, alcance limitado). **Las restricciones están en la base de datos** (Row Level Security + triggers), no solo en la interfaz — ocultar un botón en el frontend no es, por sí solo, una medida de seguridad acá. El detalle completo está en la sección 6 del documento de especificación.

## Backups

El plan gratuito de Supabase no incluye backups. Hay un workflow de GitHub Actions (`.github/workflows/backup.yml`) que corre `pg_dump` a diario, cifra el resultado y lo sube a Cloudflare R2. Requiere configurar los secrets `SUPABASE_DB_URL`, `BACKUP_ENCRYPTION_KEY`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` y `R2_BUCKET` en el repositorio de GitHub.

El procedimiento de restauración, paso a paso, está en [`RESTAURACION_BACKUPS.md`](./RESTAURACION_BACKUPS.md).

## Convenciones

- Todo el código (tablas, columnas, variables, componentes, rutas) en español.
- Colores solo por token, definidos en `app/globals.css`. Ningún color se escribe a mano en un componente.
- Celular primero en todas las pantallas.
- Montos en enteros (pesos argentinos, sin centavos).

Más detalle en la sección 9 del documento de especificación.
