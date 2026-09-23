import { useTranslation } from 'react-i18next';
import { Settings2, Smile, ArrowUpRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { LanguageSelector } from '@/components/ui/LanguageSelector';

interface AppShellProps {
  children: React.ReactNode;
  hasApiKey: boolean;
  onOpenSettings: () => void;
}

function AppShell({ children, hasApiKey, onOpenSettings }: AppShellProps) {
  const { t } = useTranslation();

  return (
    <div data-testid="app-shell" className="min-h-screen bg-surface-dark font-sans text-text">
      <a href="#studio-content" className="skip-link">
        {t('studio.skipToContent')}
      </a>
      <header className="border-b border-slate-200 bg-white/95">
        <div className="mx-auto flex h-20 max-w-[1440px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-10">
          <a href="/" className="flex min-w-0 items-center gap-3" aria-label={t('a11y.home')}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-primary text-white">
              <Smile size={25} strokeWidth={1.8} />
            </span>
            <div className="min-w-0">
              <h1 className="sr-only font-bold tracking-tight sm:not-sr-only sm:text-base">
                {t('app.title')}
              </h1>
              <p className="mt-0.5 hidden text-[10px] font-medium tracking-[0.12em] text-text-muted sm:block">
                {t('studio.brandTagline')}
              </p>
            </div>
          </a>
          <div className="flex shrink-0 items-center gap-2 sm:gap-4">
            <LanguageSelector className="w-32" />
            <button
              onClick={onOpenSettings}
              aria-label={t('a11y.apiSettings')}
              className="flex min-h-10 items-center gap-2 text-xs text-text-muted hover:text-text"
            >
              <span
                className={cn('h-1.5 w-1.5 rounded-full', hasApiKey ? 'bg-success' : 'bg-warning')}
              />
              <span role="status" aria-live="polite" className="hidden sm:inline">
                {hasApiKey ? t('app.apiConnected') : t('app.apiMissing')}
              </span>
            </button>
            <button
              onClick={onOpenSettings}
              aria-label={t('a11y.settings')}
              data-testid="settings-btn"
              className="flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50"
            >
              <Settings2 size={16} />
              <span className="hidden sm:inline">{t('studio.settings')}</span>
            </button>
          </div>
        </div>
      </header>
      <main
        id="studio-content"
        tabIndex={-1}
        className="mx-auto min-h-[calc(100vh-141px)] max-w-[1440px] px-5 outline-none sm:px-8 lg:px-10"
      >
        <div className="studio-workspace">{children}</div>
      </main>
      <footer className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-5 py-5 text-[11px] text-text-muted sm:px-8 lg:px-10">
        <span>{t('studio.footer')}</span>
        <span className="flex items-center gap-1.5">
          {t('studio.poweredBy')} <ArrowUpRight size={12} />
        </span>
      </footer>
    </div>
  );
}

export { AppShell };
export type { AppShellProps };
