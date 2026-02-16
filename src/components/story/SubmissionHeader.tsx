'use client';

interface SubmissionHeaderProps {
  currentSort: 'popular' | 'newest';
  onSortChange: (sort: 'popular' | 'newest') => void;
}

const sortLabels: Record<string, string> = {
  popular: '인기순',
  newest: '최신순',
};

export function SubmissionHeader({ currentSort, onSortChange }: SubmissionHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-bold text-text-primary">참여 작품</h2>
      <button
        onClick={() => onSortChange(currentSort === 'popular' ? 'newest' : 'popular')}
        className="flex items-center gap-1 text-sm text-text-secondary hover:text-text-primary transition-colors"
      >
        {sortLabels[currentSort]}
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>
    </div>
  );
}
