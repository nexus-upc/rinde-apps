# RINDE Mobile

Piloto Android del conductor, versión 0.1.0. Kotlin y Jetpack Compose, con build Gradle independiente. Consume las mismas API del gateway que la web.

## Alcance

Permite ingresar con una cuenta DRIVER, mantener la sesión cifrada con clave del Android Keystore en almacenamiento privado excluido de copias de seguridad, consultar viajes asignados (con respaldo en caché local), abrir el detalle, iniciar un viaje asignado y finalizarlo cuando está en ruta.

Incluye registro de gastos en soles con foto del comprobante (cámara o galería mediante contratos estándar de Android, redimensionada y comprimida a JPEG en almacenamiento privado) y cola local persistente en Room respaldada por WorkManager. Todos los gastos se guardan primero en la cola local con su `idempotencyKey` fija y se sincronizan al recuperar conexión (`POST /api/v1/expenses/sync` y subida multipart en `POST /api/v1/expenses/{expenseId}/evidences`). También permite adjuntar foto a gastos pendientes de sustento y corregir o descartar envíos rechazados. No hay datos de operación incrustados en la aplicación.

Si la sesión vence, la aplicación solicita volver a ingresar sin borrar la cola local de registros pendientes. Al cerrar sesión manualmente con registros pendientes, solicita confirmación advirtiendo que la cola se conservará para esa cuenta. Los permisos efectivos se comprueban en el gateway y en los servicios.

## Compilar e instalar

Requiere JDK 17 o 21 y Android SDK 36. Configurar ANDROID_HOME o abrir esta carpeta en Android Studio para que cree local.properties, ignorado por Git.

```powershell
.\gradlew.bat assembleDebug testDebugUnitTest lintDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

Android mínimo: 8.0 (API 26). SDK objetivo: 36. El wrapper fija Gradle 8.14.5 y verifica su SHA-256. El build móvil se ejecuta por separado del npm de la web.

## Conectar al backend

En el acceso, Conexión de prueba permite indicar la dirección del gateway. El valor inicial de debug es http://10.0.2.2:8000, que apunta a la PC desde Android Emulator. En un teléfono real hay que usar una dirección alcanzable del entorno de prueba. No publicar bases de datos ni RabbitMQ para conectar el teléfono.

El APK debug permite HTTP local. La configuración release exige HTTPS en el manifiesto y en la validación del servidor. No hay credenciales ni una dirección cloud de producción preconfiguradas.

Para probar en un teléfono conectado por USB con depuración autorizada, puede usarse `adb reverse tcp:8000 tcp:8000` y configurar http://127.0.0.1:8000 en Conexión de prueba. Esto permite usar el gateway que escucha solo en la PC sin abrirlo a la red local. Si hay varios dispositivos, seleccionar el teléfono con `adb -s <serial>`.

## Verificar el circuito

1. Registrar al conductor y vincular su userId a una cuenta DRIVER del entorno de prueba.
2. Programar y asignarle un viaje desde las pantallas de operaciones cuando estén integradas o desde la API de prueba.
3. Ingresar en Android y actualizar sus viajes.
4. Iniciar el viaje, actualizar la web y comprobar En ruta.
5. Finalizarlo desde Android y comprobar Finalizado en la web.
6. Cuando Expense esté integrado, registrar un gasto y revisarlo desde operaciones. Actualizar Android para consultar la revisión y su motivo.

`tests/native-smoke.py` automatiza el recorrido con adb y contrasta estados con la API de operaciones. Solo usa el servidor local y las cuentas @example.test del archivo privado rinde-backend/.env.demo-company. Crea un viaje de demostración y guarda resultados y capturas en .gradle/native-review. Requiere el APK instalado en emulator-5554 o el dispositivo indicado con RINDE_NATIVE_DEVICE. No imprime contraseñas ni tokens. Ejecutarlo con Python 3.

El script devuelve 2 si el registro de gasto falla, aunque el ciclo de viajes haya pasado. Revisar results.json para distinguir el recorrido correcto de la integración pendiente. No se presenta ese resultado parcial como una suite completa en verde.

## Pendientes

Incidencias con foto en la cola sin conexión, detalle de adelanto, saldo y liquidación del viaje, mapa, GPS y actualización automática en tiempo real. El piloto no acredita esas historias como terminadas. El alcance visual está en DESIGN.md.
