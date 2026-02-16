# 홈 화면 리뉴얼 설계

## 1. 개요

### 목표
홈 화면을 3개 섹션으로 재구성하여, 스토리 진행 상황 파악 → 현재 라운드 맥락 이해 → 참여(글 읽기/투표)로 이어지는 자연스러운 흐름을 만든다.

### 참조
- 디자인 참조: `docs/screen/home.png`
- 현재 구현: `src/app/page.tsx`

### 현재 구현과의 차이점

| 항목 | 현재 | 리뉴얼 |
|------|------|--------|
| 스토리 제목 | 표시함 | 표시하지 않음 (아카이브 시 생성) |
| 전체 스토리 | StoryProgress (항상 펼침) | ExpandableStory (접기/펼치기) |
| 참여자 수 | 없음 | 표시 |
| 라운드 정보 | 제목 옆 인라인 | 별도 섹션 "지금 이야기" |
| 타이머 | 인라인 텍스트 | 배지 스타일 (빨간 배경) |
| 이전 채택작 | 전체 스토리에 포함 | 현재 라운드 섹션에 별도 표시 |
| 제출글 정렬 | 인기순 고정 | 인기순/최신순 전환 가능 |
| 제출글 카드 | 닉네임만 표시 | 아바타 + 닉네임 + 상대 시간 + "내 글" 배지 |
| 제시글(seed) | 표시 안 함 | 첫 라운드에서 제시글 표시 |

---

## 2. 섹션별 상세 설계

### 2.1 섹션 A: 오늘의 이야기

스토리 전체 진행 상황을 한눈에 파악할 수 있는 최상단 섹션.

#### 레이아웃
```
┌─────────────────────────────────────┐
│ 오늘의 이야기                       │
│                                     │
│ 챕터 13 진행 중 · 842명 참여         │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ [제시글] 어두운 밤, 낡은 서점의  │   │
│ │ 문이 삐걱거리며 열렸다...       │   │
│ │                               │   │
│ │ [채택작 1] 서점 주인은 안경 너머 │   │
│ │ 낯선 손님을 바라보았다...       │   │
│ │                               │   │
│ │ [채택작 2] ...                 │   │
│ │                               │   │
│ │        전체 스토리 읽기 ▼       │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 데이터 요구사항
- **완료된 라운드 수**: `rounds` WHERE `story_id = current` AND `status = 'completed'`
- **참여자 수**: `COUNT(DISTINCT submissions.user_id)` — 해당 스토리의 모든 라운드(완료 + 진행 중)
- **전체 스토리 내용**: 완료된 라운드의 채택작(winning_submission.content)을 라운드 순서대로
- **제시글(seed text)**: 스토리의 첫 번째 글. `stories` 테이블에 `seed_text` 컬럼 추가 필요 (아래 DB 변경 참조)

#### 접기/펼치기 동작
- **기본(접힘)**: 제시글 + 채택작 처음 2개까지 표시 (총 최대 3개)
- **펼침**: 제시글 + 전체 채택작 표시
- **토글 버튼**: "전체 스토리 읽기 ▼" / "접기 ▲"
- **1라운드 진행 중**: 제시글만 표시, 접기/펼치기 버튼 없음

#### 참여자 수 계산 쿼리
```typescript
// 해당 스토리의 모든 라운드 ID 수집
const allRoundIds = [
  ...(completedRounds?.map((r) => r.id) || []),
  currentRound.id,
];

// DISTINCT user_id 카운트
const { data: participants } = await supabase
  .from('submissions')
  .select('user_id')
  .in('round_id', allRoundIds);

const participantCount = new Set(participants?.map((p) => p.user_id)).size;
```

---

### 2.2 섹션 B: 지금 이야기

현재 진행 중인 라운드의 핵심 정보. 참여자가 "무엇을 이어서 써야 하는지" 맥락을 제공한다.

#### 레이아웃
```
┌─────────────────────────────────────┐
│ 지금 이야기              ⏱ 45:12    │
│                                     │
│ ROUND 16 OF 24                      │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 이전 채택작:                  │   │
│ │ "그녀는 서점 구석에 놓인       │   │
│ │  낡은 일기장을 발견했다..."    │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 데이터 요구사항
- **라운드 번호**: `currentRound.round_number`
- **총 라운드**: `story.total_rounds`
- **남은 시간**: `currentRound.ends_at`
- **이전 채택작**: 직전 completed 라운드의 `winning_submission.content`
- **첫 라운드인 경우**: `story.seed_text` (제시글) 표시

