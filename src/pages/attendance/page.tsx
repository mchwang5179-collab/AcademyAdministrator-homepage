import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type {
  AbsenceType,
  Attendance,
  AttendanceStatus,
  ClassRoom,
  Student,
  TimetableSlot,
} from '@/lib/types';
import { ATTENDANCE_STATUSES, DAY_NAMES, attendanceLabel } from '@/lib/constants';
import AbsenceModal from './components/AbsenceModal';

type ClassStudentRow = { class_id: string; student_id: string };

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function displayDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${DAY_NAMES[d.getDay()]}요일)`;
}

function addDays(dateStr: string, amount: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + amount);
  return toDateStr(d);
}

function formatTime(value: string): string {
  return value.slice(0, 5);
}

type AbsenceTarget = {
  student: Student;
  classId: string;
} | null;

export default function AttendancePage() {
  const [date, setDate] = useState(() => toDateStr(new Date()));
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [classStudentMap, setClassStudentMap] = useState<Record<string, string[]>>({});
  const [studentMap, setStudentMap] = useState<Record<string, Student>>({});
  const [records, setRecords] = useState<Record<string, Attendance>>({});
  const [makeupSessions, setMakeupSessions] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // 결석 사유 모달
  const [absenceTarget, setAbsenceTarget] = useState<AbsenceTarget>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const weekday = parseDate(date).getDay();

      const [classesRes, slotsRes, csRes, attendanceRes, makeupRes] = await Promise.all([
        supabase.from('classes').select('*'),
        supabase.from('timetable').select('*').eq('day_of_week', weekday),
        supabase.from('class_students').select('class_id, student_id'),
        supabase.from('attendance').select('*').eq('date', date),
        supabase
          .from('attendance')
          .select('*')
          .eq('makeup_date', date)
          .eq('makeup_status', 'pending'),
      ]);

      if (classesRes.error) throw classesRes.error;
      if (slotsRes.error) throw slotsRes.error;
      if (csRes.error) throw csRes.error;
      if (attendanceRes.error) throw attendanceRes.error;
      if (makeupRes.error) throw makeupRes.error;

      const classList = (classesRes.data as ClassRoom[]) || [];
      const slotList = (slotsRes.data as TimetableSlot[]) || [];
      const csRows = (csRes.data as ClassStudentRow[]) || [];
      const attRows = (attendanceRes.data as Attendance[]) || [];
      const makeupRows = (makeupRes.data as Attendance[]) || [];

      // 당일 수업이 있는 반 id 모음 (시간표 기준)
      const todayClassIds = new Set(slotList.map((s) => s.class_id));

      // 당일 수업 반들의 학생 배정
      const csm: Record<string, string[]> = {};
      csRows.forEach((r) => {
        if (!todayClassIds.has(r.class_id)) return;
        if (!csm[r.class_id]) csm[r.class_id] = [];
        csm[r.class_id].push(r.student_id);
      });

      // 필요한 학생 id 수집 (정규 수업 + 보충 수업)
      const studentIds = new Set<string>();
      Object.values(csm).forEach((ids) => ids.forEach((id) => studentIds.add(id)));
      makeupRows.forEach((r) => studentIds.add(r.student_id));

      let sm: Record<string, Student> = {};
      if (studentIds.size > 0) {
        const { data: sData, error: sErr } = await supabase
          .from('students')
          .select('*')
          .in('id', Array.from(studentIds));
        if (sErr) throw sErr;
        sm = {};
        ((sData as Student[]) || []).forEach((s) => {
          sm[s.id] = s;
        });
      }

      // 출결 기록 (class_id + student_id 로 key)
      const recMap: Record<string, Attendance> = {};
      attRows.forEach((r) => {
        recMap[`${r.class_id}|${r.student_id}`] = r;
      });

      setClasses(classList);
      setSlots(slotList);
      setClassStudentMap(csm);
      setStudentMap(sm);
      setRecords(recMap);
      setMakeupSessions(makeupRows);
    } catch (err) {
      setError('출결 정보를 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classMap = useMemo(() => {
    const m = new Map<string, ClassRoom>();
    classes.forEach((c) => m.set(c.id, c));
    return m;
  }, [classes]);

  // 당일 수업 반 목록 (시간순 정렬)
  const todayClasses = useMemo(() => {
    const ids = new Set(slots.map((s) => s.class_id));
    const list = classes.filter((c) => ids.has(c.id));
    const slotMap = new Map<string, TimetableSlot[]>();
    slots.forEach((s) => {
      if (!slotMap.has(s.class_id)) slotMap.set(s.class_id, []);
      slotMap.get(s.class_id)!.push(s);
    });
    list.sort((a, b) => {
      const sa = (slotMap.get(a.id) || [])[0];
      const sb = (slotMap.get(b.id) || [])[0];
      return (sa?.start_time || '').localeCompare(sb?.start_time || '');
    });
    return list;
  }, [classes, slots]);

  function recordFor(classId: string, studentId: string): Attendance | undefined {
    return records[`${classId}|${studentId}`];
  }

  async function upsertRecord(
    classId: string,
    studentId: string,
    patch: Partial<Attendance>
  ) {
    const { error: err } = await supabase.from('attendance').upsert(
      {
        class_id: classId,
        student_id: studentId,
        date,
        ...patch,
      },
      { onConflict: 'class_id,student_id,date' }
    );
    if (err) throw err;
  }

  async function setStatus(classId: string, student: Student, status: AttendanceStatus) {
    if (saving) return;
    const current = recordFor(classId, student.id);

    // 같은 상태를 다시 누르면 초기화
    if (current?.status === status && status !== 'absent') {
      setSaving(true);
      try {
        await supabase
          .from('attendance')
          .delete()
          .eq('class_id', classId)
          .eq('student_id', student.id)
          .eq('date', date);
        setRecords((prev) => {
          const next = { ...prev };
          delete next[`${classId}|${student.id}`];
          return next;
        });
      } catch (err) {
        setError('출결 저장에 실패했어요.');
        console.error(err);
      } finally {
        setSaving(false);
      }
      return;
    }

    if (status === 'absent') {
      // 결석이면 사유/보충 모달 열기
      setAbsenceTarget({ student, classId });
      return;
    }

    setSaving(true);
    try {
      if (status === 'makeup') {
        await upsertRecord(classId, student.id, {
          status: 'makeup',
          makeup_status: 'completed',
          makeup_completed_date: date,
        });
      } else {
        await upsertRecord(classId, student.id, {
          status,
          absence_type: null,
          makeup_date: null,
          makeup_time: null,
          makeup_status: null,
        });
      }
      setRecords((prev) => {
        const next = { ...prev };
        const existing = prev[`${classId}|${student.id}`];
        next[`${classId}|${student.id}`] = {
          ...(existing || {
            id: '',
            class_id: classId,
            student_id: student.id,
            date,
            status,
            note: null,
            absence_type: null,
            makeup_date: null,
            makeup_time: null,
            makeup_status: null,
            makeup_completed_date: null,
            created_at: new Date().toISOString(),
          }),
          status: status === 'makeup' ? 'makeup' : status,
          ...(status === 'makeup'
            ? { makeup_status: 'completed' as const, makeup_completed_date: date }
            : {
                absence_type: null,
                makeup_date: null,
                makeup_time: null,
                makeup_status: null,
                makeup_completed_date: null,
              }),
        };
        return next;
      });
    } catch (err) {
      setError('출결 저장에 실패했어요.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function saveAbsence(type: AbsenceType, makeupDate: string, makeupTime: string) {
    if (!absenceTarget) return;
    const { student, classId } = absenceTarget;
    setSaving(true);
    try {
      await upsertRecord(classId, student.id, {
        status: 'absent',
        absence_type: type,
        makeup_date: makeupDate || null,
        makeup_time: makeupTime || null,
        makeup_status: 'pending',
      });
      setRecords((prev) => {
        const next = { ...prev };
        const existing = prev[`${classId}|${student.id}`];
        next[`${classId}|${student.id}`] = {
          ...(existing || {
            id: '',
            class_id: classId,
            student_id: student.id,
            date,
            status: 'absent' as AttendanceStatus,
            note: null,
            absence_type: null,
            makeup_date: null,
            makeup_time: null,
            makeup_status: null,
            makeup_completed_date: null,
            created_at: new Date().toISOString(),
          }),
          status: 'absent',
          absence_type: type,
          makeup_date: makeupDate || null,
          makeup_time: makeupTime || null,
          makeup_status: 'pending' as const,
          makeup_completed_date: null,
        };
        return next;
      });
      setAbsenceTarget(null);
    } catch (err) {
      setError('결석 저장에 실패했어요.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function markMakeupComplete(record: Attendance) {
    if (saving) return;
    setSaving(true);
    try {
      const { error: err } = await supabase
        .from('attendance')
        .update({
          status: 'makeup',
          makeup_status: 'completed',
          makeup_completed_date: date,
        })
        .eq('id', record.id);
      if (err) throw err;
      setMakeupSessions((prev) => prev.filter((r) => r.id !== record.id));
    } catch (err) {
      setError('보충 출석 저장에 실패했어요.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  // 전체 통계
  const stats = useMemo(() => {
    const counts: Record<AttendanceStatus, number> = {
      present: 0,
      late: 0,
      absent: 0,
      early_leave: 0,
      makeup: 0,
    };
    let total = 0;
    Object.values(classStudentMap).forEach((ids) => {
      ids.forEach(() => {
        total += 1;
      });
    });
    Object.values(records).forEach((r) => {
      if (r.status in counts) counts[r.status] += 1;
    });
    const processed =
      counts.present + counts.late + counts.absent + counts.early_leave + counts.makeup;
    return { counts, processed, unprocessed: total - processed, total };
  }, [classStudentMap, records]);

  const inputClass =
    'rounded-md border border-background-300 bg-white px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">출결 체크</h2>
          <p className="mt-1 text-sm text-foreground-500">
            오늘 열리는 수업별로 학생 출결을 기록하세요. 변경 사항은 즉시 저장돼요.
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDate(addDays(date, -1))}
            title="이전 날"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
          >
            <i className="ri-arrow-left-s-line"></i>
          </button>
          <input
            type="date"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            className={`${inputClass} w-[150px]`}
          />
          <button
            onClick={() => setDate(addDays(date, 1))}
            title="다음 날"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md border border-background-300 text-foreground-600 hover:bg-background-100"
          >
            <i className="ri-arrow-right-s-line"></i>
          </button>
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

      {/* 통계 */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {ATTENDANCE_STATUSES.map((st) => (
          <div key={st.value} className="rounded-lg border border-background-200 bg-white p-4">
            <div className="flex items-center gap-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${st.activeClass}`}>
                <i className={`${st.icon} text-base`}></i>
              </span>
              <span className="text-sm text-foreground-500">{st.label}</span>
            </div>
            <p className="mt-2 text-2xl font-bold text-foreground-950">{stats.counts[st.value]}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
        </div>
      ) : todayClasses.length === 0 && makeupSessions.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-calendar-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">
            {displayDate(date)}에 열리는 수업이 없어요.
          </p>
          <p className="mt-1 text-xs text-foreground-400">
            시간표에 등록된 요일에만 출결 체크가 가능해요.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {todayClasses.map((c) => {
            const studentIds = classStudentMap[c.id] || [];
            const classSlots = slots
              .filter((s) => s.class_id === c.id)
              .sort((a, b) => a.start_time.localeCompare(b.start_time));

            return (
              <div
                key={c.id}
                className="overflow-hidden rounded-lg border border-background-200 bg-white"
              >
                <div className="flex flex-col gap-1 border-b border-background-200 bg-background-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-100 text-primary-700">
                      <i className="ri-book-open-line text-lg"></i>
                    </span>
                    <div>
                      <span className="text-sm font-bold text-foreground-950">{c.name}</span>
                      {c.subject && (
                        <span className="ml-2 text-xs text-foreground-500">{c.subject}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {classSlots.map((s) => (
                      <span
                        key={s.id}
                        className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700"
                      >
                        {formatTime(s.start_time)} ~ {formatTime(s.end_time)}
                      </span>
                    ))}
                  </div>
                </div>

                {studentIds.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm text-foreground-400">
                    이 반에 배정된 학생이 없어요.
                  </div>
                ) : (
                  <div className="divide-y divide-background-100">
                    {studentIds.map((sid) => {
                      const s = studentMap[sid];
                      if (!s) return null;
                      const rec = recordFor(c.id, sid);
                      const current = rec?.status;
                      return (
                        <div
                          key={sid}
                          className="flex flex-col gap-3 px-4 py-3 transition-colors hover:bg-background-50 sm:flex-row sm:items-center sm:justify-between"
                        >
                          <div className="flex min-w-0 items-center gap-3">
                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-700">
                              {s.name.charAt(0)}
                            </span>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="truncate text-sm font-semibold text-foreground-900">
                                  {s.name}
                                </span>
                                {s.grade && (
                                  <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-700">
                                    {s.grade}
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-foreground-400">
                                {current ? attendanceLabel(current) : '미처리'}
                                {rec?.absence_type && (
                                  <span className="ml-1.5 text-foreground-500">
                                    · {rec.absence_type}
                                  </span>
                                )}
                                {rec?.makeup_date && (
                                  <span className="ml-1.5 text-accent-700">
                                    · 보충 {rec.makeup_date}
                                    {rec.makeup_time ? ` ${formatTime(rec.makeup_time)}` : ''}
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          <div className="flex shrink-0 flex-wrap items-center gap-1.5">
                            {ATTENDANCE_STATUSES.map((st) => {
                              const active = current === st.value;
                              return (
                                <button
                                  key={st.value}
                                  onClick={() => setStatus(c.id, s, st.value)}
                                  disabled={saving}
                                  title={st.label}
                                  className={`inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                                    active
                                      ? st.activeClass
                                      : 'border border-background-200 text-foreground-600 hover:bg-background-100'
                                  }`}
                                >
                                  <i className={`${st.icon} text-base`}></i>
                                  {st.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          {makeupSessions.length > 0 && (
            <div className="overflow-hidden rounded-lg border border-accent-200 bg-white">
              <div className="flex items-center justify-between border-b border-accent-200 bg-accent-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-100 text-accent-700">
                    <i className="ri-refresh-line text-lg"></i>
                  </span>
                  <div>
                    <span className="text-sm font-bold text-foreground-950">보충 수업</span>
                    <span className="ml-2 text-xs text-foreground-500">
                      {makeupSessions.length}명
                    </span>
                  </div>
                </div>
                <span className="rounded-full bg-accent-100 px-2.5 py-1 text-xs font-medium text-accent-800">
                  {displayDate(date)}
                </span>
              </div>
              <div className="divide-y divide-background-100">
                {makeupSessions.map((r) => {
                  const s = studentMap[r.student_id];
                  const c = classMap[r.class_id];
                  return (
                    <div
                      key={r.id}
                      className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-accent-100 text-sm font-bold text-accent-700">
                          {s?.name.charAt(0) || '?'}
                        </span>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-sm font-semibold text-foreground-900">
                              {s?.name || '삭제된 학생'}
                            </span>
                            <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-xs text-secondary-700">
                              {c?.name || '삭제된 반'}
                            </span>
                          </div>
                          <span className="text-xs text-foreground-500">
                            {r.absence_type || '결석'} · 결석일 {r.date}
                            {r.makeup_time ? ` · ${formatTime(r.makeup_time)} 보충` : ''}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => markMakeupComplete(r)}
                        disabled={saving}
                        className="inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-3 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <i className="ri-check-line"></i> 보충 출석
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <AbsenceModal
        open={!!absenceTarget}
        studentName={absenceTarget?.student.name || ''}
        initialType={absenceTarget ? recordFor(absenceTarget.classId, absenceTarget.student.id)?.absence_type || null : null}
        initialMakeupDate={absenceTarget ? recordFor(absenceTarget.classId, absenceTarget.student.id)?.makeup_date || null : null}
        initialMakeupTime={absenceTarget ? recordFor(absenceTarget.classId, absenceTarget.student.id)?.makeup_time || null : null}
        onClose={() => setAbsenceTarget(null)}
        onSave={saveAbsence}
      />
    </div>
  );
}