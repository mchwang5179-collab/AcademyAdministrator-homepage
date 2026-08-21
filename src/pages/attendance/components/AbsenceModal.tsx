import { useEffect, useState } from 'react';
import Modal from '@/components/base/Modal';
import type { AbsenceType } from '@/lib/types';
import { ABSENCE_TYPES } from '@/lib/constants';

type AbsenceModalProps = {
  open: boolean;
  studentName: string;
  initialType: AbsenceType | null;
  initialMakeupDate: string | null;
  initialMakeupTime: string | null;
  onClose: () => void;
  onSave: (type: AbsenceType, makeupDate: string, makeupTime: string) => void;
};

export default function AbsenceModal({
  open,
  studentName,
  initialType,
  initialMakeupDate,
  initialMakeupTime,
  onClose,
  onSave,
}: AbsenceModalProps) {
  const [type, setType] = useState<AbsenceType | null>(initialType);
  const [makeupDate, setMakeupDate] = useState(initialMakeupDate || '');
  const [makeupTime, setMakeupTime] = useState(initialMakeupTime || '');

  useEffect(() => {
    if (open) {
      setType(initialType);
      setMakeupDate(initialMakeupDate || '');
      setMakeupTime(initialMakeupTime || '');
    }
  }, [open, initialType, initialMakeupDate, initialMakeupTime]);

  const canSave = !!type;

  function handleSave() {
    if (!type) return;
    onSave(type, makeupDate, makeupTime);
  }

  const inputClass =
    'rounded-md border border-background-300 bg-white px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <Modal open={open} title={`${studentName} 학생 결석`} onClose={onClose}>
      <p className="text-sm text-foreground-500">결석 사유와 보충 일정을 입력하세요.</p>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-foreground-700">결석 사유</label>
        <div className="flex flex-wrap gap-2">
          {ABSENCE_TYPES.map((t) => {
            const active = type === t;
            return (
              <button
                key={t}
                onClick={() => setType(t)}
                className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-foreground-600 text-background-50'
                    : 'border border-background-300 text-foreground-600 hover:bg-background-100'
                }`}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-500">보충 날짜</label>
          <input
            type="date"
            value={makeupDate}
            onChange={(e) => setMakeupDate(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-foreground-500">보충 시간</label>
          <input
            type="time"
            value={makeupTime}
            onChange={(e) => setMakeupTime(e.target.value)}
            className={`${inputClass} w-full`}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-600 hover:bg-background-100"
        >
          취소
        </button>
        <button
          onClick={handleSave}
          disabled={!canSave}
          className="cursor-pointer whitespace-nowrap rounded-md bg-foreground-600 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-foreground-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          결석 저장
        </button>
      </div>
    </Modal>
  );
}