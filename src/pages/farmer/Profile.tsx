
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { PRODUCT_TYPES } from '@/constants/productTypes';
import ProfilePhoto from '@/components/farmer/ProfilePhoto';
import ProfileForm from '@/components/farmer/ProfileForm';

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
    productTypes: ['vegetables', 'fruits', 'organic'],
  });

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
        <ProfilePhoto 
          profileImage={profileData.profileImage} 
          name={profileData.name} 
        />
        
        <ProfileForm 
          profileData={profileData}
          productTypeOptions={PRODUCT_TYPES}
          onChange={handleChange}
          onToggleProductType={toggleProductType}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
};

export default FarmerProfile;
