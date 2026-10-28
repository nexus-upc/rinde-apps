# RINDE Apps

Monorepo de las aplicaciones cliente de RINDE by NEXUS. El backend está en nexus-upc/rinde-services.

## Aplicaciones

| Carpeta | Estado | Build |
|---|---|---|
| apps/web | Angular 22, versión 0.3.0. Incluye acceso y usuarios, suscripciones, administración de plataforma y buzón de demostración. | npm run build:web desde la raíz. |
| apps/mobile | Piloto Android Kotlin 0.1.0: acceso, viajes y cambios de estado contra el gateway. Formulario de gastos sujeto a la integración de Expense. | gradlew.bat assembleDebug desde apps/mobile. |
| apps/landing-page | Espacio reservado para la landing de US01 a US07. El repositorio anterior estaba vacío. | Pendiente de implementación. |

La reorganización conserva los commits, autores, fechas y el tag histórico v0.1.0 del repositorio web. Los repositorios mobile y landing estaban vacíos al migrarlos. El piloto móvil se agregó después; landing permanece reservada.

## Instalar y compilar

Requiere la versión de Node.js indicada en apps/web/README.md. Desde la raíz:

```powershell
npm ci
npm run build
```

Hay un único package-lock.json en la raíz. npm workspaces instala las dependencias y enlaza la aplicación web conservando su package.json y configuración propios. Los comandos de cada aplicación se ejecutan desde su carpeta:

```powershell
npm run build --workspace=rinde-web
npm run check:architecture
npm start -- --host 127.0.0.1
```

El servidor web usa http://localhost:4200 y consume el gateway en http://localhost:8000. El acceso del dueño está en /platform/sign-in. Los secretos del backend no forman parte de este repositorio. La documentación de la aplicación y del diseño está en apps/web/README.md, apps/web/docs y apps/web/DESIGN.md.

npm run check conserva las comprobaciones de arquitectura, pruebas unitarias y build. npm run test:platform y npm run test:mailbox ejecutan las comprobaciones de navegador del panel del dueño y del buzón de demostración. Requieren su entorno de backend de prueba configurado; no son necesarias para compilar.

## Trabajo del equipo

Crear ramas feature/ desde develop y hacer merge --no-ff al terminar y comprobar el cambio. Cada aplicación mantiene su configuración y su versión. Usar tags por aplicación en las siguientes versiones, por ejemplo web/v0.2.0; el tag histórico v0.1.0 conserva la estructura anterior.

La aplicación Android tiene su proyecto Gradle en apps/mobile. La landing tendrá su proyecto en apps/landing-page. Añadirla a workspaces cuando exista un package.json; no agregar mobile como paquete npm. Los cambios de plataforma y de empresa siguen separados dentro de la aplicación web.

La compilación de la migración original corresponde a web. Android se compila y comprueba por separado siguiendo apps/mobile/README.md. Landing permanece pendiente.
