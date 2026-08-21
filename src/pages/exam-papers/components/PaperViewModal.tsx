import { useEffect, useState } from 'react';
import type { ExamPaper } from '@/lib/types';
import Modal from '@/components/base/Modal';

type Props = {
  paper: ExamPaper | null;
  onClose: () => void;
};

export default function PaperViewModal({ paper, onClose }: Props) {
  const [showCleaned, setShowCleaned] = useState(false);

  useEffect(() => {
    if (paper) setShowCleaned(false);
  }, [paper]);

  if (!paper) return null;

  const cleaned = paper.cleaned_image_url;
  const src = showCleaned && cleaned ? cleaned : paper.image_url;

  return (
    <Modal open title={paper.title || '시험지'} onClose={onClose}>
      <div className="space-y-4">
        {cleaned && (
          <div className="inline-flex items-center gap-1 rounded-full border border-background-200 bg-background-50 p-1">
            <button
              onClick={() => setShowCleaned(false)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                !showCleaned ? 'bg-primary-500 text-background-50' : 'text-foreground-600'
              }`}
            >
              원본
            </button>
            <button
              onClick={() => setShowCleaned(true)}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                showCleaned ? 'bg-primary-500 text-background-50' : 'text-foreground-600'
              }`}
            >
              정리본
            </button>
          </div>
        )}

        {src ? (
          <div className="overflow-hidden rounded-lg border border-background-200 bg-background-50">
            <img
              src={src}
              alt={paper.title || '시험지'}
              className="max-h-80 w-full bg-white object-contain"
            />
            <a
              href={src}
              target="_blank"
              rel="noreferrer"
              className="flex cursor-pointer items-center justify-center gap-1.5 border-t border-background-200 py-2 text-xs font-medium text-primary-600 hover:bg-background-100"
            >
              <i className="ri-external-link-line"></i> 전체 크기로 보기
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-center rounded-lg border border-background-200 bg-background-50 py-16 text-sm text-foreground-400">
            이미지가 없어요.
          </div>
        )}

        <div className="rounded-lg border border-background-200 bg-background-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-100 text-accent-700">
              <i className="ri-checkbox-multiple-line text-sm"></i>
            </span>
            <h4 className="text-sm font-bold text-foreground-900">답안지</h4>
          </div>
          {paper.answer ? (
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground-800">
              {paper.answer}
            </pre>
          ) : (
            <p className="text-sm text-foreground-400">아직 답을 기입하지 않았어요.</p>
          )}
        </div>
      </div>
    </Modal>
  );
}