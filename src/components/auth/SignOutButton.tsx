'use client';

export function SignOutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="text-sm text-text-secondary hover:text-text-primary border border-border rounded-lg px-6 py-2 transition-colors"
      >
        로그아웃
      </button>
    </form>
  );
}
