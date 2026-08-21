import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  status: 'pending' | 'rejected';
};

export default function PendingApproval({ status }: Props) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate('/login');
  }

  async function handleRecheck() {
    setChecking(true);
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user?.id;
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('status')
        .eq('id', userId)
        .maybeSingle();
      if (profile?.status === 'approved') {
        navigate('/dashboard');
        return;
      }
    }
    setChecking(false);
  }

  const isRejected = status === 'rejected';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background-50 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center">
          <div
            className={`flex h-16 w-16 items-center justify-center rounded-full ${
              isRejected ? 'bg-accent-100 text-accent-700' : 'bg-primary-100 text-primary-700'
            }`}
          >
            <i className={`${isRejected ? 'ri-close-circle-line' : 'ri-hourglass-line'} text-4xl`}></i>
          </div>

          <h1 className="mt-5 text-2xl font-bold text-foreground-950">
            {isRejected ? '가입이 승인되지 않았어요' : '승인 대기 중이에요'}
          </h1>

          <div className="mt-3 rounded-lg border border-background-200 bg-white p-5 text-sm leading-relaxed text-foreground-600">
            {isRejected ? (
              <p>
                원장님(황명철 선생님)이 가입 신청을 승인하지 않았어요.
                <br />
                궁금한 점이 있다면 원장님께 직접 문의해 주세요.
              </p>
            ) : (
              <p>
                회원가입 신청은 완료됐어요.
                <br />
                지금은 <strong className="font-semibold text-foreground-900">원장님(황명철 선생님)</strong>
                의 승인을 기다리고 있어요.
                <br />
                승인이 완료되면 모든 기능을 이용할 수 있어요.
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center gap-3">
            <button
              onClick={handleLogout}
              className="cursor-pointer whitespace-nowrap rounded-md border border-background-300 bg-white px-4 py-2.5 text-sm font-medium text-foreground-700 transition-colors hover:bg-background-100"
            >
              로그아웃
            </button>
            {!isRejected && (
              <button
                onClick={handleRecheck}
                className="cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-4 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600"
              >
                <i className="ri-refresh-line mr-1.5"></i>승인 여부 다시 확인
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}