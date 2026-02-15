# Phase 1: 기반 구축 — 상세 구현 계획

## 1. 개요

### 목표
프로젝트 초기 셋업, 디자인 시스템 구축, 소셜 로그인, 기본 레이아웃을 완성하여 Phase 2(핵심 기능) 개발의 토대를 마련한다.

### 확정 사항

| 항목 | 결정 |
|------|------|
| 로그인 | 구글 + 카카오 소셜 로그인 (이메일 로그인은 MVP 제외) |
| 폰트 | Pretendard 단일 사용 |
| 디자인 | 모노톤 기반 + 포인트 컬러(코랄 #FF6B4A) |
| 테마 | 다크모드 + 라이트모드 지원 |
| 플랫폼 | 모바일 웹 우선, 데스크탑 반응형 |
| 프레임워크 | Next.js 15 (App Router) + TypeScript |
| CSS | Tailwind CSS v4 |
| DB/Auth | Supabase (PostgreSQL + Auth) |
| 상태관리 | Zustand |
| 배포 | Vercel |

---

## 2. 디자인 시스템

### 2.1 컬러 토큰

#### 라이트 모드

| 토큰 | 값 | 용도 |
|------|------|------|
| `--bg-primary` | `#FAFAFA` | 페이지 배경 |
| `--bg-surface` | `#FFFFFF` | 카드, 입력 필드 배경 |
| `--bg-elevated` | `#F0F0F0` | 강조 섹션 배경 |
| `--text-primary` | `#1A1A1A` | 본문 텍스트 |
| `--text-secondary` | `#6B6B6B` | 보조 텍스트, 캡션 |
| `--text-tertiary` | `#9B9B9B` | 플레이스홀더, 비활성 |
| `--border` | `#E0E0E0` | 구분선, 테두리 |
| `--accent` | `#FF6B4A` | 포인트 컬러 (버튼, 타이머, 강조) |
| `--accent-hover` | `#E55A3A` | 포인트 컬러 호버 |
| `--accent-light` | `#FFF0ED` | 포인트 컬러 배경 (뱃지 등) |

#### 다크 모드

| 토큰 | 값 | 용도 |
|------|------|------|
| `--bg-primary` | `#1A1A1A` | 페이지 배경 |
| `--bg-surface` | `#242424` | 카드, 입력 필드 배경 |
| `--bg-elevated` | `#2E2E2E` | 강조 섹션 배경 |
| `--text-primary` | `#E8E8E8` | 본문 텍스트 |
| `--text-secondary` | `#A0A0A0` | 보조 텍스트, 캡션 |
| `--text-tertiary` | `#6B6B6B` | 플레이스홀더, 비활성 |
| `--border` | `#3A3A3A` | 구분선, 테두리 |
| `--accent` | `#FF6B4A` | 포인트 컬러 (양 모드 동일) |
| `--accent-hover` | `#FF8266` | 포인트 컬러 호버 |
| `--accent-light` | `#2E1F1A` | 포인트 컬러 배경 (뱃지 등) |

### 2.2 타이포그래피

폰트: **Pretendard** (Variable)

| 스케일 | 크기 | 굵기 | 용도 |
|--------|------|------|------|
| `heading-1` | 24px / 1.5rem | 700 (Bold) | 페이지 제목 |
| `heading-2` | 20px / 1.25rem | 700 (Bold) | 섹션 제목 |
| `heading-3` | 18px / 1.125rem | 600 (SemiBold) | 카드 제목 |
| `body-lg` | 16px / 1rem | 400 (Regular) | 소설 본문 (가독성 최우선) |
| `body` | 14px / 0.875rem | 400 (Regular) | 일반 본문 |
| `caption` | 12px / 0.75rem | 400 (Regular) | 보조 정보, 타임스탬프 |

- 소설 본문 line-height: 1.8 (읽기 편안함)
- 일반 본문 line-height: 1.6
- letter-spacing: -0.01em (한글 가독성)

### 2.3 다크/라이트 모드 전환

- `next-themes` 라이브러리 사용
- CSS 변수 기반으로 전환 (Tailwind의 `dark:` 프리픽스 활용)
- 시스템 설정 자동 감지 + 수동 토글
- `localStorage`에 사용자 선택 저장

### 2.4 기본 UI 컴포넌트

| 컴포넌트 | 설명 |
|----------|------|
| `Button` | Primary(코랄), Secondary(보더), Ghost 변형 |
| `Card` | 제출글, 스토리 카드 등에 사용 |
| `Input` | 텍스트 입력 (글자수 카운터 포함) |
| `BottomNav` | 모바일 하단 탭 네비게이션 |
| `HeaderNav` | 데스크탑 상단 네비게이션 |
| `ThemeToggle` | 다크/라이트 모드 전환 버튼 |
| `Avatar` | 사용자 프로필 이미지 |
| `Badge` | 작가 레벨, 라운드 번호 등 |

---

## 3. 레이아웃

### 3.1 반응형 브레이크포인트

| 이름 | 범위 | 레이아웃 |
|------|------|----------|
| Mobile | < 768px | 하단 탭 네비게이션, 단일 컬럼 |
| Desktop | ≥ 768px | 상단 헤더 네비게이션, max-width 컨테이너 |

### 3.2 모바일 레이아웃

```
┌─────────────────────┐
│  Storlit      🌙    │  ← 심플 헤더 (로고 + 테마 토글)
├─────────────────────┤
│                     │
│    콘텐츠 영역       │  ← 스크롤 가능
│                     │
│                     │
├─────────────────────┤
│  🏠   📚   👤      │  ← 하단 탭 (홈, 아카이브, 프로필)
└─────────────────────┘
```

### 3.3 데스크탑 레이아웃

```
┌──────────────────────────────────────────┐
│  Storlit     홈  아카이브  프로필    🌙   │  ← 상단 헤더
├──────────────────────────────────────────┤
│           ┌──────────────┐               │
│           │              │               │
│           │  콘텐츠 영역  │               │  ← max-width: 640px
│           │  (중앙 정렬)  │               │      (가독성을 위해 좁은 폭)
│           │              │               │
│           └──────────────┘               │
└──────────────────────────────────────────┘
```

- 데스크탑에서도 콘텐츠 영역은 max-width 640px로 제한하여 긴 텍스트의 가독성 확보
- "책 읽는 느낌"을 주기 위해 넓은 여백 활용

---

## 4. DB 스키마

### 4.1 테이블 정의 (SQL)

```sql
-- Supabase Auth의 auth.users 테이블을 활용하되, 추가 프로필 정보를 위한 public.profiles 테이블 생성
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname VARCHAR(30) NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.stories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(100) NOT NULL,
  genre VARCHAR(20),
  status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  total_rounds INT DEFAULT 15,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE public.rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id UUID NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  round_number INT NOT NULL,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ends_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'voting', 'completed')),
  winning_submission_id UUID,
  UNIQUE(story_id, round_number)
);

CREATE TABLE public.submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID NOT NULL REFERENCES public.rounds(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 500),
  vote_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(round_id, user_id) -- 라운드당 1인 1제출
);

-- winning_submission_id FK는 submissions 생성 후 추가
ALTER TABLE public.rounds
  ADD CONSTRAINT fk_winning_submission
  FOREIGN KEY (winning_submission_id) REFERENCES public.submissions(id);

CREATE TABLE public.votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(submission_id, user_id) -- 제출당 1인 1투표
);
```

### 4.2 RLS 정책

```sql
-- profiles: 본인만 수정, 전체 읽기 허용
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "프로필 전체 읽기" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "본인 프로필 수정" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "본인 프로필 생성" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- stories: 전체 읽기
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "스토리 전체 읽기" ON public.stories FOR SELECT USING (true);

-- rounds: 전체 읽기
ALTER TABLE public.rounds ENABLE ROW LEVEL SECURITY;
CREATE POLICY "라운드 전체 읽기" ON public.rounds FOR SELECT USING (true);

-- submissions: 전체 읽기, 로그인 사용자 작성
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "제출글 전체 읽기" ON public.submissions FOR SELECT USING (true);
CREATE POLICY "로그인 사용자 제출" ON public.submissions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- votes: 로그인 사용자 투표/취소
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "투표 전체 읽기" ON public.votes FOR SELECT USING (true);
CREATE POLICY "로그인 사용자 투표" ON public.votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "본인 투표 취소" ON public.votes FOR DELETE USING (auth.uid() = user_id);
```

---

## 5. 소셜 로그인

### 5.1 OAuth 플로우

```
사용자 → 로그인 버튼 클릭
       → Supabase Auth signInWithOAuth({ provider: 'google' | 'kakao' })
       → OAuth 제공자 로그인 화면
       → 인증 완료 → /auth/callback 리다이렉트
       → Supabase 세션 생성
       → 프로필 자동 생성 (DB trigger 또는 callback 로직)
       → 메인 페이지 이동
```

### 5.2 설정 필요 사항

**구글 OAuth**
- Google Cloud Console에서 OAuth 2.0 클라이언트 생성
- Supabase Dashboard → Authentication → Providers → Google 활성화
- 리다이렉트 URI 설정

**카카오 OAuth**
- Kakao Developers에서 앱 생성
- Supabase Dashboard → Authentication → Providers → Kakao 활성화
- 리다이렉트 URI 설정

### 5.3 로그인 페이지 UI

```
┌─────────────────────┐
│                     │
│      Storlit        │  ← 로고
│                     │
│  매일 함께 쓰는      │  ← 서비스 설명
│  릴레이 소설         │
│                     │
│ ┌─────────────────┐ │
│ │ G  구글로 시작   │ │  ← 구글 로그인 버튼
│ └─────────────────┘ │
│ ┌─────────────────┐ │
│ │ 💬 카카오로 시작  │ │  ← 카카오 로그인 버튼
│ └─────────────────┘ │
│                     │
└─────────────────────┘
```

---

## 6. 구현 순서 & 체크리스트

### Step 1: 프로젝트 초기화 ✅ 완료

- [x] Next.js 15 프로젝트 생성 (App Router, TypeScript)
- [x] Tailwind CSS v4 설치 및 설정
- [x] ESLint + Prettier 설정
- [x] 디렉토리 구조 생성
  ```
  src/
  ├── app/              # 페이지 (App Router)
  │   ├── layout.tsx
  │   ├── page.tsx
  │   ├── login/
  │   ├── archive/
  │   ├── profile/
  │   └── auth/callback/
  ├── components/       # 재사용 컴포넌트
  │   ├── ui/           # 기본 UI (Button, Card, Input...)
  │   ├── layout/       # 레이아웃 (Nav, Header...)
  │   └── auth/         # 인증 관련
  ├── lib/              # 유틸리티, Supabase 클라이언트
  ├── stores/           # Zustand 스토어
  └── types/            # TypeScript 타입
  ```
- [x] `.env.local` 템플릿 생성 (`.env.local.example`)

### Step 2: 폰트 & 기본 스타일 ✅ 완료

- [x] Pretendard 웹폰트 설정 (CDN — pretendardvariable-dynamic-subset)
- [x] CSS 변수 기반 컬러 토큰 정의 (라이트/다크 모드)
- [x] Tailwind 커스텀 테마 확장 (`@theme inline` 컬러 토큰 매핑)
- [x] `globals.css` 기본 스타일 (리셋, 타이포그래피, story-text 클래스)
- [x] `next-themes` 설치 및 ThemeProvider 구현 (`data-theme` attribute 방식)

### Step 3: 기본 레이아웃 ✅ 완료

- [x] `RootLayout` 구성 (ThemeProvider, Pretendard CDN, 메타데이터)
- [x] `BottomNav` 컴포넌트 (모바일 하단 탭: 홈, 아카이브, 프로필)
- [x] `HeaderNav` 컴포넌트 (데스크탑 상단 네비게이션)
- [x] 반응형 레이아웃 래퍼 (768px 기준 모바일 ↔ 데스크탑 전환, max-w-640px 콘텐츠)
- [x] `ThemeToggle` 컴포넌트 (다크/라이트 전환, sun/moon 아이콘)

### Step 4: Supabase 연동 ✅ 완료

- [x] `@supabase/supabase-js` + `@supabase/ssr` 설치
- [x] 브라우저 클라이언트 설정 (`lib/supabase/client.ts`)
- [x] 서버 클라이언트 설정 (`lib/supabase/server.ts`)
- [x] 미들웨어 세션 갱신 설정 (`lib/supabase/middleware.ts` + `src/middleware.ts`)
- [x] 환경변수 템플릿 작성 (`.env.local.example`)

### Step 5: DB 스키마 생성 ✅ 완료

- [x] SQL 마이그레이션 파일 작성 (`supabase/migrations/001_initial_schema.sql`)
- [x] 5개 테이블 생성 (profiles, stories, rounds, submissions, votes)
- [x] RLS 정책 설정
- [x] 신규 유저 자동 프로필 생성 트리거 (`handle_new_user`)
- [x] 성능 인덱스 추가
- [x] TypeScript 타입 정의 (`src/types/database.ts`)
- [x] Supabase 대시보드에서 SQL 실행 및 스키마 확인

### Step 6: 소셜 로그인 구현 ✅ 완료

- [x] 로그인 페이지 UI 구현 (`/login`) — 구글/카카오 브랜드 버튼
- [x] OAuth 콜백 처리 (`/auth/callback/route.ts`)
- [x] 로그아웃 라우트 (`/auth/signout/route.ts`)
- [x] 인증 상태 관리 (미들웨어 세션 갱신)
- [x] LoginButtons 클라이언트 컴포넌트 구현
- [x] Supabase 대시보드에서 구글 OAuth 프로바이더 설정
- [x] Supabase 대시보드에서 카카오 OAuth 프로바이더 설정

### Step 7: 기본 페이지 스캐폴딩 ✅ 완료

- [x] 메인 페이지 (`/`) — 빈 상태 아이콘 + "현재 진행 중인 스토리가 없습니다"
- [x] 아카이브 페이지 (`/archive`) — 빈 상태 아이콘 + "아직 완성된 스토리가 없습니다"
- [x] 프로필 페이지 (`/profile`) — 아바타, 닉네임, 이메일, 통계, 로그아웃 (비로그인 시 /login 리다이렉트)
- [x] 로그인 페이지 (`/login`) — 구글/카카오 로그인 버튼
- [x] SignOutButton 컴포넌트

### Step 8: 검증 ✅ 완료

- [x] `npm run build` 빌드 성공 확인 (모든 라우트 정상 등록)
- [x] `npm run dev` 로컬 실행 → UI 확인
- [x] 구글 로그인 → 프로필 페이지 표시 확인
- [x] 카카오 로그인 → 프로필 페이지 표시 확인
- [x] 로그인 후 /profile 페이지 정상 동작 확인
- [x] 모바일 하단 탭 네비게이션 확인
- [x] 데스크탑 상단 헤더 네비게이션 확인
- [x] 다크모드 ↔ 라이트모드 전환 확인

---

## Phase 1 완료 (2025-02-15)
