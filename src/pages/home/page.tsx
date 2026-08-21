import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

export default function Home() {
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(() => {
      if (mounted) {
        setChecking(false);
        setHasSession(false);
      }
    }, 2000);

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      clearTimeout(timer);
      setHasSession(!!data.session);
      setChecking(false);
    }).catch(() => {
      if (!mounted) return;
      clearTimeout(timer);
      setHasSession(false);
      setChecking(false);
    });

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  if (checking) {
    return (
      <div className="flex h-screen items-center justify-center bg-background-50">
        <div className="flex items-center gap-3 text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-2xl"></i>
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (hasSession) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-md text-center">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-500 text-background-50">
            <i className="ri-graduation-cap-line text-3xl"></i>
          </div>
        </div>
        <h1 className="mt-6 text-2xl font-bold text-foreground-950">학원 관리 시스템</h1>
        <p className="mt-2 text-sm text-foreground-500">
          학원 운영의 모든 것을 한 곳에서 관리하세요
        </p>

        <div className="mt-8 space-y-3">
          <Link
            to="/login"
            className="inline-block w-full rounded-lg bg-primary-500 px-4 py-3 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
          >
            로그인
          </Link>
          <Link
            to="/signup"
            className="inline-block w-full rounded-lg border border-background-300 bg-white px-4 py-3 text-sm font-semibold text-foreground-700 transition-colors hover:bg-background-100"
          >
            회원가입
          </Link>
        </div>
      </div>
    </div>
  );
}