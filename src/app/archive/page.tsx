export default function ArchivePage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <svg
        width="48"
        height="48"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        className="text-text-tertiary mb-4"
      >
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
      <p className="text-text-secondary text-sm">
        아직 완성된 스토리가 없습니다
      </p>
      <p className="text-text-tertiary text-xs mt-1">
        첫 번째 릴레이 소설이 완성되면 여기에 표시됩니다
      </p>
    </div>
  );
}
