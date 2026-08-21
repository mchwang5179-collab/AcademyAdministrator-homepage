import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      const userId = data.session?.user?.id;
      if (!userId) {
        setLoading(false);
        return;
      }
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()
        .then(({ data: p, error }) => {
          if (!mounted) return;
          if (error) {
            console.error(error);
          }
          setProfile(p as Profile | null);
          setLoading(false);
        });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return { profile, loading };
}