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

- [x] Exportar Stock
- [x] Exportar Clientes / deudas
- [x] Exportar Ventas
- [x] Importar Stock (carga masiva de productos, gateado por el permiso `gestionar_stock`) — el mismo archivo exportado sirve de plantilla: `Código de barras` decide si una fila actualiza un producto existente o crea uno nuevo, y `Cantidad a ingresar` carga stock

## 5. Visual

- [x] Logo real de la clienta (interpretado — colores y forma, no el archivo tal cual): bordó `#6E1B22` y rosa pastel `#FAD6D1`/`#FBEAEA` tomados del logo, aplicados como `--color-acento`/`--color-acento-texto`/`--color-acento-suave` en `app/globals.css` (el fondo se mantiene blanco a propósito). Se actualizaron también los íconos PWA (`app/icon.tsx`, `app/apple-icon.tsx`, `app/manifest.ts`) y las insignias circulares de marca (Header, login) para imitar la forma del logo — círculo sólido con las iniciales
- [ ] Pulido general de estilo (espaciado, tipografía, micro-detalles) — a partir de un mockup de venta que le gustó a la clienta, se adaptó el estilo (no los colores del mockup: se mantuvo el bordó/rosa real) en Sidebar/Header, Panel y las listas de Stock/Clientes: sidebar oscuro responsive con marca e ítems con ícono, tarjetas de estadística con número grande, avatares circulares con iniciales, punto de color por estado de stock, foco de formulario en acento. Falta aplicar el mismo criterio en Ventas, Caja y Usuarios — quedó acotado a las pantallas que mostraba el mockup por tiempo, no por decisión de dejarlas afuera

## 6. Punto de venta: alta rápida de cliente

- [x] Botón "+ Nuevo" junto al buscador de cliente en Ventas, para no tener que cortar una venta e ir a Clientes cuando aparece alguien nuevo que quiere pagar a cuenta corriente. Mismo patrón que el quick-add de categoría en el modal de nuevo producto (Stock) — formulario inline con solo el nombre (lo mínimo para seguir la venta), seleccionado automáticamente al crearlo.
