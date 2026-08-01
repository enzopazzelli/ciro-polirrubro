# Guía de uso — Ciro Polirrubro

Guía rápida para el día a día del sistema. Se usa igual desde el celular o la
computadora — la mayoría de las pantallas están pensadas para el celular.

## Entrar al sistema

1. Abrí el link que te compartieron con Chrome (Android) o Safari (iPhone).
2. Ingresá tu email y contraseña, tocá **Ingresar**.
3. Vas a caer directo en el Panel.

**Para instalarlo en la pantalla de inicio** (recomendado, evita pasar por el navegador cada vez):
- Android: menú (⋮) del navegador → **Instalar aplicación**.
- iPhone: botón de compartir → **Agregar a pantalla de inicio**.

**Vista cómoda o compacta.** Arriba a la derecha hay un selector con esas dos
opciones: cambia qué tan separadas se ven las filas en las listas (productos,
clientes, ventas, etc.). Es solo una preferencia visual, cada dispositivo
recuerda la suya.

## Panel

Es la pantalla de inicio. Responde "¿cómo va el día?" sin tener que entrar a buscar nada:

- **Ventas de hoy**: cuánto se vendió y en cuántas operaciones.
- **Desglose por forma de pago**: efectivo, transferencia, tarjeta y cuenta corriente por separado.
- **Stock crítico**: qué productos están bajos o agotados.
- **Clientes con deuda**: quién debe, ordenado por quién hace más tiempo que no paga.
- **Últimas ventas**: van apareciendo solas, sin que recargues la pantalla.
- **Caja**: si está abierta o no, y desde cuándo.

> La operadora ve una versión más chica: ventas de hoy, stock crítico y caja. Sin el resto.

## Vender

Pensado para usarlo parada, con una mano, con alguien esperando en el mostrador.

### El camino más común

1. Entrás a **Ventas**: la pantalla ya está lista para escanear, sin tocar nada.
2. Escaneás cada producto con la pistola. Si lo escaneás de nuevo, suma cantidad — no duplica la línea.
3. Si no tiene código, lo buscás por nombre y lo tocás.
4. Tocás **Cobrar**.
5. Elegís la forma de pago y tocás **Todo**.
6. Tocás **Confirmar**. La pantalla vuelve limpia, lista para la próxima.

### Si se paga con dos formas a la vez

Por ejemplo, parte con tarjeta y el resto en efectivo: elegís una forma, cargás
el monto (o tocás Todo si es lo último que falta), y repetís con la otra. No
se puede confirmar hasta que el restante llegue a cero.

### Cuenta corriente

Pide elegir un cliente antes de habilitarse. Si el monto a crédito supera el
límite que tiene cargado ese cliente, a la operadora no la deja seguir — a vos
sí, porque sos quien autoriza esa excepción.

Si el cliente todavía no está cargado, no hace falta cortar la venta: al lado
del buscador hay un botón **+ Nuevo** que lo da de alta con solo el nombre y
lo deja seleccionado al toque. Después, si querés sumarle teléfono, dirección
o notas, lo completás desde Clientes con calma.

> **Sin internet no se frena.** La venta se guarda igual y se termina de subir
> sola apenas vuelve la conexión. No hace falta hacer nada especial.

### Historial de ventas

Desde **Ventas → Ver historial de ventas** (o desde "Ver historial completo"
en el Panel) se ve cada venta hecha, buscable por número o por cliente.
Tocando una se ve el detalle completo: qué se vendió, cómo se pagó y el total.

### Anular una venta

Si una venta se cargó mal, se puede anular desde su pantalla de detalle. Al
anularla:
- El stock de los productos vendidos vuelve solo (como si nunca se hubiera
  vendido).
- Si se había pagado a cuenta corriente, el cargo se revierte del saldo del
  cliente.
- Si se había cobrado en efectivo con la caja abierta, se registra la salida
  correspondiente en la caja.

**No se puede deshacer.** Por default solo vos podés anular una venta, pero
podés habilitarle este permiso a una operadora de confianza desde Usuarios
(ver esa sección más abajo).

## Stock

Buscador arriba, y un aviso de color para lo que hay que reponer.

**Vos y la operadora siempre pueden:**
- Buscar por nombre, marca o categoría
- Cargar un producto nuevo (se abre en una ventana, sin salir de la pantalla).
  Si la categoría que necesitás no existe todavía, hay un botón **+ Nueva**
  al lado del selector que la crea ahí mismo, sin ir a otro lado.
- Escaneando un código que no exista, se ofrece cargar ese producto directo,
  ya con el código puesto.
- Ver el historial de movimientos de cada producto.

**Por default, solo vos (dueña) podés:**
- Editar precios de productos ya cargados
- Ver el precio de costo y el margen
- Ingreso de mercadería (sumar unidades) y ajustar stock a mano, con motivo —
  también sirve para cargar varios productos de una a través de un Excel (ver
  más abajo)
