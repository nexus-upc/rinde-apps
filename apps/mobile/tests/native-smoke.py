"""Recorrido nativo contra el entorno local de demostración; crea un viaje de prueba."""
from pathlib import Path
from datetime import datetime, timedelta, timezone
import base64
import json
import os
import re
import shlex
import subprocess
import sys
import time
import urllib.request
import urllib.error
import xml.etree.ElementTree as ET

MOBILE = Path(__file__).resolve().parents[1]
BACKEND = MOBILE.parents[1].parent / 'rinde-backend'
OUTPUT = MOBILE / '.gradle' / 'native-review'
OUTPUT.mkdir(parents=True, exist_ok=True)
DEVICE = os.environ.get('RINDE_NATIVE_DEVICE', 'emulator-5554')
BASE = 'http://127.0.0.1:8000'


def adb(*args, capture=False):
    return subprocess.run(['adb', '-s', DEVICE, *args], check=True,
                          stdout=subprocess.PIPE if capture else subprocess.DEVNULL,
                          stderr=subprocess.DEVNULL).stdout


def request(method, route, body=None, token=None):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(BASE + route, data=data, headers=headers, method=method)
    with urllib.request.urlopen(req, timeout=20) as response:
        return json.loads(response.read())


def nodes():
    adb('shell', 'uiautomator', 'dump', '/sdcard/rinde-review.xml')
    xml = adb('exec-out', 'cat', '/sdcard/rinde-review.xml', capture=True)
    return list(ET.fromstring(xml).iter('node'))


def text_nodes(text):
    return [n for n in nodes() if text in n.get('text', '') or text == n.get('content-desc')]


def wait_text(text, timeout=25):
    until = time.monotonic() + timeout
    while time.monotonic() < until:
        found = text_nodes(text)
        if found:
            return found
        time.sleep(.4)
    raise RuntimeError('No apareció el estado esperado: ' + text)


