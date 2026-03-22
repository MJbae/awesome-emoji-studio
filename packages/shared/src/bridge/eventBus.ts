// ===================================================================
// Event Bus — CustomEvent publishing/subscribing for pipeline events
// ===================================================================

export type EmoticonEventType =
  | 'emoticon:stage-change'
  | 'emoticon:progress'
  | 'emoticon:job-complete'
  | 'emoticon:job-error'
  | 'emoticon:sticker-generated';

// Uses queueMicrotask to prevent pipeline blocking during event dispatch
export function emitEvent(type: EmoticonEventType, detail: unknown): void {
  queueMicrotask(() => {
    window.dispatchEvent(new CustomEvent(type, { detail }));
  });
}

export function onEvent(
  type: EmoticonEventType,
  handler: (e: CustomEvent) => void,
): () => void {
  const listener = handler as EventListener;
  window.addEventListener(type, listener);
  return () => {
    window.removeEventListener(type, listener);
  };
}
