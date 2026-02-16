'use client';

import { useState } from 'react';
import { toggleVote } from '@/actions/vote';
import { Badge } from '@/components/ui/Badge';
import { formatTimeAgo } from '@/lib/utils';

interface SubmissionCardProps {
  submission: {
    id: string;
    content: string;
    vote_count: number;
    user_id: string;
    created_at: string;
    profiles?: { nickname: string; avatar_url: string | null } | null;
  };
  isVoted: boolean;
  isMySubmission: boolean;
}

export function SubmissionCard({
  submission,
  isVoted: initialIsVoted,
  isMySubmission,
}: SubmissionCardProps) {
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(initialIsVoted);
  const [voteCount, setVoteCount] = useState(submission.vote_count);

  const handleVote = async () => {
    if (voting || isMySubmission) return;
    setVoting(true);

    const newVoted = !voted;
    setVoted(newVoted);
    setVoteCount(newVoted ? voteCount + 1 : voteCount - 1);

    const result = await toggleVote(submission.id);

    if (result.error) {
      setVoted(!newVoted);
      setVoteCount(submission.vote_count);
    }
    setVoting(false);
  };

  const nickname = submission.profiles?.nickname || '익명';
  const avatarUrl = submission.profiles?.avatar_url;

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4">
      {/* 작성자 정보 */}
      <div className="flex items-center gap-2 mb-3">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nickname}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-8 h-8 rounded-full bg-bg-elevated flex-shrink-0" />
        )}
        <span className="text-sm font-medium text-text-primary">@{nickname}</span>
        {isMySubmission && <Badge variant="accent">내 글</Badge>}
        <span className="text-xs text-text-tertiary ml-auto">
          {formatTimeAgo(submission.created_at)}
        </span>
      </div>

      {/* 내용 */}
      <p className="text-text-primary story-text mb-4 line-clamp-3">
        {submission.content}
      </p>

      {/* 투표 버튼 */}
      <button
        onClick={handleVote}
        disabled={voting || isMySubmission}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
          voted
            ? 'bg-accent text-white'
            : 'bg-bg-elevated text-text-secondary hover:bg-accent-light'
        } disabled:opacity-50`}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill={voted ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {voteCount}
      </button>
    </div>
  );
}
