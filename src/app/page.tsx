import { createClient } from '@/lib/supabase/server';
import { Timer } from '@/components/story/Timer';
import { StoryProgress } from '@/components/story/StoryProgress';
import { SubmissionList } from '@/components/story/SubmissionList';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();

  // 1. 현재 active 라운드 조회
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

  // 진행 중인 라운드 없음 → 빈 상태
  if (!currentRound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-tertiary mb-4"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <p className="text-text-secondary text-sm">
          현재 진행 중인 스토리가 없습니다
        </p>
        <p className="text-text-tertiary text-xs mt-1">
          새로운 릴레이 소설이 시작되면 여기에서 참여할 수 있습니다
        </p>
      </div>
    );
  }

  // 2. 현재 라운드 제출글 조회
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', currentRound.id)
    .order('vote_count', { ascending: false });

  // 제출글 작성자 프로필 별도 조회
  const userIds = [...new Set(rawSubmissions?.map((s) => s.user_id) || [])];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', userIds)
    : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const submissions = rawSubmissions?.map((s) => ({
    ...s,
    profiles: profileMap.get(s.user_id) || null,
  })) || [];

  // 3. 사용자의 투표/제출 정보 조회
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let myVoteIds: string[] = [];

  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('submission_id')
      .eq('user_id', user.id);
    myVoteIds = votes?.map((v) => v.submission_id) || [];
  }

  // 4. 이전 라운드 채택글 조회
  const { data: previousRounds } = await supabase
    .from('rounds')
    .select('round_number, submissions!winning_submission_id(content)')
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  const story = currentRound.stories as {
    title: string;
    total_rounds: number;
  };

  return (
    <div className="space-y-6">
      {/* 헤더: 스토리 제목 + 타이머 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {story.title}
          </h1>
          <p className="text-sm text-text-secondary">
            라운드 {currentRound.round_number} / {story.total_rounds}
          </p>
        </div>
        <Timer endsAt={currentRound.ends_at} />
      </div>

      {/* 지금까지의 스토리 */}
      {previousRounds && previousRounds.length > 0 && (
        <StoryProgress rounds={previousRounds} />
      )}

      {/* 현재 라운드 제출글 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">
            이번 라운드 제출글
          </h2>
          {user && (
            <Link href="/write" className="text-sm text-accent font-medium">
              글쓰기
            </Link>
          )}
        </div>

        <SubmissionList
          initialSubmissions={submissions}
          initialVoteIds={myVoteIds}
          roundId={currentRound.id}
          currentUserId={user?.id}
        />
      </div>

      {/* 플로팅 글쓰기 버튼 (로그인 시) */}
      {user && (
        <Link
          href="/write"
          className="fixed bottom-20 right-4 md:bottom-6 w-14 h-14 rounded-full
            bg-accent text-white flex items-center justify-center shadow-lg
            hover:bg-accent-hover transition-colors z-10"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </Link>
      )}
    </div>
  );
}
