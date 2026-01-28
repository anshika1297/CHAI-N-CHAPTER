'use client';

import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { uploadImage, type UploadModule } from '@/lib/api';

interface ImageUploadFieldProps {
  value: string;
  onChange: (url: string) => void;
  module: UploadModule;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  id?: string;
  className?: string;
}

export default function ImageUploadField({
  value,
  onChange,
  module,
  label,
  placeholder = 'https://... or upload',
  disabled,
  id,
  className = '',
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
          className="flex-1 px-3 py-2 border border-chai-brown/20 rounded-lg font-body text-sm text-chai-brown focus:outline-none focus:ring-2 focus:ring-terracotta disabled:opacity-50"
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
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
