# Phase 2: 핵심 기능 구현 — 상세 구현 계획

## 1. 개요

### 목표
릴레이 소설의 핵심 메커니즘인 라운드 시스템, 글 제출, 투표 기능을 구현하여 실제로 집단 창작이 이루어지는 MVP를 완성한다.

### Phase 2 범위
- 라운드 시스템 구현 (Vercel Cron으로 자동 진행)
- 글 제출 기능
- 투표 기능
- 메인 화면 (현재 라운드 + 투표 + 타이머)
- 글쓰기 화면

### Phase 1 완료 상태
- ✅ Next.js 15 프로젝트 구축 (App Router + TypeScript)
- ✅ Tailwind CSS v4 디자인 시스템 (라이트/다크 모드)
- ✅ Supabase 연동 (PostgreSQL + Auth)
- ✅ DB 스키마 완성 (5개 테이블 + RLS + 인덱스)
- ✅ 소셜 로그인 (구글 + 카카오)
- ✅ 기본 레이아웃 (헤더 + 하단 탭 + 반응형)
- ✅ 빈 페이지 스캐폴딩 (/, /archive, /profile, /login)

---

## 2. 아키텍처 결정 사항

### 2.1 Server Actions vs API Routes

**결정: Server Actions 우선 사용**

| 기능 | 구현 방식 | 이유 |
|------|----------|------|
| 글 제출 (POST) | **Server Action** | Form progressive enhancement, 타입 안전성, 별도 API 엔드포인트 불필요 |
| 투표/투표 취소 | **Server Action** | 간단한 mutation, revalidatePath로 즉시 UI 갱신 |
| 현재 라운드 조회 | **Server Component** | SSR로 초기 로딩 속도 향상 |
| 라운드 자동 진행 | **API Route (Cron)** | Vercel Cron은 반드시 API Route 필요 |

**Server Action 파일 구조:**
```
src/
├── actions/
│   ├── submission.ts    # submitStory()
│   └── vote.ts          # toggleVote()
```

**장점:**
- API Routes보다 보일러플레이트 코드 적음
- `revalidatePath()` 로 캐시 갱신 간편
- 타입 안전성 (request/response 파싱 불필요)
- Next.js 15의 권장 패턴

### 2.2 Realtime vs Polling

**결정: MVP는 Polling, 추후 Realtime 전환**

**Phase 2 (MVP):**
- 클라이언트에서 5초마다 투표 수 갱신 (useEffect + setInterval)
- 서버 컴포넌트는 페이지 재접속 시 최신 데이터 SSR

**이유:**
- 구현 단순 (Supabase Realtime 설정 불필요)
- MVP 트래픽에서는 5초 폴링도 충분히 빠름
- 라운드 종료 시점은 타이머가 표시하므로 실시간성 덜 중요

**Phase 3 이후 Realtime 전환 시:**
- `supabase.channel().on('postgres_changes')` 사용
- 투표 수 실시간 반영, 새 제출글 실시간 표시

### 2.3 Zustand 사용 계획

**Phase 2에서 Zustand 사용할 상태:**
- 현재 라운드 정보 (클라이언트 캐시)
- 타이머 카운트다운 (남은 초)
- 투표 상태 (내가 투표한 submission_id)

**Store 구조:**
```typescript
// src/stores/roundStore.ts
interface RoundStore {
  currentRound: Round | null;
  submissions: Submission[];
  myVoteIds: Set<string>;
  timeLeft: number;
  setCurrentRound: (round: Round) => void;
  setSubmissions: (submissions: Submission[]) => void;
  setMyVotes: (voteIds: string[]) => void;
  setTimeLeft: (seconds: number) => void;
  toggleVoteOptimistic: (submissionId: string) => void;
}
```

**사용 위치:**
- 메인 페이지에서 SSR 데이터를 클라이언트 store에 hydrate
- 타이머 컴포넌트에서 카운트다운 관리
- 투표 버튼에서 낙관적 업데이트 (optimistic UI)

---