#### 첫 라운드 vs 이후 라운드
| 상태 | 표시 내용 |
|------|----------|
| 첫 라운드 (round_number = 1) | "제시글:" + `story.seed_text` |
| 이후 라운드 (round_number > 1) | "이전 채택작:" + 직전 winning_submission.content |

---

### 2.3 섹션 C: 참여 작품

현재 라운드에 제출된 글 목록. 정렬 기능과 상세한 작성자 정보를 제공한다.

#### 레이아웃
```
┌─────────────────────────────────────┐
│ 참여 작품                  [인기순 ▼]│
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 🟤 @star_weaver [내 글] 3분 전 │   │
│ │                               │   │
│ │ "키 큰 인물이 섰다. 무지갯빛   │   │
│ │  넝마를 걸친 채, 어둠 속 조명을 │   │
│ │  흡수하는 것 같았다..."        │   │
│ │                               │   │
│ │ ❤️ 124                        │   │
│ └───────────────────────────────┘   │
│                                     │
│ ┌───────────────────────────────┐   │
│ │ 🟤 @void_walker       9분 전  │   │
│ │ "냉각수에서 아이 같은 형체가..." │   │
│ │ ❤️ 99                         │   │
│ └───────────────────────────────┘   │
└─────────────────────────────────────┘
```

#### 정렬 기능
- **인기순 (기본)**: `vote_count DESC`
- **최신순**: `created_at DESC`
- 전환 시 클라이언트에서 즉시 재정렬 (`useMemo`)
- 5초 폴링 시 현재 정렬 기준으로 서버 재조회

#### 카드 구조
```
┌──────────────────────────────────┐
│ [아바타 32px] @닉네임 [내 글] N분 전│
│                                  │
│ 본문 텍스트 (line-clamp-3)        │
│                                  │
│ [❤️ N] 투표 버튼                  │
└──────────────────────────────────┘
```

- **아바타**: 프로필 이미지 있으면 표시, 없으면 bg-elevated 원형 플레이스홀더
- **닉네임**: `@` + `profiles.nickname` (없으면 "익명")
- **"내 글" 배지**: `submission.user_id === currentUserId`일 때 표시
- **상대 시간**: `formatTimeAgo(submission.created_at)`
- **투표 버튼**: 낙관적 업데이트 유지 (기존 로직)

#### 상대 시간 표시 규칙
| 경과 시간 | 표시 |
|----------|------|
| 1분 미만 | "방금" |
| 1~59분 | "N분 전" |
| 1~23시간 | "N시간 전" |
| 1일 이상 | "N일 전" |

#### 빈 상태
```
아직 제출된 글이 없습니다.
첫 번째로 작성해보세요!
```

---

## 3. DB 스키마 변경

### stories 테이블에 seed_text 컬럼 추가

스토리의 시작을 알리는 제시글을 저장하기 위해 `seed_text` 컬럼이 필요하다.

```sql
-- 003_add_seed_text.sql
ALTER TABLE public.stories ADD COLUMN seed_text TEXT;

COMMENT ON COLUMN public.stories.seed_text IS '스토리의 첫 번째 제시글. 참여자들이 이 글을 읽고 이어서 작성한다.';
```

- 첫 스토리 생성 시 `seed_text`를 함께 입력
- 섹션 A(오늘의 이야기)에서 전체 스토리 최상단에 표시
- 섹션 B(지금 이야기)에서 첫 라운드일 때 "제시글"로 표시

---

## 4. 컴포넌트 아키텍처

### 4.1 신규 컴포넌트

#### `StoryOverview` (Server Component)
- 경로: `src/components/story/StoryOverview.tsx`
- 역할: "오늘의 이야기" 섹션 전체

```typescript
interface StoryOverviewProps {
  completedRounds: number;
  totalRounds: number;
  participantCount: number;
  seedText: string | null;           // 제시글
  storyContent: Array<{              // 라운드별 채택작
    round_number: number;
    content: string;
  }>;
}
```

#### `ExpandableStory` (Client Component)
- 경로: `src/components/story/ExpandableStory.tsx`
- 역할: 전체 스토리 접기/펼치기 카드

```typescript
interface ExpandableStoryProps {
  seedText: string | null;
  rounds: Array<{
    round_number: number;
    content: string;
  }>;
}
```

- 동작:
  - `isExpanded` 상태 관리
  - 접힌 상태: seedText + 처음 2개 채택작만 표시
  - 펼침: 전체 표시
  - 3개 이하면 토글 버튼 숨김

#### `CurrentRoundInfo` (Server Component)
- 경로: `src/components/story/CurrentRoundInfo.tsx`
- 역할: "지금 이야기" 섹션 전체

