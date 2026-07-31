# Roadmap — Mejoras post-entrega

Documento vivo: se va tildando a medida que se completa cada punto. Esto **no**
es parte del alcance original contratado (las 7 etapas de `README.md` /
la especificación) — son mejoras que se suman después de la entrega inicial,
a pedido explícito.

## 1. Mejoras rápidas (sin tocar el modelo de datos)

- [x] Anular una venta (el permiso ya existía desde la Etapa 1 vía RLS; faltaba la interfaz y la reversión de stock/cuenta/caja)
- [x] Ver el detalle de una venta puntual + historial de ventas
- [x] Mensajes de error más amigables en toda la app
- [x] Vista de tabla: compacta / cómoda, seleccionable

## 2. Campos adicionales

- [x] Clientes: `direccion`, `notas`
- [x] Productos: `marca`

## 3. Permisos granulares por operador

Casi todas las restricciones actuales de operador pasan a ser habilitables
individualmente por la dueña, por usuario (no por rol fijo):

- [x] Diseño: `perfiles.permisos` (jsonb) + `auth_permiso(clave)` + reescritura de políticas RLS de las tablas afectadas
- [x] Pantalla para que la dueña habilite/deshabilite por usuario (`/usuarios`, checkboxes por operador)
- [x] Cubre:
  - [x] Modificar precios de venta de productos ya cargados
  - [x] Ver precio de costo y márgenes
  - [x] Ingresar mercadería / ajustar stock manualmente
  - [x] Editar límites de crédito de clientes
  - [x] Anular ventas
  - [x] Vender a crédito por encima del límite del cliente
  - [x] Desactivar productos o clientes (desactivar **usuarios** queda exclusivamente admin-only, vía `/usuarios` — no se hizo togglable: es la pantalla de gestión de cuentas, no un permiso operativo del día a día)

## 4. Importar / exportar Excel

- [ ] Exportar Stock
- [ ] Exportar Clientes / deudas
- [ ] Exportar Ventas
- [ ] Importar Stock (carga masiva de productos)

## 5. Visual

- [ ] Logo real de la clienta (interpretado — colores y forma, no el archivo tal cual) → nueva paleta de marca en `app/globals.css` y `lib/marca.ts`
- [ ] Pulido general de estilo (espaciado, tipografía, micro-detalles)
