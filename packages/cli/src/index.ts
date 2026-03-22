#!/usr/bin/env node

import { Command } from 'commander';
import { setJsonMode } from './io/output.js';
import { generate } from './commands/generate.js';
import { configSetKey, configGetKey, configDeleteKey } from './commands/config.js';

const program = new Command();

program
  .name('emoji-cli')
  .description('AI-powered emoji pack creator — CLI for macOS')
  .version('0.1.0');

// ---------------------------------------------------------------------------
// generate command
// ---------------------------------------------------------------------------

program
  .command('generate')
  .description('Run the full emoji generation pipeline')
  .requiredOption('-c, --concept <text>', 'Emoji concept description')
  .option('-l, --language <lang>', 'Target market (ko, ja, zh-TW)', 'ko')
  .option('--reference-image <path>', 'Path to reference image')
  .option('--api-key <key>', 'Gemini API key (overrides config)')
  .option('--platforms <list>', 'Target platforms (comma-separated or "all")', 'all')
  .option('--bg-removal', 'Enable background removal', true)
  .option('--no-bg-removal', 'Disable background removal')
  .option('--outline <style>', 'Outline style (none, white, black)', 'white')
  .option('--outline-thickness <px>', 'Outline thickness in pixels', '3')
  .option('--outline-opacity <pct>', 'Outline opacity (0-100)', '100')
  .option('--auto', 'Auto mode — approve all confirmations automatically', false)
  .option('--json', 'Output structured JSON (NDJSON) for AI consumption', false)
  .option('-o, --output <dir>', 'Output directory', './output')
  .option('-v, --verbose', 'Verbose logging', false)
  .action(async (opts) => {
    if (opts.json) setJsonMode(true);
    await generate(opts);
  });

// ---------------------------------------------------------------------------
// config command
// ---------------------------------------------------------------------------

const configCmd = program.command('config').description('Manage CLI configuration');

configCmd
  .command('set-key <key>')
  .description('Set Gemini API key')
  .option('--json', 'JSON output', false)
  .action(async (key, opts) => {
    if (opts.json) setJsonMode(true);
    await configSetKey(key);
  });

configCmd
  .command('get-key')
  .description('Show current API key (masked)')
  .option('--json', 'JSON output', false)
  .action(async (opts) => {
    if (opts.json) setJsonMode(true);
    await configGetKey();
  });

configCmd
  .command('delete-key')
  .description('Delete stored API key')
  .option('--json', 'JSON output', false)
  .action(async (opts) => {
    if (opts.json) setJsonMode(true);
    await configDeleteKey();
  });

// ---------------------------------------------------------------------------
// Parse and run
// ---------------------------------------------------------------------------

program.parse();
