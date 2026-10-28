// Crea una empresa de demostración con flota, conductores y viajes en varios estados, por la API real.
// Usa el buzón del dueño para verificar e invitar; guarda las credenciales en un archivo privado.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = path.resolve(__dirname, '../..');
const backend = path.resolve(app, '../../../rinde-backend');
const privateFile = path.resolve(process.env.RINDE_TEST_ENV || path.join(backend, '.env.platform'));
const accountFile = path.resolve(
  process.env.RINDE_DEMO_ACCOUNT || path.join(backend, '.env.demo-company'),
);
const api = process.env.RINDE_API_BASE || 'http://localhost:8000';
const config = Object.fromEntries(
  fs
    .readFileSync(privateFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);

async function request(method, route, body, token) {
  const response = await fetch(api + route, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  if (!response.ok) throw new Error(`${method} ${route.split('?')[0]}: ${response.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

/** Fecha local en AAAA-MM-DD desplazada en días. */
function day(offset) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${String(date.getDate()).padStart(2, '0')}`;
}

async function token(email, password, route = '/api/v1/auth/sign-in') {
  return (await request('POST', route, { email, password })).accessToken;
}

/** Último mensaje del buzón para ese destinatario y propósito; devuelve el token de su enlace. */
async function mailboxToken(owner, email, purpose) {
  const query = `?search=${encodeURIComponent(email)}&purpose=${purpose}`;
  const page = await request('GET', '/api/v1/platform/demo-mailbox/messages' + query, null, owner);
  const message = (page.content ?? page.items ?? [])[0];
  if (!message) throw new Error(`No llegó el mensaje ${purpose} para ${email}`);
  const detail = await request(
    'GET',
    `/api/v1/platform/demo-mailbox/messages/${message.id}`,
    null,
    owner,
  );
  return new URL(detail.actionPath, 'http://local').searchParams;
}

async function run() {
  const suffix = crypto.randomBytes(3).toString('hex');
  const email = `demo-${suffix}@example.test`;
  const password = 'Demo-' + crypto.randomBytes(9).toString('base64url');
  const owner = await token(
    config.RINDE_PLATFORM_BOOTSTRAP_EMAIL,
    config.RINDE_PLATFORM_BOOTSTRAP_PASSWORD,
    '/api/v1/platform/auth/sign-in',
  );

  const tenant = await request('POST', '/api/v1/tenants', {
    tradeName: 'Transportes Andes Demo ' + suffix,
    ruc: '20' + crypto.randomInt(100000000, 999999999),
    administratorFullName: 'Ana Rojas Paredes',
    administratorEmail: email,
    password,
  });
  const verification = await mailboxToken(owner, email, 'EMAIL_VERIFICATION');
  await request('POST', `/api/v1/tenants/${tenant.id}/verification`, {
    token: verification.get('token'),
  });
  const admin = await token(email, password);

  const plates = ['ABC-123', 'BXT-604', 'CMR-218', 'DEF-456'];
  const vehicles = [];
  for (const [index, plateNumber] of plates.entries()) {
    vehicles.push(
      await request(
        'POST',
        '/api/v1/vehicles',
        {
          plateNumber,
          brand: 'Volvo',
          model: 'FH',
          modelYear: 2020 + index,
          payloadCapacityKg: 18000,
        },
        admin,
      ),
    );
  }

  const people = ['Luis Quispe', 'Jorge Salas', 'Rosa Medina', 'Marco Ríos'];
  const drivers = [];
  for (const [index, fullName] of people.entries()) {
    const driverEmail = `conductor${index + 1}-${suffix}@example.test`;
    const user = await request(
      'POST',
      '/api/v1/users',
      { fullName, email: driverEmail, role: 'DRIVER' },
      admin,
    );
    const invitation = await mailboxToken(owner, driverEmail, 'INVITATION');
    await request('POST', '/api/v1/auth/password', { token: invitation.get('token'), password });
    const driver = await request(
      'POST',
      '/api/v1/drivers',
      {
        userId: user.id,
        fullName,
        documentType: 'DNI',
        documentNumber: String(40000000 + crypto.randomInt(9999999)),
        licenseNumber: 'Q' + crypto.randomInt(10000000, 99999999),
        licenseCategory: 'A-IIIc',
        licenseExpirationDate: day(400),
      },
      admin,
    );
    drivers.push({ ...driver, session: await token(driverEmail, password) });
  }

  // Ruta, día relativo, unidad y conductor (índice) y hasta dónde avanza. Los servicios usan UTC,
  // así que de noche en Lima el día local ya es pasado para ellos y se confirma.
  const plan = [
    ['Lima', 'Arequipa', 0, 0, 'IN_ROUTE'],
    ['Callao', 'Trujillo', 0, 1, 'IN_ROUTE'],
    ['Ica', 'Lima', 0, 2, 'FINISHED'],
    ['Lima', 'Huancayo', 0, 3, 'ASSIGNED'],
    ['Lima', 'Chimbote', 1, null, 'SCHEDULED'],
    ['Lima', 'Piura', 3, null, 'SCHEDULED'],
    ['Lima', 'Cusco', 2, 2, 'ASSIGNED'],
  ];
  for (const [origin, destination, offset, unit, target] of plan) {
    const trip = await request(
      'POST',
      '/api/v1/trips',
      {
        origin,
        destination,
        cargoDescription: 'Carga general',
        cargoWeightKg: 12000,
        departureDate: day(offset),
        confirmPastDate: offset <= 0,
      },
      admin,
    );
    if (unit === null) continue;
    await request(
      'PUT',
      `/api/v1/trips/${trip.id}/assignment`,
      {
        vehicleId: vehicles[unit].id,
        driverId: drivers[unit].id,
        confirmOverdueMaintenance: false,
      },
      admin,
    );
    if (target === 'ASSIGNED') continue;
    await request('POST', `/api/v1/trips/${trip.id}/start`, null, drivers[unit].session);
    if (target === 'FINISHED') {
      await request('POST', `/api/v1/trips/${trip.id}/finish`, null, drivers[unit].session);
    }
  }

  fs.writeFileSync(
    accountFile,
    [
      '# Empresa de demostración creada por tests/demo-company/seed.cjs. Privado, no subir.',
      `RINDE_DEMO_ADMIN_EMAIL=${email}`,
      `RINDE_DEMO_ADMIN_PASSWORD=${password}`,
      `RINDE_DEMO_DRIVER_EMAIL=conductor1-${suffix}@example.test`,
      '# Los conductores usan la misma contraseña que el administrador.',
      '',
    ].join('\n'),
  );
  console.log(JSON.stringify({ email, tenant: tenant.tradeName, accountFile }));
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
