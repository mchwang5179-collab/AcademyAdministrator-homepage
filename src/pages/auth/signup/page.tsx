import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

function translateError(message: string): string {
  if (message.includes('already registered')) {
    return '이미 가입된 이메일이에요. 로그인해 주세요.';
  }
  if (message.includes('password')) {
    return '비밀번호는 6자 이상이어야 해요.';
  }
  if (message.includes('Email not confirmed')) {
    return '이메일 인증이 켜져 있어요. Supabase 대시보드에서 "Confirm email"을 끄거나, 관리자에게 문의하세요.';
  }
  return '회원가입에 실패했어요. 잠시 후 다시 시도해 주세요.';
}

export default function Signup() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(translateError(signUpError.message));
      return;
    }

    // 이메일 인증이 꺼져 있으면 세션이 바로 내려옴
    if (signUpData.session) {
      setLoading(false);
      navigate('/dashboard');
      return;
    }

    // 이메일 인증이 켜져 있을 때: 바로 로그인 시도
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (signInError) {
      setError(translateError(signInError.message));
      return;
    }

    navigate('/dashboard');
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-500 text-background-50">
            <i className="ri-graduation-cap-line text-3xl"></i>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-foreground-950">계정 만들기</h1>
          <p className="mt-1 text-sm text-foreground-500">
            가입 후 원장님의 승인을 받으면 이용할 수 있어요
          </p>
        </div>

        <div className="rounded-2xl border border-background-200 bg-white p-6 md:p-8">
          <div className="mb-4 flex items-start gap-2.5 rounded-md bg-primary-100/70 px-3 py-2.5 text-xs leading-relaxed text-primary-800">
            <i className="ri-information-line mt-0.5 text-base"></i>
            <span>
              회원가입 신청 후 <strong className="font-semibold">원장님(황명철 선생님)</strong>의
              승인이 있어야 모든 기능을 사용할 수 있어요. 승인 전에는 로그인해도 대기 화면만 보여요.
            </span>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground-700">이름</label>
              <input
                type="text"
                name="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="홍길동"
                className="w-full rounded-md border border-background-300 bg-background-50 px-3 py-2.5 text-sm text-foreground-900 outline-none transition-colors focus:border-primary-500 focus:ring-2 focus:ring-primary-200"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-foreground-700">이메일</label>
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
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="6자 이상 입력하세요"
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
              {loading ? '가입 중...' : '회원가입'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-500">
            이미 계정이 있으신가요?{' '}
            <Link to="/login" className="font-semibold text-primary-600 hover:text-primary-700">
              로그인
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}