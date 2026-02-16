# Phase 4: 마무리 — 상세 구현 계획

## 1. 개요

### 목표
SNS 공유 기능, PWA 설정, 기본 어뷰징 방지를 구현하고, QA 및 배포를 완료하여 MVP를 출시한다.

### Phase 4 범위
- SNS 공유 기능 (카카오톡, 트위터)
- PWA 설정 (홈 화면 추가 지원)
- 기본 어뷰징 방지 (중복 투표, 중복 제출 차단)
- QA 및 배포

### Phase 3 완료 상태
- ✅ 스토리 완성 로직 (마지막 라운드 종료 시 자동 완성)
- ✅ 아카이브 페이지 (완성된 단편 목록 + 상세 읽기 + seed_text 표시)
- ✅ 프로필 페이지 (통계 + 최근 작성 글)
- ✅ 일일 스토리 체계 (9AM~10PM KST, 13라운드/일)
- ✅ Cron 자동 스토리 생성 + 라운드 진행

---

## 2. 아키텍처 결정 사항

### 2.1 SNS 공유 방식

**결정: Web Share API + 카카오 SDK + OG 메타태그**

| 방식 | 용도 | 이유 |
|------|------|------|
| **OG 메타태그** | 모든 SNS 공유 시 미리보기 | 링크 공유 시 썸네일/설명 자동 표시 |
| **Web Share API** | 모바일 네이티브 공유 | 모바일에서 OS 기본 공유 시트 활용, 별도 SDK 불필요 |
| **카카오 SDK** | 카카오톡 직접 공유 | 한국 사용자 비중 높음, 커스텀 템플릿 지원 |
| **Twitter Intent URL** | 트위터 공유 | SDK 없이 URL 파라미터만으로 구현 가능 |

**Web Share API 장점:**
- 모바일에서 카카오톡, 메시지, 인스타 등 모든 앱으로 공유 가능
- 별도 SDK 설치 불필요
- 지원하지 않는 브라우저에서는 폴백(복사 버튼)으로 처리

### 2.2 PWA 구현 방식

**결정: Next.js 내장 기능 활용 (next-pwa 미사용)**

**이유:**
- Next.js 16은 `metadata` API로 manifest 링크 자동 삽입 지원
- MVP에서는 오프라인 캐시 불필요 → 서비스 워커 생략
- `manifest.json` + 아이콘 + 메타태그만으로 "홈 화면 추가" 지원 가능
- 추후 오프라인 읽기가 필요하면 `next-pwa` 또는 `serwist` 도입

### 2.3 어뷰징 방지 전략

**결정: DB 레벨 제약 + 서버 액션 검증 (MVP 수준)**

| 방어 수단 | 구현 위치 | 상태 |
|-----------|----------|------|
| 투표 중복 방지 | `UNIQUE(submission_id, user_id)` + RLS | ✅ 이미 구현 |
| 자기 글 투표 방지 | `toggleVote` 액션 내 체크 | ✅ 이미 구현 |
| 제출 글자 수 제한 | `CHECK(char_length(content) <= 500)` + 액션 검증 | ✅ 이미 구현 |
| 라운드 종료 후 제출 방지 | `submitStory` 액션 내 시간 체크 | ✅ 이미 구현 |
| 제출 횟수 제한 | 라운드당 최대 N개 제한 (서버 액션) | ⬜ 신규 |
| 인증 필수 | Supabase Auth + RLS `auth.uid()` | ✅ 이미 구현 |

**MVP에서 제외하는 것:**
- IP 기반 중복 감지 (복잡도 높음, 효과 제한적)
- Rate limiting 미들웨어 (초기 트래픽에서 불필요)
- 다중 계정 감지 (소셜 로그인 자체가 일정 수준 방어)

---

## 3. SNS 공유 기능

### 3.1 OG 메타태그

**글로벌 메타데이터 (`src/app/layout.tsx`):**

```typescript
export const metadata: Metadata = {
  title: 'Storlit — 매일 함께 쓰는 릴레이 소설',
  description: '매일 한 편의 단편이 집단 창작으로 완성되는 참여형 릴레이 소설 플랫폼',
  openGraph: {
    title: 'Storlit — 매일 함께 쓰는 릴레이 소설',
    description: '매일 한 편의 단편이 집단 창작으로 완성되는 참여형 릴레이 소설 플랫폼',
    type: 'website',
    locale: 'ko_KR',
    siteName: 'Storlit',
  },
  twitter: {
    card: 'summary',
    title: 'Storlit — 매일 함께 쓰는 릴레이 소설',
    description: '매일 한 편의 단편이 집단 창작으로 완성되는 참여형 릴레이 소설 플랫폼',
  },
};
```

