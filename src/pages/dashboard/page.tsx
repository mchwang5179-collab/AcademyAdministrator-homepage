import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

const steps = [
  { to: '/students', title: '학생 등록하기', desc: '학생 명단과 보호자 정보를 등록해 보세요.', icon: 'ri-user-add-line', color: 'bg-primary-500' },
  { to: '/classes', title: '반 / 수업 개설하기', desc: '과목별 반을 만들고 담당 선생님을 배정하세요.', icon: 'ri-group-2-line', color: 'bg-accent-500' },
  { to: '/timetable', title: '시간표 만들기', desc: '반별 요일과 시간을 정해 시간표를 구성하세요.', icon: 'ri-calendar-line', color: 'bg-secondary-500' },
  { to: '/attendance', title: '출결 체크하기', desc: '매일 출석·지각·결석을 간편하게 기록하세요.', icon: 'ri-check-double-line', color: 'bg-primary-600' },
];

export default function Dashboard() {
  const { profile, loading } = useProfile();
  const [stats, setStats] = useState({
    students: 0,
    classes: 0,
    present: 0,
    absent: 0,
  });

  const loadStats = useCallback(async () => {
    const today = toDateStr(new Date());
    try {
      const [studentsRes, classesRes, presentRes, absentRes] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('classes').select('id', { count: 'exact', head: true }),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'present'),
        supabase
          .from('attendance')
          .select('id', { count: 'exact', head: true })
          .eq('date', today)
          .eq('status', 'absent'),
      ]);
      setStats({
        students: studentsRes.count ?? 0,
        classes: classesRes.count ?? 0,
        present: presentRes.count ?? 0,
        absent: absentRes.count ?? 0,
      });
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const displayName = profile?.full_name || '사용자';
  const roleLabel = profile?.role === 'admin' ? '원장님' : '선생님';

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
      </div>
    );
  }

  const statItems = [
    { label: '총 학생 수', value: stats.students, icon: 'ri-user-star-line', color: 'bg-primary-100 text-primary-700' },
    { label: '개설된 반', value: stats.classes, icon: 'ri-group-line', color: 'bg-accent-100 text-accent-700' },
    { label: '오늘 출석', value: stats.present, icon: 'ri-checkbox-circle-line', color: 'bg-secondary-100 text-secondary-700' },
    { label: '오늘 결석', value: stats.absent, icon: 'ri-time-line', color: 'bg-background-100 text-foreground-700' },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground-950 md:text-2xl">
          안녕하세요, {displayName} {roleLabel} 👋
        </h2>
        <p className="mt-1 text-sm text-foreground-500">
          학원 운영의 모든 것을 한 곳에서 관리하세요.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((s) => (
          <div key={s.label} className="rounded-lg border border-background-200 bg-white p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground-500">{s.label}</span>
              <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${s.color}`}>
                <i className={`${s.icon} text-lg`}></i>
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-foreground-950">{s.value}</p>
            <p className="mt-1 text-xs text-foreground-400">실시간 집계</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-background-200 bg-white p-5 md:p-6">
        <h3 className="text-base font-bold text-foreground-950">빠른 시작</h3>
        <p className="mt-1 text-sm text-foreground-500">
          아래 메뉴를 눌러 바로 이동할 수 있어요.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, i) => (
            <Link
              key={step.title}
              to={step.to}
              className="group rounded-lg border border-background-200 bg-background-50 p-4 transition-colors hover:border-primary-300 hover:bg-white"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`flex h-10 w-10 items-center justify-center rounded-lg text-background-50 ${step.color}`}
                >
                  <i className={`${step.icon} text-lg`}></i>
                </span>
                <span className="text-xs font-bold text-foreground-400">STEP {i + 1}</span>
              </div>
              <p className="mt-3 text-sm font-semibold text-foreground-900 group-hover:text-primary-700">
                {step.title}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-foreground-500">{step.desc}</p>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-lg bg-primary-100/70 p-4 text-sm text-primary-800">
          <i className="ri-information-line mr-1.5"></i>
          학생 → 반 → 시간표 → 출결 순서로 설정하면 학원 관리가 완성돼요.
        </div>
      </div>
    </div>
  );
}