## 3. 라운드 시스템 (Cron Job)

### 3.1 Vercel Cron 설정

**`vercel.json`:**
```json
{
  "crons": [
    {
      "path": "/api/cron/advance-round",
      "schedule": "0 * * * *"
    }
  ]
}
```
- `0 * * * *` = 매시간 정각 (0분)에 실행
- Vercel 프로젝트 설정에서 Cron Jobs 활성화 필요

**환경변수 추가 (`.env.local`):**
```
CRON_SECRET=your-random-secret-string-here
```

### 3.2 라운드 자동 진행 로직

**API Route: `/api/cron/advance-round/route.ts`**

```typescript
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  // Vercel Cron Secret 검증 (보안)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = await createClient();

  // 1. 현재 active 상태인 라운드 조회
  const { data: activeRound } = await supabase
    .from('rounds')
    .select('*')
    .eq('status', 'active')
    .single();

  if (!activeRound) {
    return NextResponse.json({ message: 'No active round' });
  }

  // 2. 라운드 종료 시간 확인
  const now = new Date();
  const endsAt = new Date(activeRound.ends_at);
  if (now < endsAt) {
    return NextResponse.json({ message: 'Round not ended yet' });
  }

  // 3. 최다 득표 제출글 찾기
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', activeRound.id)
    .order('vote_count', { ascending: false })
    .limit(1);

  const winner = submissions?.[0];

  // 4. 라운드 완료 처리
  await supabase
    .from('rounds')
    .update({
      status: 'completed',
      winning_submission_id: winner?.id || null,
    })
    .eq('id', activeRound.id);

  // 5. 스토리 조회 (마지막 라운드인지 확인)
  const { data: story } = await supabase
    .from('stories')
    .select('*')
    .eq('id', activeRound.story_id)
    .single();

  if (!story) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  // 6-1. 마지막 라운드면 스토리 완성
  if (activeRound.round_number >= story.total_rounds) {
    await supabase
      .from('stories')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .eq('id', story.id);

    return NextResponse.json({
      message: 'Story completed',
      story_id: story.id,
    });
  }

  // 6-2. 다음 라운드 생성
  const nextRoundNumber = activeRound.round_number + 1;
  const nextStartsAt = new Date();
  const nextEndsAt = new Date(nextStartsAt.getTime() + 60 * 60 * 1000); // +1시간

  await supabase.from('rounds').insert({
    story_id: story.id,
    round_number: nextRoundNumber,
    started_at: nextStartsAt.toISOString(),
    ends_at: nextEndsAt.toISOString(),
    status: 'active',
  });

  return NextResponse.json({
    message: 'Round advanced',
    next_round: nextRoundNumber,
  });
}
```

### 3.3 첫 스토리/라운드 생성

**Supabase SQL Editor에서 수동 생성 (MVP):**

```sql
-- 첫 번째 스토리 생성
INSERT INTO public.stories (title, genre, status, total_rounds)
VALUES ('첫 번째 릴레이 소설', '판타지', 'in_progress', 15)
RETURNING id;

-- 첫 번째 라운드 생성 (위에서 받은 story_id 사용)
INSERT INTO public.rounds (story_id, round_number, started_at, ends_at, status)
VALUES (
  '<story_id>',
  1,
  NOW(),
  NOW() + INTERVAL '1 hour',
  'active'
);
```

---

## 4. Server Actions

