import { useMemo, useState } from 'react';
import type { ExamSchedule } from '@/lib/types';
import { DAY_NAMES, formatTime } from '@/lib/constants';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

type Props = {
  schedules: ExamSchedule[];
};

export default function ExamCalendar({ schedules }: Props) {
  const [viewDate, setViewDate] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const byDate = useMemo(() => {
    const map: Record<string, ExamSchedule[]> = {};
    schedules.forEach((s) => {
      if (!s.exam_date) return;
      if (!map[s.exam_date]) map[s.exam_date] = [];
      map[s.exam_date].push(s);
    });
    return map;
  }, [schedules]);

  const cells = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const result: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(d);
    return result;
  }, [year, month]);

  const todayStr = toDateStr(new Date());

  function changeMonth(amount: number) {
    setViewDate(new Date(year, month + amount, 1));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-foreground-500">
          시험 일정이 달력에 표시돼요. 날짜가 정해지지 않은 일정은 아래에서 확인하세요.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            title="이전 달"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <span className="min-w-[110px] text-center text-base font-bold text-foreground-950">
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

      <div className="overflow-hidden rounded-lg border border-background-200 bg-white">
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

        <div className="grid grid-cols-7">
          {cells.map((day, idx) => {
            if (day === null) {
              return (
                <div
                  key={`blank-${idx}`}
                  className="min-h-[110px] border-b border-r border-background-100 last:border-r-0"
                ></div>
              );
            }
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const daySchedules = byDate[dateStr] || [];
            const isToday = dateStr === todayStr;
            return (
              <div
                key={day}
                className="min-h-[110px] border-b border-r border-background-100 p-1.5 last:border-r-0"
              >
                <span
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
                    isToday ? 'bg-primary-500 text-background-50' : 'text-foreground-700'
                  }`}
                >
                  {day}
                </span>

                <div className="mt-1 space-y-1">
                  {daySchedules.map((s) => (
                    <div
                      key={s.id}
                      className="rounded bg-primary-50 px-1.5 py-1 text-[11px] leading-tight text-primary-800"
                      title={`${s.subject}${s.start_time ? ` · ${formatTime(s.start_time)}` : ''}`}
                    >
                      <span className="block truncate font-semibold">{s.subject}</span>
                      {s.start_time && (
                        <span className="block text-[10px] opacity-80">
                          {formatTime(s.start_time)}
                          {s.end_time ? `~${formatTime(s.end_time)}` : ''}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {schedules.some((s) => !s.exam_date) && (
        <div className="rounded-lg border border-background-200 bg-white p-4">
          <p className="mb-2 text-sm font-semibold text-foreground-700">날짜 미정 일정</p>
          <div className="flex flex-wrap gap-2">
            {schedules
              .filter((s) => !s.exam_date)
              .map((s) => (
                <span
                  key={s.id}
                  className="rounded-full bg-secondary-100 px-3 py-1 text-xs text-secondary-800"
                >
                  {s.subject}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}