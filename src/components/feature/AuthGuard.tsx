import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import type { ProfileStatus } from '@/lib/supabaseClient';
import PendingApproval from './PendingApproval';

type AuthState = 'loading' | 'unauthed' | 'pending' | 'rejected' | 'approved';

export default function AuthGuard({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>('loading');
  const location = useLocation();

  useEffect(() => {
    let mounted = true;
    let fallbackTimer: ReturnType<typeof setTimeout>;

    fallbackTimer = setTimeout(() => {
      if (mounted) setState('unauthed');
    }, 3000);

    function resolveState() {
      supabase.auth
        .getSession()
        .then(({ data }) => {
          if (!mounted) return;
          const userId = data.session?.user?.id;
          if (!userId) {
            clearTimeout(fallbackTimer);
            setState('unauthed');
            return;
          }
          supabase
            .from('profiles')
            .select('status')
            .eq('id', userId)
            .maybeSingle()
            .then(({ data: profile }) => {
              if (!mounted) return;
              clearTimeout(fallbackTimer);
              const status: ProfileStatus = profile?.status ?? 'pending';
              if (status === 'approved') setState('approved');
              else if (status === 'rejected') setState('rejected');
              else setState('pending');
            })
            .catch(() => {
              if (!mounted) return;
              clearTimeout(fallbackTimer);
              setState('pending');
            });
        })
        .catch(() => {
          if (!mounted) return;
          clearTimeout(fallbackTimer);
          setState('unauthed');
        });
    }

    resolveState();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) {
        clearTimeout(fallbackTimer);
        setState('unauthed');
        return;
      }
      resolveState();
    });

    return () => {
      mounted = false;
      clearTimeout(fallbackTimer);
      listener.subscription.unsubscribe();
    };
  }, []);

  if (state === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background-50">
        <div className="flex items-center gap-3 text-foreground-600">
          <i className="ri-loader-4-line animate-spin text-2xl"></i>
          <span className="text-sm">불러오는 중...</span>
        </div>
      </div>
    );
  }

  if (state === 'unauthed') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (state === 'pending' || state === 'rejected') {
    return <PendingApproval status={state} />;
  }

  return <>{children}</>;
}