- Desactivar o eliminar un producto

Ninguna de estas cinco es fija: si confiás en una operadora, se la podés
habilitar de forma individual desde **Usuarios** — ver esa sección.

### Desactivar vs. eliminar

**Desactivar** oculta el producto de las búsquedas normales sin borrar nada —
se puede reactivar cuando quieras, y su historial de ventas sigue intacto. Es
lo que conviene para un producto que se dejó de vender.

**Eliminar** lo borra de verdad, para siempre. Solo funciona si el producto
**nunca tuvo movimientos** (ni ventas, ni ingresos, ni ajustes) — si los tuvo,
el sistema no lo deja y te avisa. Sirve para limpiar un producto cargado por
error, un duplicado, o una prueba.

### Exportar e importar por Excel

- **Exportar Excel** descarga toda la lista de Stock en una planilla.
- **Importar Excel** permite cargar varios productos de una. El más simple es
  bajar primero **Exportar Excel** (sirve de plantilla), agregar filas nuevas
  o editar precios/stock mínimo de las que ya existen, completar **Cantidad a
  ingresar** en las que necesitás sumar stock, y volver a subir ese mismo
  archivo. El sistema usa el **código de barras** para saber si una fila es un
  producto nuevo o uno que ya existe.

> Un código de barras repetido no se puede cargar dos veces: el sistema avisa cuál producto ya lo tiene.

## Clientes

El saldo de cada cliente se arma solo, a partir de sus compras y pagos.

- Cargar un cliente nuevo con teléfono, dirección y notas (para lo que
  necesites recordar de él), lo pueden hacer las dos.
- Registrar un pago baja el saldo por el monto exacto.
- Un cliente sin deuda aparece como **"Al día"**.
- Si paga de más, queda **"A favor"** — se muestra clarito, no se confunde con una deuda.
- **Exportar Excel** descarga la lista completa de clientes con su saldo —
  útil para revisar deudas fuera del sistema.

> El límite de crédito de cada cliente solo lo cambiás vos, salvo que se lo
> habilites a alguien más desde Usuarios.

### Desactivar vs. eliminar

Igual que con los productos: **desactivar** oculta al cliente sin borrar nada
(se puede reactivar); **eliminar** lo borra para siempre y solo funciona si
**nunca tuvo ventas, pagos ni cargos** en cuenta corriente — si los tuvo, el
sistema no lo deja.

## Caja

Solo el efectivo pasa por acá — transferencias y tarjeta no afectan el arqueo.

1. Al empezar el día, **abrí la caja** con el efectivo que hay para arrancar.
2. Durante el día, registrá cualquier **gasto** (con qué fue y cuánto).
3. Al cerrar, contás el efectivo físico y lo cargás como **declarado**.
4. El sistema muestra su propio **calculado** (apertura + ventas en efectivo − gastos) y la diferencia entre los dos.

> Una caja cerrada no se puede volver a tocar. Antes de confirmar el cierre, revisá bien el monto declarado.

## Usuarios (solo dueña)

Acá manejás quién puede entrar al sistema y qué puede hacer cada quien.

- Crear una operadora nueva con su email y una contraseña. El sistema no
  viene con ninguna operadora precargada — cada una se da de alta acá cuando
  la necesitás.
- Cambiarle la contraseña a alguien que se la olvidó (o la tuya propia).
- Desactivar a alguien que ya no trabaja más ahí — no se borra, pero deja de poder entrar.

### Permisos por confianza

Debajo de cada operadora hay una lista de casilleros para tildar. Están
apagados por default; los tildás vos, uno por uno, según cuánto confiés en
esa persona. Se guardan al toque, no hace falta ningún botón de "Guardar"
aparte. Son estos:

- **Modificar precios de venta de productos ya cargados**
- **Ver precio de costo y márgenes**
- **Ingresar mercadería / ajustar stock manualmente** (incluye la carga
  masiva por Excel)
- **Editar límites de crédito de clientes**
- **Anular ventas**
- **Vender a crédito por encima del límite del cliente**
- **Desactivar o eliminar productos y clientes**

Ninguno de estos afecta a otra operadora ni a vos — es por persona. Podés
tildar todos, ninguno, o solo los que tengan sentido para cada una.

## Lo que el sistema no hace

Se decidió así a propósito, para mantenerlo simple y rápido:

- No imprime tickets ni genera comprobantes en PDF.
- No emite factura electrónica — es un sistema de uso interno del local.
- No maneja compras a proveedores; la mercadería que entra se carga a mano en Stock.
- No arma reportes ni comparaciones históricas — el Panel muestra cómo está el negocio hoy, no gráficos de meses pasados.

## Si algo falla

Si algo no funciona como se explica acá, o la pantalla muestra un error que no
entendés, escribí directamente en vez de darle vueltas:

**enzopazzelli1@gmail.com**