### 4.1 글 제출 (`src/actions/submission.ts`)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function submitStory(roundId: string, content: string) {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 2. 글자 수 검증 (500자 제한)
  if (content.length === 0 || content.length > 500) {
    return { error: '내용은 1~500자 이내여야 합니다' };
  }

  // 3. 라운드 상태 확인 (active인지)
  const { data: round } = await supabase
    .from('rounds')
    .select('*')
    .eq('id', roundId)
    .single();

  if (!round || round.status !== 'active') {
    return { error: '현재 제출할 수 없는 라운드입니다' };
  }

  // 4. 라운드 종료 시간 확인
  if (new Date() >= new Date(round.ends_at)) {
    return { error: '라운드가 종료되었습니다' };
  }

  // 5. 제출 (UNIQUE 제약으로 중복 제출 방지)
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      round_id: roundId,
      user_id: user.id,
      content: content.trim(),
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505') {
      return { error: '이미 이번 라운드에 제출하셨습니다' };
    }
    return { error: '제출에 실패했습니다' };
  }

  revalidatePath('/');
  return { data };
}
```

### 4.2 투표 (`src/actions/vote.ts`)

```typescript
'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function toggleVote(submissionId: string) {
  const supabase = await createClient();

  // 1. 인증 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { error: '로그인이 필요합니다' };
  }

  // 2. 자신의 글인지 확인
  const { data: submission } = await supabase
    .from('submissions')
    .select('user_id')
    .eq('id', submissionId)
    .single();

  if (!submission) {
    return { error: '제출글을 찾을 수 없습니다' };
  }
  if (submission.user_id === user.id) {
    return { error: '자신의 글에는 투표할 수 없습니다' };
  }

  // 3. 기존 투표 확인
  const { data: existingVote } = await supabase
    .from('votes')
    .select('id')
    .eq('submission_id', submissionId)
    .eq('user_id', user.id)
    .single();

  if (existingVote) {
    // 투표 취소
    await supabase.from('votes').delete().eq('id', existingVote.id);
    await supabase.rpc('decrement_vote_count', { p_submission_id: submissionId });
    revalidatePath('/');
    return { action: 'removed' };
  } else {
    // 투표 추가
    await supabase.from('votes').insert({
      submission_id: submissionId,
      user_id: user.id,
    });
    await supabase.rpc('increment_vote_count', { p_submission_id: submissionId });
    revalidatePath('/');
    return { action: 'added' };
  }
}
```

### 4.3 RPC 함수 (Supabase SQL 마이그레이션)

```sql
-- supabase/migrations/002_vote_count_functions.sql

-- vote_count 원자적 증가
CREATE OR REPLACE FUNCTION increment_vote_count(p_submission_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET vote_count = vote_count + 1
  WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql;

-- vote_count 원자적 감소
CREATE OR REPLACE FUNCTION decrement_vote_count(p_submission_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.submissions
  SET vote_count = GREATEST(vote_count - 1, 0)
  WHERE id = p_submission_id;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. UI 컴포넌트

### 5.1 컴포넌트 목록

| 컴포넌트 | 경로 | 설명 |
|---------|------|------|
| `SubmissionCard` | `components/story/SubmissionCard.tsx` | 제출글 카드 (내용 + 투표 버튼 + 득표수) |
| `StoryProgress` | `components/story/StoryProgress.tsx` | 지금까지의 스토리 (이전 라운드 채택글) |
| `Timer` | `components/story/Timer.tsx` | 라운드 남은 시간 카운트다운 |
| `WriteForm` | `components/story/WriteForm.tsx` | 글쓰기 폼 (텍스트 에리어 + 글자수 + 제출) |
| `RoundInfo` | `components/story/RoundInfo.tsx` | 라운드 번호 + 상태 표시 |
| `SubmissionList` | `components/story/SubmissionList.tsx` | 제출글 목록 + 5초 폴링 갱신 |
| `Button` | `components/ui/Button.tsx` | 재사용 버튼 (Primary / Secondary / Ghost) |
| `Card` | `components/ui/Card.tsx` | 카드 컨테이너 |
| `Badge` | `components/ui/Badge.tsx` | 라운드 번호, 상태 등 |

### 5.2 주요 컴포넌트 상세

#### `SubmissionCard` (클라이언트 컴포넌트)

```typescript
'use client';

import { useState } from 'react';
import { toggleVote } from '@/actions/vote';

interface SubmissionCardProps {
  submission: {
    id: string;
    content: string;
    vote_count: number;
    user_id: string;
    profiles?: { nickname: string; avatar_url: string | null };
  };
  isVoted: boolean;
  isMySubmission: boolean;
}

export function SubmissionCard({ submission, isVoted, isMySubmission }: SubmissionCardProps) {
  const [voting, setVoting] = useState(false);
  const [voted, setVoted] = useState(isVoted);
  const [voteCount, setVoteCount] = useState(submission.vote_count);

  const handleVote = async () => {
    if (voting || isMySubmission) return;
    setVoting(true);

    // 낙관적 업데이트
    setVoted(!voted);
    setVoteCount(voted ? voteCount - 1 : voteCount + 1);

    const result = await toggleVote(submission.id);

    if (result.error) {
      // 롤백
      setVoted(voted);
      setVoteCount(submission.vote_count);
    }
    setVoting(false);
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4">
      {/* 작성자 */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-bg-elevated" />
        <span className="text-sm text-text-secondary">
          {submission.profiles?.nickname || '익명'}
        </span>
        {isMySubmission && (
          <span className="text-xs text-accent font-medium">내 글</span>
        )}
      </div>

      {/* 내용 */}
      <p className="text-text-primary story-text mb-4">{submission.content}</p>

      {/* 투표 버튼 */}
      <button
        onClick={handleVote}
        disabled={voting || isMySubmission}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm transition-colors ${
          voted
            ? 'bg-accent text-white'
            : 'bg-bg-elevated text-text-secondary hover:bg-accent-light'
        } disabled:opacity-50`}
      >
        {/* 하트 아이콘 */}
        <svg width="16" height="16" viewBox="0 0 24 24"
          fill={voted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
        {voteCount}
      </button>
    </div>
  );
}
```

#### `Timer` (클라이언트 컴포넌트)

```typescript
'use client';

