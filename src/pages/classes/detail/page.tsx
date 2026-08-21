import { useCallback, useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { ClassRoom, Student, TimetableSlot } from '@/lib/types';
import { useTeachers } from '@/hooks/useTeachers';
import { DAY_NAMES, formatTime } from '@/lib/constants';

type ClassStudentRow = { class_id: string; student_id: string };

function gradeSortKey(grade: string | null): number {
  if (!grade) return -1;
  const match = grade.match(/(초|중|고)\s*(\d)/);
  if (!match) {
    const numMatch = grade.match(/(\d)/);
    return numMatch ? parseInt(numMatch[1], 10) : 0;
  }
  const level = match[1] === '초' ? 1 : match[1] === '중' ? 2 : 3;
  const num = parseInt(match[2], 10);
  return level * 10 + num;
}

export default function ClassDetail() {
  const { id } = useParams<{ id: string }>();

  const [classRoom, setClassRoom] = useState<ClassRoom | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<string>>(new Set());
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [dayOfWeek, setDayOfWeek] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [addingSlot, setAddingSlot] = useState(false);

  const { teachers } = useTeachers();

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError('');
    try {
      const [classRes, studentsRes, csRes, slotsRes] = await Promise.all([
        supabase.from('classes').select('*').eq('id', id).maybeSingle(),
        supabase.from('students').select('*').order('name', { ascending: true }),
        supabase.from('class_students').select('class_id, student_id').eq('class_id', id),
        supabase
          .from('timetable')
          .select('*')
          .eq('class_id', id)
          .order('day_of_week', { ascending: true })
          .order('start_time', { ascending: true }),
      ]);

      if (classRes.error) throw classRes.error;
      if (studentsRes.error) throw studentsRes.error;
      if (csRes.error) throw csRes.error;
      if (slotsRes.error) throw slotsRes.error;

      setClassRoom(classRes.data as ClassRoom | null);
      const studentList = (studentsRes.data as Student[]) || [];
      studentList.sort(
        (a, b) =>
          gradeSortKey(b.grade) - gradeSortKey(a.grade) ||
          a.name.localeCompare(b.name, 'ko')
      );
      setStudents(studentList);
      setAssignedIds(
        new Set(((csRes.data as ClassStudentRow[]) || []).map((row) => row.student_id))
      );
      setSlots((slotsRes.data as TimetableSlot[]) || []);
    } catch (err) {
      setError('반 정보를 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function toggleStudent(studentId: string, isAssigned: boolean) {
    try {
      if (isAssigned) {
        const { error: err } = await supabase
          .from('class_students')
          .delete()
          .eq('class_id', id)
          .eq('student_id', studentId);
        if (err) throw err;
        setAssignedIds((prev) => {
          const next = new Set(prev);
          next.delete(studentId);
          return next;
        });
      } else {
        const { error: err } = await supabase
          .from('class_students')
          .insert({ class_id: id, student_id: studentId });
        if (err) throw err;
        setAssignedIds((prev) => new Set(prev).add(studentId));
      }
    } catch (err) {
      setError('학생 배정에 실패했어요.');
      console.error(err);
    }
  }

  async function addSlot(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!id) return;
    if (endTime <= startTime) {
      setError('종료 시간은 시작 시간보다 늦어야 해요.');
      return;
    }
    setAddingSlot(true);
    try {
      const { error: err } = await supabase.from('timetable').insert({
        class_id: id,
        day_of_week: dayOfWeek,
        start_time: startTime,
        end_time: endTime,
      });
      if (err) throw err;
      loadData();
    } catch (err) {
      setError('시간표 추가에 실패했어요.');
      console.error(err);
    } finally {
      setAddingSlot(false);
    }
  }

  async function removeSlot(slotId: string) {
    try {
      const { error: err } = await supabase.from('timetable').delete().eq('id', slotId);
      if (err) throw err;
      loadData();
    } catch (err) {
      setError('시간표 삭제에 실패했어요.');
      console.error(err);
    }
  }

  async function changeTeacher(teacherId: string) {
    if (!id) return;
    try {
      const { error: err } = await supabase
        .from('classes')
        .update({ teacher_id: teacherId || null })
        .eq('id', id);
      if (err) throw err;
      loadData();
    } catch (err) {
      setError('담당 선생님 변경에 실패했어요.');
      console.error(err);
    }
  }

  const teacherMap = new Map(teachers.map((t) => [t.id, t.full_name || '이름 없음']));

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
      </div>
    );
  }

  if (!classRoom) {
    return (
      <div className="mx-auto max-w-2xl py-16 text-center">
        <p className="text-foreground-600">반을 찾을 수 없어요.</p>
        <Link
          to="/classes"
          className="mt-4 inline-flex cursor-pointer items-center gap-1 text-sm font-semibold text-primary-600 hover:text-primary-700"
        >
          <i className="ri-arrow-left-line"></i> 반 목록으로
        </Link>
      </div>
    );
  }

  const inputClass =
    'rounded-md border border-background-300 bg-background-50 px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-center gap-2">
        <Link
          to="/classes"
          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-foreground-900"
        >
          <i className="ri-arrow-left-line"></i>
        </Link>
        <h2 className="text-xl font-bold text-foreground-950">{classRoom.name}</h2>
        {classRoom.subject && (
          <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700">
            {classRoom.subject}
          </span>
        )}
      </div>

      {error && (
        <div className="rounded-md bg-accent-100 px-4 py-3 text-sm text-accent-800">{error}</div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* 학생 배정 */}
        <div className="rounded-lg border border-background-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground-950">학생 배정</h3>
            <span className="rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-semibold text-primary-700">
              {assignedIds.size}명
            </span>
          </div>
          <p className="mt-1 text-sm text-foreground-500">
            체크박스를 눌러 이 반에 학생을 배정하거나 해제하세요.
          </p>

          <div className="mt-4 max-h-[420px] space-y-1 overflow-y-auto pr-1">
            {students.length === 0 ? (
              <p className="py-8 text-center text-sm text-foreground-400">
                등록된 학생이 없어요. 먼저 학생을 추가해 주세요.
              </p>
            ) : (
              students.map((s) => {
                const checked = assignedIds.has(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-2.5 transition-colors hover:bg-background-50"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStudent(s.id, checked)}
                      className="h-4 w-4 cursor-pointer accent-primary-500"
                    />
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                      {s.name.charAt(0)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <span className="text-sm font-medium text-foreground-900">{s.name}</span>
                      {s.grade && (
                        <span className="ml-2 text-xs text-foreground-500">{s.grade}</span>
                      )}
                    </div>
                    {s.school && (
                      <span className="hidden text-xs text-foreground-400 sm:block">
                        {s.school}
                      </span>
                    )}
                  </label>
                );
              })
            )}
          </div>
        </div>

        {/* 시간표 */}
        <div className="rounded-lg border border-background-200 bg-white p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-foreground-950">시간표</h3>
            <span className="text-sm text-foreground-500">담당: {classRoom.teacher_id ? teacherMap.get(classRoom.teacher_id) : '미배정'}</span>
          </div>

          <div className="mt-3">
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              담당 선생님 변경
            </label>
            <select
              value={classRoom.teacher_id || ''}
              onChange={(e) => changeTeacher(e.target.value)}
              className={`${inputClass} w-full`}
            >
              <option value="">선택 안 함</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.full_name || '이름 없음'}
                  {t.role === 'admin' ? ' (원장)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <p className="text-sm font-medium text-foreground-700">주간 일정</p>
            <div className="mt-3 space-y-2">
              {slots.length === 0 ? (
                <p className="rounded-md bg-background-50 px-3 py-6 text-center text-sm text-foreground-400">
                  아직 등록된 일정이 없어요.
                </p>
              ) : (
                slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between rounded-md border border-background-200 bg-background-50 px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className="flex h-7 w-7 items-center justify-center rounded-md bg-accent-100 text-xs font-bold text-accent-700">
                        {DAY_NAMES[slot.day_of_week]}
                      </span>
                      <span className="text-sm font-medium text-foreground-900">
                        {formatTime(slot.start_time)} ~ {formatTime(slot.end_time)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-foreground-400 hover:bg-accent-100 hover:text-accent-700"
                    >
                      <i className="ri-close-line"></i>
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={addSlot} className="mt-4 rounded-md border border-dashed border-background-300 p-3">
              <p className="mb-3 text-xs font-medium text-foreground-500">일정 추가</p>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-foreground-500">요일</label>
                  <select
                    value={dayOfWeek}
                    onChange={(e) => setDayOfWeek(Number(e.target.value))}
                    className={`${inputClass} w-full`}
                  >
                    {DAY_NAMES.map((d, i) => (
                      <option key={i} value={i}>
                        {d}요일
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-foreground-500">시작</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs text-foreground-500">종료</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={`${inputClass} w-full`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={addingSlot}
                  className="cursor-pointer whitespace-nowrap rounded-md bg-secondary-500 px-4 py-2 text-sm font-semibold text-background-50 hover:bg-secondary-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {addingSlot ? '추가 중...' : '추가'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}