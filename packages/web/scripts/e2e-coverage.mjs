import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import coverage from 'istanbul-lib-coverage';
const { createCoverageMap } = coverage;
import libReport from 'istanbul-lib-report';
import reports from 'istanbul-reports';
import sourceMaps from 'istanbul-lib-source-maps';
import instrumentation from 'istanbul-lib-instrument';
const { createInstrumenter } = instrumentation;
import ts from 'typescript';

const webRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const output = path.join(webRoot, 'coverage/e2e');
let map = createCoverageMap({});
for (const entry of fs.readdirSync(path.join(output, 'raw'))) {
  if (entry.endsWith('.json')) map.merge(JSON.parse(fs.readFileSync(path.join(output, 'raw', entry), 'utf8')));
}
map = await sourceMaps.createSourceMapStore().transformCoverage(map);
function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'msw' ? [] : walk(absolute);
    return /\.(ts|tsx)$/.test(entry.name) && !/\.d\.ts$|\.test\./.test(entry.name) ? [absolute] : [];
  });
}
// Unvisited production modules stay in the denominator. Only declarations, tests,
// and the MSW test support folder are excluded; no production branch is ignored.
const missingFiles = [];
for (const filename of [...walk(path.resolve(webRoot, '../shared/src')), ...walk(path.join(webRoot, 'src'))]) {
  if (map.files().includes(filename)) continue;
  const transpiled = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX, sourceMap: true, inlineSources: true },
    fileName: filename,
  });
  const instrumenter = createInstrumenter({ esModules: true });
  const sourceMap = JSON.parse(transpiled.sourceMapText);
  sourceMap.sources = [filename];
  instrumenter.instrumentSync(transpiled.outputText, filename, sourceMap);
  map.addFileCoverage(instrumenter.lastFileCoverage());
  missingFiles.push(path.relative(path.resolve(webRoot, '../..'), filename));
}
map = await sourceMaps.createSourceMapStore().transformCoverage(map);
const context = libReport.createContext({ dir: output, coverageMap: map });
for (const reporter of ['text-summary', 'json', 'json-summary', 'html', 'lcovonly']) {
  reports.create(reporter).execute(context);
}
const uncoveredBranches = map.files().flatMap((filename) => {
  const file = map.fileCoverageFor(filename);
  return Object.entries(file.branchMap).flatMap(([id, branch]) =>
    file.b[id].flatMap((hits, arm) => hits > 0 ? [] : [{
      file: path.relative(path.resolve(webRoot, '../..'), filename),
      line: branch.locations[arm]?.start?.line ?? branch.loc.start.line,
      type: branch.type,
      arm,
      hits,
    }]),
  );
});
fs.writeFileSync(path.join(output, 'uncovered-branches.json'), JSON.stringify(uncoveredBranches, null, 2));
const summary = map.getCoverageSummary().toJSON();
const unvisited = missingFiles.filter((filename) => !filename.includes('/types/'));
const record = { sourceScope: 'All shared and web runtime TypeScript/TSX sources', thresholds: { branches: 100 }, passed: summary.branches.covered === summary.branches.total, summary, unvisited };
fs.writeFileSync(path.join(output, 'gate.json'), JSON.stringify(record, null, 2));
console.log(`E2E source branch coverage: ${summary.branches.covered}/${summary.branches.total} (${summary.branches.pct}%). Required: 100%.`);
if (process.env.E2E_ENFORCE_COVERAGE === '1' && !record.passed) {
  console.error('The 100% source branch completion gate is NOT met. See coverage/e2e/index.html and gate.json.');
  process.exitCode = 1;
}