import { useEffect, useState } from 'react';

interface TimerProps {
  endsAt: string; // ISO timestamp
}

export function Timer({ endsAt }: TimerProps) {
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
      setTimeLeft(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <div className="flex items-center gap-2 text-accent">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
      <span className="font-mono text-sm font-semibold">{timeLeft}</span>
    </div>
  );
}
```

#### `WriteForm` (클라이언트 컴포넌트)

```typescript
'use client';

import { useState } from 'react';
import { submitStory } from '@/actions/submission';
import { useRouter } from 'next/navigation';

interface WriteFormProps {
  roundId: string;
}

const CHAR_LIMIT = 500;

export function WriteForm({ roundId }: WriteFormProps) {
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    const result = await submitStory(roundId, content);

    if (result.error) {
      setError(result.error);
      setSubmitting(false);
    } else {
      router.push('/');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="이어질 내용을 작성해주세요..."
        className="w-full h-48 p-4 bg-bg-surface border border-border rounded-lg
          resize-none focus:outline-none focus:ring-2 focus:ring-accent
          text-text-primary story-text"
        maxLength={CHAR_LIMIT}
      />

      <div className="flex items-center justify-between">
        <span className={`text-sm ${
          content.length > CHAR_LIMIT ? 'text-red-500' : 'text-text-tertiary'
        }`}>
          {content.length} / {CHAR_LIMIT}
        </span>
        <button
          type="submit"
          disabled={submitting || content.length === 0 || content.length > CHAR_LIMIT}
          className="px-6 py-2 bg-accent text-white rounded-lg font-medium
            hover:bg-accent-hover disabled:opacity-50 disabled:cursor-not-allowed
            transition-colors"
        >
          {submitting ? '제출 중...' : '제출하기'}
        </button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </form>
  );
}
```

#### `StoryProgress` (서버 컴포넌트)

```typescript
interface StoryProgressProps {
  rounds: Array<{
    round_number: number;
    submissions: { content: string } | null;
  }>;
}

export function StoryProgress({ rounds }: StoryProgressProps) {
  return (
    <div className="bg-bg-surface border border-border rounded-lg p-4">
      <h3 className="text-sm font-semibold text-text-secondary mb-3">
        지금까지의 이야기
      </h3>
      <div className="story-text text-text-primary space-y-2">
        {rounds.map((round) => (
          <p key={round.round_number}>
            {round.submissions?.content || '(채택된 글 없음)'}
          </p>
        ))}
      </div>
    </div>
  );
}
```

#### `SubmissionList` (클라이언트 컴포넌트 — 5초 폴링)

```typescript
'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SubmissionCard } from './SubmissionCard';

