import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Student } from '@/lib/types';
import { GRADE_LEVELS } from '@/lib/constants';
import Modal from '@/components/base/Modal';

type Props = {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function StudentFormModal({ open, student, onClose, onSaved }: Props) {
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [school, setSchool] = useState('');
  const [grade, setGrade] = useState('');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setName(student?.name || '');
      setBirthDate(student?.birth_date || '');
      setSchool(student?.school || '');
      setGrade(student?.grade || '');
      setParentName(student?.parent_name || '');
      setParentPhone(student?.parent_phone || '');
      setNotes(student?.notes || '');
      setFormError('');
    }
  }, [open, student]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      name: name.trim(),
      birth_date: birthDate || null,
      school: school.trim() || null,
      grade: grade.trim() || null,
      parent_name: parentName.trim() || null,
      parent_phone: parentPhone.trim() || null,
      notes: notes.trim() || null,
    };

    try {
      let error: { message: string } | null = null;
      if (student) {
        const res = await supabase.from('students').update(payload).eq('id', student.id);
        error = res.error;
      } else {
        const res = await supabase.from('students').insert(payload);
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
    <Modal
      open={open}
      title={student ? '학생 정보 수정' : '학생 등록'}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            이름 <span className="text-accent-600">*</span>
          </label>
          <input
            type="text"
            name="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="학생 이름"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              생년월일
            </label>
            <input
              type="date"
              name="birth_date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">학년</label>
            <select
              name="grade"
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className={inputClass}
            >
              <option value="">선택 안 함</option>
              {GRADE_LEVELS.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">학교</label>
          <input
            type="text"
            name="school"
            value={school}
            onChange={(e) => setSchool(e.target.value)}
            placeholder="학교명"
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              보호자 이름
            </label>
            <input
              type="text"
              name="parent_name"
              value={parentName}
              onChange={(e) => setParentName(e.target.value)}
              placeholder="보호자 성함"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-foreground-700">
              보호자 연락처
            </label>
            <input
              type="text"
              name="parent_phone"
              value={parentPhone}
              onChange={(e) => setParentPhone(e.target.value)}
              placeholder="010-0000-0000"
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">메모</label>
          <textarea
            name="notes"
            value={notes}
            maxLength={500}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="특이사항이나 참고할 내용"
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