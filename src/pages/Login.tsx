
import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/context/AuthContext';

const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  
  // Get role from URL query parameter or default to null
  const queryParams = new URLSearchParams(location.search);
  const defaultRole = queryParams.get('role') as UserRole || null;
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(defaultRole);
  const [isLoading, setIsLoading] = useState(false);

  // If user is already authenticated, redirect to the appropriate dashboard
  if (isAuthenticated) {
    const redirectPath = user?.role === 'farmer' ? '/farmer' : '/buyer';
    navigate(redirectPath);
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!role) {
      toast({
        title: "Error",
        description: "Please select your role",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      await login(email, password, role);
      
      toast({
        title: "Login Successful",
        description: "Welcome back to Go Fresh!",
      });
      
      // Redirect based on role
      navigate(role === 'farmer' ? '/farmer' : '/buyer');
    } catch (error) {
      console.error("Login error:", error);
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-md w-full">
        <Link to="/" className="flex items-center justify-center mb-8">
          <div className="text-4xl font-bold text-green-600">Go Fresh</div>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Login</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role">I am a</Label>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    type="button"
                    variant={role === 'farmer' ? 'default' : 'outline'}
                    className={role === 'farmer' ? 'bg-green-600 hover:bg-green-700' : ''}
                    onClick={() => setRole('farmer')}
                  >
                    Farmer
                  </Button>
                  <Button
                    type="button"
                    variant={role === 'buyer' ? 'default' : 'outline'}
                    className={role === 'buyer' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                    onClick={() => setRole('buyer')}
                  >
                    Buyer
                  </Button>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  placeholder="Enter your email" 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-sm text-green-600 hover:text-green-700">
                    Forgot password?
                  </Link>
                </div>
                <Input 
                  id="password" 
                  placeholder="••••••••" 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required 
                />
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Logging in..." : "Login"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Don't have an account?{' '}
                <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
                  Create an account
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Login;
