import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';
import type { ClassRoom } from '@/lib/types';
import { useProfile } from '@/hooks/useProfile';
import TeacherFormModal from './components/TeacherFormModal';

export default function Teachers() {
  const { profile, loading: profileLoading } = useProfile();
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Profile | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [teachersRes, classesRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('*')
          .in('role', ['teacher', 'admin'])
          .order('created_at', { ascending: true }),
        supabase.from('classes').select('*'),
      ]);
      if (teachersRes.error) throw teachersRes.error;
      if (classesRes.error) throw classesRes.error;
      setTeachers((teachersRes.data as Profile[]) || []);
      setClasses((classesRes.data as ClassRoom[]) || []);
    } catch (err) {
      setError('선생님 목록을 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const classByTeacher = useMemo(() => {
    const map: Record<string, ClassRoom[]> = {};
    classes.forEach((c) => {
      if (!c.teacher_id) return;
      if (!map[c.teacher_id]) map[c.teacher_id] = [];
      map[c.teacher_id].push(c);
    });
    return map;
  }, [classes]);

  const isAdmin = profile?.role === 'admin';

  if (profileLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <i className="ri-lock-line text-3xl"></i>
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground-950">접근 권한이 없어요</h2>
        <p className="mt-1 text-sm text-foreground-500">
          선생님 관리는 원장님만 이용할 수 있는 메뉴예요.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h2 className="text-xl font-bold text-foreground-950">선생님 관리</h2>
        <p className="mt-1 text-sm text-foreground-500">
          원장님과 선생님 계정 정보를 확인하고 수정할 수 있어요.
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

      <div className="flex items-center gap-2 rounded-lg border border-background-200 bg-white px-4 py-3 text-sm text-foreground-600">
        <i className="ri-team-line text-foreground-500"></i>
        총 {teachers.length}명의 계정이 있어요.
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {teachers.map((t) => {
          const assigned = classByTeacher[t.id] || [];
          const isSelf = t.id === profile?.id;
          return (
            <div
              key={t.id}
              className="flex flex-col rounded-lg border border-background-200 bg-white p-5"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-accent-500 text-background-50">
                    <span className="text-base font-bold">{(t.full_name || '이').charAt(0)}</span>
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-foreground-950">
                        {t.full_name || '이름 없음'}
                      </h3>
                      {isSelf && (
                        <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[10px] font-semibold text-primary-700">
                          나
                        </span>
                      )}
                    </div>
                    <span
                      className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        t.role === 'admin'
                          ? 'bg-accent-100 text-accent-800'
                          : 'bg-secondary-100 text-secondary-700'
                      }`}
                    >
                      {t.role === 'admin' ? '원장님' : '선생님'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setEditing(t)}
                  title="수정"
                  className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600"
                >
                  <i className="ri-pencil-line"></i>
                </button>
              </div>

              <div className="mt-4 space-y-1.5 text-sm">
                <div className="flex items-center gap-2 text-foreground-600">
                  <i className="ri-phone-line w-4 text-foreground-400"></i>
                  {t.phone || '연락처 없음'}
                </div>
                <div className="flex items-center gap-2 text-foreground-600">
                  <i className="ri-calendar-line w-4 text-foreground-400"></i>
                  가입일 {t.created_at?.slice(0, 10) || '-'}
                </div>
              </div>

              <div className="mt-4 border-t border-background-100 pt-3">
                <p className="text-xs font-medium text-foreground-500">
                  담당 반 {assigned.length}개
                </p>
                {assigned.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {assigned.map((c) => (
                      <span
                        key={c.id}
                        className="rounded-full bg-background-100 px-2.5 py-1 text-xs text-foreground-700"
                      >
                        {c.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs text-foreground-400">담당 중인 반이 없어요.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TeacherFormModal
        open={!!editing}
        teacher={editing}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          loadData();
        }}
      />
    </div>
  );
}