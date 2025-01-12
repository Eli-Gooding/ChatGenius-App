import { useEffect, useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { User } from '@supabase/supabase-js';

interface DBUser {
  id: string;
  user_name: string;
  email: string;
  avatar_url: string | null;
  user_status: 'online' | 'away' | 'offline';
}

export function useUser() {
  const [user, setUser] = useState<DBUser | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get the authenticated user
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          setUser(null);
          return;
        }

        // Get the user profile data
        const { data: dbUser, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (error) throw error;
        
        setUser(dbUser);
      } catch (error) {
        console.error('Error fetching user:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        fetchUser();
      } else {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const mutateUser = async () => {
    const { data: dbUser, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user?.id)
      .single();

    if (!error && dbUser) {
      setUser(dbUser);
    }
  };

  return { user, loading, mutateUser };
} 