# Arquitectura del frontend de Rinde

La aplicación conserva Angular standalone y el diseño Arcadia. La organización sigue las
funcionalidades del producto: IAM, suscripciones y viajes. Cada integrante puede continuar su
funcionalidad sin agregar lógica de negocio a los componentes compartidos.

## Separación de responsabilidades

| Área | Responsabilidad | Dependencias permitidas |
|---|---|---|
| app y layout | Configuración, rutas, sesión visible y composición del espacio de trabajo. | core, shared y puntos de entrada de las funcionalidades. |
| core | Sesión, almacenamiento, HTTP, avisos globales y coordinación genérica de peticiones. | Angular, RxJS y contratos puros compartidos. No depende de funcionalidades. |
| features/*/models | Contratos y tipos de la funcionalidad. | TypeScript. No importa Angular. |
| features/*/data-access | Llamadas HTTP y recursos de la API. | Configuración de core y modelos propios. |
| features/*/state | Consultas, acciones, transiciones y estado observable de una pantalla. | data-access, modelos y servicios transversales de core. |
| features/*/pages | Composición de vistas, formularios del acceso y navegación. | state, ui y componentes compartidos. No usa HttpClient ni llama al cliente de datos. |
| features/*/ui | Formularios y vistas de presentación de la funcionalidad. | Modelos e inputs y outputs tipados. No consulta la API. |
| shared | Marca, acceso visual, botones, cabeceras, estados, avisos y directivas de formulario. | Otros elementos compartidos y Angular. No conoce funcionalidades ni la sesión. |

Las rutas generales cargan las rutas de cada funcionalidad de forma diferida. Las rutas públicas
de IAM están separadas del espacio protegido. La sesión se comprueba al entrar y al cambiar de
pantalla dentro de ese espacio; la gestión de usuarios y la suscripción exigen administrador.

La organización por funcionalidad y la proximidad de archivos relacionados coinciden con la
[guía de estilo de Angular](https://angular.dev/style-guide). Los directorios de este proyecto
expresan además sus reglas concretas de dependencia, comprobadas por un script del repositorio.

## Páginas y componentes de presentación

UsersPage compone PageHeader, InviteUserForm, UserList y StatePanel. UsersStore consulta la lista
y procesa invitaciones y cambios. InviteUserForm conserva el formulario y emite una solicitud
tipada; UserList emite el cambio de rol o de estado. Ninguno de esos dos componentes conoce el
cliente HTTP. Si un cambio de rol falla, el selector conserva el rol confirmado por el servidor.

SubscriptionPage compone SubscriptionSummary, PlanSelector y CheckoutReview. SubscriptionStore
conserva el plan seleccionado, la suscripción recuperada de la API y las operaciones de pago.
La vista de checkout recibe un recurso y emite una decisión; la coordinación con el servidor
permanece en el servicio de estado. Los formatos monetarios y de fecha son funciones de
presentación con formateadores Intl reutilizados.

Las páginas del acceso mantienen sus formularios y su navegación. AccessStore administra las
peticiones de registro, ingreso, recuperación, verificación y aceptación de invitaciones. El
foco se aplica al control recién montado con AutoFocus; no se buscan nodos globales por id.
Los errores de campos se relacionan con sus controles mediante aria-invalid y aria-describedby.

Los componentes de presentación usan OnPush. Reciben datos mediante inputs y comunican acciones
mediante outputs; las acciones se nombran por su propósito. Los componentes pequeños conservan
plantilla inline cuando facilita su lectura; las vistas con contenido y estilos propios usan
archivos separados con el mismo nombre.

## Estado local y sesión

UsersStore, SubscriptionStore y AccessStore se proporcionan en sus páginas. Al abandonar una
pantalla se destruye su instancia; una pantalla nueva no hereda una invitación o un checkout
abierto de la anterior. El estado escribible es privado y las vistas reciben señales de solo
lectura. Los modelos y las colecciones usan readonly donde corresponde; las actualizaciones
crean nuevos valores y no modifican los objetos de entrada de un componente hijo.

Signals permite derivar el plan elegido, el rótulo de una acción o el número de usuarios sin
mantener copias independientes de esos datos. Este uso de señales calculadas y de exposición
de solo lectura se apoya en la [documentación de Signals](https://angular.dev/guide/signals).
Readonly impide modificaciones a través del contrato TypeScript; no se presenta como un
congelamiento profundo de los objetos en tiempo de ejecución.

RxJS se conserva para HTTP y para la secuencia de selección y checkout. RequestAction reúne
el estado pendiente y el error de una acción, impide enviar la misma acción mientras sigue
pendiente y cancela su suscripción cuando se destruye el propietario. Las consultas que
coordinan varios recursos conservan esa coordinación en su store. La cancelación usa
[takeUntilDestroyed con DestroyRef](https://angular.dev/ecosystem/rxjs-interop/take-until-destroyed).
No hace falta un gestor de estado adicional para el alcance actual.

AuthService conserva la sesión global y delega HTTP a AuthApi y almacenamiento a SessionStorage.
Una restricción del navegador al almacenamiento no impide mantener la sesión en memoria.
La vigencia se vuelve a comprobar antes de usar el token. SessionProfileStore sigue los cambios
de sesión: cancela una consulta pendiente y limpia el perfil al salir.

## Peticiones y permisos

API_BASE_URL centraliza la dirección de la API y se puede reemplazar en una prueba. El
interceptor compara origen y segmento de ruta, en vez de aceptar cualquier cadena que empiece
igual. No agrega el JWT a recursos del frontend, otro puerto ni un host parecido.

Un 401 de una petición autenticada cierra la sesión correspondiente y vuelve al ingreso. Si
esa respuesta pertenece a una sesión anterior, no cierra la sesión nueva. El error de credenciales
del propio formulario de ingreso permanece en ese formulario. Los errores de la API muestran
su detail cuando existe y una alternativa en español cuando no existe.

Los guards mejoran la navegación, pero los permisos y el aislamiento por empresa siguen siendo
responsabilidad del gateway y del backend. El navegador no verifica la firma del JWT ni recibe
la clave HMAC de los pagos. La confirmación simulada continúa habilitada solo en el entorno
de pruebas y se presenta como pago de prueba.

## Verificación y continuidad

El comando npm run check ejecuta, en este orden, el control de arquitectura, las pruebas y la
compilación de producción. TypeScript usa strict, noUncheckedIndexedAccess, noUnusedLocals y
noUnusedParameters; las plantillas usan strictTemplates.

scripts/check-architecture.mjs resuelve las importaciones con TypeScript. Rechaza ciclos,
dependencias entre funcionalidades, llamadas HTTP fuera de data-access, páginas que importen
clientes de datos y vistas que importen servicios de estado. También impide que shared conozca
la sesión o funcionalidades, que los modelos dependan de Angular, y el uso de $any en plantillas
o de document.getElementById en la implementación.

Las pruebas funcionales existentes del acceso, usuarios y suscripción se mantienen junto con
sus archivos. Se agregan regresiones sobre cancelación de peticiones, envíos repetidos, sesión
vencida, respuestas 401 atrasadas, límites del origen de la API, recuperación de un cambio de
rol fallido y contrato accesible del botón. La revisión de navegador cubre las rutas reales y
la presentación en escritorio y móvil antes de promover la versión a main.

Para agregar viajes, flota o gastos, se crea su funcionalidad con sus propios modelos, cliente
de datos, servicio de estado y página. Las vistas que necesiten reutilización se extraen a ui;
solo los elementos sin conocimiento de una funcionalidad pasan a shared. No se importan stores
ni clientes de otra funcionalidad.

El tablero de viajes sigue provisional y las pantallas de S2-11, S2-12 y S2-13 siguen asignadas
al equipo. Esta organización prepara su implementación; no las presenta como terminadas.
