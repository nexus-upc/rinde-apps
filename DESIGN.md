---
name: Rinde, Arcadia Piedra
description: Sistema visual vigente de la aplicación web y su extensión de administración de plataforma.
colors:
  arc-bg: "#ffffff"
  arc-card: "#ffffff"
  arc-surface: "#f5f5f4"
  arc-border: "#e7e5e4"
  arc-ink: "#1c1917"
  arc-muted: "#57534e"
  arc-subtle: "#78716c"
  arc-shadow: "#1c1917"
  arc-fill: "#1c1917"
  arc-fill-hover: "#292524"
  arc-on-fill: "#ffffff"
  arc-band: "#1c1917"
  arc-on-band: "#ffffff"
  arc-disabled-bg: "#e7e5e4"
  arc-disabled-ink: "#8a837e"
  arc-accent: "#c15f3c"
  arc-danger: "#b42318"
  arc-danger-bg: "#fef3f2"
  arc-success: "#067647"
  arc-success-bg: "#ecfdf3"
  arc-wait: "#8a5a12"
  arc-wait-bg: "#fbf0dc"
typography:
  page-title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: "40px"
    letterSpacing: "-0.02em"
  entrance-title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "26px"
    fontWeight: 600
    lineHeight: "34px"
    letterSpacing: "-0.02em"
  showcase-title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "28px"
    fontWeight: 600
    lineHeight: "36px"
    letterSpacing: "-0.02em"
  section-title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "18px"
    fontWeight: 600
    lineHeight: "24px"
  row-title:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "16px"
    fontWeight: 500
    lineHeight: "24px"
  body:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "20px"
  label:
    fontFamily: "'DM Sans Variable', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif"
    fontSize: "12px"
    fontWeight: 500
    lineHeight: "16px"
rounded:
  control: "9px"
  row: "16px"
  card: "24px"
  block: "32px"
  pill: "999px"
spacing:
  compact: "4px"
  small: "8px"
  control: "12px"
  regular: "16px"
  access: "20px"
  section: "24px"
  page: "32px"
  wide: "40px"
  showcase: "48px"
  entrance: "64px"
components:
  button-primary:
    backgroundColor: "{colors.arc-fill}"
    textColor: "{colors.arc-on-fill}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.arc-fill-hover}"
  button-secondary:
    backgroundColor: "{colors.arc-surface}"
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
  field-input:
    backgroundColor: "{colors.arc-surface}"
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.control}"
    padding: "0 12px"
    height: "44px"
    width: "100%"
  navigation-item:
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.row}"
    padding: "0 12px"
  status-chip:
    backgroundColor: "{colors.arc-bg}"
    textColor: "{colors.arc-muted}"
    rounded: "{rounded.pill}"
    padding: "0 10px"
    height: "24px"
  platform-row:
    backgroundColor: "{colors.arc-surface}"
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.row}"
    padding: "24px"
  platform-form:
    backgroundColor: "{colors.arc-surface}"
    textColor: "{colors.arc-ink}"
    rounded: "{rounded.card}"
    padding: "24px"
---

# Sistema de diseño: Rinde

## Overview

**Creative North Star: "Arcadia, tema claro Piedra"**

Rinde conserva el sistema Arcadia aprobado: páginas blancas, tipografía local, texto de tinta y superficies piedra. El espacio y la jerarquía tipográfica organizan la información. La navegación, la barra de sesión y el contenido comparten el fondo de página sin líneas divisorias.

La administración de plataforma prolonga ese sistema con los mismos controles, marca y composición adaptable. Sus filas de datos y formularios usan superficies existentes. El acceso separado conserva el marco de entrada y su vista previa inclinada. Los valores documentados proceden de la implementación; las distribuciones propias del panel no constituyen un rediseño general.

**Key Characteristics:**

- Fondo blanco continuo y separación mediante espacio o superficie piedra.
- Una acción principal de tinta, acompañada por acciones secundarias y enlaces de texto.
- DM Sans para la interfaz y Sora exclusivamente para el nombre de marca.
- Controles redondeados, foco terracota y adaptación del contenido a una columna.

## Colors

La paleta combina neutrales cálidos con un acento de foco y colores funcionales de estado. Los valores del encabezado corresponden a las variables de `src/styles/_tokens.scss`, conservando sus nombres sin el prefijo CSS `--`.

### Primary

La tinta de acción usa `arc-fill`, con texto `arc-on-fill` y respuesta `arc-fill-hover`. El acento terracota `arc-accent` señala el foco del teclado y del campo activo. La gran superficie de tinta y los avisos flotantes emplean `arc-band` y `arc-on-band`.

### Neutral