interface SubmissionListProps {
  initialSubmissions: Array<{...}>;
  initialVoteIds: string[];
  roundId: string;
  currentUserId?: string;
}

export function SubmissionList({
  initialSubmissions, initialVoteIds, roundId, currentUserId
}: SubmissionListProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [myVoteIds, setMyVoteIds] = useState(new Set(initialVoteIds));

  // 5초마다 제출글 갱신
  useEffect(() => {
    const supabase = createClient();
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('submissions')
        .select('*, profiles(nickname, avatar_url)')
        .eq('round_id', roundId)
        .order('vote_count', { ascending: false });

      if (data) setSubmissions(data);
    }, 5000);

    return () => clearInterval(interval);
  }, [roundId]);

  return (
    <div className="space-y-4">
      {submissions.map((submission) => (
        <SubmissionCard
          key={submission.id}
          submission={submission}
          isVoted={myVoteIds.has(submission.id)}
          isMySubmission={submission.user_id === currentUserId}
        />
      ))}
    </div>
  );
}
```

---

## 6. 페이지 구현

### 6.1 메인 페이지 (`/app/page.tsx`) — 완전 재설계

**데이터 흐름:**
1. SSR로 현재 active 라운드 조회
2. 해당 라운드의 제출글 목록 + 작성자 프로필 조회
3. 로그인 사용자의 투표 정보 조회
4. 이전 라운드 채택글 조회 (스토리 진행 상황)
5. 클라이언트 컴포넌트(SubmissionList)에서 5초 폴링으로 갱신

**화면 구조:**
```
┌─────────────────────────┐
│  스토리 제목    ⏱ 45:23  │  ← 타이틀 + 타이머
├─────────────────────────┤
│  지금까지의 이야기        │  ← StoryProgress (접을 수 있음)
│  1라운드: ...            │
│  2라운드: ...            │
├─────────────────────────┤
│  이번 라운드 제출글  [글쓰기]│
│  ┌─────────────────────┐│
│  │ 닉네임               ││
│  │ 제출 내용...          ││  ← SubmissionCard
│  │ ❤️ 12               ││
│  └─────────────────────┘│
│  ┌─────────────────────┐│
│  │ 닉네임               ││
│  │ 제출 내용...          ││  ← SubmissionCard
│  │ 🤍 8                ││
│  └─────────────────────┘│
├─────────────────────────┤
│         ✏️              │  ← 플로팅 글쓰기 버튼 (미제출 시)
└─────────────────────────┘
```

**구현 코드:**
```typescript
import { createClient } from '@/lib/supabase/server';
import { Timer } from '@/components/story/Timer';
import { StoryProgress } from '@/components/story/StoryProgress';
import { SubmissionList } from '@/components/story/SubmissionList';
import Link from 'next/link';

