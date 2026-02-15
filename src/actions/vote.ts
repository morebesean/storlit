'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleVote(submissionId: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    return { error: '제출글을 찾을 수 없습니다' };
  }
  if (submission.user_id === user.id) {
    return { error: '자신의 글에는 투표할 수 없습니다' };
  }

  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .single();

  if (existingVote) {
    await supabase.from('votes').delete().eq('id', existingVote.id);
    await supabase.rpc('decrement_vote_count', {
      p_submission_id: submissionId,
    });
    revalidatePath('/');
    return { action: 'removed' as const };
  } else {
    await supabase.from('votes').insert({
      submission_id: submissionId,
      user_id: user.id,
    });
    await supabase.rpc('increment_vote_count', {
      p_submission_id: submissionId,
    });
    revalidatePath('/');
    return { action: 'added' as const };
  }
}
