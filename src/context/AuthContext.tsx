import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User, Profile } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  currentUser: User | null; // Alias for backward compatibility
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isConfigured: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (
    name: string,
    email: string,
    password: string
  ) => Promise<{ success: boolean; error?: string; message?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string; error?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: { name: string; email?: string; phone?: string }) => Promise<boolean>;
  openAuthModal: (mode?: 'login' | 'signup' | 'forgot') => void;
  closeAuthModal: () => void;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup' | 'forgot';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { error: toastError, success: toastSuccess } = useToast();

  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup' | 'forgot'>('login');

  // Load user profile from Supabase profiles table
  const fetchUserProfile = useCallback(async (userId: string, authUserEmail?: string, authUserName?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.warn('Could not fetch user profile:', error.message);
      }

      if (data) {
        setProfile({
          id: data.id,
          name: data.name || authUserName || 'User',
          email: data.email || authUserEmail || '',
          phone: data.phone || undefined,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        });

        setUser({
          id: data.id,
          name: data.name || authUserName || 'User',
          email: data.email || authUserEmail || '',
          phone: data.phone || undefined,
          createdAt: data.created_at,
        });
      } else {
        // If profile row does not exist yet, attempt to create it
        const fallbackName = authUserName || authUserEmail?.split('@')[0] || 'User';
        const fallbackEmail = authUserEmail || '';
        
        const newProfile: Profile = {
          id: userId,
          name: fallbackName,
          email: fallbackEmail,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        setProfile(newProfile);
        setUser({
          id: userId,
          name: fallbackName,
          email: fallbackEmail,
          createdAt: newProfile.createdAt,
        });

        // Insert into profiles asynchronously
        supabase.from('profiles').upsert({
          id: userId,
          name: fallbackName,
          email: fallbackEmail,
          updated_at: new Date().toISOString(),
        }).then(({ error: insertErr }) => {
          if (insertErr) {
            console.warn('Profile auto-create skipped or failed:', insertErr.message);
          }
        });
      }
    } catch (err) {
      console.error('Error in fetchUserProfile:', err);
    }
  }, []);

  // Initialize and listen to Supabase auth session
  useEffect(() => {
    let isMounted = true;

    async function initSession() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.warn('Supabase getSession error:', error.message);
        }

        if (session?.user && isMounted) {
          const u = session.user;
          const metaName = (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string);
          await fetchUserProfile(u.id, u.email, metaName);
        } else if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } catch (err) {
        console.error('Error getting initial session:', err);
        if (isMounted) {
          setUser(null);
          setProfile(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    initSession();

    // Subscribe to auth state changes across tabs / sessions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const u = session.user;
            const metaName = (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string);
            await fetchUserProfile(u.id, u.email, metaName);
          }
          setIsLoading(false);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setProfile(null);
          setIsLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserProfile]);

  const login = async (email: string, password: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !password) {
      return { success: false, error: 'Email and password are required' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes('invalid login credentials')) {
          msg = 'Incorrect email or password. Please try again.';
        }
        return { success: false, error: msg };
      }

      if (data.user) {
        const metaName = (data.user.user_metadata?.name as string) || (data.user.user_metadata?.full_name as string);
        await fetchUserProfile(data.user.id, data.user.email, metaName);
        setAuthModalOpen(false);
        return { success: true };
      }

      return { success: false, error: 'Failed to sign in. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during sign in' };
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Name is required' };
    }
    if (!trimmedEmail) {
      return { success: false, error: 'Email is required' };
    }
    if (!password || password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          data: {
            name: trimmedName,
            full_name: trimmedName,
          },
        },
      });

      if (error) {
        let msg = error.message;
        if (error.message.toLowerCase().includes('already registered')) {
          msg = 'An account with this email already exists. Please log in.';
        }
        return { success: false, error: msg };
      }

      if (data.user) {
        // Attempt to create the profile row
        try {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            name: trimmedName,
            email: trimmedEmail,
            updated_at: new Date().toISOString(),
          });
        } catch (e) {
          console.warn('Profile creation after signup:', e);
        }

        // If session was established immediately (auto-confirm enabled)
        if (data.session) {
          await fetchUserProfile(data.user.id, data.user.email, trimmedName);
          setAuthModalOpen(false);
          return { success: true };
        } else {
          // If email confirmation is required by Supabase settings
          return {
            success: true,
            message: 'Account created! If email confirmation is enabled, please verify your email before logging in.',
          };
        }
      }

      return { success: false, error: 'Could not create account. Please try again.' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Network error during registration' };
    }
  };

  const forgotPassword = async (email: string) => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      return { success: false, message: '', error: 'Please enter your email address' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: window.location.origin,
      });

      if (error) {
        return { success: false, message: '', error: error.message };
      }

      return {
        success: true,
        message: `Password reset instructions have been sent to ${trimmedEmail}`,
      };
    } catch (err: any) {
      return {
        success: false,
        message: '',
        error: err?.message || 'Failed to send password reset email',
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('Error during sign out:', err);
    } finally {
      setUser(null);
      setProfile(null);
      setAuthModalMode('login');
      toastSuccess('Signed out successfully');
    }
  };

  const updateProfile = async (data: { name: string; email?: string; phone?: string }): Promise<boolean> => {
    if (!user) return false;

    const trimmedName = data.name.trim();
    if (!trimmedName) {
      toastError('Name cannot be empty');
      return false;
    }

    try {
      const now = new Date().toISOString();
      const updates = {
        name: trimmedName,
        phone: data.phone?.trim() || null,
        updated_at: now,
      };

      const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (error) {
        toastError(error.message || 'Failed to update profile in database');
        return false;
      }

      // Also update auth user metadata
      supabase.auth.updateUser({
        data: { name: trimmedName, full_name: trimmedName },
      }).catch((e) => console.warn('Auth user metadata update warning:', e));

      setUser((prev) => (prev ? { ...prev, name: trimmedName, phone: data.phone?.trim() } : null));
      setProfile((prev) => (prev ? { ...prev, name: trimmedName, phone: data.phone?.trim(), updatedAt: now } : null));
      toastSuccess('Profile updated successfully');
      return true;
    } catch (err: any) {
      toastError(err?.message || 'Failed to update profile');
      return false;
    }
  };

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        currentUser: user,
        profile,
        isAuthenticated: !!user,
        isLoading,
        isConfigured: isSupabaseConfigured,
        login,
        signup,
        forgotPassword,
        logout,
        updateProfile,
        openAuthModal,
        closeAuthModal,
        authModalOpen,
        authModalMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
