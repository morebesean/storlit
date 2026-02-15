import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Vercel Cron Secret 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. 현재 active 상태인 라운드 조회
  const { data: activeRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('status', 'active')
    .single();

  if (!activeRound) {
    return NextResponse.json({ message: 'No active round' });
  }

  // 2. 라운드 종료 시간 확인
  const now = new Date();
  const endsAt = new Date(activeRound.ends_at);
  if (now < endsAt) {
    return NextResponse.json({ message: 'Round not ended yet' });
  }

  // 3. 최다 득표 제출글 찾기
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', activeRound.id)
    .order('vote_count', { ascending: false })
    .limit(1);

  const winner = submissions?.[0];

  // 4. 라운드 완료 처리
  await supabase
    .from('rounds')
    .update({
      status: 'completed',
      winning_submission_id: winner?.id || null,
    })
    .eq('id', activeRound.id);

  // 5. 스토리 조회 (마지막 라운드인지 확인)
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', activeRound.story_id)
    .single();

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // 6-1. 마지막 라운드면 스토리 완성
  if (activeRound.round_number >= story.total_rounds) {
    await supabase
      .from('stories')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', story.id);

    return NextResponse.json({
      message: 'Story completed',
      story_id: story.id,
    });
  }

  // 6-2. 다음 라운드 생성
  const nextRoundNumber = activeRound.round_number + 1;
  const nextStartsAt = new Date();
  const nextEndsAt = new Date(nextStartsAt.getTime() + 60 * 60 * 1000);

  await supabase.from('rounds').insert({
    story_id: story.id,
    round_number: nextRoundNumber,
    started_at: nextStartsAt.toISOString(),
    ends_at: nextEndsAt.toISOString(),
    status: 'active',
  });

  return NextResponse.json({
    message: 'Round advanced',
    next_round: nextRoundNumber,
  });
}
