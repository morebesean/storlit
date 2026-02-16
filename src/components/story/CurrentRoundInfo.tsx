import { Timer } from './Timer';

interface CurrentRoundInfoProps {
  roundNumber: number;
  totalRounds: number;
  endsAt: string;
  previousContent: string | null;
  isFirstRound: boolean;
}

export function CurrentRoundInfo({
  roundNumber,
  totalRounds,
  endsAt,
  previousContent,
  isFirstRound,
}: CurrentRoundInfoProps) {
  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-text-primary">지금 이야기</h2>
        <Timer endsAt={endsAt} variant="badge" />
      </div>

      <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wide mb-3">
        Round {roundNumber} of {totalRounds}
      </p>

      {previousContent && (
        <div className="bg-bg-surface border border-border rounded-lg p-4">
          <p className="text-xs font-medium text-text-tertiary mb-2">
            {isFirstRound ? '제시글:' : '이전 채택작:'}
          </p>
          <p className="story-text text-text-primary">&ldquo;{previousContent}&rdquo;</p>
        </div>
      )}
    </section>
  );
}
