import { Badge } from '@/components/ui/Badge';

interface RoundInfoProps {
  roundNumber: number;
  totalRounds: number;
  status: 'active' | 'voting' | 'completed';
}

const statusLabels: Record<string, string> = {
  active: '진행 중',
  voting: '투표 중',
  completed: '완료',
};

export function RoundInfo({ roundNumber, totalRounds, status }: RoundInfoProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-text-secondary">
        라운드 {roundNumber} / {totalRounds}
      </span>
      <Badge>{statusLabels[status]}</Badge>
    </div>
  );
}
