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
      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
      트위터
    </a>
  );
}
