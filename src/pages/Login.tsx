
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useAuth, UserRole } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Lock, Mail } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useToast();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await login(email, password, role);
      toast({
        title: "Login Successful",
        description: `Welcome back! You are logged in as a ${role}.`,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Login Failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="w-full max-w-md px-4 sm:px-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Login to FarmBid Local</CardTitle>
              <CardDescription className="text-center">
                Choose your account type and enter your credentials
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="buyer" onValueChange={(value) => setRole(value as UserRole)} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buyer" className="flex items-center justify-center gap-2">
                    <User size={16} />
                    <span>Buyer</span>
                  </TabsTrigger>
                  <TabsTrigger value="farmer" className="flex items-center justify-center gap-2">
                    <User size={16} />
                    <span>Farmer</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="buyer" className="py-2">
                  <p className="text-sm text-gray-500">
                    Login as a buyer to browse and bid on fresh produce from local farmers.
                  </p>
                </TabsContent>
                <TabsContent value="farmer" className="py-2">
                  <p className="text-sm text-gray-500">
                    Login as a farmer to list your crops and manage auctions.
                  </p>
                </TabsContent>
              </Tabs>
            
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail size={16} />
                    <span>Email</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <Lock size={16} />
                    <span>Password</span>
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Logging in..." : `Login as ${role === 'farmer' ? 'Farmer' : 'Buyer'}`}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2 text-center">
              <div className="text-sm text-gray-500">
                Don't have an account?{" "}
                <Link to="/register" className="text-farmgreen-600 hover:underline">
                  Register
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Login;
