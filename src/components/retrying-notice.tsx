interface RetryingNoticeProps {
  onCancel: () => void;
}

/** Shown while a low-confidence mobile MediaPipe result is automatically
 * retried with a different engine (see MIN_ALIVE_ALPHA_RATIO in
 * background-removal.worker.ts). No "continue anyway?" confirm — the cancel
 * button already covers that (press it or don't), so this never blocks. */
export function RetryingNotice({ onCancel }: RetryingNoticeProps) {
  return (
    <div className="flex w-full flex-col items-center gap-2 rounded-md border border-hairline bg-canvas p-4 text-center">
      <p className="text-[14px] font-medium text-ink">정밀 분석 중이에요</p>
      <p className="text-[13px] text-muted">복잡한 사진이라 조금 더 걸려요</p>
      <button
        type="button"
        onClick={onCancel}
        className="mt-1 h-9 rounded-sm border border-hairline px-4 text-[13px] font-medium text-body"
      >
        취소
      </button>
    </div>
  );
}
