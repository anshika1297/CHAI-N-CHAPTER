'use client';

import { Eye, EyeOff } from 'lucide-react';

export default function AdminPublishToggle({
  isPublished,
  onToggle,
  disabled,
}: {
  isPublished: boolean;
  onToggle: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      className={`inline-flex items-center gap-1 text-sm font-body px-2 py-1 rounded disabled:opacity-50 ${
        isPublished ? 'bg-emerald-50 text-emerald-800' : 'bg-gray-100 text-gray-600'
      }`}
    >
      {isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
      {isPublished ? 'Live' : 'Draft'}
    </button>
  );
}
