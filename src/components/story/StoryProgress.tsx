interface CompletedRound {
  round_number: number;
  // Supabase FK 관계 조회 결과: 단일 FK이지만 배열로 반환될 수 있음
  submissions: { content: string }[] | { content: string } | null;
}

interface StoryProgressProps {
  rounds: CompletedRound[];
}

function getContent(
  submissions: CompletedRound['submissions']
): string | null {
  if (!submissions) return null;
  if (Array.isArray(submissions)) return submissions[0]?.content || null;
  return submissions.content;
}

export function StoryProgress({ rounds }: StoryProgressProps) {
  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">
        지금까지의 이야기
      </h3>
      <div className="story-text text-text-primary space-y-2">
        {rounds.map((round) => (
          <p key={round.round_number}>
            {getContent(round.submissions) || '(채택된 글 없음)'}
          </p>
        ))}
      </div>
    </div>
  );
}
