import { test, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const temporary = [];
afterEach(() => { for (const directory of temporary.splice(0)) fs.rmSync(directory, { recursive: true, force: true }); });
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'emoji-locale-gate-'));
  temporary.push(directory);
  fs.mkdirSync(path.join(directory, 'scripts'), { recursive: true });
  fs.cpSync(path.join(root, 'scripts/check-locales.mjs'), path.join(directory, 'scripts/check-locales.mjs'));
  fs.cpSync(path.join(root, 'packages/shared/src/i18n/locales'), path.join(directory, 'packages/shared/src/i18n/locales'), { recursive: true });
  fs.cpSync(path.join(root, 'docs/localization'), path.join(directory, 'docs/localization'), { recursive: true, filter: (file) => !file.includes('screenshots') });
  const guidanceSource = 'packages/shared/src/services/gemini/prompts/writingGuidance.ts';
  fs.mkdirSync(path.dirname(path.join(directory, guidanceSource)), { recursive: true });
  fs.copyFileSync(path.join(root, guidanceSource), path.join(directory, guidanceSource));
  return directory;
}
function run(directory) { return spawnSync(process.execPath, ['scripts/check-locales.mjs'], { cwd: directory, encoding: 'utf8' }); }
function change(directory, locale, edit) {
  const filename = path.join(directory, `packages/shared/src/i18n/locales/${locale}.json`);
  const data = JSON.parse(fs.readFileSync(filename, 'utf8')); edit(data); fs.writeFileSync(filename, JSON.stringify(data));
}

test('approved catalogs pass even after formatting-only changes', () => {
  const directory = fixture();
  change(directory, 'ko', () => {});
  assert.equal(run(directory).status, 0);
});
test('unreviewed wording fails the approval gate', () => {
  const directory = fixture();
  change(directory, 'ko', (data) => { data.input.title += ' 수정'; });
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /content differs from its approved language review/);
});
test('missing messages fail the completeness gate', () => {
  const directory = fixture();
  change(directory, 'ja', (data) => { delete data.input.title; });
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /missing or empty input.title/);
});
test('interpolation mistakes fail the message contract', () => {
  const directory = fixture();
  change(directory, 'zh-TW', (data) => { data.postprocess.applyCount = '套用至 {{wrong}} 張圖片'; });
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /interpolation mismatch in postprocess.applyCount/);
});
test('adding an unapproved sixth language fails the language set gate', () => {
  const directory = fixture();
  fs.writeFileSync(path.join(directory, 'packages/shared/src/i18n/locales/th.json'), '{}');
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Only the five approved locale files/);
});

test('unreviewed generated-language guidance fails the approval gate', () => {
  const directory = fixture();
  fs.appendFileSync(path.join(directory, 'packages/shared/src/services/gemini/prompts/writingGuidance.ts'), '\n// changed writing guidance');
  const result = run(directory);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Generated writing guidance differs/);
});

test('Windows line endings preserve the approved writing guidance', () => {
  const directory = fixture();
  const filename = path.join(directory, 'packages/shared/src/services/gemini/prompts/writingGuidance.ts');
  fs.writeFileSync(filename, fs.readFileSync(filename, 'utf8').replace(/\r?\n/g, '\r\n'));
  assert.equal(run(directory).status, 0);
});
