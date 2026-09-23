import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const locales = ['en', 'ko', 'ja', 'zh-CN', 'zh-TW'];
const directory = path.join(root, 'packages/shared/src/i18n/locales');
const review = JSON.parse(fs.readFileSync(path.join(root, 'docs/localization/review-manifest.json'), 'utf8'));
const contract = JSON.parse(fs.readFileSync(path.join(root, 'docs/localization/message-contract.json'), 'utf8'));

function flatten(value, prefix = '') {
  return Object.fromEntries(Object.entries(value).flatMap(([key, child]) => {
    const name = prefix ? `${prefix}.${key}` : key;
    return typeof child === 'string' ? [[name, child]] : Object.entries(flatten(child, name));
  }));
}
function tokens(value) { return [...value.matchAll(/{{\s*([^}]+?)\s*}}/g)].map((match) => match[1]).sort().join(','); }
function canonical(value) {
  if (typeof value !== 'object' || value === null) return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
}
const expected = flatten(contract);
const errors = [];
const actualFiles = fs.readdirSync(directory).filter((name) => name.endsWith('.json')).sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(locales.map((locale) => `${locale}.json`).sort())) errors.push('Only the five approved locale files may be shipped.');
for (const locale of locales) {
  const document = JSON.parse(fs.readFileSync(path.join(directory, `${locale}.json`), 'utf8'));
  const messages = flatten(document);
  for (const [key, source] of Object.entries(expected)) {
    if (!messages[key]?.trim()) errors.push(`${locale}: missing or empty ${key}`);
    else if (tokens(source) !== tokens(messages[key])) errors.push(`${locale}: interpolation mismatch in ${key}`);
  }
  for (const [key, value] of Object.entries(messages)) {
    const base = key.replace(/_(?:zero|one|two|few|many|other)$/, '');
    if (!(key in expected) && !(base in expected)) errors.push(`${locale}: unreviewed message contract ${key}`);
    if (!value.trim()) errors.push(`${locale}: empty ${key}`);
    if (base in expected && tokens(expected[base]) !== tokens(value)) errors.push(`${locale}: plural interpolation mismatch in ${key}`);
  }
  const approval = review.locales[locale];
  const hash = createHash('sha256').update(canonical(document)).digest('hex');
  if (approval?.status !== 'PASS' || approval.sha256 !== hash) errors.push(`${locale}: content differs from its approved language review; obtain an agent review before updating the approval.`);
  if (!approval?.report || !fs.existsSync(path.join(root, approval.report))) errors.push(`${locale}: language review report is missing.`);
  console.log(`${locale}: ${Object.keys(messages).length} messages checked`);
}
const guidance = review.generatedWritingGuidance;
if (guidance?.status !== 'PASS' || !guidance.source || !guidance.report) {
  errors.push('Generated writing guidance requires an agent review.');
} else {
  const source = path.join(root, guidance.source);
  const digest = fs.existsSync(source) ? createHash('sha256').update(fs.readFileSync(source, 'utf8').replace(/\r\n/g, '\n')).digest('hex') : null;
  if (digest !== guidance.sha256 || !fs.existsSync(path.join(root, guidance.report))) errors.push('Generated writing guidance differs from its approved agent review.');
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exitCode = 1;
} else {
  console.log('PASS: five complete locale catalogs match their approved language reviews.');
}
