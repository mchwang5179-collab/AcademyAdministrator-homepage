import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { ClassRoom } from '@/lib/types';
import { useTeachers } from '@/hooks/useTeachers';
import ClassFormModal from './components/ClassFormModal';
import ConfirmDialog from '@/components/base/ConfirmDialog';

type ClassStudentRow = { class_id: string; student_id: string };

export default function Classes() {
  const [classes, setClasses] = useState<ClassRoom[]>([]);
  const [studentCounts, setStudentCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ClassRoom | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ClassRoom | null>(null);
  const [deleting, setDeleting] = useState(false);
  const { teachers } = useTeachers();

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [classesRes, csRes] = await Promise.all([
        supabase.from('classes').select('*').order('created_at', { ascending: false }),
        supabase.from('class_students').select('class_id, student_id'),
      ]);
      if (classesRes.error) throw classesRes.error;
      if (csRes.error) throw csRes.error;

      const classList = (classesRes.data as ClassRoom[]) || [];
      const counts: Record<string, number> = {};
      ((csRes.data as ClassStudentRow[]) || []).forEach((row) => {
        counts[row.class_id] = (counts[row.class_id] || 0) + 1;
      });
      setClasses(classList);
      setStudentCounts(counts);
    } catch (err) {
      setError('반 목록을 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: err } = await supabase.from('classes').delete().eq('id', deleteTarget.id);
      if (err) throw err;
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      setError('삭제에 실패했어요.');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  const teacherMap = new Map(teachers.map((t) => [t.id, t.full_name || '이름 없음']));

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">반 / 수업</h2>
          <p className="mt-1 text-sm text-foreground-500">
            총 {classes.length}개의 반이 개설되어 있어요.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
          className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
        >
          <i className="ri-add-line text-base"></i>
          반 개설
        </button>
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
      ) : classes.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-group-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">아직 개설된 반이 없어요.</p>
          <p className="mt-1 text-xs text-foreground-400">
            반 개설 버튼을 눌러 첫 수업을 만들어 보세요.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <div
              key={c.id}
              className="group flex flex-col rounded-lg border border-background-200 bg-white p-5 transition-colors hover:border-primary-300"
            >
              <div className="flex items-start justify-between">
                <Link to={`/classes/${c.id}`} className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-bold text-foreground-950 transition-colors group-hover:text-primary-700">
                    {c.name}
                  </h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    {c.subject && (
                      <span className="rounded-full bg-secondary-100 px-2.5 py-0.5 text-xs font-medium text-secondary-700">
                        {c.subject}
                      </span>
                    )}
                    <span className="text-xs text-foreground-500">
                      담당: {c.teacher_id ? teacherMap.get(c.teacher_id) : '미배정'}
                    </span>
                  </div>
                </Link>
                <div className="flex shrink-0 gap-1">
                  <button
                    onClick={() => {
                      setEditing(c);
                      setFormOpen(true);
                    }}
                    title="수정"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600"
                  >
                    <i className="ri-pencil-line"></i>
                  </button>
                  <button
                    onClick={() => setDeleteTarget(c)}
                    title="삭제"
                    className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-accent-100 hover:text-accent-700"
                  >
                    <i className="ri-delete-bin-line"></i>
                  </button>
                </div>
              </div>

              {c.description && (
                <p className="mt-3 line-clamp-2 text-sm text-foreground-600">{c.description}</p>
              )}

              <div className="mt-4 flex items-center justify-between border-t border-background-100 pt-3">
                <span className="flex items-center gap-1.5 text-sm text-foreground-600">
                  <i className="ri-user-line text-foreground-400"></i>
                  학생 {studentCounts[c.id] || 0}명
                </span>
                <Link
                  to={`/classes/${c.id}`}
                  className="inline-flex cursor-pointer items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary-600 hover:text-primary-700"
                >
                  관리
                  <i className="ri-arrow-right-line"></i>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      <ClassFormModal
        open={formOpen}
        classRoom={editing}
        teachers={teachers}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          loadData();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="반 삭제"
        message={`'${deleteTarget?.name}' 반을 삭제할까요? 소속 학생 배정과 시간표도 함께 삭제돼요.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}