
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const FarmerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Mock farmer profile data - in a real app, this would come from context or API
  const [profileData, setProfileData] = useState({
    name: 'Rajesh Kumar',
    email: 'rajesh@example.com',
    phone: '+91 98765 43210',
    address: 'Village Greenfields, District Farmland, State Agricultural',
    pinCode: '400001',
    landSize: '5 acres',
    landType: 'Irrigated',
    mainCrops: 'Tomatoes, Potatoes, Onions',
    farmingExperience: '15 years',
    bio: 'Experienced farmer specializing in organic vegetable production with focus on sustainable farming practices.',
    profileImage: 'https://randomuser.me/api/portraits/men/72.jpg',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we would typically send the data to an API
    console.log('Profile data submitted:', profileData);
    
    // Show success message
    toast({
      title: "Profile Updated",
      description: "Your profile has been successfully updated.",
    });
  };

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
                <p>April 2023</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Farmer ID</span>
                <p>FRM-2023-0458</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Products Listed</span>
                <p>12</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Successful Sales</span>
                <p>8</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Update your personal and farm details</CardDescription>
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
                <h3 className="font-medium text-lg mb-3">Farm Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="landSize">Land Size</Label>
                    <Input 
                      id="landSize" 
                      name="landSize" 
                      value={profileData.landSize} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="landType">Land Type</Label>
                    <Input 
                      id="landType" 
                      name="landType" 
                      value={profileData.landType} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="mainCrops">Main Crops</Label>
                    <Input 
                      id="mainCrops" 
                      name="mainCrops" 
                      value={profileData.mainCrops} 
                      onChange={handleChange} 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="farmingExperience">Farming Experience</Label>
                    <Input 
                      id="farmingExperience" 
                      name="farmingExperience" 
                      value={profileData.farmingExperience} 
                      onChange={handleChange} 
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

export default FarmerProfile;
