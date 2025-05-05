
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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
  login: (email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  register: (userData: Partial<User>, password: string) => Promise<void>;
  isFarmer: () => boolean;
  isBuyer: () => boolean;
  loading: boolean;
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

// Mock database for users
const mockDatabase = {
  users: [
    {
      id: 'F123456',
      name: 'Demo Farmer',
      email: 'farmer@example.com',
      password: 'password123',
      role: 'farmer' as UserRole,
      phone: '555-123-4567',
      address: '123 Farm Road',
      landSize: '5 acres',
      accountDetails: 'Bank of Agriculture #12345'
    },
    {
      id: 'B123456',
      name: 'Demo Buyer',
      email: 'buyer@example.com',
      password: 'password123',
      role: 'buyer' as UserRole,
      phone: '555-123-4567',
      address: '456 Market Street',
      companyName: 'Local Market',
      preferredCategories: ['Vegetables', 'Fruits']
    }
  ]
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Check if we have a user in local storage
    const savedUser = localStorage.getItem('goFreshUser');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading state for authentication check
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, []);

  // Enhanced login function that checks credentials
  const login = async (email: string, password: string, role: UserRole): Promise<boolean> => {
    setLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Check mock database for matching credentials
    const foundUser = mockDatabase.users.find(
      u => u.email === email && u.password === password && u.role === role
    );
    
    if (foundUser) {
      // Create user object without password for storage
      const { password: _, ...safeUserData } = foundUser;
      
      // Ensure role is correctly typed as UserRole
      const typedUserData: User = {
        ...safeUserData,
        role: safeUserData.role as UserRole
      };
      
      // Save user to state and localStorage
      setUser(typedUserData);
      localStorage.setItem('goFreshUser', JSON.stringify(typedUserData));
      setLoading(false);
      return true;
    }
    
    setLoading(false);
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('goFreshUser');
  };

  // Enhanced register function that saves to mock database
  const register = async (userData: Partial<User>, password: string) => {
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate appropriate ID based on role
    const userId = generateUserId(userData.role as UserRole);
    
    // Create user with all provided data and the generated ID
    const newUser = {
      id: userId,
      name: userData.name || '',
      email: userData.email || '',
      password: password,  // In a real app, this would be hashed
      role: userData.role as UserRole,  // Ensure role is typed correctly
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
    
    // Add to mock database
    mockDatabase.users.push(newUser);
    
    // Save user to state and localStorage (without password)
    const { password: _, ...safeUserData } = newUser;
    
    // Ensure role is correctly typed as UserRole for the user state
    const typedUserData: User = {
      ...safeUserData,
      role: safeUserData.role as UserRole
    };
    
    setUser(typedUserData);
    localStorage.setItem('goFreshUser', JSON.stringify(typedUserData));
    setLoading(false);
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
      loading
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
