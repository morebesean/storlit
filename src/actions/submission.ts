'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitStory(roundId: string, content: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  if (content.length === 0 || content.length > 500) {
    return { error: '내용은 1~500자 이내여야 합니다' };
  }

  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round || round.status !== 'active') {
    return { error: '현재 제출할 수 없는 라운드입니다' };
  }

  if (new Date() >= new Date(round.ends_at)) {
    return { error: '라운드가 종료되었습니다' };
  }

  const { data, error } = await supabase
    .from('submissions')
    .insert({
      round_id: roundId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    return { error: '제출에 실패했습니다' };
  }

  revalidatePath('/');
  return { data };
}
