'use client';

import { useCallback, useSyncExternalStore } from 'react';

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (options: object) => void;
      };
    };
    __kakaoSdkLoaded?: boolean;
    __kakaoSdkListeners?: Set<() => void>;
  }
}

function getSnapshot() {
  return typeof window !== 'undefined' && !!window.__kakaoSdkLoaded;
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};

  if (!window.__kakaoSdkListeners) {
    window.__kakaoSdkListeners = new Set();
  }
  window.__kakaoSdkListeners.add(callback);

  // Load SDK if not yet loaded
  if (!window.__kakaoSdkLoaded) {
    if (window.Kakao) {
      const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
      if (key && !window.Kakao.isInitialized()) window.Kakao.init(key);
      window.__kakaoSdkLoaded = true;
      window.__kakaoSdkListeners.forEach((cb) => cb());
    } else {
      const script = document.createElement('script');
      script.src =
        'https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js';
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        const key = process.env.NEXT_PUBLIC_KAKAO_JS_KEY;
        if (key && !window.Kakao.isInitialized()) window.Kakao.init(key);
        window.__kakaoSdkLoaded = true;
        window.__kakaoSdkListeners?.forEach((cb) => cb());
      };
      document.head.appendChild(script);
    }
  }

  return () => {
    window.__kakaoSdkListeners?.delete(callback);
  };
}

interface KakaoShareButtonProps {
  title: string;
  description: string;
  url: string;
}

export function KakaoShareButton({
  title,
  description,
  url,
}: KakaoShareButtonProps) {
  const sdkLoaded = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot
  );

  const handleShare = useCallback(() => {
    if (!sdkLoaded || !window.Kakao?.isInitialized()) return;

    window.Kakao.Share.sendDefault({
      objectType: 'feed',
      content: {
        title,
        description,
        imageUrl: `${url}/og-image.png`,
        link: { mobileWebUrl: url, webUrl: url },
      },
      buttons: [
        {
          title: '읽으러 가기',
          link: { mobileWebUrl: url, webUrl: url },
        },
      ],
    });
  }, [sdkLoaded, title, description, url]);

  return (
    <button
      onClick={handleShare}
      disabled={!sdkLoaded}
      className="flex items-center gap-1 px-3 py-1.5 rounded-md text-sm
        bg-[#FEE500] text-[#191919] hover:bg-[#FDD835] transition-colors
        disabled:opacity-50"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 3C6.477 3 2 6.463 2 10.691c0 2.724 1.8 5.108 4.508 6.453-.199.744-.72 2.694-.826 3.109-.129.506.186.499.39.363.16-.106 2.55-1.735 3.585-2.44.77.107 1.564.162 2.343.162 5.523 0 10-3.463 10-7.691C22 6.463 17.523 3 12 3z" />
      </svg>
      카카오톡
    </button>
  );
}
