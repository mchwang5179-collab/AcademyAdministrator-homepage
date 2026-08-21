import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function translateError(message: string): string {
  if (message.includes('Invalid login credentials')) {
    return '이메일 또는 비밀번호가 올바르지 않아요.';
  }
  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 아직 완료되지 않았어요. 메일함을 확인해 주세요.';
  }
  return '로그인에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(translateError(error.message));
      return;
    }
    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-background-50">
            <i className="ri-graduation-cap-line text-3xl"></i>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground-950">학원 관리 시스템</h1>
          <p className="mt-1 text-sm text-foreground-500">로그인하고 학원을 관리해 보세요</p>
        </div>

        <div className="rounded-2xl border border-background-200 bg-white p-6 md:p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground-700">
                이메일
              </label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground-700">
                비밀번호
              </label>
              <input
                type="password"
                name="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                className="w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            {error && (
              <div className="rounded-md bg-accent-100 px-3 py-2.5 text-sm text-accent-800">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-500">
            아직 계정이 없으신가요?{' '}
            <Link to="/signup" className="font-semibold text-primary-600 hover:text-primary-700">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}