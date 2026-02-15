import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SignOutButton } from '@/components/auth/SignOutButton';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  const nickname =
    profile?.nickname ??
    user.user_metadata?.name ??
    user.user_metadata?.full_name ??
    '사용자';
  const avatarUrl =
    profile?.avatar_url ??
    user.user_metadata?.avatar_url ??
    user.user_metadata?.picture;

  // 통계: 작성한 글 수
  const { count: submissionCount } = await supabase
    .from('submissions')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  // 통계: 채택된 글 수 (winning_submission_id에 내 글이 포함된 라운드 수)
  const { data: mySubmissions } = await supabase
    .from('submissions')
    .select('id')
    .eq('user_id', user.id);
  const mySubmissionIds = mySubmissions?.map((s) => s.id) || [];

  let adoptedCount = 0;
  if (mySubmissionIds.length > 0) {
    const { count } = await supabase
      .from('rounds')
      .select('*', { count: 'exact', head: true })
      .in('winning_submission_id', mySubmissionIds);
    adoptedCount = count || 0;
  }

  // 최근 작성한 글 목록
  const { data: recentSubmissions } = await supabase
    .from('submissions')
    .select('id, content, vote_count, created_at, round_id')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  return (
    <div className="flex flex-col items-center pt-8">
      {/* Avatar */}
      <div className="w-20 h-20 rounded-full bg-bg-elevated flex items-center justify-center overflow-hidden mb-4">
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={nickname}
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="text-text-tertiary"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )}
      </div>

      {/* Nickname */}
      <h1 className="text-xl font-bold text-text-primary mb-1">{nickname}</h1>
      <p className="text-text-tertiary text-xs mb-6">{user.email}</p>

      {/* Stats */}
      <div className="flex gap-8 mb-8">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">
            {submissionCount || 0}
          </p>
          <p className="text-xs text-text-secondary">작성한 글</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">{adoptedCount}</p>
          <p className="text-xs text-text-secondary">채택된 글</p>
        </div>
      </div>

      {/* Recent Submissions */}
      {recentSubmissions && recentSubmissions.length > 0 && (
        <div className="w-full mb-8">
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            최근 작성한 글
          </h2>
          <div className="space-y-3">
            {recentSubmissions.map((sub) => (
              <div
                key={sub.id}
                className="bg-bg-surface border border-border rounded-lg p-3"
              >
                <p className="text-sm text-text-primary line-clamp-2">
                  {sub.content}
                </p>
                <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                  <span>
                    ❤️ {sub.vote_count}
                  </span>
                  <span>
                    {new Date(sub.created_at).toLocaleDateString('ko-KR', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sign Out */}
      <SignOutButton />
    </div>
  );
}
