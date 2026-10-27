const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const app = path.resolve(__dirname, '../..');
const privateFile = path.resolve(
  process.env.RINDE_TEST_ENV || path.resolve(app, '../../../rinde-backend/.env.platform'),
);
const config = Object.fromEntries(
  fs
    .readFileSync(privateFile, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith('#') && line.includes('='))
    .map((line) => [line.slice(0, line.indexOf('=')), line.slice(line.indexOf('=') + 1)]),
);
const web = process.env.RINDE_WEB_BASE || 'http://localhost:4200';
const api = process.env.RINDE_API_BASE || 'http://localhost:8000';
const directory = path.join(app, '.impeccable/review/demo-mailbox');
fs.mkdirSync(directory, { recursive: true });
const checks = [];
const errors = [];
async function request(method, route, body, token, expected = 200) {
  const response = await fetch(api + route, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: 'Bearer ' + token } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  assert.equal(response.status, expected, method + ' ' + route.split('?')[0]);
  return response.status === 204 ? null : response.json();
}
async function settle(page) {
  await page.evaluate(() => document.fonts.ready.then(() => true));
  await page.locator('.mailbox-page[aria-busy="true"]').waitFor({ state: 'hidden' });
}
async function capture(page, name) {
  await settle(page);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: path.join(directory, name + '.png'), fullPage: true });
}
async function signIn(page, email, password) {
  await page.goto(web + '/sign-in');
  await page.getByRole('button', { name: 'Continuar con correo', exact: true }).click();
  await page.locator('#email').fill(email);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await page.waitForURL((url) => url.pathname === '/trips');
}
async function mailbox(page, email, purpose) {
  await page.goto(web + '/platform/mailbox');
  await page.getByRole('heading', { name: 'Buzón de demostración', exact: true }).waitFor();
  await page.getByLabel('Destinatario o empresa').fill(email);
  await page.getByLabel('Tipo de correo').selectOption(purpose);
  const filtered = page.waitForResponse((response) => {
    const url = new URL(response.url());
    return (
      url.pathname === '/api/v1/platform/demo-mailbox/messages' &&
      url.searchParams.get('purpose') === purpose &&
      url.searchParams.get('search') === email
    );
  });
  await page.getByRole('button', { name: 'Filtrar', exact: true }).click();
  await (await filtered).finished();
  await settle(page);
  const row = page.locator('.mail-row').filter({ hasText: email });
  await row.waitFor();
  await row.click();
  await page.locator('.mail-detail h2').waitFor();
  await settle(page);
}
async function recipientTab(context, page, label) {
  const [recipient] = await Promise.all([
    context.waitForEvent('page'),
    page.getByRole('link', { name: label, exact: true }).click(),
  ]);
  await recipient.waitForLoadState('domcontentloaded');
  assert.equal(await recipient.evaluate(() => window.opener), null);
  assert.equal(await recipient.evaluate(() => sessionStorage.getItem('rinde.accessToken')), null);
  return recipient;
}
async function run() {
  const browser = await chromium.launch({
    headless: true,
    channel:
      process.env.RINDE_BROWSER_CHANNEL || (process.platform === 'win32' ? 'msedge' : undefined),
  });
  try {
    const ownerContext = await browser.newContext({
      viewport: { width: 1440, height: 900 },
      reducedMotion: 'reduce',
    });
    const guestContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      reducedMotion: 'reduce',
    });
    const owner = await ownerContext.newPage();
    const guest = await guestContext.newPage();
    for (const page of [owner, guest]) page.on('pageerror', (error) => errors.push(error.message));
    const suffix = crypto.randomBytes(4).toString('hex');
    const companyEmail = 'mailbox-' + suffix + '@example.invalid';
    const companyName = 'Transportes Buzón Demo ' + suffix;
    const password = 'MailboxDemo!42' + crypto.randomBytes(10).toString('hex');
    const changedPassword = 'MailboxChanged!42' + crypto.randomBytes(10).toString('hex');
    const inviteEmail = 'driver-mailbox-' + suffix + '@example.invalid';

    await guest.goto(web + '/platform/mailbox');
    await guest.waitForURL((url) => url.pathname === '/platform/sign-in');
    assert.equal(new URL(guest.url()).searchParams.get('returnUrl'), '/platform/mailbox');
    await owner.goto(web + '/platform/sign-in?returnUrl=%2Fplatform%2Fmailbox');
    await owner.getByLabel('Correo', { exact: true }).fill(config.RINDE_PLATFORM_BOOTSTRAP_EMAIL);
    await owner
      .getByLabel('Contraseña', { exact: true })
      .fill(config.RINDE_PLATFORM_BOOTSTRAP_PASSWORD);
    await owner.getByRole('button', { name: 'Ingresar a Rinde', exact: true }).click();
    await owner.waitForURL((url) => url.pathname === '/platform/mailbox');
    const ownerToken = await owner.evaluate(() => sessionStorage.getItem('rinde.accessToken'));
    assert.ok(ownerToken);
    checks.push('Ingreso reservado al operador y retorno al buzón después de autenticar');

    await guest.goto(web + '/register');
    await guest.locator('#tradeName').fill(companyName);
    await guest.locator('#ruc').fill('20' + crypto.randomInt(100000000, 999999999));
    await guest.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await guest.locator('#administratorFullName').fill('Administrador de demostración');
    await guest.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await guest.locator('#administratorEmail').fill(companyEmail);
    await guest.getByRole('button', { name: 'Siguiente', exact: true }).click();
    await guest.locator('#password').fill(password);
    await guest.getByRole('button', { name: 'Crear mi cuenta', exact: true }).click();
    await guest.getByRole('link', { name: 'Abrir buzón como operador', exact: true }).waitFor();
    await capture(guest, 'registration-sent-desktop');
    await mailbox(owner, companyEmail, 'EMAIL_VERIFICATION');
    await capture(owner, 'mailbox-verification-desktop');
    const verification = await recipientTab(ownerContext, owner, 'Verificar empresa');
    verification.on('pageerror', (error) => errors.push(error.message));
    await verification
      .getByRole('button', { name: 'Confirmar y activar la cuenta', exact: true })
      .click();
    await verification.waitForURL((url) => url.pathname === '/sign-in');
    await owner.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await settle(owner);
    await owner
      .getByText('Este enlace ya se utilizó y no se puede reutilizar.', { exact: true })
      .waitFor();
    assert.equal(
      await owner.getByRole('link', { name: 'Verificar empresa', exact: true }).count(),
      0,
    );
    checks.push('Registro y verificación desde un mensaje real, sin preparar tokens en SQL');

    await signIn(guest, companyEmail, password);
    await guest.goto(web + '/users');
    await guest.getByRole('button', { name: 'Invitar usuario', exact: true }).click();
    await guest.locator('#invite-name').fill('Conductor de demostración');
    await guest.locator('#invite-email').fill(inviteEmail);
    await guest.locator('#invite-role').selectOption('DRIVER');
    await guest.getByRole('button', { name: 'Enviar invitación', exact: true }).click();
    await guest
      .getByText('Invitación preparada para ' + inviteEmail + ' en el buzón de demostración.', {
        exact: true,
      })
      .waitFor();
    await mailbox(owner, inviteEmail, 'INVITATION');
    await capture(owner, 'mailbox-invitation-desktop');
    const invited = await recipientTab(ownerContext, owner, 'Aceptar invitación');
    await invited.locator('#password').fill(password);
    await invited.locator('#confirmation').fill(password);
    await invited.getByRole('button', { name: 'Activar mi cuenta', exact: true }).click();
    await invited.waitForURL((url) => url.pathname === '/sign-in');
    const driver = await request('POST', '/api/v1/auth/sign-in', { email: inviteEmail, password });
    assert.ok(driver.accessToken);
    checks.push('Invitación, alta de contraseña e ingreso del conductor con el enlace del buzón');

    const companyToken = await guest.evaluate(() => sessionStorage.getItem('rinde.accessToken'));
    await request('GET', '/api/v1/platform/demo-mailbox/messages', null, companyToken, 403);
    await request('GET', '/api/v1/platform/demo-mailbox/messages', null, null, 401);
    await guest.goto(web + '/platform/mailbox');
    await guest.waitForURL((url) => url.pathname === '/trips');
    checks.push('Empresa y visitante anónimo sin acceso a mensajes ni enlaces del operador');

    await guest.getByRole('button', { name: 'Cerrar sesión', exact: true }).click();
    await guest.goto(web + '/recover');
    await guest.locator('#email').fill(companyEmail);
    await guest.getByRole('button', { name: 'Enviar enlace', exact: true }).click();
    await guest.getByRole('heading', { name: 'Revisa tu correo', exact: true }).waitFor();
    await guest.getByRole('link', { name: 'Abrir buzón como operador', exact: true }).waitFor();
    await capture(guest, 'recovery-sent-desktop');
    await mailbox(owner, companyEmail, 'PASSWORD_RESET');
    await capture(owner, 'mailbox-recovery-desktop');
    const recovery = await recipientTab(ownerContext, owner, 'Crear nueva contraseña');
    await recovery.locator('#password').fill(changedPassword);
    await recovery.locator('#confirmation').fill(changedPassword);
    await recovery.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
    await recovery.waitForURL((url) => url.pathname === '/sign-in');
    await request('POST', '/api/v1/auth/sign-in', { email: companyEmail, password }, null, 401);
    const updated = await request('POST', '/api/v1/auth/sign-in', {
      email: companyEmail,
      password: changedPassword,
    });
    assert.ok(updated.accessToken);
    await owner.getByRole('button', { name: 'Actualizar', exact: true }).click();
    await settle(owner);
    await owner
      .getByText('Este enlace ya se utilizó y no se puede reutilizar.', { exact: true })
      .waitFor();
    await capture(owner, 'mailbox-used-desktop');
    checks.push('Recuperación real, sustitución de contraseña y desactivación de la acción usada');
    assert.equal(
      await owner.evaluate(() => sessionStorage.getItem('rinde.accessToken')),
      ownerToken,
    );
    checks.push('Tres flujos de destinatario sin transferir ni reemplazar la sesión del operador');

    const mobileContext = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: 'reduce',
    });
    await mobileContext.addInitScript(
      (token) => sessionStorage.setItem('rinde.accessToken', token),
      ownerToken,
    );
    const mobile = await mobileContext.newPage();
    mobile.on('pageerror', (error) => errors.push(error.message));
    await mobile.goto(web + '/platform/mailbox');
    await mobile.locator('.mail-row').first().waitFor();
    await settle(mobile);
    await capture(mobile, 'mailbox-list-mobile');
    await mobile.locator('.mail-row').first().click();
    await mobile.locator('.mail-detail h2').waitFor();
    await capture(mobile, 'mailbox-detail-mobile');
    for (const width of [344, 360, 390]) {
      await mobile.setViewportSize({ width, height: 844 });
      const dimensions = await mobile.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
      }));
      assert.ok(dimensions.scroll <= dimensions.width, 'Desborde a ' + width);
      const targets = await mobile
        .locator('button:visible,a.ui-button:visible,select:visible')
        .evaluateAll((elements) =>
          elements.map((element) => element.getBoundingClientRect().height),
        );
      assert.ok(
        targets.every((height) => height >= 44),
        'Control táctil menor de 44 px a ' + width,
      );
    }
    await mobile.getByRole('button', { name: 'Volver a los mensajes', exact: true }).click();
    await mobile.waitForFunction(() => document.activeElement?.classList.contains('mail-row'));
    checks.push('Buzón móvil, retorno al listado, foco y controles a 344, 360 y 390 px');
    assert.deepEqual(errors, [], 'Errores de página');
    fs.writeFileSync(
      path.join(directory, 'browser-result.json'),
      JSON.stringify(
        {
          success: true,
          checks,
          unexpectedErrors: errors,
          fixtures:
            'Solo datos de demostración. Los tres enlaces proceden de eventos reales de IAM y del buzón; no se prepararon hashes ni tokens mediante SQL.',
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({ success: true, checks: checks.length, unexpectedErrors: errors.length }),
    );
    await mobileContext.close();
    await guestContext.close();
    await ownerContext.close();
  } finally {
    await browser.close();
  }
}
run().catch((error) => {
  console.error(error.message.replace(/([?&]token=)[^&\s]+/g, '$1[redacted]'));
  process.exitCode = 1;
});
