'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SubmissionCard } from './SubmissionCard';

interface SubmissionData {
  id: string;
  content: string;
  vote_count: number;
  user_id: string;
  created_at: string;
  profiles: { nickname: string; avatar_url: string | null } | null;
}

interface SubmissionListProps {
  initialSubmissions: SubmissionData[];
  initialVoteIds: string[];
  roundId: string;
  currentUserId?: string;
}

export function SubmissionList({
  initialSubmissions,
  initialVoteIds,
  roundId,
  currentUserId,
}: SubmissionListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [myVoteIds, setMyVoteIds] = useState(new Set(initialVoteIds));

  // 5초마다 제출글 갱신 (profiles 별도 조회)
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data: rawData } = await supabase
        .from('submissions')
        .select('*')
        .eq('round_id', roundId)
        .order('vote_count', { ascending: false });

      if (!rawData) return;

      const userIds = [...new Set(rawData.map((s) => s.user_id))];
      const { data: profiles } =
        userIds.length > 0
          ? await supabase
              .from('profiles')
              .select('id, nickname, avatar_url')
              .in('id', userIds)
          : { data: [] };

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p]) || []
      );

      setSubmissions(
        rawData.map((s) => ({
          ...s,
          profiles: profileMap.get(s.user_id) || null,
        }))
      );
    }, 5000);

    return () => clearInterval(interval);
  }, [roundId]);

  // initialSubmissions 변경 시 동기화
  useEffect(() => {
    setSubmissions(initialSubmissions);
  }, [initialSubmissions]);

  useEffect(() => {
    setMyVoteIds(new Set(initialVoteIds));
  }, [initialVoteIds]);

  if (submissions.length === 0) {
    return (
      <p className="text-text-tertiary text-sm text-center py-8">
        아직 제출된 글이 없습니다. 첫 번째로 작성해보세요!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          isVoted={myVoteIds.has(submission.id)}
          isMySubmission={submission.user_id === currentUserId}
        />
      ))}
    </div>
  );
}
