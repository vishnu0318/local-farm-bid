
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import PersonalInfoForm from './PersonalInfoForm';
import FarmDetailsForm from './FarmDetailsForm';

interface ProfileFormProps {
  profileData: {
    name: string;
    email: string;
    phone: string;
    address: string;
    pinCode: string;
    landSize: string;
    landType: string;
    mainCrops: string;
    farmingExperience: string;
    bio: string;
    productTypes: string[];
  };
  productTypeOptions: Array<{
    id: string;
    label: string;
  }>;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleProductType: (productTypeId: string) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const ProfileForm = ({ 
  profileData, 
  productTypeOptions,
  onChange, 
  onToggleProductType, 
  onSubmit 
}: ProfileFormProps) => {
  return (
    <Card className="md:col-span-2">
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your personal and farm details</CardDescription>
      </CardHeader>
      <form onSubmit={onSubmit}>
        <CardContent className="space-y-4">
          <PersonalInfoForm 
            name={profileData.name}
            email={profileData.email}
            phone={profileData.phone}
            pinCode={profileData.pinCode}
            address={profileData.address}
            onChange={onChange}
          />
          
          <FarmDetailsForm 
            landSize={profileData.landSize}
            landType={profileData.landType}
            mainCrops={profileData.mainCrops}
            farmingExperience={profileData.farmingExperience}
            bio={profileData.bio}
            productTypes={profileData.productTypes}
            productTypeOptions={productTypeOptions}
            onChange={onChange}
            onToggleProductType={onToggleProductType}
          />
        </CardContent>
        <CardFooter>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" type="button">Cancel</Button>
            <Button type="submit">Save Changes</Button>
          </div>
        </CardFooter>
      </form>
    </Card>
  );
};

export default ProfileForm;
