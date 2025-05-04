
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
import { format, isAfter, startOfToday, addDays } from 'date-fns';
import { Calendar as CalendarIcon, Clock, IndianRupee } from 'lucide-react';
import { cn } from '@/lib/utils';

// Subcategory mapping
const SUBCATEGORIES = {
  vegetables: [
    { value: 'leafy', label: 'Leafy Greens' },
    { value: 'root', label: 'Root Vegetables' },
    { value: 'allium', label: 'Allium (Onion family)' },
    { value: 'cruciferous', label: 'Cruciferous' },
    { value: 'marrow', label: 'Marrow' },
  ],
  fruits: [
    { value: 'tropical', label: 'Tropical Fruits' },
    { value: 'berries', label: 'Berries' },
    { value: 'citrus', label: 'Citrus' },
    { value: 'stone', label: 'Stone Fruits' },
    { value: 'seasonal', label: 'Seasonal Fruits' },
  ],
  grains: [
    { value: 'cereals', label: 'Cereals' },
    { value: 'millets', label: 'Millets' },
    { value: 'rice', label: 'Rice Varieties' },
    { value: 'wheat', label: 'Wheat Varieties' },
  ],
  dairy: [
    { value: 'milk', label: 'Milk' },
    { value: 'cheese', label: 'Cheese' },
    { value: 'butter', label: 'Butter' },
    { value: 'curd', label: 'Curd & Yogurt' },
  ],
  other: [
    { value: 'spices', label: 'Spices' },
    { value: 'herbs', label: 'Herbs' },
    { value: 'nuts', label: 'Nuts & Seeds' },
    { value: 'honey', label: 'Honey & Bee Products' },
  ],
};

// Convert 24-hour format to 12-hour with AM/PM
const formatTimeWithAMPM = (time24) => {
  if (!time24) return '';
  
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  
  return `${hour12}:${minutes} ${ampm}`;
};

// Convert 12-hour format string to 24-hour format for input
const parse12HourTime = (time12) => {
  if (!time12) return '';
  
  const [timePart, ampm] = time12.split(' ');
  let [hours, minutes] = timePart.split(':');
  hours = parseInt(hours, 10);
  
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  
  return `${hours.toString().padStart(2, '0')}:${minutes}`;
};

const AddProduct = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const location = useLocation();
  const { id } = useParams();
  
  const editMode = id !== undefined;
  const editData = location.state?.product || null;

  const [availableSubCategories, setAvailableSubCategories] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    subCategory: '',
    quantity: '',
    unit: 'kg',
    price: '',
    description: '',
    bidStartDate: null,
    bidEndDate: null,
    bidStartTime: '',
    bidEndTime: '',
    imageUrl: '',
  });

  // Initialize form with edit data if available
  useEffect(() => {
    if (editMode && editData) {
      const bidStartDate = new Date(editData.bidStart);
      const bidEndDate = new Date(editData.bidEnd);
      
      const startHours = bidStartDate.getHours();
      const startMinutes = bidStartDate.getMinutes();
      const endHours = bidEndDate.getHours();
      const endMinutes = bidEndDate.getMinutes();
      
      const bidStartTime = `${startHours.toString().padStart(2, '0')}:${startMinutes.toString().padStart(2, '0')}`;
      const bidEndTime = `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
      
      setFormData({
        name: editData.name,
        category: editData.category,
        subCategory: editData.subCategory || '',
        quantity: editData.quantity,
        unit: editData.unit,
        price: editData.price,
        description: editData.description || '',
        bidStartDate: bidStartDate,
        bidEndDate: bidEndDate,
        bidStartTime: bidStartTime,
        bidEndTime: bidEndTime,
        imageUrl: editData.imageUrl,
      });
      
      // Set subcategories based on the category
      if (editData.category && SUBCATEGORIES[editData.category]) {
        setAvailableSubCategories(SUBCATEGORIES[editData.category]);
      }
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
    
    // If category changed, update subcategories
    if (name === 'category') {
      setFormData(prev => ({
        ...prev,
        subCategory: '' // Reset subcategory when category changes
      }));
      setAvailableSubCategories(SUBCATEGORIES[value] || []);
    }
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate bid times
    if (!formData.bidStartDate || !formData.bidEndDate || !formData.bidStartTime || !formData.bidEndTime) {
      toast({
        title: "Missing Bid Information",
        description: "Please set both start and end times for bidding",
        variant: "destructive",
      });
      return;
    }
    
    // Check if end date is after start date
    const startDateTime = new Date(formData.bidStartDate);
    const [startHours, startMinutes] = formData.bidStartTime.split(':').map(Number);
    startDateTime.setHours(startHours, startMinutes);
    
    const endDateTime = new Date(formData.bidEndDate);
    const [endHours, endMinutes] = formData.bidEndTime.split(':').map(Number);
    endDateTime.setHours(endHours, endMinutes);
    
    if (endDateTime <= startDateTime) {
      toast({
        title: "Invalid Bid Period",
        description: "The end date and time must be after the start date and time",
        variant: "destructive",
      });
      return;
    }
    
    // Here we would typically send the data to an API
    console.log('Product data submitted:', formData);
    
    // Show success message
    toast({
      title: editMode ? "Product Updated" : "Product Added",
      description: `${formData.name} has been successfully ${editMode ? "updated" : "added"} with bidding period.`,
    });
    
    // Redirect to my products page
    navigate('/farmer/my-products');
  };

  // Get today's date to disable past dates
  const today = startOfToday();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {editMode ? 'Edit Product' : 'Add New Product'}
      </h1>
      
      <Card>
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
                    <SelectItem value="vegetables">Vegetables</SelectItem>
                    <SelectItem value="fruits">Fruits</SelectItem>
                    <SelectItem value="grains">Grains</SelectItem>
                    <SelectItem value="dairy">Dairy</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.category && (
                <div className="space-y-2">
                  <Label htmlFor="subCategory">Sub-Category</Label>
                  <Select 
                    value={formData.subCategory} 
                    onValueChange={(value) => handleSelectChange('subCategory', value)}
                  >
                    <SelectTrigger id="subCategory">
                      <SelectValue placeholder="Select sub-category" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableSubCategories.map(sub => (
                        <SelectItem key={sub.value} value={sub.value}>{sub.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              
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
            </div>

            {/* Bidding Period Section */}
            <div className="border p-4 rounded-md bg-gray-50">
              <h3 className="text-lg font-medium mb-4">Bidding Period</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Bid Start Date & Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.bidStartDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.bidStartDate ? format(formData.bidStartDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.bidStartDate || undefined}
                          onSelect={(date) => handleDateChange('bidStartDate', date)}
                          disabled={(date) => isAfter(today, date)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="time"
                        name="bidStartTime"
                        value={formData.bidStartTime}
                        onChange={handleTimeChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Bid End Date & Time</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !formData.bidEndDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {formData.bidEndDate ? format(formData.bidEndDate, "PPP") : <span>Pick date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={formData.bidEndDate || undefined}
                          onSelect={(date) => handleDateChange('bidEndDate', date)}
                          disabled={(date) => isAfter(today, date)}
                          initialFocus
                          className={cn("p-3 pointer-events-auto")}
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <Input
                        type="time"
                        name="bidEndTime"
                        value={formData.bidEndTime}
                        onChange={handleTimeChange}
                        className="pl-10"
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => navigate('/farmer/my-products')}>Cancel</Button>
              <Button type="submit">{editMode ? 'Update Product' : 'Add Product'}</Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
