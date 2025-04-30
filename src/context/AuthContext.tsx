
import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'farmer' | 'buyer' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  location?: {
    latitude: number;
    longitude: number;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  isFarmer: () => boolean;
  isBuyer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);

  // Mock login function - in a real app, this would connect to a backend
  const login = async (email: string, password: string, role: UserRole) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock user data
    setUser({
      id: '1',
      name: role === 'farmer' ? 'Demo Farmer' : 'Demo Buyer',
      email,
      role,
    });
  };

  const logout = () => {
    setUser(null);
  };

  // Mock register function
  const register = async (name: string, email: string, password: string, role: UserRole) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setUser({
      id: '1',
      name,
      email,
      role,
    });
  };

  // Helper functions to check user role
  const isFarmer = () => user?.role === 'farmer';
  const isBuyer = () => user?.role === 'buyer';

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      login,
      logout,
      register,
      isFarmer,
      isBuyer,
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
