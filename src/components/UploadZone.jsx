import { useEffect, useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { useLang } from '../context/LangContext';

export default function UploadZone({ onFile, disabled }) {
  const { t } = useLang();
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(false);
  const inputRef = useRef(null);
  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  const handleFile = (file) => {
    if (!file || disabled) return;
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type)) {
      setError(true);
      setPreview(null);
      onFile(null);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    setError(false);
    const url = URL.createObjectURL(file);
    setPreview(url);
    onFile(file);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files[0];
    handleFile(file);
  };

  const clear = (e) => {
    e.stopPropagation();
    setPreview(null);
    setError(false);
    onFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  return (
    <div
      role="button"
      tabIndex={disabled ? -1 : 0}
      aria-label={t('uploadTitle')}
      aria-disabled={disabled}
      onKeyDown={event => {
        if (event.target === event.currentTarget && !disabled && ['Enter', ' '].includes(event.key)) {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      onClick={() => !disabled && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        if (!disabled) setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={onDrop}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed transition-all
        ${isDragging
          ? 'border-violet-400/50 bg-violet-500/5 scale-[1.01]'
          : 'border-white/15 bg-white/[0.02] hover:border-white/28 hover:bg-white/[0.04]'
        }
        ${disabled ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
        disabled={disabled}
      />

      {preview ? (
        <div className="flex items-center gap-4 p-4">
          <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-white/[0.08] flex-shrink-0">
            <img src={preview} alt={t('previewAlt')} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-white/90">{t('uploadLoaded')}</p>
            <p className="text-xs text-white/40 mt-0.5">{t('uploadReady')}</p>
          </div>
          {!disabled && (
            <button
              onClick={clear}
              className="p-2 rounded-lg hover:bg-white/10 transition"
              aria-label={t('removeImage')}
            >
              <X className="w-4 h-4 text-white/45" />
            </button>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4 p-10">
          <div className="w-16 h-16 rounded-2xl bg-white/[0.06] border border-white/10 flex items-center justify-center">
            <Upload className="w-7 h-7 text-white/50" strokeWidth={1.5} />
          </div>
          <div>
            <p className="text-base font-medium text-white/85">{t('uploadTitle')}</p>
            <p className="text-sm text-white/35 mt-1">{t('uploadSub')}</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-white/25 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.07]">
            <ImageIcon className="w-3 h-3" />
            {t('uploadHint')}
          </div>
        </div>
      )}
      {error && <p role="alert" className="px-4 pb-4 text-sm text-red-300">{t('uploadInvalidType')}</p>}
    </div>
  );
}