export default async function HomePage() {
  const supabase = await createClient();

  // 1. 현재 active 라운드 조회
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

  // 진행 중인 라운드 없음 → 빈 상태
  if (!currentRound) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        {/* 연필 아이콘 */}
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.5" className="text-text-tertiary mb-4">
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
        </svg>
        <p className="text-text-secondary text-sm">현재 진행 중인 스토리가 없습니다</p>
        <p className="text-text-tertiary text-xs mt-1">
          새로운 릴레이 소설이 시작되면 여기에서 참여할 수 있습니다
        </p>
      </div>
    );
  }

  // 2. 현재 라운드 제출글 조회 (+ 작성자 프로필)
  const { data: submissions } = await supabase
    .from('submissions')
    .select('*, profiles(nickname, avatar_url)')
    .eq('round_id', currentRound.id)
    .order('vote_count', { ascending: false });

  // 3. 사용자의 투표/제출 정보 조회
  const { data: { user } } = await supabase.auth.getUser();
  let myVoteIds: string[] = [];
  let mySubmission = null;

  if (user) {
    const { data: votes } = await supabase
      .from('votes').select('submission_id').eq('user_id', user.id);
    myVoteIds = votes?.map((v) => v.submission_id) || [];

    const { data: sub } = await supabase
      .from('submissions').select('id')
      .eq('round_id', currentRound.id).eq('user_id', user.id).single();
    mySubmission = sub;
  }

  // 4. 이전 라운드 채택글 조회
  const { data: previousRounds } = await supabase
    .from('rounds')
    .select('round_number, submissions!winning_submission_id(content)')
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  return (
    <div className="space-y-6">
      {/* 헤더: 스토리 제목 + 타이머 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary">
            {currentRound.stories.title}
          </h1>
          <p className="text-sm text-text-secondary">
            라운드 {currentRound.round_number} / {currentRound.stories.total_rounds}
          </p>
        </div>
        <Timer endsAt={currentRound.ends_at} />
      </div>

      {/* 지금까지의 스토리 */}
      {previousRounds && previousRounds.length > 0 && (
        <StoryProgress rounds={previousRounds} />
      )}

      {/* 현재 라운드 제출글 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary">이번 라운드 제출글</h2>
          {!mySubmission && user && (
            <Link href="/write" className="text-sm text-accent font-medium">
              글쓰기
            </Link>
          )}
        </div>

        {submissions && submissions.length > 0 ? (
          <SubmissionList
            initialSubmissions={submissions}
            initialVoteIds={myVoteIds}
            roundId={currentRound.id}
            currentUserId={user?.id}
          />
        ) : (
          <p className="text-text-tertiary text-sm text-center py-8">
            아직 제출된 글이 없습니다. 첫 번째로 작성해보세요!
          </p>
        )}
      </div>

      {/* 플로팅 글쓰기 버튼 (미제출 + 로그인 시) */}
      {!mySubmission && user && (
        <Link
          href="/write"
          className="fixed bottom-20 right-4 md:bottom-6 w-14 h-14 rounded-full
            bg-accent text-white flex items-center justify-center shadow-lg
            hover:bg-accent-hover transition-colors z-10"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
          </svg>
        </Link>
      )}
    </div>
  );
}
```

### 6.2 글쓰기 페이지 (`/app/write/page.tsx`) — 신규 생성

```typescript
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { WriteForm } from '@/components/story/WriteForm';
import { StoryProgress } from '@/components/story/StoryProgress';
import Link from 'next/link';

export default async function WritePage() {
  const supabase = await createClient();

  // 1. 인증 확인
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // 2. 현재 라운드 확인
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

  if (!currentRound) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">현재 진행 중인 라운드가 없습니다</p>
        <Link href="/" className="text-accent text-sm mt-4 inline-block">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  // 3. 이미 제출했는지 확인
  const { data: mySubmission } = await supabase
    .from('submissions')
    .select('id')
    .eq('round_id', currentRound.id)
    .eq('user_id', user.id)
    .single();

  if (mySubmission) {
    return (
      <div className="text-center py-12">
        <p className="text-text-secondary">이미 이번 라운드에 제출하셨습니다</p>
        <Link href="/" className="text-accent text-sm mt-4 inline-block">
          메인으로 돌아가기
        </Link>
      </div>
    );
  }

  // 4. 이전 라운드 채택글 조회
  const { data: previousRounds } = await supabase
    .from('rounds')
    .select('round_number, submissions!winning_submission_id(content)')
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-text-primary">글쓰기</h1>
        <p className="text-sm text-text-secondary mt-1">
          라운드 {currentRound.round_number} — {currentRound.stories.title}
        </p>
      </div>

      {/* 지금까지의 스토리 */}
      {previousRounds && previousRounds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-text-secondary mb-3">
            지금까지의 이야기
          </h2>
          <StoryProgress rounds={previousRounds} />
        </div>
      )}

      {/* 글쓰기 폼 */}
      <WriteForm roundId={currentRound.id} />
    </div>
  );
}
```

---

## 7. Zustand 스토어

### 7.1 설치

```bash
npm install zustand
```

### 7.2 라운드 스토어 (`src/stores/roundStore.ts`)

```typescript
import { create } from 'zustand';

