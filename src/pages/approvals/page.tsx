import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';
import { useProfile } from '@/hooks/useProfile';

export default function Approvals() {
  const { profile, loading: profileLoading } = useProfile();
  const [requests, setRequests] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('*')
        .in('status', ['pending', 'rejected'])
        .order('created_at', { ascending: true });
      if (err) throw err;
      setRequests((data as Profile[]) || []);
    } catch (e) {
      setError('가입 신청 목록을 불러오지 못했어요.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleDecision(id: string, status: 'approved' | 'rejected') {
    setProcessingId(id);
    const { error: err } = await supabase.from('profiles').update({ status }).eq('id', id);
    setProcessingId(null);
    if (err) {
      setError('처리 중 문제가 발생했어요. 다시 시도해 주세요.');
      console.error(err);
      return;
    }
    loadData();
  }

  const isAdmin = profile?.role === 'admin';
  const pending = requests.filter((r) => r.status === 'pending');
  const rejected = requests.filter((r) => r.status === 'rejected');

  if (profileLoading || loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <i className="ri-loader-4-line animate-spin text-2xl text-foreground-500"></i>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center justify-center py-24 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent-100 text-accent-700">
          <i className="ri-lock-line text-3xl"></i>
        </div>
        <h2 className="mt-4 text-lg font-bold text-foreground-950">접근 권한이 없어요</h2>
        <p className="mt-1 text-sm text-foreground-500">가입 승인은 원장님만 이용할 수 있어요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground-950">가입 승인</h2>
        <p className="mt-1 text-sm text-foreground-500">
          새로 가입 신청한 선생님 계정을 승인하거나 거절할 수 있어요.
        </p>
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-accent-100 px-4 py-3 text-sm text-accent-800">
          <span>{error}</span>
          <button
            onClick={loadData}
            className="cursor-pointer whitespace-nowrap font-semibold underline"
          >
            다시 시도
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 text-sm">
        <span className="flex items-center gap-1.5 rounded-full bg-primary-100 px-3 py-1.5 font-medium text-primary-700">
          <i className="ri-hourglass-line"></i>
          승인 대기 {pending.length}건
        </span>
        <span className="flex items-center gap-1.5 rounded-full bg-background-100 px-3 py-1.5 font-medium text-foreground-600">
          <i className="ri-close-circle-line"></i>
          거절됨 {rejected.length}건
        </span>
      </div>

      {/* 승인 대기 */}
      <section className="space-y-3">
        <h3 className="flex items-center gap-2 text-base font-bold text-foreground-950">
          <i className="ri-hourglass-line text-foreground-500"></i>
          승인 대기
        </h3>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-background-300 bg-white py-12 text-center">
            <i className="ri-inbox-line text-3xl text-foreground-300"></i>
            <p className="mt-2 text-sm text-foreground-500">승인을 기다리는 가입 신청이 없어요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pending.map((r) => (
              <div key={r.id} className="flex flex-col rounded-lg border border-background-200 bg-white p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary-500 text-background-50">
                    <span className="text-base font-bold">{(r.full_name || '이').charAt(0)}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-bold text-foreground-950">
                      {r.full_name || '이름 없음'}
                    </h4>
                    <p className="text-xs text-foreground-500">
                      신청일 {r.created_at?.slice(0, 10) || '-'}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => handleDecision(r.id, 'approved')}
                    disabled={processingId === r.id}
                    className="flex-1 cursor-pointer whitespace-nowrap rounded-md bg-primary-500 px-3 py-2.5 text-sm font-semibold text-background-50 transition-colors hover:bg-primary-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {processingId === r.id ? '처리 중...' : '승인'}
                  </button>
                  <button
                    onClick={() => handleDecision(r.id, 'rejected')}
                    disabled={processingId === r.id}
                    className="flex-1 cursor-pointer whitespace-nowrap rounded-md border border-background-300 bg-white px-3 py-2.5 text-sm font-medium text-foreground-600 transition-colors hover:bg-background-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 거절됨 */}
      {rejected.length > 0 && (
        <section className="space-y-3">
          <h3 className="flex items-center gap-2 text-base font-bold text-foreground-950">
            <i className="ri-close-circle-line text-foreground-500"></i>
            거절됨
          </h3>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rejected.map((r) => (
              <div
                key={r.id}
                className="flex flex-col rounded-lg border border-background-200 bg-background-50 p-5"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-background-200 text-foreground-500">
                    <span className="text-base font-bold">{(r.full_name || '이').charAt(0)}</span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="truncate text-base font-bold text-foreground-900">
                      {r.full_name || '이름 없음'}
                    </h4>
                    <p className="text-xs text-foreground-500">
                      신청일 {r.created_at?.slice(0, 10) || '-'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDecision(r.id, 'approved')}
                  disabled={processingId === r.id}
                  className="mt-4 w-full cursor-pointer whitespace-nowrap rounded-md border border-primary-300 bg-white px-3 py-2.5 text-sm font-semibold text-primary-700 transition-colors hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {processingId === r.id ? '처리 중...' : '다시 승인'}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}