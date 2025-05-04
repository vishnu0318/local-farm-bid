
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';

interface ProductType {
  id: string;
  label: string;
}

interface FarmDetailsFormProps {
  landSize: string;
  landType: string;
  mainCrops: string;
  farmingExperience: string;
  bio: string;
  productTypes: string[];
  productTypeOptions: ProductType[];
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onToggleProductType: (productTypeId: string) => void;
}

const FarmDetailsForm = ({ 
  landSize, 
  landType, 
  mainCrops, 
  farmingExperience, 
  bio, 
  productTypes, 
  productTypeOptions,
  onChange, 
  onToggleProductType 
}: FarmDetailsFormProps) => {
  return (
    <div className="border-t pt-4 mt-6">
      <h3 className="font-medium text-lg mb-3">Farm Details</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="landSize">Land Size</Label>
          <Input 
            id="landSize" 
            name="landSize" 
            value={landSize} 
            onChange={onChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="landType">Land Type</Label>
          <Input 
            id="landType" 
            name="landType" 
            value={landType} 
            onChange={onChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="mainCrops">Main Crops</Label>
          <Input 
            id="mainCrops" 
            name="mainCrops" 
            value={mainCrops} 
            onChange={onChange} 
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="farmingExperience">Farming Experience</Label>
          <Input 
            id="farmingExperience" 
            name="farmingExperience" 
            value={farmingExperience} 
            onChange={onChange} 
          />
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label>Product Types</Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 pt-2">
            {productTypeOptions.map((type) => (
              <div className="flex items-center space-x-2" key={type.id}>
                <Checkbox 
                  id={`product-${type.id}`} 
                  checked={productTypes.includes(type.id)}
                  onCheckedChange={() => onToggleProductType(type.id)}
                />
                <label
                  htmlFor={`product-${type.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {type.label}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="bio">Bio / Description</Label>
          <Textarea 
            id="bio" 
            name="bio" 
            value={bio} 
            onChange={onChange} 
            className="min-h-[100px]" 
          />
        </div>
      </div>
    </div>
  );
};

export default FarmDetailsForm;