El blanco `arc-bg` sostiene la página; `arc-card` conserva el blanco de los contenedores correspondientes. Piedra `arc-surface` distingue campos, filas y navegación activa. `arc-ink` es el texto principal, `arc-muted` describe información complementaria y `arc-subtle` cubre texto auxiliar y marcadores de campo. `arc-border` está disponible en el sistema, pero el marco de navegación no dibuja divisores. Los controles deshabilitados principales usan `arc-disabled-bg` y `arc-disabled-ink`.

El peligro, la confirmación y la espera tienen pares de texto y fondo: `arc-danger`, `arc-success` y `arc-wait`, cada uno con su variante `-bg`. No sustituyen una etiqueta textual de estado. Los estados de las filas de plataforma permanecen como texto neutro; los chips de color ya existen en la vista previa de acceso.

**Regla del fondo continuo.** La barra lateral y la barra de sesión conservan el fondo blanco de la página; las superficies piedra agrupan contenido sin introducir líneas de separación.

## Typography

La interfaz usa la familia y las medidas del encabezado. DM Sans Variable y Sora se distribuyen localmente mediante las hojas de estilo declaradas en `angular.json`. Sora se reserva al nombre de marca, con peso (700) y espaciado (-0.04em); no se emplea como fuente de títulos de interfaz.

El título de página, el de acceso y el mensaje de la vista previa tienen roles distintos. Los encabezados de sección usan `section-title`; las filas del panel usan `row-title`. El cuerpo mantiene `body`, mientras que las etiquetas de formulario usan `label`. Las ayudas y los errores comparten las dimensiones de etiqueta, con peso normal cuando así lo define el componente. Los botones usan texto de cuerpo con peso (500) y altura de línea (1).

Las cifras y los importes de las filas utilizan números tabulares. El resumen de plataforma presenta sus valores con tamaño (20px), interlineado (28px) y peso (500); esta medida corresponde al resumen, no reemplaza la escala de títulos. En dispositivos con puntero táctil, los campos, selectores y áreas de texto pasan a (16px).

**Regla de los pesos.** Los títulos se distinguen con peso (600); las etiquetas y acciones usan como máximo (500). El nombre de marca conserva su excepción propia.

## Layout

El marco de escritorio tiene barra lateral fija de (232px), con relleno de (24px 16px). La barra superior es adhesiva, con altura mínima de (56px) y relleno horizontal de (40px). El contenido lleva relleno de (32px 40px). La navegación separa enlaces por (4px).

Hasta (768px), la barra lateral pasa al flujo, el contenido pierde el desplazamiento lateral y el relleno pasa a (24px 16px). En plataforma, el menú de enlaces se sustituye por un selector nativo con etiqueta y altura mínima de (44px). La identidad de sesión permite saltos de línea.

El acceso utiliza una columna de formulario de ancho máximo (360px). Desde (1100px), la columna izquierda ocupa (600px), con relleno de (72px 64px), y el bloque decorativo queda separado (16px) de los bordes superior, derecho e inferior. Por debajo de ese umbral, la vista decorativa no se monta.

La extensión de plataforma limita el contenido a (1120px), separa sus bloques por (32px) y limita la búsqueda a (640px). El resumen tiene dos columnas con separación de (40px 48px). Los datos de cada fila tienen tres columnas y separación de (16px 24px). Hasta (640px), ambos pasan a una columna, las filas reducen su relleno a (16px) y el contador de paginación ocupa una línea propia. Los campos emparejados del alta de plan también pasan de dos columnas a una.

Los espacios del encabezado son medidas observadas de la implementación, no nuevas variables CSS. Los textos extensos y las referencias permiten salto de palabra para conservar el ancho disponible.

## Elevation & Depth

Las páginas y las filas permanecen planas. La profundidad se reserva a la respuesta del botón principal, a los avisos flotantes y a la vista previa de acceso. El archivo `.impeccable/design.json` conserva las sombras exactas y los parámetros de movimiento que no admite el encabezado de este formato.

La vista previa conserva perspectiva (2400px), giro horizontal (14deg) y giro de plano (-4deg), con origen en la esquina superior izquierda. Esta composición es propia del acceso; no se traslada a las listas de operación.

Las duraciones compartidas van de `arc-dur-instant` a `arc-dur-slow`. La pulsación usa la escala `arc-press-scale`; el foco y los colores responden con la curva de salida. Con preferencia de movimiento reducido se anulan las animaciones de entrada y de avisos y la escala de pulsación vuelve a (1). El indicador circular de carga conserva el comportamiento definido por el componente.

**Regla de profundidad por función.** Las filas y los formularios del panel no heredan las sombras o la inclinación de la vista previa decorativa.

## Shapes

Los radios del encabezado distinguen campos, filas, tarjetas, bloques y píldoras. Los controles usan `control`; las filas y los avisos de formulario, `row`; los formularios del panel y las tarjetas de la vista previa, `card`; el bloque decorativo de acceso, `block`. Botones y chips usan `pill`.

