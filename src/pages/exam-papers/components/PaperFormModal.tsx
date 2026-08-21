import { useEffect, useRef, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ExamPaper } from '@/lib/types';
import { EXAM_TERMS, GRADES, SCHOOLS, subjectsForSchool } from '@/lib/constants';
import { removePencilHandwriting } from '@/lib/pencilRemoval';
import Modal from '@/components/base/Modal';

type Props = {
  open: boolean;
  paper: ExamPaper | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function PaperFormModal({ open, paper, onClose, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [school, setSchool] = useState(SCHOOLS[0]);
  const [grade, setGrade] = useState(GRADES[0]);
  const [term, setTerm] = useState(EXAM_TERMS[0]);
  const [subject, setSubject] = useState('');
  const [answer, setAnswer] = useState('');

  const [originalPreview, setOriginalPreview] = useState<string | null>(null);
  const [existingOriginal, setExistingOriginal] = useState<string | null>(null);
  const [cleanedPreview, setCleanedPreview] = useState<string | null>(null);
  const [existingCleaned, setExistingCleaned] = useState<string | null>(null);
  const [newFile, setNewFile] = useState<File | null>(null);
  const [activePreview, setActivePreview] = useState<'original' | 'cleaned'>('original');
  const [threshold, setThreshold] = useState(140);
  const [processing, setProcessing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      const initSchool = paper?.school || SCHOOLS[0];
      setTitle(paper?.title || '');
      setSchool(initSchool);
      setGrade(paper?.grade || GRADES[0]);
      setTerm(paper?.term || EXAM_TERMS[0]);
      setSubject(paper?.subject || subjectsForSchool(initSchool)[0] || '');
      setAnswer(paper?.answer || '');
      setExistingOriginal(paper?.image_url || null);
      setExistingCleaned(paper?.cleaned_image_url || null);
      setOriginalPreview(null);
      setCleanedPreview(null);
      setNewFile(null);
      setActivePreview('original');
      setThreshold(140);
      setFormError('');
    }
  }, [open, paper]);

  const displayOriginal = originalPreview || existingOriginal;
  const displayCleaned = cleanedPreview || existingCleaned;
  const shownImage =
    activePreview === 'cleaned' && displayCleaned ? displayCleaned : displayOriginal;

  function handleSchoolChange(v: string) {
    setSchool(v);
    const list = subjectsForSchool(v);
    if (!list.includes(subject)) setSubject(list[0] || '');
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setNewFile(file);
    setOriginalPreview(null);
    setCleanedPreview(null);
    setActivePreview('original');
    const reader = new FileReader();
    reader.onload = () => setOriginalPreview(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleRemove() {
    if (!originalPreview) return;
    setProcessing(true);
    try {
      const result = await removePencilHandwriting(originalPreview, threshold);
      setCleanedPreview(result);
      setActivePreview('cleaned');
    } catch (err) {
      setFormError('필기 제거 처리에 실패했어요. 이미지를 다시 확인해 주세요.');
      console.error(err);
    } finally {
      setProcessing(false);
    }
  }

  async function uploadImage(dataUrl: string, fileName: string): Promise<string> {
    const res = await fetch(dataUrl);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: 'image/jpeg' });
    const { error } = await supabase.storage
      .from('exam-papers')
      .upload(fileName, file, { upsert: true });
    if (error) throw error;
    const { data } = supabase.storage.from('exam-papers').getPublicUrl(fileName);
    return data.publicUrl;
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!newFile && !existingOriginal) {
      setFormError('시험지 이미지를 업로드해 주세요.');
      return;
    }
    setSaving(true);
    setFormError('');

    try {
      let imageUrl = paper?.image_url || null;
      let cleanedUrl = paper?.cleaned_image_url || null;

      if (newFile && originalPreview) {
        const uid = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
        imageUrl = await uploadImage(originalPreview, `${uid}-original.jpg`);
        if (cleanedPreview) {
          cleanedUrl = await uploadImage(cleanedPreview, `${uid}-cleaned.jpg`);
        } else {
          cleanedUrl = null;
        }
      }

      const payload = {
        title: title.trim() || [school, grade, term, subject].filter(Boolean).join(' '),
        school,
        grade,
        term,
        subject,
        image_url: imageUrl,
        cleaned_image_url: cleanedUrl,
        answer: answer.trim() || null,
      };

      let error: { message: string } | null = null;
      if (paper) {
        const res = await supabase.from('exam_papers').update(payload).eq('id', paper.id);
        error = res.error;
      } else {
        const res = await supabase.from('exam_papers').insert(payload);
        error = res.error;
      }
      if (error) throw error;
      onSaved();
    } catch (err) {
      setFormError('저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    'w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200';

  return (
    <Modal open={open} title={paper ? '시험지 수정' : '시험지 등록'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">제목</label>
          <input
            type="text"
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="비워두면 학교·학년·시험·과목으로 자동 생성돼요"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">학교</label>
            <select
              name="school"
              value={school}
              onChange={(e) => handleSchoolChange(e.target.value)}
              className={inputClass}
            >
              {SCHOOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">학년</label>
            <select
              name="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={inputClass}
            >
              {GRADES.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">시험 구분</label>
            <select
              name="term"
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className={inputClass}
            >
              {EXAM_TERMS.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">과목</label>
            <select
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className={inputClass}
            >
              {subjectsForSchool(school).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 이미지 업로드 */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            시험지 이미지 <span className="text-accent-600">*</span>
          </label>
          <input
            type="file"
            accept="image/*"
            ref={fileRef}
            onChange={handleFile}
            className="hidden"
          />

          {displayOriginal || displayCleaned ? (
            <div className="space-y-2">
              <div className="overflow-hidden rounded-lg border border-background-200 bg-background-50">
                <img
                  src={shownImage}
                  alt="시험지 미리보기"
                  className="max-h-64 w-full bg-white object-contain"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActivePreview('original')}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                    activePreview === 'original'
                      ? 'bg-primary-500 text-background-50'
                      : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                  }`}
                >
                  원본
                </button>
                {displayCleaned && (
                  <button
                    type="button"
                    onClick={() => setActivePreview('cleaned')}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1 text-xs font-medium ${
                      activePreview === 'cleaned'
                        ? 'bg-primary-500 text-background-50'
                        : 'bg-background-100 text-foreground-600 hover:bg-background-200'
                    }`}
                  >
                    정리본
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="cursor-pointer whitespace-nowrap rounded-full border border-background-300 px-3 py-1 text-xs font-medium text-foreground-600 hover:bg-background-100"
                >
                  이미지 교체
                </button>
              </div>

              {originalPreview && (
                <div className="rounded-lg border border-background-200 bg-background-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1">
                      <p className="text-xs font-medium text-foreground-700">필기 제거 강도</p>
                      <input
                        type="range"
                        min={80}
                        max={220}
                        value={threshold}
                        onChange={(e) => setThreshold(Number(e.target.value))}
                        className="mt-1 w-full cursor-pointer accent-primary-500"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleRemove}
                      disabled={processing}
                      className="cursor-pointer whitespace-nowrap rounded-md bg-accent-500 px-3 py-2 text-xs font-semibold text-background-50 hover:bg-accent-600 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {processing ? (
                        <>
                          <i className="ri-loader-4-line animate-spin"></i> 처리 중
                        </>
                      ) : (
                        <>
                          <i className="ri-magic-line"></i> 필기 제거
                        </>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-[11px] leading-relaxed text-foreground-500">
                    연필 필기는 회색빛이라 지워지고, 인쇄된 글자는 진해서 남아요. 볼펜·유성펜
                    필기는 지워지지 않을 수 있어요. 강도를 조절하며 다시 눌러보세요.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-background-300 bg-background-50 py-8 text-foreground-500 hover:border-primary-400 hover:bg-background-100"
            >
              <i className="ri-image-add-line text-2xl"></i>
              <span className="text-sm font-medium">시험지 이미지를 업로드하세요</span>
              <span className="text-xs text-foreground-400">클릭해서 사진 선택</span>
            </button>
          )}
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            답안지 (내가 푼 답 기입)
          </label>
          <textarea
            name="answer"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="예) 1. ③  2. ⑤  3. ① ..."
            rows={4}
            maxLength={2000}
            className={`${inputClass} resize-none`}
          />
        </div>

        {formError && (
          <div className="rounded-md bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
            {formError}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 px-4 py-2 text-sm font-medium text-foreground-700 hover:bg-background-100"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={saving}
            className="cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-4 py-2 text-sm font-semibold text-background-50 hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </form>
    </Modal>
  );
}