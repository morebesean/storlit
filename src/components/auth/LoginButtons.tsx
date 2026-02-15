'use client';

import { createClient } from '@/lib/supabase/client';

export function LoginButtons() {
  const handleLogin = async (provider: 'google' | 'kakao') => {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  };

  return (
    <div className="flex flex-col gap-3 w-full max-w-xs">
      <button
        onClick={() => handleLogin('google')}
        className="flex items-center justify-center gap-3 w-full h-12 rounded-lg border border-border bg-bg-surface text-text-primary text-sm font-medium hover:bg-bg-elevated transition-colors"
      >
        <svg width="18" height="18" viewBox="0 0 24 24">
          <path
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            fill="#4285F4"
          />
          <path
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            fill="#34A853"
          />
          <path
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            fill="#FBBC05"
          />
          <path
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            fill="#EA4335"
          />
        </svg>
        구글로 시작하기
      </button>

      <button
        onClick={() => handleLogin('kakao')}
        className="flex items-center justify-center gap-3 w-full h-12 rounded-lg text-sm font-medium transition-colors"
        style={{ backgroundColor: '#FEE500', color: '#000000' }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
          <path d="M12 3C6.48 3 2 6.36 2 10.5c0 2.67 1.74 5.01 4.36 6.36-.14.52-.9 3.35-.93 3.56 0 0-.02.15.08.21.1.06.21.01.21.01.28-.04 3.24-2.12 3.75-2.47.83.12 1.69.18 2.53.18 5.52 0 10-3.36 10-7.5S17.52 3 12 3z" />
        </svg>
        카카오로 시작하기
      </button>
    </div>
  );
}
