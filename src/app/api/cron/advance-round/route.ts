import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// 한국 시간대 (KST = UTC+9)
const KST_OFFSET = 9 * 60 * 60 * 1000;
const DAILY_ROUNDS = 13; // 오전 9시 ~ 오후 9시 (13라운드)
const START_HOUR = 9; // 오전 9시 시작

function getKSTHour(date: Date): number {
  const kst = new Date(date.getTime() + KST_OFFSET);
  return kst.getUTCHours();
}

function getTodayKST9AM(): Date {
  const now = new Date();
  const kst = new Date(now.getTime() + KST_OFFSET);
  // UTC 기준 0시 = KST 9시
  return new Date(
    Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate(), 0)
  );
}

function formatKSTDate(date: Date): string {
  const kst = new Date(date.getTime() + KST_OFFSET);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  return `${y}년 ${m}월 ${d}일의 이야기`;
}

export async function GET(request: Request) {
  // Vercel Cron Secret 검증
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date();
  const kstHour = getKSTHour(now);

  // 1. 현재 active 상태인 라운드 조회
  const { data: activeRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('status', 'active')
    .single();

  // active 라운드가 없는 경우
  if (!activeRound) {
    // 오전 9시(KST)에만 새 스토리 + 첫 라운드 생성
    if (kstHour === START_HOUR) {
      // 이미 진행 중인 스토리가 있는지 확인
      const { data: existingStory } = await supabase
        .from('stories')
        .select('id')
        .eq('status', 'in_progress')
        .single();

      if (existingStory) {
        return NextResponse.json({ message: 'Story already in progress' });
      }

      // 새 스토리 생성
      const { data: newStory } = await supabase
        .from('stories')
        .insert({
          title: formatKSTDate(now),
          genre: null,
          status: 'in_progress',
          total_rounds: DAILY_ROUNDS,
        })
        .select()
        .single();

      if (!newStory) {
        return NextResponse.json(
          { error: 'Failed to create story' },
          { status: 500 }
        );
      }

      // 첫 라운드 생성
      const startsAt = getTodayKST9AM();
      const endsAt = new Date(startsAt.getTime() + 60 * 60 * 1000);

      await supabase.from('rounds').insert({
        story_id: newStory.id,
        round_number: 1,
        started_at: startsAt.toISOString(),
        ends_at: endsAt.toISOString(),
        status: 'active',
      });

      return NextResponse.json({
        message: 'New story started',
        story_id: newStory.id,
      });
    }

    return NextResponse.json({
      message: 'No active round, waiting for 9AM KST',
    });
  }

  // 2. 라운드 종료 시간 확인
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

  // 6-1. 마지막 라운드(13)면 스토리 완성
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
  const nextStartsAt = new Date(endsAt); // 이전 라운드 종료 시점부터
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
