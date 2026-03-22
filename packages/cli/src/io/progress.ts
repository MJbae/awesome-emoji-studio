import ora, { type Ora } from 'ora';
import type { ProgressEvent } from '../types/cli.js';
import { isJsonMode, emitJson } from './output.js';

let spinner: Ora | null = null;

export function startSpinner(message: string): void {
  if (isJsonMode()) return;
  spinner = ora({ text: message, indent: 2 }).start();
}

export function updateSpinner(message: string): void {
  if (isJsonMode()) return;
  if (spinner) {
    spinner.text = message;
  }
}

export function succeedSpinner(message: string): void {
  if (isJsonMode()) return;
  if (spinner) {
    spinner.succeed(message);
    spinner = null;
  }
}

export function failSpinner(message: string): void {
  if (isJsonMode()) return;
  if (spinner) {
    spinner.fail(message);
    spinner = null;
  }
}

export function stopSpinner(): void {
  if (spinner) {
    spinner.stop();
    spinner = null;
  }
}

export function reportProgress(event: ProgressEvent): void {
  if (isJsonMode()) {
    emitJson(event);
    return;
  }

  const { stage, status, current, total, message } = event;

  if (status === 'started') {
    startSpinner(message);
  } else if (status === 'running' && current !== undefined && total !== undefined) {
    updateSpinner(`${message} (${current}/${total})`);
  } else if (status === 'complete') {
    succeedSpinner(message);
  }
}