**아카이브 상세 페이지 동적 메타데이터 (`src/app/archive/[id]/page.tsx`):**

```typescript
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: story } = await supabase
    .from('stories')
    .select('title, genre, seed_text')
    .eq('id', id)
    .single();

  if (!story) return {};

  const description = story.seed_text
    ? story.seed_text.slice(0, 100) + '...'
    : `${story.genre || '릴레이 소설'} — Storlit에서 함께 만든 이야기`;

  return {
    title: `${story.title} — Storlit`,
    description,
    openGraph: {
      title: story.title,
      description,
      type: 'article',
    },
    twitter: {
      card: 'summary',
      title: story.title,
      description,
    },
  };
}
```

### 3.2 공유 버튼 컴포넌트

**`src/components/share/ShareButton.tsx` (클라이언트 컴포넌트):**

```typescript
'use client';

import { useState } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url: string;
}

export function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    // 1. Web Share API 지원 시 네이티브 공유
    if (navigator.share) {
      try {
        await navigator.share({ title, text, url });
        return;
      } catch {
        // 사용자가 취소한 경우 무시
      }
    }

    // 2. 폴백: 클립보드 복사
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
        bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
    >
      {/* 공유 아이콘 */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2">
        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
        <polyline points="16 6 12 2 8 6" />
        <line x1="12" y1="2" x2="12" y2="15" />
      </svg>
      {copied ? '복사됨!' : '공유'}
    </button>
  );
}
```

### 3.3 트위터 공유

**`src/components/share/TwitterShareButton.tsx`:**

```typescript
'use client';

interface TwitterShareButtonProps {
  text: string;
  url: string;
}

export function TwitterShareButton({ text, url }: TwitterShareButtonProps) {
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;

  return (
    <a
      href={twitterUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
        bg-bg-elevated text-text-secondary hover:text-text-primary transition-colors"
    >
      {/* X(트위터) 아이콘 */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      트위터
    </a>
  );
}
```

### 3.4 카카오톡 공유

**`src/components/share/KakaoShareButton.tsx`:**

```typescript
'use client';

import { useEffect, useState } from 'react';

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: object) => void;
      };
    };
  }
}

interface KakaoShareButtonProps {
  title: string;
  description: string;
  url: string;
}

export function KakaoShareButton({ title, description, url }: KakaoShareButtonProps) {
  const [sdkLoaded, setSdkLoaded] = useState(false);

  useEffect(() => {
    // 카카오 SDK 동적 로드
    if (window.Kakao) {
      setSdkLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
    script.integrity = 'sha384-DKYJZ8NLiK8MN4/C5P2ezmFnkrysYjmXsHTIbSQoYbO/YjaNXaSqZTKk+tECQTp'; // 실제 해시로 교체
    script.crossOrigin = 'anonymous';
    script.onload = () => {
      if (!window.Kakao.isInitialized()) {
        window.Kakao.init(process.env.NEXT_PUBLIC_KAKAO_JS_KEY || '');
      }
      setSdkLoaded(true);
    };
    document.head.appendChild(script);
  }, []);

  const handleShare = () => {
    if (!sdkLoaded) return;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: `${url}/og-image.png`, // OG 이미지 URL
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: '읽으러 가기',
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  };

  return (
    <button
      onClick={handleShare}
      disabled={!sdkLoaded}
      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
        bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] transition-colors
        disabled:opacity-50"
    >
      {/* 카카오 말풍선 아이콘 */}
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.108 4.508 6.453-.199.744-.72 2.694-.826 3.109-.129.506.186.499.39.363.16-.106 2.55-1.735 3.585-2.44.77.107 1.564.162 2.343.162 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z" />
      </svg>
      카카오톡
    </button>
  );
}
```

### 3.5 공유 버튼 배치

**아카이브 상세 페이지 하단에 공유 버튼 그룹 추가:**

