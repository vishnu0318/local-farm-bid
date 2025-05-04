
import { createContext, useContext, useState, ReactNode } from 'react';

export type UserRole = 'farmer' | 'buyer' | null;

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone?: string;
  address?: string;
  // Farmer specific fields
  landSize?: string;
  accountDetails?: string;
  // Buyer specific fields
  companyName?: string;
  preferredCategories?: string[];
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
  register: (userData: Partial<User>, password: string) => Promise<void>;
  isFarmer: () => boolean;
  isBuyer: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to generate unique IDs based on role
const generateUserId = (role: UserRole): string => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  if (role === 'farmer') {
    return `F${timestamp}${random}`;
  } else {
    return `B${timestamp}${random}`;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check if we have a user in local storage
    const savedUser = localStorage.getItem('goFreshUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Mock login function - in a real app, this would connect to a backend
  const login = async (email: string, password: string, role: UserRole) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create mock user data based on role
    const mockUser = {
      id: role === 'farmer' ? 'F123456' : 'B123456',
      name: role === 'farmer' ? 'Demo Farmer' : 'Demo Buyer',
      email,
      role,
      phone: '555-123-4567',
      address: role === 'farmer' ? '123 Farm Road' : '456 Market Street',
      ...(role === 'farmer' ? {
        landSize: '5 acres',
        accountDetails: 'Bank of Agriculture #12345'
      } : {
        companyName: 'Local Market',
        preferredCategories: ['Vegetables', 'Fruits']
      })
    };
    
    // Save user to state and localStorage
    setUser(mockUser);
    localStorage.setItem('goFreshUser', JSON.stringify(mockUser));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('goFreshUser');
  };

  // Enhanced register function that accepts role-specific details
  const register = async (userData: Partial<User>, password: string) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate appropriate ID based on role
    const userId = generateUserId(userData.role as UserRole);
    
    // Create user with all provided data and the generated ID
    const newUser = {
      id: userId,
      name: userData.name || '',
      email: userData.email || '',
      role: userData.role as UserRole,
      phone: userData.phone,
      address: userData.address,
      // Include role-specific fields if they exist
      ...(userData.role === 'farmer' ? {
        landSize: userData.landSize,
        accountDetails: userData.accountDetails
      } : {
        companyName: userData.companyName,
        preferredCategories: userData.preferredCategories
      })
    };
    
    // Save user to state and localStorage
    setUser(newUser);
    localStorage.setItem('goFreshUser', JSON.stringify(newUser));
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
