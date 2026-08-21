import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ExamPaper, ExamTerm } from '@/lib/types';
import { EXAM_TERMS, GRADES, SCHOOLS } from '@/lib/constants';
import PaperFormModal from './components/PaperFormModal';
import PaperViewModal from './components/PaperViewModal';
import ConfirmDialog from '@/components/base/ConfirmDialog';

type SchoolFilter = '전체' | string;
type GradeFilter = '전체' | string;
type TermFilter = '전체' | ExamTerm;

export default function ExamPapersPage() {
  const [papers, setPapers] = useState<ExamPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [school, setSchool] = useState<SchoolFilter>('전체');
  const [grade, setGrade] = useState<GradeFilter>('전체');
  const [term, setTerm] = useState<TermFilter>('전체');
  const [search, setSearch] = useState('');

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<ExamPaper | null>(null);
  const [viewing, setViewing] = useState<ExamPaper | null>(null);
  const [deleting, setDeleting] = useState<ExamPaper | null>(null);
  const [deletingBusy, setDeletingBusy] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('exam_papers')
        .select('*')
        .order('created_at', { ascending: false });
      if (err) throw err;
      setPapers((data as ExamPaper[]) || []);
    } catch (err) {
      setError('시험지를 불러오지 못했어요.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = useMemo(() => {
    return papers.filter((p) => {
      if (school !== '전체' && p.school !== school) return false;
      if (grade !== '전체' && p.grade !== grade) return false;
      if (term !== '전체' && p.term !== term) return false;
      const q = search.trim().toLowerCase();
      if (q) {
        const hay = `${p.title || ''} ${p.subject || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [papers, school, grade, term, search]);

  function openAdd() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(paper: ExamPaper) {
    setEditing(paper);
    setFormOpen(true);
  }

  async function handleDelete() {
    if (!deleting) return;
    setDeletingBusy(true);
    try {
      const { error: err } = await supabase.from('exam_papers').delete().eq('id', deleting.id);
      if (err) throw err;
      setDeleting(null);
      loadData();
    } catch (err) {
      setError('삭제에 실패했어요.');
      console.error(err);
    } finally {
      setDeletingBusy(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-background-300 bg-white px-3 py-2 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground-950">시험지 관리</h2>
          <p className="mt-1 text-sm text-foreground-500">
            시험지 이미지를 모아두고, 필기를 지워 정리본을 만들고, 답안지를 기입해 관리하세요.
          </p>
        </div>
        <button
          onClick={openAdd}
          className="inline-flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
        >
          <i className="ri-add-line text-lg"></i> 시험지 등록
        </button>
      </div>

      {/* 필터 */}
      <div className="flex flex-col gap-3 rounded-lg border border-background-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground-500">학교</label>
            <select
              value={school}
              onChange={(e) => setSchool(e.target.value)}
              className={inputClass}
            >
              <option value="전체">전체 학교</option>
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground-500">학년</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={inputClass}
            >
              <option value="전체">전체 학년</option>
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground-500">시험 구분</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value as TermFilter)}
              className={inputClass}
            >
              <option value="전체">전체</option>
              {EXAM_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-foreground-500">검색</label>
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-400"></i>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="제목, 과목 검색"
                className="w-full rounded-md border border-background-300 bg-white py-2 pl-9 pr-3 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>
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
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-background-200 bg-white py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background-100 text-foreground-400">
            <i className="ri-file-copy-2-line text-2xl"></i>
          </div>
          <p className="mt-4 text-sm font-medium text-foreground-700">
            {papers.length === 0 ? '아직 등록된 시험지가 없어요.' : '조건에 맞는 시험지가 없어요.'}
          </p>
          <p className="mt-1 text-xs text-foreground-400">
            {papers.length === 0
              ? "'시험지 등록' 버튼으로 첫 시험지를 올려 보세요."
              : '필터나 검색어를 바꿔 보세요.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((p) => {
            const thumb = p.cleaned_image_url || p.image_url;
            return (
              <div
                key={p.id}
                className="flex flex-col overflow-hidden rounded-lg border border-background-200 bg-white"
              >
                <button
                  onClick={() => setViewing(p)}
                  className="block w-full cursor-pointer overflow-hidden bg-background-100"
                >
                  {thumb ? (
                    <img
                      src={thumb}
                      alt={p.title || '시험지'}
                      className="h-44 w-full object-cover object-top transition-transform duration-300 hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-44 w-full items-center justify-center text-foreground-400">
                      <i className="ri-image-line text-3xl"></i>
                    </div>
                  )}
                </button>

                <div className="flex flex-1 flex-col p-4">
                  <p className="truncate text-sm font-bold text-foreground-950">
                    {p.title || '제목 없음'}
                  </p>

                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {p.school && (
                      <span className="rounded-full bg-background-100 px-2 py-0.5 text-[11px] text-foreground-600">
                        {p.school}
                      </span>
                    )}
                    {p.grade && (
                      <span className="rounded-full bg-background-100 px-2 py-0.5 text-[11px] text-foreground-600">
                        {p.grade}
                      </span>
                    )}
                    {p.term && (
                      <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[11px] text-secondary-800">
                        {p.term}
                      </span>
                    )}
                    {p.subject && (
                      <span className="rounded-full bg-primary-100 px-2 py-0.5 text-[11px] text-primary-800">
                        {p.subject}
                      </span>
                    )}
                    {p.cleaned_image_url && (
                      <span className="rounded-full bg-accent-100 px-2 py-0.5 text-[11px] text-accent-800">
                        정리본 있음
                      </span>
                    )}
                  </div>

                  {p.answer && (
                    <p className="mt-2 flex items-center gap-1 text-xs text-foreground-500">
                      <i className="ri-checkbox-multiple-line"></i> 답안지 기입됨
                    </p>
                  )}

                  <div className="mt-3 flex justify-end gap-1 border-t border-background-100 pt-3">
                    <button
                      onClick={() => setViewing(p)}
                      title="보기"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600"
                    >
                      <i className="ri-eye-line"></i>
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      title="수정"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-background-100 hover:text-primary-600"
                    >
                      <i className="ri-pencil-line"></i>
                    </button>
                    <button
                      onClick={() => setDeleting(p)}
                      title="삭제"
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 hover:bg-accent-100 hover:text-accent-700"
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <PaperFormModal
        open={formOpen}
        paper={editing}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          loadData();
        }}
      />

      <PaperViewModal paper={viewing} onClose={() => setViewing(null)} />

      <ConfirmDialog
        open={!!deleting}
        title="시험지 삭제"
        message={`'${deleting?.title || '이 시험지'}'를 삭제할까요? 이 작업은 되돌릴 수 없어요.`}
        confirmLabel="삭제"
        loading={deletingBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}