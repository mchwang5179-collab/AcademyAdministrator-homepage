import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Student } from '@/lib/types';
import { gradeBadgeClass } from '@/lib/constants';
import StudentFormModal from './components/StudentFormModal';
import ConfirmDialog from '@/components/base/ConfirmDialog';

function formatDate(value: string | null): string {
  if (!value) return '-';
  return value;
}

export default function Students() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadStudents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setStudents((data as Student[]) || []);
    } catch (err) {
      setError('학생 목록을 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(student: Student) {
    setEditing(student);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const { error: err } = await supabase.from('students').delete().eq('id', deleteTarget.id);
      if (err) throw err;
      setDeleteTarget(null);
      loadStudents();
    } catch (err) {
      setError('삭제에 실패했어요.');
      console.error(err);
    } finally {
      setDeleting(false);
    }
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      s.name.toLowerCase().includes(q) ||
      (s.parent_name || '').toLowerCase().includes(q) ||
      (s.school || '').toLowerCase().includes(q) ||
      (s.grade || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">학생 관리</h2>
          <p className="mt-1 text-sm text-foreground-500">
            총 {students.length}명의 학생이 등록되어 있어요.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
        >
          <i className="ri-add-line text-base"></i>
          학생 추가
        </button>
      </div>

      <div className="relative">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-400"></i>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="이름, 학교, 학년, 보호자로 검색"
          className="w-full rounded-md border border-background-300 bg-white py-2.5 pl-9 pr-3 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
        />
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-accent-100 px-4 py-3 text-sm text-accent-800">
          <span>{error}</span>
          <button
            onClick={loadStudents}
            className="cursor-pointer whitespace-nowrap font-semibold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-lg border border-background-200 bg-white">
        {loading ? (
          <div className="flex h-48 items-center justify-center">
            <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
              <i className="ri-user-star-line text-2xl"></i>
            </div>
            <p className="mt-4 text-sm font-medium text-foreground-700">
              {students.length === 0 ? '아직 등록된 학생이 없어요.' : '검색 결과가 없어요.'}
            </p>
            <p className="mt-1 text-xs text-foreground-400">
              {students.length === 0 ? '학생 추가 버튼을 눌러 첫 학생을 등록해 보세요.' : '다른 검색어로 시도해 보세요.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-background-200 bg-background-50">
                <tr>
                  <th className="px-4 py-3 font-semibold text-foreground-600">이름</th>
                  <th className="px-4 py-3 font-semibold text-foreground-600">생년월일</th>
                  <th className="px-4 py-3 font-semibold text-foreground-600">학교 / 학년</th>
                  <th className="px-4 py-3 font-semibold text-foreground-600">보호자</th>
                  <th className="px-4 py-3 font-semibold text-foreground-600">연락처</th>
                  <th className="px-4 py-3 text-right font-semibold text-foreground-600">관리</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-background-100 transition-colors last:border-0 hover:bg-background-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span
                          className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${gradeBadgeClass(s.grade)}`}
                        >
                          {s.name.charAt(0)}
                        </span>
                        <span className="font-semibold text-foreground-900">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-foreground-600">{formatDate(s.birth_date)}</td>
                    <td className="px-4 py-3 text-foreground-600">
                      <span className="text-foreground-800">{s.school || '-'}</span>
                      {s.grade && (
                        <span
                          className={`ml-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${gradeBadgeClass(s.grade)}`}
                        >
                          {s.grade}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-foreground-600">{s.parent_name || '-'}</td>
                    <td className="px-4 py-3 text-foreground-600">{s.parent_phone || '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1">
                        <button
                          onClick={() => openEdit(s)}
                          title="수정"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600"
                        >
                          <i className="ri-pencil-line"></i>
                        </button>
                        <button
                          onClick={() => setDeleteTarget(s)}
                          title="삭제"
                          className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-accent-100 hover:text-accent-700"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <StudentFormModal
        open={formOpen}
        student={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          loadStudents();
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="학생 삭제"
        message={`'${deleteTarget?.name}' 학생을 삭제할까요? 이 작업은 되돌릴 수 없어요.`}
        loading={deleting}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}