import { Download, FileDown, Image as ImageIcon } from 'lucide-react';
import type { PlatformId, PlatformSpec } from '@/types/domain';
import { Button } from '@/components/ui/Button';

interface ExportStageProps {
  platforms: Record<PlatformId, PlatformSpec>;
  selectedPlatform: PlatformId;
  onPlatformChange: (platform: PlatformId) => void;
  stickerCount: number;
  isExporting: boolean;
  exportProgress: number;
  onExport: () => void;
  onBack: () => void;
}

function ExportStage({
  platforms: _platforms,
  selectedPlatform: _selectedPlatform,
  stickerCount,
  isExporting,
  exportProgress,
  onExport,
  onBack,
}: ExportStageProps) {
  void _platforms;
  void _selectedPlatform;

  return (
    <section data-stage="export" className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium">
          <FileDown size={14} />
          마지막 단계
        </div>
        <h2 className="text-3xl font-bold text-text">이모지 팩 내보내기</h2>
        <p className="text-text-muted">이모지 세트를 다운로드하세요.</p>
      </div>

      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <FileDown size={16} className="text-primary" />
          대상 플랫폼
        </h3>

        <div className="relative p-4 rounded-xl border-2 border-primary bg-primary/5">
          <p className="font-bold text-slate-800 text-sm">LINE Emoji</p>
          <p className="text-xs text-text-muted mb-3">LINE emoji format</p>

          <div className="space-y-1 text-[10px] text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
            <div className="flex justify-between">
              <span>콘텐츠</span>
              <span className="font-mono">180×180</span>
            </div>
            <div className="flex justify-between">
              <span>메인</span>
              <span className="font-mono">없음</span>
            </div>
            <div className="flex justify-between">
              <span>탭</span>
              <span className="font-mono">96×74</span>
            </div>
            <div className="flex justify-between pt-1 border-t border-dashed border-slate-300">
              <span>수량</span>
              <span className="font-mono">40</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-6">
        <div className="w-16 h-16 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center mx-auto">
          <Download size={32} />
        </div>

        <div>
          <h3 className="text-xl font-bold text-text">내보내기 준비 완료</h3>
          <p className="text-text-muted text-sm mt-1">
            {stickerCount}개 이모지가 LINE Emoji 형식으로 준비됨
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto text-left">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <ImageIcon className="text-slate-400 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-slate-700 text-sm">{stickerCount}개 이미지</p>
              <p className="text-xs text-text-muted">PNG 형식</p>
            </div>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
            <FileDown className="text-slate-400 shrink-0" size={20} />
            <div>
              <p className="font-semibold text-slate-700 text-sm">ZIP 파일</p>
              <p className="text-xs text-text-muted">+ metadata.json</p>
            </div>
          </div>
        </div>

        {isExporting ? (
          <div className="w-full max-w-md mx-auto space-y-2">
            <progress
              value={exportProgress}
              max={100}
              aria-valuetext={`Export progress: ${exportProgress}%`}
              aria-label="Export progress"
              className="w-full h-3 overflow-hidden [&::-webkit-progress-bar]:rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:bg-primary [&::-webkit-progress-value]:transition-all [&::-moz-progress-bar]:bg-primary [&::-moz-progress-bar]:rounded-full"
            />
            <p role="status" aria-live="polite" className="text-sm text-text-muted">
              처리 및 리사이즈 중… {exportProgress}%
            </p>
          </div>
        ) : (
          <Button
            onClick={onExport}
            disabled={stickerCount === 0}
            icon={<Download size={18} />}
            size="lg"
            className="w-full max-w-md mx-auto"
            aria-label="Download LINE Emoji ZIP"
            data-testid="download-btn"
          >
            LINE Emoji ZIP 다운로드
          </Button>
        )}
      </div>

      <div className="flex justify-start pt-4">
        <Button
          variant="outline"
          onClick={onBack}
          disabled={isExporting}
          aria-label="Go back"
          data-testid="back-btn"
        >
          이전
        </Button>
      </div>
    </section>
  );
}

export { ExportStage };
export type { ExportStageProps };
