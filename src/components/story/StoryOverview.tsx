import { ExpandableStory } from './ExpandableStory';

interface StoryOverviewProps {
  completedRounds: number;
  totalRounds: number;
  participantCount: number;
  seedText: string | null;
  storyContent: Array<{
    round_number: number;
    content: string;
  }>;
}

export function StoryOverview({
  completedRounds,
  totalRounds,
  participantCount,
  seedText,
  storyContent,
}: StoryOverviewProps) {
  return (
    <section>
      <h2 className="text-lg font-bold text-text-primary mb-1">오늘의 이야기</h2>
      <p className="text-sm text-text-secondary mb-4">
        챕터 {completedRounds + 1} 진행 중 · {participantCount}명 참여
      </p>
      <ExpandableStory seedText={seedText} rounds={storyContent} />
    </section>
  );
}