def tap_node(node):
    points = list(map(int, re.findall(r'\d+', node.get('bounds', ''))))
    assert len(points) == 4
    adb('shell', 'input', 'tap', str((points[0] + points[2]) // 2),
        str((points[1] + points[3]) // 2))


def tap(text, last=False):
    found = wait_text(text)
    tap_node(found[-1] if last else found[0])


def find_scroll(text, direction='up'):
    for _ in range(8):
        found = text_nodes(text)
        if found:
            return found[0]
        points = ('550', '1500', '550', '550') if direction == 'up' else ('550', '550', '550', '1500')
        adb('shell', 'input', 'swipe', *points, '250')
    raise RuntimeError('No se encontró el control: ' + text)


def type_text(value):
    adb('shell', 'input', 'text', shlex.quote(value.replace(' ', '%s')))


def capture(name):
    (OUTPUT / (name + '.png')).write_bytes(adb('exec-out', 'screencap', '-p', capture=True))


def main():
    adb('shell', 'am', 'force-stop', 'com.nexus.rinde.mobile')
    adb('shell', 'am', 'start', '-n', 'com.nexus.rinde.mobile/.MainActivity')
    wait_text('Correo electrónico')
    config = dict(line.split('=', 1) for line in (BACKEND / '.env.demo-company').read_text().splitlines()
                  if line and not line.startswith('#') and '=' in line)
    email = config['RINDE_DEMO_DRIVER_EMAIL']
    password = config['RINDE_DEMO_ADMIN_PASSWORD']
    admin_email = config['RINDE_DEMO_ADMIN_EMAIL']
    assert email.endswith('@example.test') and admin_email.endswith('@example.test')
    token = request('POST', '/api/v1/auth/sign-in', {'email': email, 'password': password})['accessToken']
    admin = request('POST', '/api/v1/auth/sign-in', {'email': admin_email, 'password': password})['accessToken']
    claims = json.loads(base64.urlsafe_b64decode(token.split('.')[1] + '==='))
    drivers = request('GET', '/api/v1/drivers', token=admin)
    driver = next(d for d in drivers if d['userId'] == claims['sub'])
    vehicles = request('GET', '/api/v1/vehicles', token=admin)
    vehicle = next(v for v in vehicles if v['status'] == 'AVAILABLE')
    previous = json.loads((OUTPUT / 'fixture.json').read_text()) if (OUTPUT / 'fixture.json').exists() else {}
    offset = previous.get('dateOffset', 3) + 1
    departure = (datetime.now(timezone.utc).date() + timedelta(days=offset)).isoformat()
    trip = request('POST', '/api/v1/trips', {
        'origin': 'Lima', 'destination': 'Ica', 'cargoDescription': 'Prueba del piloto Android',
        'cargoWeightKg': 100, 'departureDate': departure, 'confirmPastDate': False,
    }, admin)
    request('PUT', f"/api/v1/trips/{trip['id']}/assignment", {
        'vehicleId': vehicle['id'], 'driverId': driver['id'], 'confirmOverdueMaintenance': False,
    }, admin)
    result = {'tripId': trip['id'], 'tripCode': trip['code'], 'dateOffset': offset,
              'device': adb('shell', 'getprop', 'ro.build.version.release', capture=True).decode().strip(),
              'createdAt': datetime.now(timezone.utc).isoformat(), 'checks': {}}
    (OUTPUT / 'fixture.json').write_text(json.dumps(result, indent=2))
    fields = [n for n in nodes() if n.get('class') == 'android.widget.EditText']
    tap_node(fields[0])
    type_text(email)
    adb('shell', 'input', 'keyevent', '4')
    fields = [n for n in nodes() if n.get('class') == 'android.widget.EditText']
    tap_node(fields[1])
    type_text(password)
    adb('shell', 'input', 'keyevent', '4')
    tap('Ingresar')
    wait_text('Mis viajes')
    result['checks']['driver_sign_in'] = True
    capture('01-mis-viajes')
    tap_node(find_scroll(trip['code']))
    wait_text('Iniciar viaje')
    capture('02-viaje-asignado')
    tap('Iniciar viaje')
    wait_text('¿Iniciar este viaje?')
    tap('Iniciar viaje', last=True)
    wait_text('Viaje iniciado.')
    updated = request('GET', f"/api/v1/trips/{trip['id']}", token=admin)
    assert updated['status'] == 'IN_ROUTE'
    result['checks']['native_start_visible_to_operations'] = True
    capture('03-viaje-en-ruta')
    tap('Registrar gasto')
    amount_field = next(n for n in nodes() if n.get('class') == 'android.widget.EditText')
    tap_node(amount_field)
    type_text('35.50')
    adb('shell', 'input', 'keyevent', '4')
    tap_node(find_scroll('Guardar gasto'))
    time.sleep(2)
    screen = ' '.join(n.get('text', '') for n in nodes())
    if 'Gasto registrado, pendiente' in screen:
        result['checks']['expense_registration'] = True
    else:
        result['checks']['expense_registration'] = False
        result['expense_response_screen'] = screen
    capture('04-resultado-gasto')
    if not result['checks']['expense_registration']:
        assert find_scroll('35.50').get('class') == 'android.widget.EditText'
        result['checks']['expense_form_preserved_on_error'] = True
    for _ in range(3):
        adb('shell', 'input', 'swipe', '550', '450', '550', '1600', '200')
    tap_node(find_scroll('Finalizar viaje'))
    wait_text('¿Finalizar este viaje?')
    tap('Finalizar viaje', last=True)
    wait_text('Viaje finalizado.')
    updated = request('GET', f"/api/v1/trips/{trip['id']}", token=admin)
    assert updated['status'] == 'FINISHED'
    result['checks']['native_finish_visible_to_operations'] = True
    capture('05-viaje-finalizado')
    night = adb('shell', 'cmd', 'uimode', 'night', 'yes', capture=True).decode()
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1.3')
    time.sleep(2)
    capture('06-tema-sistema-texto-grande')
    result['night_mode_enabled'] = 'yes' in night
    adb('shell', 'cmd', 'uimode', 'night', 'no')
    adb('shell', 'settings', 'put', 'system', 'font_scale', '1.0')
    (OUTPUT / 'results.json').write_text(json.dumps(result, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps(result, ensure_ascii=False))
    return 0 if all(result['checks'].values()) else 2


if __name__ == '__main__':
    sys.exit(main())