```typescript
interface CurrentRoundInfoProps {
  roundNumber: number;
  totalRounds: number;
  endsAt: string;
  previousContent: string | null;    // 이전 채택작 또는 제시글
  isFirstRound: boolean;             // 첫 라운드 여부 (라벨 분기)
}
```

#### `SubmissionHeader` (Client Component)
- 경로: `src/components/story/SubmissionHeader.tsx`
- 역할: "참여 작품" 헤더 + 정렬 드롭다운

```typescript
interface SubmissionHeaderProps {
  currentSort: 'popular' | 'newest';
  onSortChange: (sort: 'popular' | 'newest') => void;
}
```

### 4.2 수정 컴포넌트

#### `Timer.tsx` — variant 추가
```typescript
interface TimerProps {
  endsAt: string;
  variant?: 'inline' | 'badge';  // 추가
}
```
- `inline` (기본): 현재 스타일 유지 (accent 텍스트 + 시계 아이콘)
- `badge`: 빨간 배경 배지 (`bg-red-500/90 text-white px-3 py-1 rounded-full`)

#### `SubmissionList.tsx` — 정렬 기능 추가
- `sortBy` 상태 추가 (`'popular' | 'newest'`)
- `SubmissionHeader` 통합
- `useMemo`로 정렬된 submissions 계산
- 폴링 시 `sortBy`에 따라 order 변경

#### `SubmissionCard.tsx` — 카드 정보 강화
- `created_at` prop 추가 (이미 SubmissionData에 포함됨)
- 아바타 이미지: `submission.profiles?.avatar_url` → `<img>` 또는 플레이스홀더
- 상대 시간: `formatTimeAgo(submission.created_at)` 표시
- "내 글" 배지: `<Badge>` 컴포넌트 사용

#### `Badge.tsx` — variant 추가
```typescript
type BadgeVariant = 'default' | 'accent' | 'outline';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}
```
- `default`: 현재 스타일 (accent-light 배경, accent 텍스트)
- `accent`: accent 배경, white 텍스트
- `outline`: 투명 배경, border, secondary 텍스트

### 4.3 삭제 컴포넌트
- `StoryProgress.tsx` → 기능이 `ExpandableStory`로 이동
- `RoundInfo.tsx` → 기능이 `CurrentRoundInfo`로 통합

---

## 5. 데이터 흐름 (page.tsx)

### 서버 사이드 데이터 페칭

```typescript
export default async function HomePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // 1. 현재 active 라운드 + 스토리 조회
  const { data: currentRound } = await supabase
    .from('rounds')
    .select('*, stories(*)')
    .eq('status', 'active')
    .single();

  if (!currentRound) return <EmptyState />;

  const story = currentRound.stories as {
    title: string;
    total_rounds: number;
    seed_text: string | null;
  };

  // 2. 완료된 라운드 + 채택작 조회
  const { data: completedRounds } = await supabase
    .from('rounds')
    .select('id, round_number, winning_submission_id, submissions!winning_submission_id(content)')
    .eq('story_id', currentRound.story_id)
    .eq('status', 'completed')
    .order('round_number', { ascending: true });

  // 3. 참여자 수 계산
  const allRoundIds = [
    ...(completedRounds?.map((r) => r.id) || []),
    currentRound.id,
  ];
  const { data: participants } = await supabase
    .from('submissions')
    .select('user_id')
    .in('round_id', allRoundIds);
  const participantCount = new Set(participants?.map((p) => p.user_id)).size;

  // 4. 전체 스토리 내용 (섹션 A용)
  const storyContent = completedRounds?.map((r) => ({
    round_number: r.round_number,
    content: getContent(r.submissions) || '(채택된 글 없음)',
  })) || [];

  // 5. 이전 채택작 또는 제시글 (섹션 B용)
  const isFirstRound = currentRound.round_number === 1;
  const previousContent = isFirstRound
    ? story.seed_text
    : completedRounds && completedRounds.length > 0
      ? getContent(completedRounds[completedRounds.length - 1].submissions)
      : null;

  // 6. 현재 라운드 제출글 + 프로필 매핑 (기존 패턴)
  const { data: rawSubmissions } = await supabase
    .from('submissions')
    .select('*')
    .eq('round_id', currentRound.id)
    .order('vote_count', { ascending: false });

  const userIds = [...new Set(rawSubmissions?.map((s) => s.user_id) || [])];
  const { data: profiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, nickname, avatar_url').in('id', userIds)
    : { data: [] };
  const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

  const submissions = rawSubmissions?.map((s) => ({
    ...s,
    profiles: profileMap.get(s.user_id) || null,
  })) || [];

  // 7. 사용자 투표 정보
  let myVoteIds: string[] = [];
  if (user) {
    const { data: votes } = await supabase
      .from('votes')
      .select('submission_id')
      .eq('user_id', user.id);
    myVoteIds = votes?.map((v) => v.submission_id) || [];
  }

  return (
    <div className="space-y-8">
      {/* 섹션 A: 오늘의 이야기 */}
      <StoryOverview
        completedRounds={completedRounds?.length || 0}
        totalRounds={story.total_rounds}
        participantCount={participantCount}
        seedText={story.seed_text}
        storyContent={storyContent}
      />

      {/* 섹션 B: 지금 이야기 */}
      <CurrentRoundInfo
        roundNumber={currentRound.round_number}
        totalRounds={story.total_rounds}
        endsAt={currentRound.ends_at}
        previousContent={previousContent}
        isFirstRound={isFirstRound}
      />

      {/* 섹션 C: 참여 작품 */}
      <SubmissionList
        initialSubmissions={submissions}
        initialVoteIds={myVoteIds}
        roundId={currentRound.id}
        currentUserId={user?.id}
      />

      {/* 플로팅 글쓰기 버튼 */}
      {user && (
        <Link href="/write" className="fixed bottom-20 right-4 md:bottom-6 ...">
          ✏️
        </Link>
      )}
    </div>
  );
}
```

