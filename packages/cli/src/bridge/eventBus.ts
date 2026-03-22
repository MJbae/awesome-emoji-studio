import { EventEmitter } from 'node:events';

export type EmoticonEventType =
  | 'emoticon:stage-change'
  | 'emoticon:progress'
  | 'emoticon:job-complete'
  | 'emoticon:job-error'
  | 'emoticon:sticker-generated';

const emitter = new EventEmitter();

export function emitEvent(type: EmoticonEventType, detail: unknown): void {
  queueMicrotask(() => {
    emitter.emit(type, detail);
  });
}

export function onEvent(
  type: EmoticonEventType,
  handler: (detail: unknown) => void,
): () => void {
  emitter.on(type, handler);
  return () => {
    emitter.off(type, handler);
  };
}
