import { useCallback, useState, useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Image as ImageIcon, AlertCircle } from 'lucide-react';
import { cn } from '@/utils/cn';

interface FileUploadProps {
  onUpload: (files: File[]) => void;
  accept?: string;
  maxFiles?: number;
  label?: string;
}

function FileUpload({ onUpload, accept = 'image/*,.zip', maxFiles = 120, label }: FileUploadProps) {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const inputId = useId();
  const resolvedLabel = label ?? t('fileUpload.label');

  const handleFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList) return;
      setIsProcessing(true);
      setError(null);

      const images: File[] = [];
      const items = Array.from(fileList);

      for (const file of items) {
        if (file.type.startsWith('image/')) {
          images.push(file);
        }
      }

      if (images.length === 0) {
        setError(t('fileUpload.noValidImages'));
      } else if (images.length > maxFiles) {
        setError(t('fileUpload.tooManyImages', { max: maxFiles }));
      } else {
        onUpload(images.slice(0, maxFiles));
      }

      setIsProcessing(false);
    },
    [maxFiles, onUpload, t],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  return (
    <div className="w-full space-y-3">
      <label htmlFor={inputId} className="sr-only">
        {resolvedLabel}
      </label>

      <div
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={cn(
          'group relative overflow-hidden flex flex-col items-center justify-center p-6 sm:p-10 text-center cursor-pointer transition-all duration-300 rounded-2xl border focus-within:ring-2 focus-within:ring-primary/30',
          isDragging
            ? 'border-primary bg-primary-50'
            : 'border-dashed border-slate-300 hover:border-primary/50 hover:bg-slate-50',
        )}
        aria-label={resolvedLabel}
      >
        <div className="relative z-10 w-full flex flex-col items-center gap-3">
          <input
            id={inputId}
            type="file"
            multiple
            accept={accept}
            onChange={(e) => handleFiles(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            aria-label={resolvedLabel}
          />

          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center pointer-events-none">
              {isProcessing ? (
                <span className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
              ) : (
                <Upload size={28} />
              )}
            </div>
            <div className="pointer-events-none">
              <p className="font-semibold text-slate-800">
                {isProcessing ? t('fileUpload.processing') : t('fileUpload.dragOrClick')}
              </p>
              <p className="text-sm text-text-muted mt-1">
                {t('fileUpload.formatInfo', { max: maxFiles })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-3 bg-danger-light text-danger rounded-lg flex items-center gap-2 text-sm"
        >
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
        {[
          { Icon: ImageIcon, text: t('fileUpload.autoExtractZip') },
          { Icon: Upload, text: t('fileUpload.highResSupport') },
          { Icon: AlertCircle, text: t('fileUpload.browserOnly') },
        ].map(({ Icon, text }) => (
          <div
            key={text}
            className="p-3 bg-white rounded-lg border border-slate-100 flex sm:flex-col items-center justify-center gap-2 sm:gap-1.5"
          >
            <Icon className="text-primary" size={18} />
            <span className="text-xs font-medium text-text-muted">{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export { FileUpload };
export type { FileUploadProps };
