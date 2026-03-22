import chalk from 'chalk';
import type {
  OutputEvent,
  ProgressEvent,
  ConfirmEvent,
  ResultEvent,
  ErrorEvent,
} from '../types/cli.js';

let jsonMode = false;

export function setJsonMode(enabled: boolean): void {
  jsonMode = enabled;
}

export function isJsonMode(): boolean {
  return jsonMode;
}

// ---------------------------------------------------------------------------
// JSON Output (NDJSON — one JSON object per line)
// ---------------------------------------------------------------------------

export function emitJson(event: OutputEvent): void {
  process.stdout.write(JSON.stringify(event) + '\n');
}

// ---------------------------------------------------------------------------
// Human-friendly Output
// ---------------------------------------------------------------------------

const STAGE_LABELS: Record<string, string> = {
  setup: 'Setup',
  input: 'Input',
  'concept-analysis': 'Strategy',
  'character-generation': 'Character',
  'style-selection': 'Style Selection',
  'emote-ideation': 'Emote Ideation',
  'sticker-generation': 'Emoji Generation',
  'post-processing': 'Post Processing',
  'metadata-generation': 'Metadata',
  export: 'Export',
};

const STAGE_ICONS: Record<string, string> = {
  started: chalk.yellow('...'),
  running: chalk.yellow('...'),
  complete: chalk.green('OK'),
};

export function printBanner(): void {
  if (jsonMode) return;
  console.log(chalk.bold.cyan('\n  Emoji Master CLI') + chalk.dim(' v0.1.0'));
  console.log(chalk.dim('  ' + '='.repeat(36)) + '\n');
}

export function printProgress(event: ProgressEvent): void {
  if (jsonMode) {
    emitJson(event);
    return;
  }

  const label = STAGE_LABELS[event.stage] ?? event.stage;
  const icon = STAGE_ICONS[event.status] ?? '...';

  if (event.current !== undefined && event.total !== undefined && event.total > 1) {
    console.log(
      `  ${chalk.dim('[')}${icon}${chalk.dim(']')} ${label} ${chalk.dim(`(${event.current}/${event.total})`)} ${chalk.dim(event.message)}`,
    );
  } else {
    console.log(`  ${chalk.dim('[')}${icon}${chalk.dim(']')} ${label} ${chalk.dim(event.message)}`);
  }
}

export function printConfirm(event: ConfirmEvent): void {
  if (jsonMode) {
    emitJson(event);
    return;
  }

  console.log('');
  console.log(chalk.yellow.bold('  >> Confirmation Required'));
  console.log(chalk.dim(`     ${event.message}`));
  console.log('');
}

export function printResult(event: ResultEvent): void {
  if (jsonMode) {
    emitJson(event);
    return;
  }

  console.log('');
  console.log(chalk.green.bold('  Done!'));
  console.log(`  ${chalk.dim('Session:')} ${event.session_id}`);
  console.log(`  ${chalk.dim('Output:')}  ${event.output_dir}`);
  console.log(`  ${chalk.dim('Emoji:')} ${event.sticker_count}`);
  console.log(`  ${chalk.dim('Time:')}    ${event.elapsed_time}`);

  for (const [platform, path] of Object.entries(event.exports)) {
    console.log(`  ${chalk.dim(platform + ':')} ${path}`);
  }
  console.log('');
}

export function printError(event: ErrorEvent): void {
  if (jsonMode) {
    emitJson(event);
    return;
  }

  console.error('');
  console.error(chalk.red.bold(`  Error: ${event.message}`));
  if (event.stage) {
    console.error(chalk.dim(`  Stage: ${event.stage}`));
  }
  if (event.retryable) {
    console.error(chalk.dim('  This error is retryable.'));
  }
  console.error('');
}

export function printInfo(message: string): void {
  if (jsonMode) return;
  console.log(chalk.dim(`  ${message}`));
}

export function printWarn(message: string): void {
  if (jsonMode) return;
  console.log(chalk.yellow(`  Warning: ${message}`));
}
