import { useEffect, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';

type NavItem = {
  to: string;
  label: string;
  icon: string;
  soon?: boolean;
};

const baseNav: NavItem[] = [
  { to: '/dashboard', label: '대시보드', icon: 'ri-dashboard-line' },
  { to: '/students', label: '학생 관리', icon: 'ri-user-star-line' },
  { to: '/classes', label: '반 / 수업', icon: 'ri-group-line' },
  { to: '/timetable', label: '시간표', icon: 'ri-calendar-line' },
  { to: '/exams', label: '시험 시간표', icon: 'ri-file-list-3-line' },
  { to: '/exam-papers', label: '시험지 관리', icon: 'ri-file-copy-2-line' },
  { to: '/attendance', label: '출결', icon: 'ri-checkbox-circle-line' },
  { to: '/makeup', label: '보충명단', icon: 'ri-refresh-line' },
  { to: '/absence-calendar', label: '결석 달력', icon: 'ri-calendar-2-line' },
];

const adminNav: NavItem[] = [
  { to: '/approvals', label: '가입 승인', icon: 'ri-user-add-line' },
  { to: '/teachers', label: '선생님 관리', icon: 'ri-team-line' },
];

export default function AppLayout() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session?.user) {
        loadProfile(data.session.user.id);
      } else {
        setLoading(false);
      }
    });

    function loadProfile(userId: string) {
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data, error }) => {
          if (!mounted) return;
          if (error) {
            console.error(error);
          }
          setProfile(data as Profile | null);
          setLoading(false);
        });
    }

    return () => {
      mounted = false;
    };
  }, []);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  const navItems = profile?.role === 'admin' ? [...baseNav, ...adminNav] : baseNav;
  const displayName = profile?.full_name || '사용자';
  const roleLabel = profile?.role === 'admin' ? '원장님' : '선생님';

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 px-5 py-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-background-50">
          <i className="ri-graduation-cap-line text-xl"></i>
        </div>
        <div>
          <p className="text-sm font-bold text-foreground-950">학원 관리</p>
          <p className="text-xs text-foreground-500">Academy Center</p>
        </div>
      </div>

      <nav className="mt-2 flex-1 space-y-1 px-3">
        {navItems.map((item) =>
          item.soon ? (
            <div
              key={item.to}
              className="flex cursor-not-allowed items-center justify-between rounded-lg px-3 py-2.5 text-foreground-400"
            >
              <span className="flex items-center gap-3 text-sm font-medium">
                <span className="flex h-5 w-5 items-center justify-center">
                  <i className={`${item.icon} text-base`}></i>
                </span>
                {item.label}
              </span>
              <span className="rounded-full bg-secondary-100 px-2 py-0.5 text-[10px] text-secondary-700">
                준비중
              </span>
            </div>
          ) : (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-foreground-600 hover:bg-background-100 hover:text-foreground-900'
                }`
              }
            >
              <span className="flex h-5 w-5 items-center justify-center">
                <i className={`${item.icon} text-base`}></i>
              </span>
              {item.label}
            </NavLink>
          )
        )}
      </nav>

      <div className="border-t border-background-200 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-background-50">
            <span className="text-sm font-bold">{displayName.charAt(0)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground-900">{displayName}</p>
            <p className="text-xs text-foreground-500">{roleLabel}</p>
          </div>
          <button
            onClick={handleLogout}
            title="로그아웃"
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-md text-foreground-500 transition-colors hover:bg-background-100 hover:text-foreground-900"
          >
            <i className="ri-logout-box-r-line"></i>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-background-50">
      {/* 데스크톱 사이드바 */}
      <aside className="hidden w-64 shrink-0 border-r border-background-200 bg-white md:block">
        <div className="sticky top-0 h-screen">{sidebarContent}</div>
      </aside>

      {/* 모바일 드로어 */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-foreground-950/40"
            onClick={() => setMobileOpen(false)}
          ></div>
          <aside className="absolute left-0 top-0 h-full w-64 bg-white">
            {sidebarContent}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b border-background-200 bg-white px-4 md:px-6">
          <button
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-foreground-600 hover:bg-background-100 md:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <i className="ri-menu-line text-xl"></i>
          </button>
          <h1 className="hidden text-lg font-bold text-foreground-950 md:block">대시보드</h1>
          <div className="flex items-center gap-3">
            <span className="hidden items-center gap-1.5 rounded-full bg-accent-100 px-3 py-1 text-xs font-medium text-accent-800 sm:flex">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-500"></span>
              {roleLabel}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-500 text-background-50 md:hidden">
              <span className="text-sm font-bold">{displayName.charAt(0)}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6">
          {loading ? (
            <div className="flex h-64 items-center justify-center">
              <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}