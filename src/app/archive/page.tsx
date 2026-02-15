import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function ArchivePage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from('stories')
    .select('*')
    .eq('status', 'completed')
    .order('completed_at', { ascending: false });

  if (!stories || stories.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-text-tertiary mb-4"
        >
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
        <p className="text-text-secondary text-sm">
          아직 완성된 스토리가 없습니다
        </p>
        <p className="text-text-tertiary text-xs mt-1">
          첫 번째 릴레이 소설이 완성되면 여기에 표시됩니다
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-text-primary">아카이브</h1>

      {stories.map((story) => (
        <Link
          key={story.id}
          href={`/archive/${story.id}`}
          className="block bg-bg-surface border border-border rounded-lg p-4 hover:border-accent transition-colors"
        >
          <div className="flex items-start justify-between mb-2">
            <h2 className="text-base font-semibold text-text-primary">
              {story.title}
            </h2>
            {story.genre && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-accent-light text-accent flex-shrink-0 ml-2">
                {story.genre}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-text-tertiary">
            <span>{story.total_rounds}개 라운드</span>
            <span>
              {new Date(story.completed_at!).toLocaleDateString('ko-KR', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}