```tsx
{/* 공유 */}
<div className="flex items-center justify-center gap-2">
  <ShareButton
    title={story.title}
    text={`"${story.title}" — Storlit에서 함께 만든 릴레이 소설`}
    url={`${process.env.NEXT_PUBLIC_SITE_URL}/archive/${story.id}`}
  />
  <KakaoShareButton
    title={story.title}
    description={story.seed_text?.slice(0, 50) || '릴레이 소설'}
    url={`${process.env.NEXT_PUBLIC_SITE_URL}/archive/${story.id}`}
  />
  <TwitterShareButton
    text={`"${story.title}" — Storlit에서 함께 만든 릴레이 소설`}
    url={`${process.env.NEXT_PUBLIC_SITE_URL}/archive/${story.id}`}
  />
</div>
```

---

## 4. PWA 설정

### 4.1 Web App Manifest

**`public/manifest.json`:**

```json
{
  "name": "Storlit — 매일 함께 쓰는 릴레이 소설",
  "short_name": "Storlit",
  "description": "매일 한 편의 단편이 집단 창작으로 완성되는 참여형 릴레이 소설 플랫폼",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#6C63FF",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-maskable-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable"
    },
    {
      "src": "/icons/icon-maskable-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable"
    }
  ]
}
```

### 4.2 아이콘 생성

**필요한 아이콘 목록:**

| 파일 | 크기 | 용도 |
|------|------|------|
| `public/icons/icon-192.png` | 192×192 | Android, 홈 화면 |
| `public/icons/icon-512.png` | 512×512 | Android 스플래시, PWA 설치 |
| `public/icons/icon-maskable-192.png` | 192×192 | Android adaptive icon |
| `public/icons/icon-maskable-512.png` | 512×512 | Android adaptive icon |
| `public/icons/apple-touch-icon.png` | 180×180 | iOS 홈 화면 |

**디자인 가이드:**
- 배경: accent 컬러 (`#6C63FF`)
- 전경: 흰색 연필/책 아이콘 또는 "S" 로고
- maskable 아이콘: 안전 영역(80%) 내에 로고 배치

### 4.3 레이아웃 메타태그 추가

**`src/app/layout.tsx` — `<head>` 내 추가:**

```html
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#6C63FF" />
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Storlit" />
```

### 4.4 viewport 설정

**`src/app/layout.tsx` — metadata 내:**

```typescript
export const metadata: Metadata = {
  // ... 기존 메타데이터
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
};
```

> **참고:** MVP에서는 서비스 워커를 생략한다. 오프라인 읽기 기능이 필요해지면 `serwist` 또는 `next-pwa`를 도입한다.

---

## 5. 어뷰징 방지

### 5.1 기존 구현 정리

#### DB 레벨 제약

| 테이블 | 제약 | 효과 |
|--------|------|------|
| `votes` | `UNIQUE(submission_id, user_id)` | 같은 글에 중복 투표 불가 |
| `submissions` | `CHECK(char_length(content) <= 500)` | 500자 초과 제출 불가 |

#### RLS 정책

| 테이블 | 정책 | 효과 |
|--------|------|------|
| `submissions` | `auth.uid() = user_id` (INSERT) | 인증된 사용자만 제출 |
| `votes` | `auth.uid() = user_id` (INSERT) | 인증된 사용자만 투표 |
| `votes` | `auth.uid() = user_id` (DELETE) | 본인 투표만 취소 가능 |

#### Server Action 검증

| 액션 | 검증 | 효과 |
|------|------|------|
| `submitStory` | `auth.getUser()` | 미인증 차단 |
| `submitStory` | `content.length > 500` 체크 | 글자 수 초과 차단 |
| `submitStory` | `round.status !== 'active'` 체크 | 비활성 라운드 제출 차단 |
| `submitStory` | `new Date() >= ends_at` 체크 | 종료된 라운드 제출 차단 |
| `toggleVote` | `submission.user_id === user.id` 체크 | 자기 글 투표 차단 |
| `toggleVote` | 기존 투표 조회 후 토글 | 중복 투표 방지 (토글 방식) |

### 5.2 추가 구현: 라운드당 제출 횟수 제한

**문제:** Phase 2에서 `UNIQUE(round_id, user_id)` 제약을 해제하여 라운드당 여러 글 제출 가능. 무제한 제출 시 스팸 가능성.

**수정: `src/actions/submission.ts`에 제출 횟수 체크 추가**

