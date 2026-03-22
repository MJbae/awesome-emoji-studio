import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, Eye, EyeOff, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AnimatedInputWrapper } from '@/components/ui/AnimatedInputWrapper';
import { generateText } from '@/services/gemini/client';

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
  const [error, setError] = useState<string | null>(null);
  const [validating, setValidating] = useState(false);

  if (!open) return null;

  const isValid = key.trim().length >= 10;

  const handleSave = async () => {
    const trimmed = key.trim();
    if (trimmed.length < 10) {
      setError(t('setup.minError'));
      return;
    }

    setError(null);
    setValidating(true);

    try {
      await generateText({ contents: 'hi' }, trimmed);
      onSave(trimmed);
    } catch {
      setError(t('setup.invalidError'));
    } finally {
      setValidating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Gemini API Key Setup"
      data-testid="api-key-modal"
    >
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md animate-[fadeSlideIn_0.3s_ease-out]">
        <div className="p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                <Sparkles className="text-primary" size={20} />
              </div>
              <div>
                <h2 className="font-bold text-text text-lg">{t('setup.apiTitle')}</h2>
                <p className="text-sm text-text-muted">{t('setup.apiSubtitle')}</p>
              </div>
            </div>
            {dismissable && onClose && (
              <button
                onClick={onClose}
                aria-label="Close modal"
                data-testid="close-modal-btn"
                className="p-1 rounded-lg text-text-muted hover:bg-slate-100 transition-colors"
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
              <p role="alert" className="text-xs text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-xs text-text-muted space-y-1">
            <p>{t('setup.keyStorageInfo')}</p>
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

          <Button
            onClick={handleSave}
            disabled={validating}
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
