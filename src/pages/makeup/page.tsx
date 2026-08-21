import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Attendance, ClassRoom, Student } from '@/lib/types';
import { DAY_NAMES, formatTime } from '@/lib/constants';

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]}요일)`;
}

function todayStr(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function MakeupPage() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, Student>>({});
  const [classMap, setClassMap] = useState<Record<string, ClassRoom>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [attRes, studentsRes, classesRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .eq('status', 'absent')
          .order('date', { ascending: false }),
        supabase.from('students').select('*'),
        supabase.from('classes').select('*'),
      ]);

      if (attRes.error) throw attRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (classesRes.error) throw classesRes.error;

      const attRows = (attRes.data as Attendance[]) || [];

      const sm: Record<string, Student> = {};
      ((studentsRes.data as Student[]) || []).forEach((s) => {
        sm[s.id] = s;
      });

      const cm: Record<string, ClassRoom> = {};
      ((classesRes.data as ClassRoom[]) || []).forEach((c) => {
        cm[c.id] = c;
      });

      setRecords(attRows);
      setStudentMap(sm);
      setClassMap(cm);
    } catch (err) {
      setError('보충명단을 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    if (filter === 'all') return records;
    return records.filter((r) => r.makeup_status === filter);
  }, [records, filter]);

  async function markCompleted(record: Attendance) {
    try {
      const { error: err } = await supabase
        .from('attendance')
        .update({
          makeup_status: 'completed',
          status: 'makeup',
          makeup_completed_date: todayStr(),
        })
        .eq('id', record.id);
      if (err) throw err;
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                makeup_status: 'completed' as const,
                status: 'makeup' as const,
                makeup_completed_date: todayStr(),
              }
            : r
        )
      );
    } catch (err) {
      setError('보충 완료 처리에 실패했어요.');
      console.error(err);
    }
  }

  async function resetPending(record: Attendance) {
    try {
      const { error: err } = await supabase
        .from('attendance')
        .update({
          makeup_status: 'pending',
          status: 'absent',
          makeup_completed_date: null,
        })
        .eq('id', record.id);
      if (err) throw err;
      setRecords((prev) =>
        prev.map((r) =>
          r.id === record.id
            ? {
                ...r,
                makeup_status: 'pending' as const,
                status: 'absent' as const,
                makeup_completed_date: null,
              }
            : r
        )
      );
    } catch (err) {
      setError('처리에 실패했어요.');
      console.error(err);
    }
  }

  const pendingCount = records.filter((r) => r.makeup_status === 'pending').length;
  const completedCount = records.filter((r) => r.makeup_status === 'completed').length;

  const tabs = [
    { value: 'pending' as const, label: `보충 예정 (${pendingCount})` },
    { value: 'completed' as const, label: `보충 완료 (${completedCount})` },
    { value: 'all' as const, label: `전체 (${records.length})` },
  ];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-950">보충명단</h2>
        <p className="mt-1 text-sm text-foreground-500">
          결석한 학생들의 보충 일정을 확인하고 보충 완료를 관리하세요.
        </p>
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

      {/* 탭 */}
      <div className="inline-flex items-center gap-1 rounded-full border border-background-200 bg-white p-1">
        {tabs.map((t) => (
          <button
            key={t.value}
            onClick={() => setFilter(t.value)}
            className={`cursor-pointer whitespace-nowrap rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === t.value
                ? 'bg-primary-500 text-background-50'
                : 'text-foreground-600 hover:bg-background-100'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-refresh-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">
            {filter === 'pending'
              ? '보충이 필요한 학생이 없어요.'
              : filter === 'completed'
              ? '보충 완료된 학생이 없어요.'
              : '결석 기록이 없어요.'}
          </p>
          <p className="mt-1 text-xs text-foreground-400">
            출결 체크에서 결석 처리하면 이곳에 나타나요.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-background-200 bg-white">
          <div className="hidden grid-cols-12 gap-4 border-b border-background-200 bg-background-50 px-4 py-3 text-xs font-semibold text-foreground-500 md:grid">
            <span className="col-span-3">학생</span>
            <span className="col-span-2">반</span>
            <span className="col-span-2">결석일</span>
            <span className="col-span-3">보충 일정</span>
            <span className="col-span-2 text-right">관리</span>
          </div>
          <div className="divide-y divide-background-100">
            {filtered.map((r) => {
              const student = studentMap[r.student_id];
              const c = classMap[r.class_id];
              const completed = r.makeup_status === 'completed';
              return (
                <div
                  key={r.id}
                  className="grid grid-cols-1 gap-3 px-4 py-4 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="col-span-3 flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                      {student?.name.charAt(0) || '?'}
                    </span>
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-foreground-900">
                        {student?.name || '삭제된 학생'}
                      </span>
                      {r.absence_type && (
                        <span className="text-xs text-foreground-500">{r.absence_type}</span>
                      )}
                    </div>
                  </div>

                  <span className="col-span-2 truncate text-sm text-foreground-700">
                    {c?.name || '삭제된 반'}
                  </span>

                  <span className="col-span-2 text-sm text-foreground-700">
                    {displayDate(r.date)}
                  </span>

                  <div className="col-span-3">
                    {r.makeup_date ? (
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-foreground-900">
                          {displayDate(r.makeup_date)}
                        </span>
                        {r.makeup_time && (
                          <span className="text-xs text-foreground-500">
                            {formatTime(r.makeup_time)}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-foreground-400">일정 미지정</span>
                    )}
                  </div>

                  <div className="col-span-2 flex md:justify-end">
                    {completed ? (
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">
                          <i className="ri-check-line"></i> 보충 완료
                        </span>
                        <button
                          onClick={() => resetPending(r)}
                          title="보충 예정으로 되돌리기"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-background-100 hover:text-foreground-700"
                        >
                          <i className="ri-arrow-go-back-line"></i>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => markCompleted(r)}
                        className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-3 py-1.5 text-xs font-semibold text-background-50 transition-colors hover:bg-primary-600"
                      >
                        <i className="ri-check-line"></i> 보충 완료
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}