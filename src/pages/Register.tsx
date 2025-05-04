
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { UserRole } from '@/context/AuthContext';

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [role, setRole] = useState<UserRole>('farmer');
  const [isLoading, setIsLoading] = useState(false);
  
  // Common form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  
  // Farmer-specific fields
  const [landSize, setLandSize] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  
  // Buyer-specific fields
  const [companyName, setCompanyName] = useState('');
  
  const handleRoleChange = (value: string) => {
    setRole(value as UserRole);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic validation
    if (password !== confirmPassword) {
      toast({
        title: "Error",
        description: "Passwords do not match",
        variant: "destructive"
      });
      return;
    }
    
    try {
      setIsLoading(true);
      
      // Create user data based on role
      const userData = {
        name,
        email,
        role,
        phone,
        address,
        ...(role === 'farmer' ? {
          landSize,
          accountDetails
        } : {
          companyName,
          preferredCategories: ['Vegetables', 'Fruits'] // Default categories
        })
      };
      
      await register(userData, password);
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created successfully!",
      });
      
      // Redirect based on role
      navigate(role === 'farmer' ? '/farmer' : '/buyer');
    } catch (error) {
      console.error("Registration error:", error);
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account.",
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
            <CardTitle className="text-2xl">Create an Account</CardTitle>
            <CardDescription>
              Sign up to start using Go Fresh
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <Tabs defaultValue="farmer" onValueChange={handleRoleChange}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="farmer">I am a Farmer</TabsTrigger>
                  <TabsTrigger value="buyer">I am a Buyer</TabsTrigger>
                </TabsList>
                
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input 
                      id="name" 
                      placeholder="Enter your full name" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
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
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <Input 
                        id="password" 
                        placeholder="••••••••" 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input 
                        id="confirmPassword" 
                        placeholder="••••••••" 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input 
                      id="phone" 
                      placeholder="Enter your phone number" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input 
                      id="address" 
                      placeholder="Enter your address" 
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      required 
                    />
                  </div>
                  
                  <TabsContent value="farmer">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="landSize">Land Size</Label>
                        <Input 
                          id="landSize" 
                          placeholder="E.g., 5 acres" 
                          value={landSize}
                          onChange={(e) => setLandSize(e.target.value)}
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accountDetails">Bank Account Details</Label>
                        <Input 
                          id="accountDetails" 
                          placeholder="E.g., Bank name, Account number" 
                          value={accountDetails}
                          onChange={(e) => setAccountDetails(e.target.value)}
                          required 
                        />
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="buyer">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company Name (Optional)</Label>
                        <Input 
                          id="companyName" 
                          placeholder="Enter your company name" 
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </div>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? "Creating Account..." : "Create Account"}
              </Button>
              <p className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-green-600 hover:text-green-700 font-medium">
                  Login
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Register;