```typescript
const MAX_SUBMISSIONS_PER_ROUND = 3;

// 이번 라운드 제출 횟수 확인
const { count } = await supabase
  .from('submissions')
  .select('*', { count: 'exact', head: true })
  .eq('round_id', roundId)
  .eq('user_id', user.id);

if ((count ?? 0) >= MAX_SUBMISSIONS_PER_ROUND) {
  return { error: `라운드당 최대 ${MAX_SUBMISSIONS_PER_ROUND}개까지 제출할 수 있습니다` };
}
```

### 5.3 추가 구현: 투표 시 라운드 활성 상태 확인

**현재 문제:** 라운드 종료 후에도 투표가 가능 (winning_submission 선정에는 영향 없지만, UI상 혼란)

**수정: `src/actions/vote.ts`에 라운드 상태 체크 추가**

```typescript
// 해당 제출글의 라운드가 active인지 확인
const { data: round } = await supabase
  .from('rounds')
  .select('status')
  .eq('id', submission.round_id)
  .single();

if (!round || round.status !== 'active') {
  return { error: '종료된 라운드에서는 투표할 수 없습니다' };
}
```

> 이를 위해 `toggleVote`에서 submission 조회 시 `round_id`도 함께 select 필요:
> `.select('user_id, round_id')` 로 변경

---

## 6. QA 및 배포

### 6.1 빌드 검증

```bash
npm run build    # 빌드 에러 없는지 확인
npm run lint     # ESLint 경고/에러 확인
```

### 6.2 기능 테스트 체크리스트

**홈 화면:**
- [ ] 진행 중 스토리 표시
- [ ] 타이머 카운트다운 정상
- [ ] 글쓰기 → 제출 → 목록에 반영
- [ ] 투표 → 득표수 변경
- [ ] 투표 취소 → 득표수 감소
- [ ] 자기 글 투표 방지
- [ ] 미로그인 시 글쓰기/투표 불가

**아카이브:**
- [ ] 완성된 스토리 목록 표시
- [ ] 상세 페이지 — seed_text + 채택글 순서대로
- [ ] 공유 버튼 동작 (Web Share / 카카오 / 트위터)
- [ ] OG 메타태그 미리보기 (카카오 디버거, 트위터 카드 검증기)

**프로필:**
- [ ] 통계 (작성 글 수, 채택 글 수) 정확
- [ ] 최근 작성 글 목록
- [ ] 로그아웃 동작

**PWA:**
- [ ] 모바일 Chrome에서 "홈 화면에 추가" 프롬프트 표시
- [ ] iOS Safari에서 "홈 화면에 추가" 동작
- [ ] standalone 모드에서 정상 표시 (브라우저 UI 없음)

**Cron:**
- [ ] 매시간 정각 라운드 자동 진행
- [ ] 9AM KST 새 스토리 자동 생성
- [ ] 13번째 라운드 종료 시 스토리 완성

**어뷰징 방지:**
- [ ] 같은 글에 중복 투표 불가
- [ ] 라운드당 제출 횟수 제한 (3개)
- [ ] 종료된 라운드 투표 불가
- [ ] 미인증 사용자 제출/투표 불가

### 6.3 Vercel 배포 설정

**환경변수 (Vercel Dashboard에서 설정):**

| 변수 | 용도 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 |
| `CRON_SECRET` | Cron Job 인증 시크릿 |
| `NEXT_PUBLIC_KAKAO_JS_KEY` | 카카오 JavaScript 앱 키 (공유용) |
| `NEXT_PUBLIC_SITE_URL` | 사이트 URL (공유 링크 생성용) |

**Vercel Cron 확인:**
- `vercel.json`의 `crons` 설정이 Vercel Dashboard에 반영되었는지 확인
- Cron Logs에서 실행 이력 확인

### 6.4 배포 후 확인