Los campos y los botones llevan borde transparente en reposo; el foco o la validación pueden colorearlo. Esta reserva evita que cambie la geometría al entrar en otro estado. Los discos de estado y el indicador de carga usan forma circular.

## Components

### Buttons

Los botones son píldoras con altura mínima compartida de (40px). La variante de bloque ocupa todo el ancho y alcanza (44px), al igual que los botones con puntero táctil. El panel de plataforma establece (44px) para sus acciones.

El principal usa tinta; el secundario, piedra; el discreto mantiene fondo transparente. Al pasar el cursor, donde existe esa capacidad, el principal cambia de relleno y recibe sombra, el secundario oscurece levemente y el discreto toma superficie piedra. El teclado muestra contorno de acento de (2px) separado (2px). La carga oculta la etiqueta conservando el ancho y superpone un indicador de (16px), con ciclo de (0.7s).

Los enlaces de texto carecen de subrayado por defecto y usan peso (500). Las acciones secundarias del panel mantienen altura interactiva de (44px). La selección de una pestaña de auditoría también utiliza tinta, como estado seleccionado, sin convertirla en una segunda acción principal.

### Chips

La vista previa de acceso usa etiquetas de estado de (24px) de alto y relleno horizontal de (10px). Su forma de píldora puede mostrar el estado neutro, la confirmación o la espera. Este patrón no se impone a las filas del panel, que presentan el estado mediante texto.

### Cards / Containers

Los formularios del panel usan superficie piedra, radio `card`, relleno de (24px) y separación interna de (24px). Sus campos usan fondo blanco. Las filas usan radio `row`, relleno de (24px), separación interna de (16px) y separación entre filas de (8px). No llevan sombra.

El resumen muestra secciones abiertas sobre el fondo blanco, con cifras alineadas frente a sus etiquetas; no transforma cada cifra en una tarjeta independiente.

### Inputs / Fields

Los campos y los selectores comparten dimensiones y relleno del encabezado, con borde de (1px) transparente. El foco colorea el borde con el acento y elimina el contorno nativo. La variante inválida compartida usa peligro; los componentes del panel relacionan la validación con `aria-invalid`, mensajes y descripciones accesibles.

Etiqueta y campo se separan (8px). Las ayudas y los errores mantienen su ubicación en el formulario. El motivo de una decisión admite redimensionamiento vertical y altura mínima de (96px). Los formularios se muestran dentro de la página, con acción de confirmar y enlace de cancelar; no se documentan como diálogos superpuestos.

### Navigation

La navegación de escritorio combina enlaces de texto, radio `row` y relleno horizontal de (12px). La selección añade superficie piedra y peso (500); el paso del cursor utiliza el mismo fondo. El enlace de salto al contenido aparece al recibir foco. En plataforma, la navegación móvil usa el selector descrito en Layout y conserva el nombre del ámbito y la identidad de sesión.

### Estados y avisos

El panel de estado compartido centra título, explicación y acción secundaria de reintento cuando corresponde, con altura mínima de (240px). Su texto se limita a (60ch). Los errores se anuncian como alerta y los estados ordinarios como estado informativo.

Los avisos flotantes se sitúan a (24px) del borde inferior, centrados, con ancho máximo de (560px) y margen horizontal total de (32px) en pantallas estrechas. Conservan forma de píldora, fondo de tinta y texto blanco; el aviso de peligro usa su par funcional.

## Do's and Don'ts

### Do:

- Conservar las variables `--arc-*`, las fuentes locales y los componentes compartidos como base de las nuevas pantallas.
- Distinguir título, texto secundario, acción y estado mediante la jerarquía existente.
- Mantener el foco visible y los controles táctiles de al menos 44px en las extensiones de plataforma.
- Reorganizar los datos a una columna cuando el ancho disponible lo requiera y permitir el salto de referencias extensas.
- Reservar la vista previa inclinada al marco de acceso que ya la implementa.

### Don't:

- No sustituir Arcadia por la guía anterior de Geist y azul de los prototipos del informe.
- No añadir líneas divisorias a la barra lateral o a la barra de sesión que actualmente comparten el fondo blanco.
- No extender Sora a los títulos o al cuerpo de la interfaz.
- No convertir las dimensiones o distribuciones propias del panel en reglas obligatorias para todos los módulos.

La base de este registro comprende `src/styles`, los componentes compartidos y de acceso, los dos marcos de aplicación y la extensión `src/app/features/platform`. Se contrastó con las diez capturas existentes en `.impeccable/review` y su registro de comprobaciones de navegador. Este registro describe esa evidencia; no sustituye una nueva ejecución de las comprobaciones. No se incorporan posibles defectos ajenos al alcance como reglas del sistema ni se modifican otras superficies.
