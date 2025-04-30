
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; 
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from '@/hooks/use-toast';
import { useAuth, UserRole } from '@/context/AuthContext';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { User, Phone, Home, CreditCard, Mail, Lock } from 'lucide-react';

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { toast } = useToast();
  
  // Common fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<UserRole>('buyer');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Farmer specific fields
  const [landSize, setLandSize] = useState('');
  const [accountDetails, setAccountDetails] = useState('');
  
  // Buyer specific fields
  const [companyName, setCompanyName] = useState('');
  const [preferredCategories, setPreferredCategories] = useState<string[]>([]);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Category options for buyers
  const categories = [
    { id: "vegetables", label: "Vegetables" },
    { id: "fruits", label: "Fruits" },
    { id: "grains", label: "Grains" },
    { id: "dairy", label: "Dairy" },
    { id: "other", label: "Other" }
  ];
  
  const handleCategoryChange = (category: string) => {
    setPreferredCategories(current => 
      current.includes(category) 
        ? current.filter(c => c !== category)
        : [...current, category]
    );
  };
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure your passwords match.",
        variant: "destructive",
      });
      return;
    }

    if (!termsAccepted) {
      toast({
        title: "Terms & Conditions",
        description: "You must accept the Terms & Conditions to register.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare user data based on role
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
          preferredCategories
        })
      };
      
      await register(userData, password);
      
      toast({
        title: "Registration Successful",
        description: `Welcome to FarmBid Local! Your ${role === 'farmer' ? 'Farmer' : 'Buyer'} ID has been generated.`,
      });
      navigate('/');
    } catch (error) {
      toast({
        title: "Registration Failed",
        description: "There was an error creating your account. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-2xl px-4 sm:px-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-2xl font-bold text-center">Create an Account</CardTitle>
              <CardDescription className="text-center">
                Join FarmBid Local to connect with local farms and fresh produce
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="buyer" onValueChange={(value) => setRole(value as UserRole)} className="mb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="buyer" className="flex items-center justify-center gap-2">
                    <User size={16} />
                    <span>I'm a Buyer</span>
                  </TabsTrigger>
                  <TabsTrigger value="farmer" className="flex items-center justify-center gap-2">
                    <User size={16} />
                    <span>I'm a Farmer</span>
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="buyer" className="py-2">
                  <p className="text-sm text-gray-500">
                    Register as a buyer to bid on fresh produce directly from local farmers.
                    You'll get a unique Buyer ID upon registration.
                  </p>
                </TabsContent>
                <TabsContent value="farmer" className="py-2">
                  <p className="text-sm text-gray-500">
                    Register as a farmer to list your crops for auction and reach more local buyers.
                    You'll get a unique Farmer ID upon registration.
                  </p>
                </TabsContent>
              </Tabs>
            
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Common fields section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-md">Personal Information</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="flex items-center gap-2">
                        <User size={16} />
                        <span>Full Name</span>
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        placeholder="John Doe"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                      />
                    </div>
                    
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
                      <Label htmlFor="phone" className="flex items-center gap-2">
                        <Phone size={16} />
                        <span>Mobile Number</span>
                      </Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="555-123-4567"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="address" className="flex items-center gap-2">
                        <Home size={16} />
                        <span>Address</span>
                      </Label>
                      <Input
                        id="address"
                        type="text"
                        placeholder="123 Main Street"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Role-specific fields */}
                {role === 'farmer' ? (
                  <div className="space-y-4">
                    <h3 className="font-medium text-md">Farmer Details</h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="landSize">Land Size (acres/hectares)</Label>
                        <Input
                          id="landSize"
                          type="text"
                          placeholder="e.g., 5 acres"
                          value={landSize}
                          onChange={(e) => setLandSize(e.target.value)}
                          required
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="accountDetails" className="flex items-center gap-2">
                          <CreditCard size={16} />
                          <span>Bank Account Details</span>
                        </Label>
                        <Input
                          id="accountDetails"
                          type="text"
                          placeholder="Bank name & account number"
                          value={accountDetails}
                          onChange={(e) => setAccountDetails(e.target.value)}
                          required
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <h3 className="font-medium text-md">Buyer Details</h3>
                    
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="companyName">Company/Business Name (Optional)</Label>
                        <Input
                          id="companyName"
                          type="text"
                          placeholder="Your business name"
                          value={companyName}
                          onChange={(e) => setCompanyName(e.target.value)}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Preferred Product Categories</Label>
                        <div className="grid grid-cols-2 gap-2">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox 
                                id={category.id} 
                                checked={preferredCategories.includes(category.id)}
                                onCheckedChange={() => handleCategoryChange(category.id)}
                              />
                              <label
                                htmlFor={category.id}
                                className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {category.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Password section */}
                <div className="space-y-4">
                  <h3 className="font-medium text-md">Security</h3>
                  
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirm Password</Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
                
                {/* Terms and Conditions */}
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox 
                    id="terms" 
                    checked={termsAccepted}
                    onCheckedChange={(checked) => setTermsAccepted(checked === true)}
                    required
                  />
                  <label
                    htmlFor="terms"
                    className="text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    I agree to the Terms and Conditions and Privacy Policy
                  </label>
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full mt-6"
                  disabled={isSubmitting || !termsAccepted}
                >
                  {isSubmitting ? "Creating Account..." : `Register as ${role === 'farmer' ? 'Farmer' : 'Buyer'}`}
                </Button>
              </form>
            </CardContent>
            
            <CardFooter className="flex flex-col space-y-2 text-center">
              <div className="text-sm text-gray-500">
                Already have an account?{" "}
                <Link to="/login" className="text-farmgreen-600 hover:underline">
                  Login
                </Link>
              </div>
            </CardFooter>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Register;