### 헬퍼 함수

```typescript
// Supabase FK 결과에서 content 추출 (기존 StoryProgress에서 이동)
function getContent(
  submissions: { content: string }[] | { content: string } | null
): string | null {
  if (!submissions) return null;
  if (Array.isArray(submissions)) return submissions[0]?.content || null;
  return submissions.content;
}
```

---

## 6. 유틸리티 함수

### `formatTimeAgo`

```typescript
// src/lib/utils.ts (또는 SubmissionCard 내부)
export function formatTimeAgo(dateString: string): string {
  const diff = Date.now() - new Date(dateString).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '방금';
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  return `${days}일 전`;
}
```

---

## 7. 반응형 & 레이아웃

### 유지 사항
- 최대 너비 640px, 중앙 정렬 (기존 layout.tsx)
- 모바일: 하단 탭 네비게이션 (BottomNav)
- 데스크탑(md+): 상단 네비게이션 (HeaderNav)
- 플로팅 글쓰기 버튼: `bottom-20 right-4` (모바일) / `bottom-6 right-4` (데스크탑)

### 섹션 간 간격
- `space-y-8` (32px) — 3개 주요 섹션 간

---

## 8. 구현 체크리스트

### Step 1: DB 변경
- [ ] `003_add_seed_text.sql` 마이그레이션 작성
- [ ] Supabase SQL Editor에서 실행
- [ ] 기존 스토리에 seed_text 값 설정

### Step 2: 기초 컴포넌트 수정
- [ ] `Badge.tsx` — variant prop 추가 (default/accent/outline)
- [ ] `Timer.tsx` — variant prop 추가 (inline/badge)

### Step 3: 신규 컴포넌트 생성
- [ ] `ExpandableStory.tsx` (Client) — 접기/펼치기 스토리 카드
- [ ] `StoryOverview.tsx` (Server) — "오늘의 이야기" 섹션
- [ ] `CurrentRoundInfo.tsx` (Server) — "지금 이야기" 섹션
- [ ] `SubmissionHeader.tsx` (Client) — 정렬 헤더

### Step 4: 기존 컴포넌트 수정
- [ ] `SubmissionCard.tsx` — 아바타 이미지, 상대 시간, "내 글" 배지
- [ ] `SubmissionList.tsx` — 정렬 상태 관리 + SubmissionHeader 통합

### Step 5: 페이지 리팩토링
- [ ] `page.tsx` — 새 데이터 페칭 + 3개 섹션 컴포넌트 조립
- [ ] `formatTimeAgo` 유틸 함수 추가

### Step 6: 정리
- [ ] `StoryProgress.tsx` 삭제
- [ ] `RoundInfo.tsx` 삭제
- [ ] 글쓰기 페이지(`write/page.tsx`)에서 StoryProgress 의존성 정리

### Step 7: 검증
- [ ] `npm run build` 성공
- [ ] 빈 상태 (진행 중인 라운드 없음) 확인
- [ ] 첫 라운드 (제시글 표시) 확인
- [ ] 이후 라운드 (이전 채택작 표시) 확인
- [ ] 전체 스토리 접기/펼치기 동작
- [ ] 정렬 전환 (인기순 ↔ 최신순)
- [ ] 투표 동작 (낙관적 업데이트)
- [ ] "내 글" 배지 + 자기 글 투표 방지
- [ ] 반응형 (모바일/데스크탑)
- [ ] 다크 모드/라이트 모드