interface Submission {
  id: string;
  content: string;
  vote_count: number;
  user_id: string;
}

interface RoundStore {
  submissions: Submission[];
  myVoteIds: Set<string>;

  setSubmissions: (submissions: Submission[]) => void;
  setMyVotes: (voteIds: string[]) => void;

  // 낙관적 업데이트
  toggleVoteOptimistic: (submissionId: string) => void;
}

export const useRoundStore = create<RoundStore>((set) => ({
  submissions: [],
  myVoteIds: new Set(),

  setSubmissions: (submissions) => set({ submissions }),
  setMyVotes: (voteIds) => set({ myVoteIds: new Set(voteIds) }),

  toggleVoteOptimistic: (submissionId) =>
    set((state) => {
      const newVoteIds = new Set(state.myVoteIds);
      const isVoted = newVoteIds.has(submissionId);

      if (isVoted) {
        newVoteIds.delete(submissionId);
      } else {
        newVoteIds.add(submissionId);
      }

      const newSubmissions = state.submissions.map((s) =>
        s.id === submissionId
          ? { ...s, vote_count: s.vote_count + (isVoted ? -1 : 1) }
          : s
      );

      return { myVoteIds: newVoteIds, submissions: newSubmissions };
    }),
}));
```

---

## 8. 디렉토리 구조 (Phase 2 완료 후)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                          # 메인 (재설계)
│   ├── globals.css
│   ├── write/
│   │   └── page.tsx                      # 글쓰기 (신규)
│   ├── archive/
│   │   └── page.tsx
│   ├── profile/
│   │   └── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── auth/
│   │   ├── callback/route.ts
│   │   └── signout/route.ts
│   └── api/
│       └── cron/
│           └── advance-round/
│               └── route.ts              # Cron Job (신규)
├── actions/
│   ├── submission.ts                     # 글 제출 (신규)
│   └── vote.ts                           # 투표 (신규)
├── components/
│   ├── ui/
│   │   ├── Button.tsx                    # (신규)
│   │   ├── Card.tsx                      # (신규)
│   │   └── Badge.tsx                     # (신규)
│   ├── story/
│   │   ├── SubmissionCard.tsx            # (신규)
│   │   ├── SubmissionList.tsx            # (신규)
│   │   ├── StoryProgress.tsx            # (신규)
│   │   ├── Timer.tsx                     # (신규)
│   │   ├── WriteForm.tsx                # (신규)
│   │   └── RoundInfo.tsx                # (신규)
│   ├── layout/
│   ├── auth/
│   └── providers/
├── lib/
│   └── supabase/
├── stores/
│   └── roundStore.ts                     # (신규)
└── types/
    └── database.ts
```

---

## 9. 구현 순서 & 체크리스트

### Step 1: 준비 작업

- [ ] Zustand 설치 (`npm install zustand`)
- [ ] `vercel.json` 생성 (Cron 설정)
- [ ] `.env.local`에 `CRON_SECRET` 추가
- [ ] Supabase SQL에 RPC 함수 추가 (`increment_vote_count`, `decrement_vote_count`)
- [ ] `src/actions/`, `src/components/story/` 디렉토리 생성

### Step 2: 기본 UI 컴포넌트

- [ ] `Button` 컴포넌트 (`src/components/ui/Button.tsx`)
- [ ] `Card` 컴포넌트 (`src/components/ui/Card.tsx`)
- [ ] `Badge` 컴포넌트 (`src/components/ui/Badge.tsx`)

### Step 3: Server Actions

- [ ] `submitStory()` 액션 (`src/actions/submission.ts`)
- [ ] `toggleVote()` 액션 (`src/actions/vote.ts`)

