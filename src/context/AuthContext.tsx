
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'farmer' | 'buyer' | null;

// Extend the Supabase User type to include our custom fields
interface User extends SupabaseUser {
  name?: string;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  // Farmer specific fields
  landSize?: string;
  // Buyer specific fields
  companyName?: string;
  preferredCategories?: string[];
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  register: (userData: Partial<Profile>, password: string) => Promise<{ success: boolean; error?: string }>;
  isFarmer: () => boolean;
  isBuyer: () => boolean;
  loading: boolean;
  updateProfile: (profileData: Partial<Profile>) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        console.log("Auth state changed:", event);
        setSession(newSession);
        if (newSession?.user) {
          // Add name to user object from metadata if available
          const userWithName = {
            ...newSession.user,
            name: newSession.user.user_metadata?.name || '',
          } as User;
          setUser(userWithName);

          // Use setTimeout to prevent deadlocks
          setTimeout(async () => {
            await fetchUserProfile(newSession.user.id);
          }, 0);
        } else {
          setUser(null);
          setProfile(null);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      if (currentSession?.user) {
        // Add name to user object from metadata if available
        const userWithName = {
          ...currentSession.user,
          name: currentSession.user.user_metadata?.name || '',
        } as User;
        setUser(userWithName);
        fetchUserProfile(currentSession.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      // Transform database column names to camelCase for consistency
      const transformedProfile: Profile = {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        phone: data.phone,
        address: data.address,
        landSize: data.land_size,
        companyName: data.company_name,
        preferredCategories: data.preferred_categories
      };

      setProfile(transformedProfile);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setProfile(null);
    }
  };

  const login = async (email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error("Login error:", error.message);
        setLoading(false);
        if (error.message.includes('Email not confirmed')) {
          return { 
            success: false, 
            error: "Please confirm your email before logging in. Check your inbox for a confirmation link." 
          };
        }
        return { success: false, error: error.message };
      }

      // Check if the user has the correct role
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (profileError) {
        console.error("Profile not found:", profileError.message);
        await logout();
        setLoading(false);
        return { success: false, error: "Profile not found. Please register first." };
      }

      if (profileData.role !== role) {
        console.error("Role mismatch");
        await logout();
        setLoading(false);
        return { success: false, error: `This account is not registered as a ${role}. Please use the correct role.` };
      }
      
      setLoading(false);
      return { success: true };
    } catch (error: any) {
      console.error("Login error:", error);
      setLoading(false);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
  };

  const register = async (userData: Partial<Profile>, password: string): Promise<{ success: boolean; error?: string }> => {
    setLoading(true);
    
    try {
      // Sign up the user with Supabase Auth
      const { data, error } = await supabase.auth.signUp({ 
        email: userData.email as string, 
        password,
        options: {
          data: {
            name: userData.name,
            role: userData.role
          },
          emailRedirectTo: window.location.origin + '/login',
        }
      });
      
      if (error) {
        console.error("Registration error:", error.message);
        setLoading(false);
        return { success: false, error: error.message };
      }

      // The profile is created automatically via database trigger
      
      setLoading(false);

      // Check if email confirmation is required
      if (data?.user && !data.session) {
        return { 
          success: true, 
          error: "Please check your email for a confirmation link before logging in." 
        };
      }
      
      return { success: true };
    } catch (error: any) {
      console.error("Registration error:", error);
      setLoading(false);
      return { success: false, error: error.message || 'An unknown error occurred' };
    }
  };

  // Add function to update profile
  const updateProfile = async (profileData: Partial<Profile>): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: "Not authenticated" };
    
    try {
      // Transform camelCase to snake_case for database
      const dbData = {
        name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address,
        land_size: profileData.landSize,
        company_name: profileData.companyName,
        preferred_categories: profileData.preferredCategories,
      };
      
      const { error } = await supabase
        .from('profiles')
        .update(dbData)
        .eq('id', user.id);
        
      if (error) {
        console.error("Error updating profile:", error);
        return { success: false, error: error.message };
      }
      
      // Refresh profile data
      await fetchUserProfile(user.id);
      
      return { success: true };
    } catch (error: any) {
      console.error("Error updating profile:", error);
      return { success: false, error: error.message || "An unexpected error occurred" };
    }
  };

  // Helper functions to check user role
  const isFarmer = () => profile?.role === 'farmer';
  const isBuyer = () => profile?.role === 'buyer';

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      session,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      isFarmer,
      isBuyer,
      loading,
      updateProfile
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