- [ ] 프로덕션 URL 접속 → 메인 페이지 정상
- [ ] 소셜 로그인 동작 (카카오, 구글)
- [ ] Vercel Cron Logs에서 라운드 진행 확인
- [ ] 모바일에서 PWA 설치 가능
- [ ] OG 메타태그 검증 (https://developers.kakao.com/tool/debugger/sharing)

---

## 7. 디렉토리 구조 (Phase 4 완료 후)

```
src/
├── app/
│   ├── layout.tsx                          # OG 메타태그 + PWA 메타태그 추가
│   ├── page.tsx
│   ├── globals.css
│   ├── write/
│   │   └── page.tsx
│   ├── archive/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx                    # generateMetadata + 공유 버튼 추가
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
│               └── route.ts
├── actions/
│   ├── submission.ts                       # 제출 횟수 제한 추가
│   └── vote.ts                             # 라운드 상태 체크 추가
├── components/
│   ├── ui/
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   └── Badge.tsx
│   ├── story/
│   │   ├── SubmissionCard.tsx
│   │   ├── SubmissionList.tsx
│   │   ├── StoryProgress.tsx
│   │   ├── Timer.tsx
│   │   ├── WriteForm.tsx
│   │   └── RoundInfo.tsx
│   ├── share/                              # (신규)
│   │   ├── ShareButton.tsx                 # Web Share API + 클립보드 폴백
│   │   ├── KakaoShareButton.tsx            # 카카오톡 공유
│   │   └── TwitterShareButton.tsx          # 트위터(X) 공유
│   ├── layout/
│   ├── auth/
│   │   └── SignOutButton.tsx
│   └── providers/
├── lib/
│   └── supabase/
├── stores/
│   └── roundStore.ts
├── types/
│   └── database.ts
public/
├── manifest.json                           # (신규) PWA 매니페스트
├── icons/                                  # (신규)
│   ├── icon-192.png
│   ├── icon-512.png
│   ├── icon-maskable-192.png
│   ├── icon-maskable-512.png
│   └── apple-touch-icon.png
```

---

## 8. 구현 순서 & 체크리스트

### Step 1: OG 메타태그

- [ ] `src/app/layout.tsx` — openGraph, twitter 메타데이터 추가
- [ ] `src/app/archive/[id]/page.tsx` — `generateMetadata` 함수 추가
- [ ] 환경변수 `NEXT_PUBLIC_SITE_URL` 추가

### Step 2: 공유 컴포넌트

- [ ] `src/components/share/ShareButton.tsx` — Web Share API + 클립보드 폴백
- [ ] `src/components/share/TwitterShareButton.tsx` — Twitter Intent URL
- [ ] `src/components/share/KakaoShareButton.tsx` — 카카오 SDK 동적 로드 + 공유
- [ ] `src/app/archive/[id]/page.tsx` — 공유 버튼 그룹 배치
- [ ] 환경변수 `NEXT_PUBLIC_KAKAO_JS_KEY` 추가

### Step 3: PWA 설정

- [ ] `public/manifest.json` 생성
- [ ] `public/icons/` — PWA 아이콘 5개 생성 (192, 512, maskable, apple-touch)
- [ ] `src/app/layout.tsx` — manifest 링크 + apple-mobile-web-app 메타태그 추가

### Step 4: 어뷰징 방지 강화

- [ ] `src/actions/submission.ts` — 라운드당 최대 3개 제출 제한
- [ ] `src/actions/vote.ts` — 종료된 라운드 투표 차단 (submission 조회 시 round_id 포함, 라운드 상태 체크)

### Step 5: QA

- [ ] `npm run build` 빌드 성공
- [ ] `npm run lint` 경고 확인
- [ ] 기능 테스트 체크리스트 전체 수행 (6.2절)

### Step 6: 배포

- [ ] Vercel Dashboard 환경변수 설정
- [ ] `git push` → Vercel 자동 배포
- [ ] 프로덕션 URL 접속 확인
- [ ] Vercel Cron Logs 확인
- [ ] OG 메타태그 검증 (카카오 디버거)
- [ ] 모바일 PWA 설치 테스트

---

## Phase 4 완료 기준

### 필수 기능
- [ ] OG 메타태그 (글로벌 + 아카이브 상세)
- [ ] 공유 버튼 (Web Share + 카카오톡 + 트위터)
- [ ] PWA manifest + 아이콘 (홈 화면 추가 지원)
- [ ] 어뷰징 방지 강화 (제출 횟수 제한, 종료 라운드 투표 차단)
- [ ] Vercel 프로덕션 배포 완료
- [ ] 전체 기능 테스트 통과

### 성공 지표
- [ ] 아카이브 스토리 링크를 카카오톡에 공유 시 미리보기 정상 표시
- [ ] 모바일에서 홈 화면에 앱 추가 가능
- [ ] 라운드당 3개 초과 제출 시 에러 메시지 표시
- [ ] 프로덕션 환경에서 24시간 동안 일일 스토리 1편 완성
