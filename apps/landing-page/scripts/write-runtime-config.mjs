// Escribe config.json con la URL del gateway en la carpeta de salida del build.
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const ENV_NAME = 'RINDE_API_BASE_URL';
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1']);

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Valida la URL: https siempre; http solo hacia localhost o 127.0.0.1.
function readApiBaseUrl(raw) {
  const value = (raw ?? '').trim();
  if (!value) fail(`Falta la variable ${ENV_NAME}. Indica la URL https del gateway.`);
  let url;
  try {
    url = new URL(value);
  } catch {
    fail(`${ENV_NAME} no es una URL absoluta válida.`);
  }
  if (url.username || url.password || url.search || url.hash) {
    fail(`${ENV_NAME} no debe incluir usuario, contraseña, parámetros ni fragmento.`);
  }
  const isLocalHttp = url.protocol === 'http:' && LOCAL_HOSTS.has(url.hostname);
  if (url.protocol !== 'https:' && !isLocalHttp) {
    fail(`${ENV_NAME} debe ser una URL https (http solo para localhost o 127.0.0.1).`);
  }
  return value.replace(/\/+$/, '');
}

const outputArg = process.argv[2];
if (!outputArg)
  fail('Indica la carpeta de salida: node scripts/write-runtime-config.mjs <carpeta>.');
const outputDir = path.resolve(outputArg);
if (!existsSync(outputDir)) fail(`No existe ${outputDir}. Ejecuta primero npm run build.`);

const apiBaseUrl = readApiBaseUrl(process.env[ENV_NAME]);
writeFileSync(path.join(outputDir, 'config.json'), `${JSON.stringify({ apiBaseUrl }, null, 2)}\n`);
console.log(`config.json escrito en ${outputDir}.`);
