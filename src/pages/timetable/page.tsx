import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { ClassRoom, TimetableSlot } from '@/lib/types';
import { DAY_NAMES, formatTime } from '@/lib/constants';

export default function Timetable() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [studentsByClass, setStudentsByClass] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [slotsRes, classesRes, classStudentsRes] = await Promise.all([
        supabase
          .from('timetable')
          .select('*')
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true }),
        supabase.from('classes').select('*'),
        supabase
          .from('class_students')
          .select('class_id, students(id, name)'),
      ]);
      if (slotsRes.error) throw slotsRes.error;
      if (classesRes.error) throw classesRes.error;
      if (classStudentsRes.error) throw classStudentsRes.error;
      setSlots((slotsRes.data as TimetableSlot[]) || []);
      setClasses((classesRes.data as ClassRoom[]) || []);

      const mapping: Record<string, string[]> = {};
      const rows = (classStudentsRes.data as Array<{
        class_id: string;
        students: { id: string; name: string } | null;
      }>) || [];
      rows.forEach((row) => {
        if (!row.students?.name) return;
        if (!mapping[row.class_id]) mapping[row.class_id] = [];
        mapping[row.class_id].push(row.students.name);
      });
      setStudentsByClass(mapping);
    } catch (err) {
      setError('시간표를 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classMap = new Map(classes.map((c) => [c.id, c]));

  const days = [1, 2, 3, 4, 5, 6, 0];

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-950">주간 시간표</h2>
        <p className="mt-1 text-sm text-foreground-500">
          반별 수업 일정을 요일별로 한눈에 확인하세요.
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

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
        </div>
      ) : slots.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-calendar-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">아직 등록된 일정이 없어요.</p>
          <p className="mt-1 text-xs text-foreground-400">
            반 관리에서 각 반의 시간표를 등록해 보세요.
          </p>
          <Link
            to="/classes"
            className="mt-4 inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary-600 hover:text-primary-700"
          >
            반 관리로 이동 <i className="ri-arrow-right-line"></i>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
          {days.map((day) => {
            const daySlots = slots
              .filter((s) => s.day_of_week === day)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));
            const isToday = new Date().getDay() === day;

            return (
              <div
                key={day}
                className={`rounded-lg border bg-white ${
                  isToday ? 'border-accent-300' : 'border-background-200'
                }`}
              >
                <div
                  className={`rounded-t-lg px-3 py-2 text-center text-sm font-bold ${
                    isToday ? 'bg-accent-500 text-background-50' : 'bg-background-50 text-foreground-700'
                  }`}
                >
                  {DAY_NAMES[day]}요일
                  {isToday && <span className="ml-1 text-[10px] font-normal">오늘</span>}
                </div>
                <div className="space-y-2 p-2">
                  {daySlots.length === 0 ? (
                    <p className="py-6 text-center text-xs text-foreground-300">-</p>
                  ) : (
                    daySlots.map((slot) => {
                      const c = classMap.get(slot.class_id);
                      const students = studentsByClass[slot.class_id] || [];
                      return (
                        <Link
                          key={slot.id}
                          to={c ? `/classes/${c.id}` : '/classes'}
                          className="block cursor-pointer rounded-md border border-primary-200 bg-primary-50 p-2.5 transition-colors hover:bg-primary-100"
                        >
                          <p className="truncate text-sm font-semibold text-foreground-900">
                            {c?.name || '삭제된 반'}
                          </p>
                          {c?.subject && (
                            <p className="truncate text-xs text-foreground-500">{c.subject}</p>
                          )}
                          <p className="mt-1 text-xs font-medium text-primary-700">
                            {formatTime(slot.start_time)} ~ {formatTime(slot.end_time)}
                          </p>
                          {students.length > 0 && (
                            <div className="mt-1.5 flex flex-wrap gap-1 border-t border-primary-100 pt-1.5">
                              {students.map((name) => (
                                <span
                                  key={name}
                                  className="rounded-full bg-white px-1.5 py-0.5 text-[10px] leading-none text-foreground-600"
                                >
                                  {name}
                                </span>
                              ))}
                            </div>
                          )}
                        </Link>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}