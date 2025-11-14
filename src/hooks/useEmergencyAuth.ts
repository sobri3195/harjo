import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

interface EmergencyAuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export const useEmergencyAuth = () => {
  const [authState, setAuthState] = useState<EmergencyAuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  // Ensure user is authenticated for emergency features
  const ensureAuthenticated = useCallback(async (): Promise<User | null> => {
    try {
      // First check current session
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (user) {
        return user;
      }

      if (error) {
        console.warn('Auth check error:', error);
      }

      // If no user, attempt anonymous sign-in for emergency access
      console.log('No user found, attempting emergency authentication...');
      
      const { data: authData, error: signInError } = await supabase.auth.signInAnonymously();
      
      if (signInError) {
        throw new Error(`Emergency authentication failed: ${signInError.message}`);
      }

      if (authData.user) {
        toast({
          title: "🚨 Emergency Access Granted",
          description: "You've been automatically authenticated for emergency features.",
          duration: 3000,
        });
        return authData.user;
      }

      throw new Error('Failed to establish emergency authentication');
    } catch (error) {
      console.error('Emergency authentication error:', error);
      setAuthState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Authentication failed',
        isLoading: false 
      }));
      
      toast({
        title: "Authentication Error",
        description: "Unable to authenticate for emergency features. Please try refreshing the page.",
        variant: "destructive",
        duration: 5000,
      });
      
      return null;
    }
  }, []);

  // Monitor auth state
  useEffect(() => {
    let mounted = true;

    const checkAuthState = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (mounted) {
          setAuthState({
            user: session?.user || null,
            isAuthenticated: !!session?.user,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Auth state check error:', error);
        if (mounted) {
          setAuthState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Authentication check failed',
          });
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        console.log('Emergency auth state change:', event, session?.user?.id || 'no user');
        setAuthState({
          user: session?.user || null,
          isAuthenticated: !!session?.user,
          isLoading: false,
          error: null,
        });
      }
    });

    checkAuthState();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    ...authState,
    ensureAuthenticated,
  };
};