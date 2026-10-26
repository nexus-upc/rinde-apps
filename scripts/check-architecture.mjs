import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import ts from 'typescript';

const root = process.cwd();
const sourceRoot = path.join(root, 'src/app');
const { config, error } = ts.readConfigFile(path.join(root, 'tsconfig.json'), ts.sys.readFile);
if (error) throw new Error(ts.flattenDiagnosticMessageText(error.messageText, '\n'));
const options = ts.parseJsonConfigFileContent(config, ts.sys, root).options;
const normalize = (value) => value.replaceAll('\\', '/');
const relative = (value) => normalize(path.relative(sourceRoot, value));
const files = (directory) =>
  fs
    .readdirSync(directory, { withFileTypes: true })
    .flatMap((entry) =>
      entry.isDirectory()
        ? files(path.join(directory, entry.name))
        : [path.join(directory, entry.name)],
    );
const implementations = files(sourceRoot).filter(
  (file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'),
);
const findings = [];
const graph = new Map();
const fail = (file, message) => findings.push(`${relative(file)}: ${message}`);

function inspectImport(file, specifier, node) {
  if (specifier === '@angular/common/http' && ts.isImportDeclaration(node)) {
    const bindings = node.importClause?.namedBindings;
    const usesHttp =
      bindings &&
      ts.isNamedImports(bindings) &&
      bindings.elements.some((item) => (item.propertyName ?? item.name).text === 'HttpClient');
    if (
      usesHttp &&
      !relative(file).includes('/data-access/') &&
      relative(file) !== 'core/auth/auth-api.ts'
    ) {
      fail(file, 'HttpClient pertenece a data-access, no a páginas, vistas o servicios de estado.');
    }
  }
  const target = ts.resolveModuleName(specifier, file, options, ts.sys).resolvedModule
    ?.resolvedFileName;
  if (!target || !path.resolve(target).startsWith(path.resolve(sourceRoot) + path.sep)) return;
  graph.get(file).push(target);
  const from = relative(file),
    to = relative(target);
  if (from.startsWith('core/') && /^(features|layout)\//.test(to))
    fail(file, `core depende de ${to}.`);
  if (from.startsWith('shared/') && /^(features|core|layout)\//.test(to))
    fail(file, `shared depende de ${to}.`);
  const feature = from.match(/^features\/([^/]+)\//)?.[1];
  const dependency = to.match(/^features\/([^/]+)\//)?.[1];
  if (feature && dependency && feature !== dependency)
    fail(file, `dependencia directa entre funcionalidades: ${to}.`);
  if (from.includes('/models/') && specifier.startsWith('@angular/'))
    fail(file, 'Los modelos no dependen de Angular.');
  if (from.includes('/data-access/') && /\/(pages|state|ui)\//.test(to))
    fail(file, `data-access depende de ${to}.`);
  if (from.includes('/state/') && /\/(pages|ui)\//.test(to)) fail(file, `state depende de ${to}.`);
  if (from.includes('/pages/') && to.includes('/data-access/'))
    fail(file, `La página accede directamente a ${to}.`);
  if (
    from.includes('/ui/') &&
    (to.includes('/data-access/') ||
      to.includes('/state/') ||
      (to.startsWith('core/') && !to.endsWith('.models.ts')))
  )
    fail(file, `La vista depende de una capa de estado: ${to}.`);
}

for (const file of implementations) {
  graph.set(file, []);
  const content = fs.readFileSync(file, 'utf8');
  if (content.includes('document.getElementById('))
    fail(file, 'Usar referencias de vista o la directiva de foco.');
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true);
  const visit = (node) => {
    if (
      (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) &&
      node.moduleSpecifier &&
      ts.isStringLiteral(node.moduleSpecifier)
    ) {
      inspectImport(file, node.moduleSpecifier.text, node);
    } else if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments[0] &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      inspectImport(file, node.arguments[0].text, node);
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
}
for (const file of files(sourceRoot).filter((file) => file.endsWith('.html'))) {
  if (fs.readFileSync(file, 'utf8').includes('$any('))
    fail(file, 'Los eventos de la plantilla deben tener tipos explícitos.');
}
const visited = new Set(),
  active = new Set();
function detectCycle(file) {
  if (active.has(file)) {
    fail(file, 'Ciclo entre módulos.');
    return;
  }
  if (visited.has(file)) return;
  active.add(file);
  for (const target of graph.get(file) ?? []) if (graph.has(target)) detectCycle(target);
  active.delete(file);
  visited.add(file);
}
implementations.forEach(detectCycle);
if (findings.length) {
  console.error(findings.join('\n'));
  process.exitCode = 1;
} else
  console.log(
    `Arquitectura verificada: ${implementations.length} archivos, sin ciclos ni dependencias prohibidas.`,
  );
