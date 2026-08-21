import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { ClassRoom } from '@/lib/types';
import type { Profile } from '@/lib/supabaseClient';
import Modal from '@/components/base/Modal';

type Props = {
  open: boolean;
  classRoom: ClassRoom | null;
  teachers: Profile[];
  onClose: () => void;
  onSaved: () => void;
};

export default function ClassFormModal({ open, classRoom, teachers, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setName(classRoom?.name || '');
      setSubject(classRoom?.subject || '');
      setTeacherId(classRoom?.teacher_id || '');
      setDescription(classRoom?.description || '');
      setFormError('');
    }
  }, [open, classRoom]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      name: name.trim(),
      subject: subject.trim() || null,
      teacher_id: teacherId || null,
      description: description.trim() || null,
    };

    try {
      let error: { message: string } | null = null;
      if (classRoom) {
        const res = await supabase.from('classes').update(payload).eq('id', classRoom.id);
        error = res.error;
      } else {
        const res = await supabase.from('classes').insert(payload);
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
    <Modal open={open} title={classRoom ? '반 정보 수정' : '반 / 수업 개설'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            반 이름 <span className="text-accent-600">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="예: 수학 A반"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">과목</label>
            <input
              type="text"
              name="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="예: 수학, 영어"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              담당 선생님
            </label>
            <select
              name="teacher_id"
              value={teacherId}
              onChange={(e) => setTeacherId(e.target.value)}
              className={inputClass}
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
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">설명</label>
          <textarea
            name="description"
            value={description}
            maxLength={500}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="반에 대한 설명을 입력하세요"
            rows={3}
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