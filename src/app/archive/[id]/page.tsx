import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StoryDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // 스토리 조회
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', id)
    .single();

  if (!story) notFound();

  // 완료된 라운드 + 채택글 조회
  const { data: rounds } = await supabase
    .from('rounds')
    .select('round_number, winning_submission_id')
    .eq('story_id', id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  // 채택글 ID 목록으로 submissions 조회
  const winningIds =
    rounds
      ?.map((r) => r.winning_submission_id)
      .filter((id): id is string => id !== null) || [];

  const { data: winningSubmissions } =
    winningIds.length > 0
      ? await supabase
          .from('submissions')
          .select('id, content, user_id')
          .in('id', winningIds)
      : { data: [] };

  // 작성자 프로필 조회
  const authorIds = [
    ...new Set(winningSubmissions?.map((s) => s.user_id) || []),
  ];
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, nickname')
          .in('id', authorIds)
      : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
  const submissionMap = new Map(
    winningSubmissions?.map((s) => [s.id, s]) || []
  );

  return (
    <div className="space-y-6">
      {/* 뒤로가기 + 제목 */}
      <div>
        <Link
          href="/archive"
          className="text-sm text-text-tertiary hover:text-text-secondary transition-colors"
        >
          ← 아카이브
        </Link>
        <h1 className="text-xl font-bold text-text-primary mt-2">
          {story.title}
        </h1>
        <div className="flex items-center gap-3 mt-1 text-xs text-text-tertiary">
          {story.genre && <span>{story.genre}</span>}
          <span>{story.total_rounds}개 라운드</span>
          {story.completed_at && (
            <span>
              {new Date(story.completed_at).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          )}
        </div>
      </div>

      {/* 본문 */}
      <div className="bg-bg-surface border border-border rounded-lg p-5">
        <div className="story-text text-text-primary space-y-4">
          {rounds?.map((round) => {
            const submission = round.winning_submission_id
              ? submissionMap.get(round.winning_submission_id)
              : null;
            const author = submission
              ? profileMap.get(submission.user_id)
              : null;

            return (
              <div key={round.round_number}>
                <p>{submission?.content || '(채택된 글 없음)'}</p>
                {author && (
                  <p className="text-xs text-text-tertiary mt-1 text-right">
                    — {author.nickname}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 참여 작가 수 */}
      {authorIds.length > 0 && (
        <p className="text-xs text-text-tertiary text-center">
          {authorIds.length}명의 작가가 함께 만든 이야기
        </p>
      )}
    </div>
  );
}
