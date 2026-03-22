import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Brain, TrendingUp, Globe, Users, ChevronDown, ChevronUp } from 'lucide-react';
import type { LLMStrategy, PersonaInsight } from '@/types/domain';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Loader } from '@/components/ui/Loader';
import { cn } from '@/utils/cn';

interface StrategyStageProps {
  strategy: LLMStrategy | null;
  loading: boolean;
  error: string | null;
  onContinue: () => void;
  onRetry: () => void;
  onBack: () => void;
}

const PERSONA_COLORS: Record<string, { bg: string; text: string }> = {
  'Market Analyst': { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  'Art Director': { bg: 'bg-teal-100', text: 'text-teal-700' },
  'Cultural Expert': { bg: 'bg-green-100', text: 'text-green-700' },
  'Chief Creative Director': { bg: 'bg-lime-100', text: 'text-lime-700' },
};

function getPersonaColor(persona: string) {
  return PERSONA_COLORS[persona] ?? { bg: 'bg-slate-100', text: 'text-slate-600' };
}

function StrategyStage({
  strategy,
  loading,
  error,
  onContinue,
  onRetry,
  onBack,
}: StrategyStageProps) {
  const { t } = useTranslation();
  const [expandedInsights, setExpandedInsights] = useState<Record<number, boolean>>({});

  const toggleInsight = (index: number) => {
    setExpandedInsights((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  if (loading) {
    return (
      <section data-stage="strategy" data-phase="loading" className="flex flex-col items-center justify-center min-h-[50vh]">
        <Loader title={t('strategy.analyzing')} text={t('strategy.analyzingDesc')} size="xl" />
      </section>
    );
  }

  if (error && !strategy) {
    return (
      <section data-stage="strategy" data-phase="error" className="max-w-2xl mx-auto space-y-6">
        <div className="bg-danger-light border border-red-200 rounded-xl p-6 text-center space-y-4">
          <p role="alert" className="text-danger font-medium">
            {error}
          </p>
          <Button
            variant="outline"
            onClick={onRetry}
            aria-label="Retry analysis"
            data-testid="retry-btn"
          >
            {t('strategy.retryAnalysis')}
          </Button>
        </div>
        <Button variant="outline" onClick={onBack} aria-label="Go back" data-testid="back-btn">
          {t('strategy.back')}
        </Button>
      </section>
    );
  }

  if (!strategy) return null;

  return (
    <section data-stage="strategy" data-phase="complete" className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <Brain size={14} />
          {t('strategy.panel')}
        </div>
        <h2 className="text-3xl font-bold text-text">{t('strategy.title')}</h2>
        <p className="text-text-muted">{t('strategy.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {strategy.culturalNotes && (
          <CollapsibleStrategyCard
            title={t('strategy.culturalNotes')}
            icon={<Globe className="w-5 h-5 text-green-700" />}
            iconBg="bg-green-100"
          >
            <p className="text-sm text-text-muted leading-relaxed break-words whitespace-normal">
              {strategy.culturalNotes}
            </p>
          </CollapsibleStrategyCard>
        )}

        {strategy.salesReasoning && (
          <CollapsibleStrategyCard
            title={t('strategy.salesReasoning')}
            icon={<TrendingUp className="w-5 h-5 text-lime-700" />}
            iconBg="bg-lime-100"
          >
            <p className="text-sm text-text-muted leading-relaxed break-words whitespace-normal">
              {strategy.salesReasoning}
            </p>
          </CollapsibleStrategyCard>
        )}

        {strategy.personaInsights && strategy.personaInsights.length > 0 && (
          <>
            <div className="flex items-center gap-2 px-1">
              <Users className="w-4 h-4 text-text-muted" />
              <h3 className="font-bold text-slate-700 text-xs uppercase tracking-wide">
                {t('strategy.expertInsights')}
              </h3>
            </div>
            {strategy.personaInsights.map((insight: PersonaInsight, index: number) => {
              const isExpanded = expandedInsights[index] ?? false;
              const colors = getPersonaColor(insight.persona);

              return (
                <Card key={index} className="overflow-hidden">
                  <button
                    onClick={() => toggleInsight(index)}
                    aria-expanded={isExpanded}
                    aria-label={`${insight.persona} insight`}
                    data-testid={`persona-${index}`}
                    className="w-full p-4 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
                  >
                    <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', colors.bg)}>
                      <Users className={cn('w-4 h-4', colors.text)} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-slate-900 text-sm">{insight.persona}</h4>
                        <div className="shrink-0 text-slate-400">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </div>
                      </div>

                      {!isExpanded && (
                        <p className="text-xs text-text-muted truncate mt-1">{insight.analysis}</p>
                      )}

                      {isExpanded && (
                        <p className="text-sm text-text-muted leading-relaxed pt-3 border-t border-slate-100 mt-3 break-words whitespace-normal">
                          {insight.analysis}
                        </p>
                      )}
                    </div>
                  </button>
                </Card>
              );
            })}
          </>
        )}
      </div>

      <div className="flex justify-between pt-6">
        <Button variant="outline" onClick={onBack} aria-label="Go back" data-testid="back-btn">
          {t('strategy.back')}
        </Button>
        <Button
          onClick={onContinue}
          size="lg"
          aria-label="Continue to character generation"
          data-testid="continue-btn"
        >
          {t('strategy.next')}
        </Button>
      </div>
    </section>
  );
}

function CollapsibleStrategyCard({
  title,
  icon,
  iconBg,
  children,
  defaultExpanded = false,
  badge,
}: {
  title: string;
  icon: React.ReactNode;
  iconBg: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
  badge?: string;
}) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <Card className="overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-start gap-3 text-left hover:bg-slate-50 transition-colors"
        aria-expanded={expanded}
      >
        <div className={cn('p-2 rounded-lg shrink-0 mt-0.5', iconBg)}>{icon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
            {badge && (
              <span className="bg-primary-100 text-primary-800 text-xs font-semibold px-2.5 py-0.5 rounded-full whitespace-nowrap ml-auto mr-2">
                {badge}
              </span>
            )}
            <div className="shrink-0 text-slate-400">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </div>
          </div>
          {!expanded && (
            <p className="text-xs text-text-muted truncate mt-1">
              <span className="hidden sm:inline">Click for details / </span>클릭하여 상세 내용 확인
            </p>
          )}
          {expanded && (
            <div className="mt-3 pt-3 border-t border-slate-100 animate-fade-in">{children}</div>
          )}
        </div>
      </button>
    </Card>
  );
}

export { StrategyStage };
export type { StrategyStageProps };
