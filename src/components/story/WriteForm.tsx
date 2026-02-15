'use client';

import { useState } from 'react';
import { submitStory } from '@/actions/submission';
import { useRouter } from 'next/navigation';

interface WriteFormProps {
  roundId: string;
}

const CHAR_LIMIT = 500;

export function WriteForm({ roundId }: WriteFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = await submitStory(roundId, content);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이어질 내용을 작성해주세요..."
        className="w-full h-48 p-4 bg-bg-surface border border-border rounded-lg
          resize-none focus:outline-none focus:ring-2 focus:ring-accent
          text-text-primary story-text"
        maxLength={CHAR_LIMIT}
      />

      <div className="flex items-center justify-between">
        <span
          className={`text-sm ${
            content.length > CHAR_LIMIT
              ? 'text-red-500'
              : 'text-text-tertiary'
          }`}
        >
          {content.length} / {CHAR_LIMIT}
        </span>
        <button
          type="submit"
          disabled={
            submitting || content.length === 0 || content.length > CHAR_LIMIT
          }
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium
            hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {submitting ? '제출 중...' : '제출하기'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
