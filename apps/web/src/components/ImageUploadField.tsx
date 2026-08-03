'use client';

import { useRef, useState, type ReactNode } from 'react';
import { Upload } from 'lucide-react';
import { getImageUrl, uploadImage, type UploadModule } from '@/lib/api';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  module: UploadModule;
  label?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
  /** Shown under the field (e.g. required validation from parent form). */
  validationMessage?: string | null;
}

export default function ImageUploadField({
  value,
  onChange,
  module,
  label,
  placeholder = '/api/img/... (use Upload — do not paste localhost URLs)',
  disabled,
  id,
  className = '',
  validationMessage,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const previewSrc = value.trim() ? getImageUrl(value) : '';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      const { url } = await uploadImage(file, module);
      onChange(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-chai-brown-light mb-1" htmlFor={id}>
          {label}
        </label>
      )}
      <div className="flex gap-2">
        <input
          type="text"
          id={id}
          value={value}
          onChange={(e) => { setError(null); onChange(e.target.value); }}
          placeholder={placeholder}
          disabled={disabled}
          aria-invalid={Boolean(validationMessage)}
          className={`flex-1 px-3 py-2 border rounded-lg font-body text-sm text-chai-brown focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-50 ${
            validationMessage ? 'border-red-400 ring-1 ring-red-100' : 'border-chai-brown/20'
          }`}
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          className="hidden"
          onChange={handleFileChange}
          disabled={disabled || uploading}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
          className="flex items-center gap-1.5 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm text-chai-brown hover:bg-cream transition-colors disabled:opacity-50"
          title="Upload image from device"
        >
          <Upload size={18} />
          {uploading ? '…' : 'Upload'}
        </button>
      </div>
      {previewSrc ? (
        <div className="mt-2 relative w-full max-w-[12rem] aspect-[4/3] rounded-lg overflow-hidden border border-chai-brown/15 bg-cream">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewSrc} alt="" className="w-full h-full object-cover" />
        </div>
      ) : null}
      {validationMessage ? <p className="mt-1 text-sm text-red-600">{validationMessage}</p> : null}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
      {value.trim().startsWith('/api/') ? (
        <p className="mt-1 font-body text-xs text-chai-brown-light">
          Served by the API at <code className="text-[11px] bg-cream px-1 rounded">{previewSrc || getImageUrl(value)}</code>
        </p>
      ) : null}
    </div>
  );
}
