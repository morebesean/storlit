'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  endsAt: string;
  variant?: 'inline' | 'badge';
}

export function Timer({ endsAt, variant = 'inline' }: TimerProps) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const diff = new Date(endsAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('종료');
        return;
      }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimeLeft(
        `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      );
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  if (variant === 'badge') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-red-500/90 text-white px-3 py-1 rounded-full">
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span className="font-mono text-sm font-semibold">{timeLeft}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 text-accent">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="font-mono text-sm font-semibold">{timeLeft}</span>
    </div>
  );
}
