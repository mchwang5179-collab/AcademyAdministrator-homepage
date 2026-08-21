import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ExamSchedule, ExamTerm } from '@/lib/types';
import { subjectsForSchool } from '@/lib/constants';
import Modal from '@/components/base/Modal';

type Props = {
  open: boolean;
  schedule: ExamSchedule | null;
  school: string;
  grade: string;
  term: ExamTerm;
  onClose: () => void;
  onSaved: () => void;
};

export default function ExamFormModal({
  open,
  schedule,
  school,
  grade,
  term,
  onClose,
  onSaved,
}: Props) {
  const [subject, setSubject] = useState('');
  const [examDate, setExamDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [examRange, setExamRange] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  const subjects = subjectsForSchool(school);

  useEffect(() => {
    if (open) {
      const list = subjectsForSchool(school);
      setSubject(schedule?.subject || list[0] || '');
      setExamDate(schedule?.exam_date || '');
      setStartTime(schedule?.start_time || '');
      setEndTime(schedule?.end_time || '');
      setExamRange(schedule?.exam_range || '');
      setFormError('');
    }
  }, [open, schedule, school]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!subject) {
      setFormError('과목을 선택해 주세요.');
      return;
    }
    setSaving(true);
    setFormError('');

    const payload = {
      school,
      grade,
      term,
      subject,
      exam_date: examDate || null,
      start_time: startTime || null,
      end_time: endTime || null,
      exam_range: examRange.trim() || null,
    };

    try {
      let error: { message: string } | null = null;
      if (schedule) {
        const res = await supabase.from('exam_schedules').update(payload).eq('id', schedule.id);
        error = res.error;
      } else {
        const res = await supabase.from('exam_schedules').insert(payload);
        error = res.error;
      }
      if (error) throw error;
      onSaved();
    } catch (err) {
      setFormError('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <Modal
      open={open}
      title={schedule ? '시험 일정 수정' : '시험 일정 추가'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            과목 <span className="text-accent-600">*</span>
          </label>
          <select
            name="subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className={inputClass}
          >
            {subjects.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">시험 날짜</label>
          <input
            type="date"
            name="exam_date"
            value={examDate}
            onChange={(e) => setExamDate(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              시작 시간
            </label>
            <input
              type="time"
              name="start_time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              종료 시간
            </label>
            <input
              type="time"
              name="end_time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">시험 범위</label>
          <textarea
            name="exam_range"
            value={examRange}
            maxLength={500}
            onChange={(e) => setExamRange(e.target.value)}
            placeholder="예: 1단원 ~ 3단원, 교과서 12~45쪽"
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </div>

        {formError && (
          <div className="rounded-md bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-700 hover:bg-background-100"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}