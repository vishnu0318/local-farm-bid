
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'kg',
    price: '',
    description: '',
    harvestDate: '',
    expiryDate: '',
    imageUrl: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we would typically send the data to an API
    console.log('Product data submitted:', formData);
    
    // Show success message
    toast({
      title: "Product Added",
      description: `${formData.name} has been successfully added.`,
    });
    
    // Redirect to my products page
    navigate('/farmer/my-products');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Product Details</CardTitle>
          <CardDescription>Enter the details of your new product</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Enter product name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  placeholder="Enter quantity" 
                  value={formData.quantity} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => handleSelectChange('unit', value)}
                >
                  <SelectTrigger id="unit">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Kilogram (kg)</SelectItem>
                    <SelectItem value="g">Gram (g)</SelectItem>
                    <SelectItem value="l">Liter (L)</SelectItem>
                    <SelectItem value="pcs">Pieces (pcs)</SelectItem>
                    <SelectItem value="box">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price per unit (USD)</Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter price" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="harvestDate">Harvest Date</Label>
                <Input 
                  id="harvestDate" 
                  name="harvestDate" 
                  type="date" 
                  value={formData.harvestDate} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="expiryDate">Expected Expiry Date</Label>
                <Input 
                  id="expiryDate" 
                  name="expiryDate" 
                  type="date" 
                  value={formData.expiryDate} 
                  onChange={handleChange} 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="imageUrl">Image URL</Label>
                <Input 
                  id="imageUrl" 
                  name="imageUrl" 
                  placeholder="Enter image URL" 
                  value={formData.imageUrl} 
                  onChange={handleChange} 
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe your product" 
                value={formData.description} 
                onChange={handleChange} 
                className="min-h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">Add Product</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
