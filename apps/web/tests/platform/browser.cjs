const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');

const root = path.resolve(__dirname, '../..');
const privateFile = path.resolve(
  process.env.RINDE_TEST_ENV || path.resolve(root, '../../../rinde-backend/.env.platform'),
);
const config = Object.fromEntries(
  fs
    .readFileSync(privateFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const composeRoot = path.dirname(privateFile);
const project = process.env.RINDE_TEST_PROJECT || 'rinde-platform-review';
if (!project.startsWith('rinde-platform-'))
  throw new Error('Usa un proyecto Docker de comprobación de plataforma.');
const web = process.env.RINDE_WEB_BASE || 'http://localhost:4200';
const api = process.env.RINDE_API_BASE || 'http://localhost:8000';
const screenshots = path.join(root, '.impeccable/review');
fs.mkdirSync(screenshots, { recursive: true });
const checks = [];
const failures = [];
async function request(method, route, body, token, expected = 200) {
  const response = await fetch(api + route, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(response.status, expected, method + ' ' + route);
  return response.status === 204 ? null : response.json();
}
async function settle(page) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.locator('p.platform-loading').waitFor({ state: 'hidden' });
  await page.locator('.platform-page[aria-busy="true"]').waitFor({ state: 'hidden' });
}
async function capture(page, name) {
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(screenshots, name + '.png'), fullPage: true });
}
async function navigate(page, route, heading) {
  await page.goto(web + route);
  await page.getByRole('heading', { name: heading, exact: true }).waitFor();
  await settle(page);
}
async function run() {
  const browser = await chromium.launch({
    headless: true,
    channel:
      process.env.RINDE_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  });
  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const page = await context.newPage();
    page.on('pageerror', (error) => failures.push(error.message));
    const suffix = crypto.randomBytes(4).toString('hex');
    const suspensionReason = 'Comprobación de suspensión desde la interfaz ' + suffix;
    const restoreReason = 'Comprobación de restablecimiento desde la interfaz ' + suffix;
    const planReason = 'Prueba del catálogo de la plataforma ' + suffix;
    const companyName = 'Transportes Demostración ' + suffix;
    const companyEmail = 'demo-' + suffix + '@example.invalid';
    const companyPassword = 'DemoCompany!42' + crypto.randomBytes(12).toString('hex');
    const tenant = await request(
      'POST',
      '/api/v1/tenants',
      {
        tradeName: companyName,
        ruc: '20' + crypto.randomInt(100000000, 999999999),
        administratorFullName: 'Administrador de demostración',
        administratorEmail: companyEmail,
        password: companyPassword,
      },
      null,
      201,
    );
    assert.match(tenant.id, /^[a-f0-9-]{36}$/i);
    const verification = crypto.randomBytes(32).toString('hex');
    const hash = crypto.createHash('sha256').update(verification).digest('hex');
    const sql = `UPDATE iam.access_tokens SET token_hash='${hash}' WHERE tenant_id='${tenant.id}' AND purpose='EMAIL_VERIFICATION';`;
    const changed = execFileSync(
      'docker',
      [
        'compose',
        '--env-file',
        privateFile,
        '-p',
        project,
        'exec',
        '-T',
        'postgres-iam',
        'psql',
        '-v',
        'ON_ERROR_STOP=1',
        '-U',
        'rinde',
        '-d',
        'rinde_iam',
        '-At',
        '-c',
        sql,
      ],
      { cwd: composeRoot, encoding: 'utf8' },
    );
    assert.match(changed, /UPDATE 1/);
    await request('POST', '/api/v1/tenants/' + tenant.id + '/verification', {
      token: verification,
    });
    const company = await request('POST', '/api/v1/auth/sign-in', {
      email: companyEmail,
      password: companyPassword,
    });

    await navigate(page, '/platform/sign-in', 'Administración de Rinde');
    await capture(page, 'platform-sign-in-desktop');
    await page.getByLabel('Correo', { exact: true }).fill(config.RINDE_PLATFORM_BOOTSTRAP_EMAIL);
    await page
      .getByLabel('Contraseña', { exact: true })
      .fill(config.RINDE_PLATFORM_BOOTSTRAP_PASSWORD);
    await page.getByRole('button', { name: 'Ingresar a Rinde', exact: true }).click();
    await page.waitForURL((url) => url.pathname === '/platform');
    await page.getByRole('heading', { name: 'Resumen de Rinde', exact: true }).waitFor();
    await capture(page, 'platform-overview-desktop');
    const owner = await page.evaluate(() => sessionStorage.getItem('rinde.accessToken'));
    assert.ok(owner);
    checks.push('Ingreso real del dueño y resumen desde API');

    await navigate(page, '/platform/companies', 'Empresas');
    await page.getByLabel('Buscar por empresa o RUC').fill(companyName);
    await page.getByRole('button', { name: 'Buscar', exact: true }).click();
    await page.getByRole('heading', { name: companyName, exact: true }).waitFor();
    await capture(page, 'platform-companies-desktop');
    await page.getByRole('button', { name: 'Gestionar acceso', exact: true }).click();
    await page.getByLabel('Motivo', { exact: true }).fill(suspensionReason);
    await page.getByRole('button', { name: 'Suspender acceso', exact: true }).click();
    await page.getByText('Acceso de la empresa suspendido.', { exact: true }).waitFor();
    await request('GET', '/api/v1/users/me', null, company.accessToken, 403);
    await page.getByRole('button', { name: 'Gestionar acceso', exact: true }).click();
    await page.getByLabel('Motivo', { exact: true }).fill(restoreReason);
    await page.getByRole('button', { name: 'Restablecer acceso', exact: true }).click();
    await page.getByText('Acceso de la empresa restablecido.', { exact: true }).waitFor();
    await request('GET', '/api/v1/users/me', null, company.accessToken);
    checks.push('Búsqueda, suspensión de token vigente y restablecimiento auditados');

    await navigate(page, '/platform/plans', 'Planes');
    await page.getByRole('button', { name: 'Nuevo plan', exact: true }).click();
    await page.getByLabel('Nombre', { exact: true }).fill('Plan Demostración ' + suffix);
    await page.getByLabel('Precio mensual (S/)').fill('129.90');
    await page.getByLabel('Límite de unidades').fill('12');
    await page.getByLabel('Motivo del alta').fill(planReason);
    await capture(page, 'platform-plan-form-desktop');
    await page.getByRole('button', { name: 'Crear plan', exact: true }).click();
    await page.getByRole('heading', { name: 'Plan Demostración ' + suffix, exact: true }).waitFor();
    await capture(page, 'platform-plans-desktop');
    checks.push('Alta de un plan real con motivo obligatorio');

    const companyContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    await companyContext.addInitScript(
      (token) => sessionStorage.setItem('rinde.accessToken', token),
      company.accessToken,
    );
    const companyPage = await companyContext.newPage();
    companyPage.on('pageerror', (error) => failures.push(error.message));
    await companyPage.goto(web + '/subscription');
    await companyPage
      .getByRole('radio', { name: new RegExp('Plan Demostración ' + suffix) })
      .check();
    await companyPage
      .getByRole('button', { name: /Revisar pago|Elegir plan|Continuar|Contratar/ })
      .first()
      .click();
    await companyPage
      .getByRole('heading', { name: 'Revisa tu pago de prueba', exact: true })
      .waitFor();
    await companyPage
      .getByRole('button', { name: 'Confirmar pago de prueba', exact: true })
      .click();
    await companyPage
      .getByText('Pago de prueba confirmado. Tu suscripción está activa.', { exact: true })
      .waitFor();
    checks.push('El plan publicado se contrata y confirma desde el frontend de empresa');
    await request('GET', '/api/v1/platform/companies', null, company.accessToken, 403);
    await request('GET', '/api/v1/users', null, owner, 403);
    await companyPage.goto(web + '/platform');
    await companyPage.waitForURL((url) => url.pathname === '/trips');
    await page.goto(web + '/users');
    await page.waitForURL((url) => url.pathname === '/platform');
    checks.push('Separación de permisos en API y navegación en ambos sentidos');

    await navigate(page, '/platform/subscriptions', 'Suscripciones');
    await page.getByRole('heading', { name: companyName, exact: true }).waitFor();
    await capture(page, 'platform-subscriptions-desktop');
    await navigate(page, '/platform/payments', 'Pagos de prueba');
    await page.getByRole('heading', { name: companyName, exact: true }).waitFor();
    await capture(page, 'platform-payments-desktop');
    await navigate(page, '/platform/audit', 'Auditoría');
    await page.getByText(suspensionReason, { exact: true }).waitFor();
    await capture(page, 'platform-audit-desktop');
    await page.getByRole('button', { name: 'Planes', exact: true }).click();
    await page.getByText(planReason, { exact: true }).waitFor();
    checks.push('Suscripciones, pagos simulados y auditoría coinciden con las operaciones');
    await page.route(
      '**/api/v1/platform/plans?*',
      (route) =>
        route.fulfill({
          status: 503,
          contentType: 'application/problem+json',
          body: JSON.stringify({ detail: 'Fallo de prueba controlado' }),
        }),
      { times: 1 },
    );
    await navigate(page, '/platform/plans', 'Planes');
    await page
      .getByRole('heading', { name: 'No se pudo cargar la información', exact: true })
      .waitFor();
    await page.getByRole('button', { name: 'Reintentar', exact: true }).click();
    await page.getByRole('heading', { name: 'Plan Demostración ' + suffix, exact: true }).waitFor();
    checks.push('Recuperación de un error 503 inyectado');

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    await mobileContext.addInitScript(
      (token) => sessionStorage.setItem('rinde.accessToken', token),
      owner,
    );
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', (error) => failures.push(error.message));
    await navigate(mobile, '/platform/companies', 'Empresas');
    assert.equal(await mobile.locator('#platform-navigation').inputValue(), '/platform/companies');
    await capture(mobile, 'platform-companies-mobile');
    await mobile.locator('#platform-navigation').selectOption('/platform/plans');
    await mobile.getByRole('heading', { name: 'Planes', exact: true }).waitFor();
    await mobile.getByRole('button', { name: 'Nuevo plan', exact: true }).click();
    await capture(mobile, 'platform-plan-form-mobile');
    for (const width of [344, 360, 390]) {
      await mobile.setViewportSize({ width, height: 844 });
      const dimensions = await mobile.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(dimensions.scroll <= dimensions.width, 'Desborde horizontal a ' + width);
      const targets = await mobile
        .locator('button:visible,select:visible')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            height: element.getBoundingClientRect().height,
            text: element.textContent?.trim(),
          })),
        );
      assert.ok(
        targets.every((target) => target.height >= 44),
        'Control táctil menor de 44 px a ' + width,
      );
    }
    await mobile.getByRole('button', { name: 'Cancelar', exact: true }).click();
    await mobile.waitForFunction(
      () => document.activeElement?.textContent?.trim() === 'Nuevo plan',
    );
    checks.push('Móvil 344, 360 y 390 px, controles de 44 px y retorno de foco');
    assert.deepEqual(failures, [], 'Errores JavaScript de la página');
    fs.writeFileSync(
      path.join(screenshots, 'browser-result.json'),
      JSON.stringify(
        {
          success: true,
          checks,
          unexpectedErrors: failures,
          fixtures:
            'Datos sintéticos de demostración; correo e invitación preparados solo en las bases del proyecto de comprobación.',
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ success: true, checks: checks.length, unexpectedErrors: failures.length }),
    );
    await mobileContext.close();
    await companyContext.close();
    await context.close();
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
