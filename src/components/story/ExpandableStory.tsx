'use client';

import { useState } from 'react';

interface ExpandableStoryProps {
  seedText: string | null;
  rounds: Array<{
    round_number: number;
    content: string;
  }>;
}

export function ExpandableStory({ seedText, rounds }: ExpandableStoryProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const totalItems = (seedText ? 1 : 0) + rounds.length;
  const showToggle = totalItems > 3;

  const visibleRounds = isExpanded ? rounds : rounds.slice(0, seedText ? 2 : 3);

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4">
      <div className="story-text text-text-primary space-y-3">
        {seedText && (
          <div>
            <span className="text-xs font-medium text-text-tertiary">[제시글]</span>
            <p className="mt-1">{seedText}</p>
          </div>
        )}
        {visibleRounds.map((round) => (
          <div key={round.round_number}>
            <span className="text-xs font-medium text-text-tertiary">
              [채택작 {round.round_number}]
            </span>
            <p className="mt-1">{round.content}</p>
          </div>
        ))}
      </div>

      {showToggle && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="mt-4 w-full text-center text-sm text-accent font-medium hover:text-accent-hover transition-colors"
        >
          {isExpanded ? '접기 ▲' : '전체 스토리 읽기 ▼'}
        </button>
      )}
    </div>
  );
}
