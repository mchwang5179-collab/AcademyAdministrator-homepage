type ConfirmDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = '삭제',
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground-950/40" onClick={onCancel}></div>
      <div className="relative w-full max-w-sm rounded-xl bg-white p-6">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-700">
            <i className="ri-alert-line text-xl"></i>
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground-950">{title}</h3>
            <p className="mt-1 text-sm text-foreground-600">{message}</p>
          </div>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-700 hover:bg-background-100"
          >
            취소
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="cursor-pointer whitespace-nowrap rounded-md bg-accent-600 px-4 py-2 text-sm font-semibold text-background-50 hover:bg-accent-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? '처리 중...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}