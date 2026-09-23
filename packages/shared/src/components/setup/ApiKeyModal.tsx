import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { KeyRound, Eye, EyeOff, X, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedInputWrapper';
import { LanguageSelector } from '@/components/ui/LanguageSelector';
import { GoogleGenAI } from '@google/genai';

interface ApiKeyModalProps {
  open: boolean;
  onSave: (key: string) => void;
  onClose?: () => void;
  dismissable?: boolean;
}

function ApiKeyModal({ open, onSave, onClose, dismissable = false }: ApiKeyModalProps) {
  const { t } = useTranslation();
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState<'minError' | 'invalidError' | null>(null);
  const [validating, setValidating] = useState(false);

  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const dialog = dialogRef.current;
    const focusInput = () => dialog?.querySelector<HTMLInputElement>('input')?.focus();
    const containFocus = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog?.contains(event.target)) focusInput();
    };
    const cycleFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = dialog?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), input, select, a[href]',
      );
      if (!controls?.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (!dialog?.contains(document.activeElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first)?.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', cycleFocus);
    document.addEventListener('focusin', containFocus);
    focusInput();
    return () => {
      document.removeEventListener('keydown', cycleFocus);
      document.removeEventListener('focusin', containFocus);
      document.body.style.overflow = previousOverflow;
      previousFocus?.focus();
    };
  }, [open]);

  if (!open) return null;

  const isValid = key.trim().length >= 10;

  const handleSave = async () => {
    if (validating) return;
    const trimmed = key.trim();
    if (trimmed.length < 10) {
      setError('minError');
      return;
    }

    setError(null);
    dialogRef.current?.querySelector<HTMLInputElement>('input')?.focus();
    setValidating(true);

    try {
      const ai = new GoogleGenAI({ apiKey: trimmed });
      await ai.models.list({ config: { pageSize: 1 } });
      onSave(trimmed);
    } catch {
      setError('invalidError');
    } finally {
      setValidating(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      onKeyDown={(event) => {
        if (event.key === 'Escape' && dismissable && onClose) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-[#252720]/30 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={t('setup.apiTitle')}
      data-testid="api-key-modal"
    >
      <div className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-white rounded-3xl border border-white/80 shadow-[0_24px_100px_#25272025] w-full max-w-md animate-[fadeSlideIn_0.3s_ease-out]">
        <div className="p-6 sm:p-8 space-y-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center">
                <KeyRound className="text-primary" size={21} strokeWidth={1.7} />
              </div>
              <div>
                <h2 className="font-semibold tracking-tight text-text text-xl">
                  {t('setup.apiTitle')}
                </h2>
                <p className="text-xs mt-1 text-text-muted">{t('setup.apiSubtitle')}</p>
              </div>
            </div>
            {dismissable && onClose && (
              <button
                onClick={onClose}
                aria-label={t('a11y.closeModal')}
                data-testid="close-modal-btn"
                className="p-2 rounded-lg text-text-muted hover:bg-slate-100 transition-colors"
              >
                <X size={18} />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <label htmlFor="api-key-input" className="text-sm font-medium text-slate-700">
              {t('setup.apiKeyLabel')}
            </label>
            <AnimatedInputWrapper error={!!error}>
              <input
                id="api-key-input"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError(null);
                }}
                onKeyDown={(e) => e.key === 'Enter' && isValid && handleSave()}
                placeholder={t('setup.apiKeyPlaceholder')}
                aria-invalid={!!error}
                aria-describedby={error ? 'api-key-error' : undefined}
                aria-label={t('setup.apiKeyLabel')}
                data-testid="api-key-input"
                className="w-full bg-transparent px-4 py-2.5 pr-10 text-sm text-slate-700 outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? t('setup.hideKey') : t('setup.showKey')}
                data-testid="toggle-key-visibility"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text z-20"
              >
                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </AnimatedInputWrapper>
            {error && (
              <p id="api-key-error" role="alert" className="text-xs text-danger">
                {t(`setup.${error}`)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs leading-relaxed text-text-muted space-y-2">
            <p className="flex gap-2">
              <ShieldCheck size={15} className="mt-0.5 shrink-0 text-success" />
              {t('setup.keyStorageInfo')}
            </p>
            <p>
              {t('setup.keyIssue')}{' '}
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-medium"
              >
                Google AI Studio
              </a>
            </p>
          </div>

          <LanguageSelector testId="setup-language-select" />

          <Button
            onClick={handleSave}
            disabled={validating}
            loading={validating}
            className="w-full"
            size="lg"
            aria-label={t('setup.saveAndContinue')}
            data-testid="save-api-key-btn"
          >
            {validating ? t('setup.validating') : t('setup.saveAndContinue')}
          </Button>
        </div>
      </div>
    </div>
  );
}

export { ApiKeyModal };
export type { ApiKeyModalProps };
