import { LoginButtons } from '@/components/auth/LoginButtons';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center">
      <h1 className="text-3xl font-bold text-text-primary mb-2">Storlit</h1>
      <p className="text-text-secondary text-sm mb-8">
        매일 함께 쓰는 릴레이 소설
      </p>
      <LoginButtons />
    </div>
  );
}
