import { createInterface } from 'node:readline';
import type {
  ConfirmCheckpoint,
  ConfirmPreview,
  ConfirmAction,
  ConfirmResponseEvent,
  ConfirmEvent,
} from '../types/cli.js';
import { isJsonMode, emitJson, printConfirm } from './output.js';

// ---------------------------------------------------------------------------
// Confirm Request/Response
// ---------------------------------------------------------------------------

export interface ConfirmRequest {
  checkpoint: ConfirmCheckpoint;
  message: string;
  preview: ConfirmPreview;
  options: ConfirmAction[];
}

export interface ConfirmResult {
  action: ConfirmAction;
  selectedOption?: number;
  reason?: string;
}

// ---------------------------------------------------------------------------
// Core Confirm Function
// ---------------------------------------------------------------------------

export async function requestConfirm(
  req: ConfirmRequest,
  mode: 'interactive' | 'auto',
): Promise<ConfirmResult> {
  const event: ConfirmEvent = {
    type: 'confirm',
    checkpoint: req.checkpoint,
    message: req.message,
    preview: req.preview,
    options: req.options,
    awaiting_input: mode !== 'auto',
  };

  // Auto mode: approve immediately
  if (mode === 'auto') {
    event.auto_approved = true;

    if (req.checkpoint === 'metadata' && req.preview.metadataOptions) {
      const result: ConfirmResult = { action: 'approve', selectedOption: 0 };
      if (isJsonMode()) emitJson({ ...event, auto_approved: true });
      return result;
    }

    if (isJsonMode()) emitJson({ ...event, auto_approved: true });
    return { action: 'approve' };
  }

  // JSON mode: emit confirm event and wait for stdin response
  if (isJsonMode()) {
    return awaitStdinJson(event);
  }

  // Interactive mode: prompt user in terminal
  return promptUser(req);
}

// ---------------------------------------------------------------------------
// JSON stdin/stdout protocol
// ---------------------------------------------------------------------------

async function awaitStdinJson(event: ConfirmEvent): Promise<ConfirmResult> {
  emitJson(event);

  return new Promise<ConfirmResult>((resolve, reject) => {
    const rl = createInterface({ input: process.stdin });

    const timeout = setTimeout(() => {
      rl.close();
      reject(new Error('Confirmation timeout: no response received within 5 minutes'));
    }, 5 * 60 * 1000);

    rl.once('line', (line) => {
      clearTimeout(timeout);
      rl.close();

      try {
        const response = JSON.parse(line.trim()) as ConfirmResponseEvent;
        resolve({
          action: response.action ?? 'approve',
          selectedOption: response.selectedOption,
          reason: response.reason,
        });
      } catch {
        resolve({ action: 'approve' });
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Interactive terminal prompt
// ---------------------------------------------------------------------------

async function promptUser(req: ConfirmRequest): Promise<ConfirmResult> {
  printConfirm({
    type: 'confirm',
    checkpoint: req.checkpoint,
    message: req.message,
    preview: req.preview,
    options: req.options,
    awaiting_input: true,
  });

  const optionLabels: Record<ConfirmAction, string> = {
    approve: 'Approve and continue',
    reject: 'Reject and stop',
    regenerate: 'Regenerate',
    reprocess: 'Reprocess with different options',
  };

  const availableOptions = req.options.filter(
    (o): o is ConfirmAction => o in optionLabels,
  );

  for (let i = 0; i < availableOptions.length; i++) {
    const label = optionLabels[availableOptions[i]!];
    const isDefault = i === 0;
    console.log(
      `     (${i + 1}) ${label}${isDefault ? ' [default]' : ''}`,
    );
  }

  // For metadata checkpoint, show option selection
  if (req.checkpoint === 'metadata' && req.preview.metadataOptions) {
    console.log('');
    console.log('     Metadata options:');
    for (let i = 0; i < req.preview.metadataOptions.length; i++) {
      const meta = req.preview.metadataOptions[i]!;
      console.log(`       [${i + 1}] ${meta.optionType}: "${meta.title}"`);
      console.log(`           ${meta.description}`);
    }
  }

  const rl = createInterface({ input: process.stdin, output: process.stdout });

  return new Promise<ConfirmResult>((resolve) => {
    rl.question('\n     Select [1]: ', (answer) => {
      rl.close();
      const choice = parseInt(answer.trim() || '1', 10) - 1;
      const action = availableOptions[choice] ?? 'approve';

      if (req.checkpoint === 'metadata') {
        rl.question('     Select metadata option [1]: ', (metaAnswer) => {
          const metaChoice = parseInt(metaAnswer.trim() || '1', 10) - 1;
          resolve({ action, selectedOption: metaChoice });
        });
      } else {
        resolve({ action });
      }
    });
  });
}
