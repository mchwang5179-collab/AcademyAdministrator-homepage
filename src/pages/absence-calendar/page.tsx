import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Attendance, Student } from '@/lib/types';
import { DAY_NAMES } from '@/lib/constants';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function shortDate(dateStr: string | null): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  return `${m}/${d}`;
}

export default function AbsenceCalendarPage() {
  // viewDate 는 항상 해당 월의 1일로 유지
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [records, setRecords] = useState<Attendance[]>([]);
  const [studentMap, setStudentMap] = useState<Record<string, Student>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const mm = String(month + 1).padStart(2, '0');
      const monthStart = `${year}-${mm}-01`;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const monthEnd = `${year}-${mm}-${String(daysInMonth).padStart(2, '0')}`;

      const [attRes, studentsRes] = await Promise.all([
        supabase
          .from('attendance')
          .select('*')
          .in('status', ['absent', 'makeup'])
          .gte('date', monthStart)
          .lte('date', monthEnd),
        supabase.from('students').select('*'),
      ]);

      if (attRes.error) throw attRes.error;
      if (studentsRes.error) throw studentsRes.error;

      const attRows = (attRes.data as Attendance[]) || [];
      const sm: Record<string, Student> = {};
      ((studentsRes.data as Student[]) || []).forEach((s) => {
        sm[s.id] = s;
      });

      setRecords(attRows);
      setStudentMap(sm);
    } catch (err) {
      setError('결석 정보를 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function changeMonth(amount: number) {
    setViewDate(new Date(year, month + amount, 1));
  }

  const byDate = useMemo(() => {
    const map: Record<string, Attendance[]> = {};
    records.forEach((r) => {
      if (!map[r.date]) map[r.date] = [];
      map[r.date].push(r);
    });
    return map;
  }, [records]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [year, month]);

  const todayStr = toDateStr(new Date());

  const completedCount = records.filter((r) => r.makeup_status === 'completed').length;
  const pendingCount = records.filter((r) => r.makeup_status === 'pending').length;

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">결석 달력</h2>
          <p className="mt-1 text-sm text-foreground-500">
            결석한 학생만 월별 달력에 표시돼요. 보충을 마치면 보충 완료 날짜가 함께 나와요.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            title="이전 달"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <span className="min-w-[120px] text-center text-base font-bold text-foreground-950">
            {year}년 {month + 1}월
          </span>
          <button
            onClick={() => changeMonth(1)}
            title="다음 달"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
        </div>
      </div>

      {/* 요약 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-background-200 bg-white p-4">
          <p className="text-sm text-foreground-500">이번 달 결석</p>
          <p className="mt-1 text-2xl font-bold text-foreground-950">{records.length}</p>
        </div>
        <div className="rounded-lg border border-background-200 bg-white p-4">
          <p className="text-sm text-foreground-500">보충 예정</p>
          <p className="mt-1 text-2xl font-bold text-foreground-950">{pendingCount}</p>
        </div>
        <div className="rounded-lg border border-background-200 bg-white p-4">
          <p className="text-sm text-foreground-500">보충 완료</p>
          <p className="mt-1 text-2xl font-bold text-accent-700">{completedCount}</p>
        </div>
      </div>

      {/* 범례 */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-foreground-600">
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-secondary-400"></span> 보충 예정
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-accent-500"></span> 보충 완료
        </span>
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
        <div className="flex h-64 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-background-200 bg-white">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 border-b border-background-200 bg-background-50">
            {DAY_NAMES.map((d) => (
              <div
                key={d}
                className="px-2 py-2 text-center text-xs font-semibold text-foreground-500"
              >
                {d}
              </div>
            ))}
          </div>

          {/* 달력 그리드 */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`blank-${idx}`} className="min-h-[96px] border-r border-b border-background-100 last:border-r-0"></div>;
              }
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayRecords = byDate[dateStr] || [];
              const isToday = dateStr === todayStr;
              return (
                <div
                  key={day}
                  className="min-h-[96px] border-r border-b border-background-100 p-1.5 last:border-r-0"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-primary-500 text-background-50'
                          : 'text-foreground-700'
                      }`}
                    >
                      {day}
                    </span>
                  </div>

                  <div className="mt-1 space-y-1">
                    {dayRecords.map((r) => {
                      const completed = r.makeup_status === 'completed';
                      const student = studentMap[r.student_id];
                      const doneDate = completed
                        ? r.makeup_completed_date || r.makeup_date
                        : null;
                      return (
                        <div
                          key={r.id}
                          title={`${student?.name || '학생'} · ${r.absence_type || '결석'}${
                            completed ? ` · 보충 완료 ${shortDate(doneDate)}` : ' · 보충 예정'
                          }`}
                          className={`rounded px-1.5 py-1 text-[11px] leading-tight ${
                            completed
                              ? 'bg-accent-100 text-accent-800'
                              : 'bg-secondary-50 text-foreground-700'
                          }`}
                        >
                          <span className="block truncate font-medium">
                            {student?.name || '삭제된 학생'}
                          </span>
                          <span className="block text-[10px] opacity-80">
                            {completed ? `보충완료 · ${shortDate(doneDate)}` : '보충 예정'}
                          </span>
                        </div>
                      );
                    })}
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