### Step 4: 스토리 컴포넌트

- [ ] `Timer` 컴포넌트 (카운트다운)
- [ ] `SubmissionCard` 컴포넌트 (제출글 + 투표 버튼 + 낙관적 업데이트)
- [ ] `StoryProgress` 컴포넌트 (이전 라운드 채택글)
- [ ] `WriteForm` 컴포넌트 (글쓰기 폼 + 글자수 카운터)
- [ ] `SubmissionList` 컴포넌트 (제출글 목록 + 5초 폴링)
- [ ] `RoundInfo` 컴포넌트 (라운드 번호 + 상태)

### Step 5: Zustand 스토어

- [ ] `roundStore.ts` 생성 (낙관적 업데이트 포함)

### Step 6: 메인 페이지 재구현

- [ ] `/app/page.tsx` 완전 재작성
- [ ] SSR로 현재 라운드 + 제출글 로드
- [ ] 타이머, 제출글 목록, 투표, 플로팅 글쓰기 버튼 통합
- [ ] 빈 상태 처리 (진행 중인 라운드 없음)

### Step 7: 글쓰기 페이지

- [ ] `/app/write/page.tsx` 생성
- [ ] 인증 체크 (비로그인 → /login 리다이렉트)
- [ ] 중복 제출 방지
- [ ] 이전 스토리 표시 + 글쓰기 폼 통합
- [ ] 제출 후 메인으로 리다이렉트

### Step 8: Cron Job

- [ ] `/api/cron/advance-round/route.ts` 생성
- [ ] CRON_SECRET 검증
- [ ] 라운드 종료 → 최다 득표 선정 → 라운드 완료 → 다음 라운드 생성 / 스토리 완성

### Step 9: 첫 스토리/라운드 생성

- [ ] Supabase SQL Editor에서 첫 스토리 + 첫 라운드 생성
- [ ] 메인 페이지에서 정상 표시 확인

### Step 10: 로컬 테스트

- [ ] 로그인 → 글쓰기 → 제출 → 메인에서 확인
- [ ] 다른 계정으로 투표 → 득표수 증가 확인
- [ ] 투표 취소 → 득표수 감소 확인
- [ ] 타이머 카운트다운 정상 동작
- [ ] 자기 글 투표 방지 확인
- [ ] 중복 제출 방지 확인

### Step 11: Cron Job 배포 & 테스트

- [ ] Vercel에 배포
- [ ] Vercel Dashboard에서 Cron Jobs 활성화
- [ ] `/api/cron/advance-round` 수동 호출 테스트
- [ ] 라운드 자동 진행 확인
- [ ] 15라운드 완료 시 스토리 완성 확인

### Step 12: 검증

- [ ] 에러 메시지 한글화 확인
- [ ] 로딩 상태 (버튼 disabled 등) 확인
- [ ] 모바일 반응형 확인
- [ ] 다크모드/라이트모드 전환 확인
- [ ] `npm run build` 빌드 성공
- [ ] `tsc --noEmit` 타입 에러 없음

---

## 10. Phase 2 완료 기준

### 필수 기능
- [ ] 라운드 자동 진행 (Vercel Cron, 매시간)
- [ ] 글 제출 기능 (라운드당 1회, 500자 제한)
- [ ] 투표 기능 (제출당 1회, 자기 글 투표 방지, 취소 가능)
- [ ] 메인 화면 (스토리 진행 상황 + 제출글 + 투표 + 타이머)
- [ ] 글쓰기 화면 (이전 스토리 + 폼 + 중복 방지)
- [ ] 타이머 카운트다운 (실시간)
- [ ] 첫 스토리 생성 및 전체 플로우 테스트

### 성공 지표
- [ ] 사용자가 로그인 → 글쓰기 → 제출 → 투표 플로우 완료 가능
- [ ] 1시간 후 자동으로 라운드 진행
- [ ] 15라운드 완료 시 스토리 자동 완성
- [ ] 모바일 웹에서 정상 작동
- [ ] 빌드 에러 없음
