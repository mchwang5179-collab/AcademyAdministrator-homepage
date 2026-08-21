import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';
import Modal from '@/components/base/Modal';

type Props = {
  open: boolean;
  teacher: Profile | null;
  onClose: () => void;
  onSaved: () => void;
};

export default function TeacherFormModal({ open, teacher, onClose, onSaved }: Props) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'teacher'>('teacher');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (open) {
      setFullName(teacher?.full_name || '');
      setPhone(teacher?.phone || '');
      setRole(teacher?.role || 'teacher');
      setFormError('');
    }
  }, [open, teacher]);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!teacher) return;
    setSaving(true);
    setFormError('');

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim() || null,
          role,
        })
        .eq('id', teacher.id);
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
    <Modal open={open} title="선생님 정보 수정" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">
            이름 <span className="text-accent-600">*</span>
          </label>
          <input
            type="text"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="선생님 이름"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">연락처</label>
          <input
            type="text"
            name="phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="010-0000-0000"
            className={inputClass}
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-foreground-700">역할</label>
          <select
            name="role"
            value={role}
            onChange={(e) => setRole(e.target.value as 'admin' | 'teacher')}
            className={inputClass}
          >
            <option value="teacher">선생님</option>
            <option value="admin">원장님</option>
          </select>
          <p className="mt-1.5 text-xs text-foreground-400">
            역할을 바꾸면 해당 계정이 볼 수 있는 메뉴도 달라져요.
          </p>
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