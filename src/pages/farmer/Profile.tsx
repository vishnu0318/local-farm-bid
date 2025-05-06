
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { CATEGORIES } from '@/constants/productCategories';
import ProfilePhoto from '@/components/farmer/ProfilePhoto';
import ProfileForm from '@/components/farmer/ProfileForm';

const FarmerProfile = () => {
  const { user, profile, updateProfile } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Use profile data from auth context
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    pinCode: '',
    landSize: '',
    landType: '',
    mainCrops: '',
    farmingExperience: '',
    bio: '',
    profileImage: 'https://randomuser.me/api/portraits/men/72.jpg',
    productTypes: [] as string[],
  });

  // Update local state when profile data is available
  useEffect(() => {
    if (profile) {
      console.log("Profile data loaded:", profile);
      setProfileData(prev => ({
        ...prev,
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        address: profile.address || '',
        pinCode: profile.address?.match(/(\d{6})/) ? profile.address.match(/(\d{6})/)[0] : '',
        landSize: profile.landSize || '',
        // Keep other fields as they are if not in profile
      }));
    }
  }, [profile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const toggleProductType = (productTypeId: string) => {
    setProfileData(prev => {
      const productTypes = [...prev.productTypes];
      
      if (productTypes.includes(productTypeId)) {
        return {
          ...prev,
          productTypes: productTypes.filter(id => id !== productTypeId)
        };
      } else {
        return {
          ...prev,
          productTypes: [...productTypes, productTypeId]
        };
      }
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Combine address and pincode
    const combinedAddress = profileData.address 
      ? (profileData.address.includes(profileData.pinCode) 
          ? profileData.address 
          : `${profileData.address}, ${profileData.pinCode}`)
      : '';
    
    // Update profile in Supabase through AuthContext
    const result = await updateProfile({
      name: profileData.name,
      email: profileData.email,
      phone: profileData.phone,
      address: combinedAddress,
      landSize: profileData.landSize,
    });

    setLoading(false);
    
    if (result.success) {
      // Show success message
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    } else {
      toast({
        title: "Update Failed",
        description: result.error || "Failed to update profile",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-full px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">My Profile</h1>
      
      <div className="grid gap-6 md:grid-cols-3">
        <ProfilePhoto 
          profileImage={profileData.profileImage} 
          name={profileData.name} 
        />
        
        <ProfileForm 
          profileData={profileData}
          productTypeOptions={CATEGORIES}
          onChange={handleChange}
          onToggleProductType={toggleProductType}
          onSubmit={handleSubmit}
          loading={loading}
        />
      </div>
    </div>
  );
};

export default FarmerProfile;
