import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ExamSchedule, ExamTerm } from '@/lib/types';
import { EXAM_TERMS, GRADES, SCHOOLS, formatTime } from '@/lib/constants';
import ExamFormModal from './components/ExamFormModal';
import ExamCalendar from './components/ExamCalendar';
import ConfirmDialog from '@/components/base/ConfirmDialog';

export default function ExamsPage() {
  const [school, setSchool] = useState(SCHOOLS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [term, setTerm] = useState<ExamTerm>('중간고사');
  const [schedules, setSchedules] = useState<ExamSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ExamSchedule | null>(null);
  const [deleting, setDeleting] = useState<ExamSchedule | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('exam_schedules')
        .select('*')
        .eq('school', school)
        .eq('grade', grade)
        .eq('term', term)
        .order('exam_date', { ascending: true });
      if (err) throw err;
      setSchedules((data as ExamSchedule[]) || []);
    } catch (err) {
      setError('시험 일정을 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [school, grade, term]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sorted = useMemo(() => {
    return [...schedules].sort((a, b) => {
      const da = a.exam_date || '';
      const db = b.exam_date || '';
      if (da !== db) return da.localeCompare(db);
      return (a.start_time || '').localeCompare(b.start_time || '');
    });
  }, [schedules]);

  function openAdd() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(schedule: ExamSchedule) {
    setEditing(schedule);
    setModalOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const { error: err } = await supabase
        .from('exam_schedules')
        .delete()
        .eq('id', deleting.id);
      if (err) throw err;
      setSchedules((prev) => prev.filter((s) => s.id !== deleting.id));
      setDeleting(null);
    } catch (err) {
      setError('삭제에 실패했어요.');
      console.error(err);
    } finally {
      setDeletingBusy(false);
    }
  }

  const inputClass =
    'rounded-md border border-background-300 bg-white px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">시험기간 시간표</h2>
          <p className="mt-1 text-sm text-foreground-500">
            학교·학년별 중간고사 / 기말고사 일정과 시험 범위를 관리하세요.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
        >
          <i className="ri-add-line text-lg"></i> 시험 일정 추가
        </button>
      </div>

      <div className="inline-flex items-center gap-1 rounded-full border border-background-200 bg-background-50 p-1">
        <button
          onClick={() => setView('list')}
          className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'list' ? 'bg-primary-500 text-background-50' : 'text-foreground-600 hover:bg-background-100'
          }`}
        >
          목록
        </button>
        <button
          onClick={() => setView('calendar')}
          className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            view === 'calendar'
              ? 'bg-primary-500 text-background-50'
              : 'text-foreground-600 hover:bg-background-100'
          }`}
        >
          달력
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-col gap-3 rounded-lg border border-background-200 bg-white p-4 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-foreground-500">학교</label>
          <select
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            className={`${inputClass} w-full`}
          >
            {SCHOOLS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-foreground-500">학년</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className={`${inputClass} w-full`}
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <label className="mb-1.5 block text-xs font-medium text-foreground-500">시험 구분</label>
          <div className="inline-flex w-full items-center gap-1 rounded-full border border-background-200 bg-background-50 p-1">
            {EXAM_TERMS.map((t) => (
              <button
                key={t}
                onClick={() => setTerm(t)}
                className={`flex-1 cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  term === t
                    ? 'bg-primary-500 text-background-50'
                    : 'text-foreground-600 hover:bg-background-100'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-accent-100 px-4 py-3 text-sm text-accent-800">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="cursor-pointer whitespace-nowrap font-semibold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
        </div>
      ) : view === 'calendar' ? (
        <ExamCalendar schedules={sorted} />
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-file-list-3-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">
            {school} {grade} {term} 일정이 아직 없어요.
          </p>
          <p className="mt-1 text-xs text-foreground-400">
            위의 '시험 일정 추가' 버튼으로 첫 일정을 등록해 보세요.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-background-200 bg-white">
          <div className="hidden grid-cols-12 gap-4 border-b border-background-200 bg-background-50 px-4 py-3 text-xs font-semibold text-foreground-500 md:grid">
            <span className="col-span-2">과목</span>
            <span className="col-span-2">날짜</span>
            <span className="col-span-2">시간</span>
            <span className="col-span-4">시험 범위</span>
            <span className="col-span-2 text-right">관리</span>
          </div>
          <div className="divide-y divide-background-100">
            {sorted.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-12 md:items-center md:gap-4"
              >
                <div className="col-span-2 flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                    <i className="ri-book-2-line text-base"></i>
                  </span>
                  <span className="text-sm font-semibold text-foreground-900">{s.subject}</span>
                </div>

                <span className="col-span-2 text-sm text-foreground-700">
                  {s.exam_date || <span className="text-foreground-400">미정</span>}
                </span>

                <span className="col-span-2 text-sm text-foreground-700">
                  {s.start_time ? (
                    <>
                      {formatTime(s.start_time)}
                      {s.end_time ? ` ~ ${formatTime(s.end_time)}` : ''}
                    </>
                  ) : (
                    <span className="text-foreground-400">미정</span>
                  )}
                </span>

                <span className="col-span-4 text-sm text-foreground-600">
                  {s.exam_range || <span className="text-foreground-400">범위 미기입</span>}
                </span>

                <div className="col-span-2 flex gap-2 md:justify-end">
                  <button
                    onClick={() => openEdit(s)}
                    title="수정"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
                  >
                    <i className="ri-edit-line"></i>
                  </button>
                  <button
                    onClick={() => setDeleting(s)}
                    title="삭제"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-accent-100 hover:text-accent-700"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ExamFormModal
        open={modalOpen}
        schedule={editing}
        school={school}
        grade={grade}
        term={term}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          loadData();
        }}
      />

      <ConfirmDialog
        open={!!deleting}
        title="시험 일정 삭제"
        message={`'${deleting?.subject || ''}' 일정을 삭제할까요?`}
        confirmLabel="삭제"
        loading={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}