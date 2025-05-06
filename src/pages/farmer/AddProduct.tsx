
import { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, isAfter, startOfToday, addHours } from 'date-fns';
import { Calendar as CalendarIcon, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/constants/productCategories';
import { addProduct, updateProduct } from '@/services/productService';

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();
  
  const editMode = id !== undefined;
  const editData = location.state?.product || null;

  const [formData, setFormData] = useState({
    name: '',
    category: '',
    quantity: '',
    unit: 'kg',
    price: '',
    description: '',
    bidStartDate: null as Date | null,
    bidEndDate: null as Date | null,
    bidStartTime: '',
    bidEndTime: '',
    imageUrl: '',
  });

  useEffect(() => {
    if (editMode && editData) {
      const bidStartDate = editData.bidStart ? new Date(editData.bidStart) : null;
      const bidEndDate = editData.bidEnd ? new Date(editData.bidEnd) : null;
      
      const startHours = bidStartDate ? bidStartDate.getHours() : '';
      const startMinutes = bidStartDate ? bidStartDate.getMinutes() : '';
      const endHours = bidEndDate ? bidEndDate.getHours() : '';
      const endMinutes = bidEndDate ? bidEndDate.getMinutes() : '';
      
      const bidStartTime = startHours !== '' ? `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}` : '';
      const bidEndTime = endHours !== '' ? `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}` : '';
      
      setFormData({
        name: editData.name || '',
        category: editData.category || '',
        quantity: editData.quantity?.toString() || '',
        unit: editData.unit || 'kg',
        price: editData.price?.toString() || '',
        description: editData.description || '',
        bidStartDate: bidStartDate,
        bidEndDate: bidEndDate,
        bidStartTime: bidStartTime,
        bidEndTime: bidEndTime,
        imageUrl: editData.image_url || '',
      });
    }
  }, [editMode, editData]);

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

  const handleDateChange = (name: string, date: Date | null) => {
    setFormData(prev => ({
      ...prev,
      [name]: date
    }));
  };
  
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication Error",
        description: "You must be logged in to add products",
        variant: "destructive",
      });
      return;
    }

    // Set default bid dates if not provided
    let bidStart = null;
    let bidEnd = null;

    if (formData.bidStartDate && formData.bidStartTime) {
      const [hours, minutes] = formData.bidStartTime.split(':').map(Number);
      bidStart = new Date(formData.bidStartDate);
      bidStart.setHours(hours, minutes);
    } else {
      // Default to now
      bidStart = new Date();
    }

    if (formData.bidEndDate && formData.bidEndTime) {
      const [hours, minutes] = formData.bidEndTime.split(':').map(Number);
      bidEnd = new Date(formData.bidEndDate);
      bidEnd.setHours(hours, minutes);
    } else if (bidStart) {
      // Default to 24 hours from start if not provided
      bidEnd = addHours(bidStart, 24);
    }
    
    // Create the product object
    const productData = {
      name: formData.name,
      category: formData.category,
      quantity: Number(formData.quantity),
      unit: formData.unit,
      price: Number(formData.price),
      description: formData.description,
      image_url: formData.imageUrl || 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
      farmer_id: user.id,
      available: true,
      bid_start: bidStart?.toISOString(),
      bid_end: bidEnd?.toISOString()
    };

    try {
      let result;
      
      if (editMode && id) {
        result = await updateProduct(id, productData);
      } else {
        result = await addProduct(productData);
      }
      
      if (result.success) {
        toast({
          title: editMode ? "Product Updated" : "Product Added",
          description: `${formData.name} has been successfully ${editMode ? "updated" : "added"}.`,
        });
        
        // Redirect to my products page
        navigate('/farmer/my-products');
      } else {
        toast({
          title: "Error",
          description: result.error || "An unexpected error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving product:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while saving your product",
        variant: "destructive",
      });
    }
  };

  // Get today's date to disable past dates
  const today = startOfToday();

  return (
    <div className="w-full px-2 sm:px-0">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">
        {editMode ? 'Edit Product' : 'Add New Product'}
      </h1>
      
      <Card className="w-full">
        <CardHeader>
          <CardTitle>{editMode ? 'Edit Product Details' : 'Product Details'}</CardTitle>
          <CardDescription>Enter the details of your product</CardDescription>
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
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id}>{category.label}</SelectItem>
                    ))}
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
                <Label htmlFor="price" className="flex items-center">Base Price <IndianRupee className="h-3 w-3 ml-1"/></Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter price in INR" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
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

              <div className="space-y-2">
                <Label htmlFor="bidStartDate">Bid Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="bidStartDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.bidStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.bidStartDate ? format(formData.bidStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.bidStartDate || undefined}
                      onSelect={(date) => handleDateChange('bidStartDate', date)}
                      disabled={(date) => date < today}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bidStartTime">Bid Start Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="bidStartTime"
                    name="bidStartTime"
                    type="time"
                    value={formData.bidStartTime}
                    onChange={handleTimeChange}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bidEndDate">Bid End Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="bidEndDate"
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.bidEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.bidEndDate ? format(formData.bidEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={formData.bidEndDate || undefined}
                      onSelect={(date) => handleDateChange('bidEndDate', date)}
                      disabled={(date) => date < today}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bidEndTime">Bid End Time</Label>
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-gray-400" />
                  <Input
                    id="bidEndTime"
                    name="bidEndTime"
                    type="time"
                    value={formData.bidEndTime}
                    onChange={handleTimeChange}
                  />
                </div>
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
            <div className="flex flex-col sm:flex-row gap-2 w-full">
              <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={() => navigate('/farmer/my-products')}>Cancel</Button>
              <Button type="submit" className="w-full sm:w-auto">{editMode ? 'Update Product' : 'Add Product'}</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
