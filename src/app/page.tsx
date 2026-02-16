import { createClient } from '@/lib/supabase/server';
import { StoryOverview } from '@/components/story/StoryOverview';
import { CurrentRoundInfo } from '@/components/story/CurrentRoundInfo';
import { SubmissionList } from '@/components/story/SubmissionList';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

function getContent(
  submissions: { content: string }[] | { content: string } | null
): string | null {
  if (!submissions) return null;
  if (Array.isArray(submissions)) return submissions[0]?.content || null;
  return submissions.content;
}

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 1. 현재 active 라운드 + 스토리 조회
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

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

  const story = currentRound.stories as {
    title: string;
    total_rounds: number;
    seed_text: string | null;
  };

  // 2. 완료된 라운드 + 채택작 조회
  const { data: completedRounds } = await supabase
    .from('rounds')
    .select(
      'id, round_number, winning_submission_id, submissions!winning_submission_id(content)'
    )
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  // 3. 참여자 수 계산
  const allRoundIds = [
    ...(completedRounds?.map((r) => r.id) || []),
    currentRound.id,
  ];
  const { data: participants } = await supabase
    .from('submissions')
    .select('user_id')
    .in('round_id', allRoundIds);
  const participantCount = new Set(participants?.map((p) => p.user_id)).size;

  // 4. 전체 스토리 내용 (섹션 A용)
  const storyContent =
    completedRounds?.map((r) => ({
      round_number: r.round_number,
      content: getContent(r.submissions) || '(채택된 글 없음)',
    })) || [];

  // 5. 이전 채택작 또는 제시글 (섹션 B용)
  const isFirstRound = currentRound.round_number === 1;
  const previousContent = isFirstRound
    ? story.seed_text
    : completedRounds && completedRounds.length > 0
      ? getContent(completedRounds[completedRounds.length - 1].submissions)
      : null;

  // 6. 현재 라운드 제출글 + 프로필 매핑
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', currentRound.id)
    .order('vote_count', { ascending: false });

  const userIds = [...new Set(rawSubmissions?.map((s) => s.user_id) || [])];
  const { data: profiles } =
    userIds.length > 0
      ? await supabase
          .from('profiles')
          .select('id, nickname, avatar_url')
          .in('id', userIds)
      : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const submissions =
    rawSubmissions?.map((s) => ({
      ...s,
      profiles: profileMap.get(s.user_id) || null,
    })) || [];

  // 7. 사용자 투표 정보
  let myVoteIds: string[] = [];
  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('submission_id')
      .eq('user_id', user.id);
    myVoteIds = votes?.map((v) => v.submission_id) || [];
  }

  return (
    <div className="space-y-8">
      {/* 섹션 A: 오늘의 이야기 */}
      <StoryOverview
        completedRounds={completedRounds?.length || 0}
        totalRounds={story.total_rounds}
        participantCount={participantCount}
        seedText={story.seed_text}
        storyContent={storyContent}
      />

      {/* 섹션 B: 지금 이야기 */}
      <CurrentRoundInfo
        roundNumber={currentRound.round_number}
        totalRounds={story.total_rounds}
        endsAt={currentRound.ends_at}
        previousContent={previousContent}
        isFirstRound={isFirstRound}
      />

      {/* 섹션 C: 참여 작품 */}
      <SubmissionList
        initialSubmissions={submissions}
        initialVoteIds={myVoteIds}
        roundId={currentRound.id}
        currentUserId={user?.id}
      />

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
