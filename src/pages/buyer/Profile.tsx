
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const BuyerProfile = () => {
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  
  // Profile data state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pinCode: '',
    companyName: '',
    businessType: '',
    preferredCategories: '',
    purchaseVolume: '',
    bio: '',
    profileImage: '',
  });

  // Load profile data from Supabase
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      try {
        // Get profile data
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (error) throw error;
        
        if (data) {
          setProfileData({
            name: data.name || '',
            email: user.email || '', // Get email from auth user object
            phone: data.phone || '',
            address: data.address || '',
            pinCode: data.address?.match(/(\d{6})/) ? data.address.match(/(\d{6})/)[1] : '',
            companyName: data.company_name || '',
            businessType: data.role || 'buyer',
            preferredCategories: Array.isArray(data.preferred_categories) 
              ? data.preferred_categories.join(', ')
              : '',
            purchaseVolume: '',
            bio: '',
            profileImage: user.user_metadata?.avatar_url || '',
          });
        }
      } catch (error) {
        console.error("Error loading profile:", error);
        toast({
          title: "Error loading profile",
          description: "Failed to load your profile data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadProfile();
  }, [user, toast]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsLoading(true);
    
    try {
      // Extract PIN code from address if not already included
      let address = profileData.address;
      if (profileData.pinCode && !address.includes(profileData.pinCode)) {
        address = `${address}, ${profileData.pinCode}`;
      }
      
      // Parse preferred categories from string to array
      const preferredCategories = profileData.preferredCategories
        ? profileData.preferredCategories.split(',').map(cat => cat.trim())
        : [];
      
      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          address: address,
          company_name: profileData.companyName,
          preferred_categories: preferredCategories
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Update Failed",
        description: "An error occurred while updating your profile.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !profileData.name) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-500" />
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Profile Photo</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Avatar className="h-40 w-40 mb-4">
              <AvatarImage src={profileData.profileImage} alt={profileData.name} />
              <AvatarFallback>{profileData.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <Button variant="outline" className="w-full">Change Photo</Button>
          </CardContent>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm text-gray-500">Member Since</span>
                <p>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Buyer ID</span>
                <p>{user?.id ? user.id.substring(0, 8) : "N/A"}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Active Bids</span>
                <p>-</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Won Auctions</span>
                <p>-</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal and business details</CardDescription>
          </CardHeader>
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={profileData.name} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    name="email" 
                    type="email" 
                    value={profileData.email} 
                    onChange={handleChange} 
                    required 
                    disabled
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input 
                    id="phone" 
                    name="phone" 
                    value={profileData.phone} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pinCode">PIN Code</Label>
                  <Input 
                    id="pinCode" 
                    name="pinCode" 
                    value={profileData.pinCode} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Textarea 
                    id="address" 
                    name="address" 
                    value={profileData.address} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
              </div>
              
              <div className="border-t pt-4 mt-6">
                <h3 className="font-medium text-lg mb-3">Business Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Company Name</Label>
                    <Input 
                      id="companyName" 
                      name="companyName" 
                      value={profileData.companyName} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="businessType">Business Type</Label>
                    <Input 
                      id="businessType" 
                      name="businessType" 
                      value={profileData.businessType} 
                      onChange={handleChange} 
                      disabled
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="preferredCategories">Preferred Product Categories</Label>
                    <Input 
                      id="preferredCategories" 
                      name="preferredCategories" 
                      value={profileData.preferredCategories} 
                      onChange={handleChange} 
                      placeholder="e.g. Vegetables, Fruits, Grains (comma separated)"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="purchaseVolume">Purchase Volume</Label>
                    <Input 
                      id="purchaseVolume" 
                      name="purchaseVolume" 
                      value={profileData.purchaseVolume} 
                      onChange={handleChange}
                      placeholder="e.g. Medium-Large (500+ kg weekly)" 
                    />
                  </div>
                  
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bio">Bio / Description</Label>
                    <Textarea 
                      id="bio" 
                      name="bio" 
                      value={profileData.bio} 
                      onChange={handleChange} 
                      className="min-h-[100px]"
                      placeholder="Tell farmers a bit about your business and buying preferences"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button variant="outline" type="button">Cancel</Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default BuyerProfile;
