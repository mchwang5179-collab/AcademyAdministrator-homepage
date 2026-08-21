import type { AbsenceType, AttendanceStatus, ExamTerm } from '@/lib/types';

export const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

export const ABSENCE_TYPES: AbsenceType[] = ['가족행사', '학교행사', '병결', '무단결석', '개인사정'];

export const SCHOOLS = [
  '다사고',
  '심인고',
  '와룡고',
  '호산고',
  '성서고',
  '성산고',
  '달서고',
  '서재중',
  '서동중',
  '달서중',
];

export const HIGH_SCHOOL_SUBJECTS = [
  '공통수학1',
  '공통수학2',
  '대수',
  '미적분1',
  '미적분2',
  '확률과통계',
  '기하와벡터',
];

export const MIDDLE_SCHOOL_SUBJECTS = ['중1수학', '중2수학', '중3수학'];

export const EXAM_TERMS: ExamTerm[] = ['중간고사', '기말고사'];

export const GRADES = ['1학년', '2학년', '3학년'];

export const GRADE_LEVELS = ['중1', '중2', '중3', '고1', '고2', '고3'];

export function gradeBadgeClass(grade: string | null | undefined): string {
  switch (grade) {
    case '중1':
      return 'bg-secondary-100 text-secondary-800';
    case '중2':
      return 'bg-accent-100 text-accent-800';
    case '중3':
      return 'bg-primary-100 text-primary-800';
    case '고1':
      return 'bg-secondary-500 text-background-50';
    case '고2':
      return 'bg-accent-500 text-background-50';
    case '고3':
      return 'bg-primary-500 text-background-50';
    default:
      return 'bg-background-100 text-foreground-600';
  }
}

export function subjectsForSchool(school: string): string[] {
  return school.endsWith('중') ? MIDDLE_SCHOOL_SUBJECTS : HIGH_SCHOOL_SUBJECTS;
}

export const ATTENDANCE_STATUSES: {
  value: AttendanceStatus;
  label: string;
  activeClass: string;
  icon: string;
}[] = [
  { value: 'present', label: '출석', activeClass: 'bg-primary-500 text-background-50', icon: 'ri-check-line' },
  { value: 'late', label: '지각', activeClass: 'bg-accent-500 text-background-50', icon: 'ri-time-line' },
  { value: 'absent', label: '결석', activeClass: 'bg-foreground-600 text-background-50', icon: 'ri-close-line' },
  { value: 'early_leave', label: '조퇴', activeClass: 'bg-secondary-500 text-background-50', icon: 'ri-logout-box-r-line' },
  { value: 'makeup', label: '보충', activeClass: 'bg-accent-500 text-background-50', icon: 'ri-refresh-line' },
];

export function attendanceLabel(status: AttendanceStatus | null | undefined): string {
  const found = ATTENDANCE_STATUSES.find((s) => s.value === status);
  return found?.label || '미처리';
}

export function formatTime(value: string | null): string {
  if (!value) return '';
  return value.slice(0, 5);
}

export function formatDate(value: string | null): string {
  if (!value) return '-';
  return value;
}