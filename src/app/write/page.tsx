import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WriteForm } from '@/components/story/WriteForm';
import { StoryProgress } from '@/components/story/StoryProgress';
import Link from 'next/link';

export default async function WritePage() {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. 현재 라운드 확인
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

  if (!currentRound) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">현재 진행 중인 라운드가 없습니다</p>
        <Link href="/" className="text-accent text-sm mt-4 inline-block">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  // 3. 이전 라운드 채택글 조회
  const { data: previousRounds } = await supabase
    .from('rounds')
    .select('round_number, submissions!winning_submission_id(content)')
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  const story = currentRound.stories as { title: string };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">글쓰기</h1>
        <p className="text-sm text-text-secondary mt-1">
          라운드 {currentRound.round_number} — {story.title}
        </p>
      </div>

      {/* 지금까지의 스토리 */}
      {previousRounds && previousRounds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            지금까지의 이야기
          </h2>
          <StoryProgress rounds={previousRounds} />
        </div>
      )}

      {/* 글쓰기 폼 */}
      <WriteForm roundId={currentRound.id} />
    </div>
  );
}
