import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import type { Profile } from '@/lib/supabaseClient';

export function useTeachers() {
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    supabase
      .from('profiles')
      .select('*')
      .in('role', ['teacher', 'admin'])
      .order('created_at', { ascending: true })
      .then(({ data, error }) => {
        if (!mounted) return;
        if (error) {
          console.error(error);
        }
        setTeachers((data as Profile[]) || []);
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return { teachers, loading };
}