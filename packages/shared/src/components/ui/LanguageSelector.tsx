import { useId } from 'react';
import { Languages } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { LANGUAGE_OPTIONS } from '@/constants/languages';
import { setInterfaceLanguage } from '@/i18n';
import { normalizeLocale } from '@/i18n/locale';
import { cn } from '@/utils/cn';

export function LanguageSelector({
  testId = 'language-select',
  className,
}: {
  testId?: string;
  className?: string;
}) {
  const { t, i18n } = useTranslation();
  const id = useId();
  return (
    <div
      className={cn(
        'relative flex min-h-10 items-center rounded-xl border border-slate-200 bg-white text-slate-700',
        className,
      )}
    >
      <label htmlFor={id} className="sr-only">
        {t('language.interface')}
      </label>
      <Languages size={15} aria-hidden="true" className="pointer-events-none absolute left-2.5" />
      <select
        id={id}
        value={normalizeLocale(i18n.resolvedLanguage) ?? 'en'}
        data-testid={testId}
        onChange={(event) => {
          const locale = normalizeLocale(event.target.value);
          if (locale) void setInterfaceLanguage(locale);
        }}
        className="min-h-10 w-full cursor-pointer rounded-xl bg-transparent py-2 pl-8 pr-2 text-xs font-medium outline-offset-2"
      >
        {LANGUAGE_OPTIONS.map((language) => (
          <option key={language.code} value={language.code} lang={language.code}>
            {language.nativeName}
          </option>
        ))}
      </select>
    </div>
  );
}
