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

  return (
    <div className="flex flex-col items-center pt-12">
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
      <p className="text-text-tertiary text-xs mb-8">{user.email}</p>

      {/* Stats */}
      <div className="flex gap-8 mb-8">
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">0</p>
          <p className="text-xs text-text-secondary">작성한 글</p>
        </div>
        <div className="text-center">
          <p className="text-lg font-bold text-text-primary">0</p>
          <p className="text-xs text-text-secondary">채택된 글</p>
        </div>
      </div>

      {/* Sign Out */}
      <SignOutButton />
    </div>
  );
}
