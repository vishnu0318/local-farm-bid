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
import { Calendar as CalendarIcon, Clock, IndianRupee, Sparkles, Save, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CATEGORIES } from '@/constants/productCategories';
import { addProduct, updateProduct } from '@/services/productService';
import ImageUpload from '@/components/farmer/ImageUpload';

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
      const bidStartDate = editData.bid_start ? new Date(editData.bid_start) : null;
      const bidEndDate = editData.bid_end ? new Date(editData.bid_end) : null;
      
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

  const handleImageSelect = (imageUrl: string) => {
    setFormData(prev => ({
      ...prev,
      imageUrl: imageUrl
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
    <div className="w-full px-2 sm:px-0 space-y-6">
      {/* Enhanced Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-primary/5 p-8 border border-white/20 shadow-xl">
        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-transparent to-white/5"></div>
        <div className="relative">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg animate-pulse">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {editMode ? 'Edit Product' : 'Add New Product'}
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            {editMode ? 'Update your product details' : 'Share your fresh produce with the marketplace'}
          </p>
        </div>
      </div>
      
      {/* Enhanced Form Card */}
      <Card className="w-full bg-white/80 backdrop-blur-xl shadow-2xl border border-white/20 rounded-2xl overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-white/50 via-transparent to-white/30 pointer-events-none"></div>
        <CardHeader className="relative bg-gradient-to-r from-primary/5 to-secondary/5 border-b border-white/20">
          <CardTitle className="text-2xl font-bold text-gray-800">Product Details</CardTitle>
          <CardDescription className="text-gray-600">Enter the details of your product</CardDescription>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6 p-8 relative">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Product Name */}
              <div className="space-y-3 group">
                <Label htmlFor="name" className="text-sm font-semibold text-gray-700 flex items-center">
                  Product Name
                  <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Input 
                  id="name" 
                  name="name" 
                  placeholder="Enter product name" 
                  value={formData.name} 
                  onChange={handleChange} 
                  required 
                  className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </div>
              
              {/* Category */}
              <div className="space-y-3 group">
                <Label htmlFor="category" className="text-sm font-semibold text-gray-700 flex items-center">
                  Category
                  <div className="w-2 h-2 bg-secondary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger id="category" className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-white/30 rounded-xl shadow-2xl">
                    {CATEGORIES.map(category => (
                      <SelectItem key={category.id} value={category.id} className="hover:bg-primary/10 rounded-lg transition-colors duration-200">
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Quantity */}
              <div className="space-y-3 group">
                <Label htmlFor="quantity" className="text-sm font-semibold text-gray-700 flex items-center">
                  Quantity
                  <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Input 
                  id="quantity" 
                  name="quantity" 
                  type="number" 
                  placeholder="Enter quantity" 
                  value={formData.quantity} 
                  onChange={handleChange} 
                  required 
                  className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </div>
              
              {/* Unit */}
              <div className="space-y-3 group">
                <Label htmlFor="unit" className="text-sm font-semibold text-gray-700 flex items-center">
                  Unit
                  <div className="w-2 h-2 bg-secondary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Select 
                  value={formData.unit} 
                  onValueChange={(value) => handleSelectChange('unit', value)}
                >
                  <SelectTrigger id="unit" className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl">
                    <SelectValue placeholder="Select unit" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/95 backdrop-blur-xl border-white/30 rounded-xl shadow-2xl">
                    <SelectItem value="kg" className="hover:bg-primary/10 rounded-lg transition-colors duration-200">Kilogram (kg)</SelectItem>
                    <SelectItem value="g" className="hover:bg-primary/10 rounded-lg transition-colors duration-200">Gram (g)</SelectItem>
                    <SelectItem value="l" className="hover:bg-primary/10 rounded-lg transition-colors duration-200">Liter (L)</SelectItem>
                    <SelectItem value="pcs" className="hover:bg-primary/10 rounded-lg transition-colors duration-200">Pieces (pcs)</SelectItem>
                    <SelectItem value="box" className="hover:bg-primary/10 rounded-lg transition-colors duration-200">Box</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Price */}
              <div className="space-y-3 group">
                <Label htmlFor="price" className="text-sm font-semibold text-gray-700 flex items-center">
                  Base Price 
                  <IndianRupee className="h-4 w-4 ml-1 text-primary"/>
                  <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Input 
                  id="price" 
                  name="price" 
                  type="number" 
                  step="0.01" 
                  placeholder="Enter price in INR" 
                  value={formData.price} 
                  onChange={handleChange} 
                  required 
                  className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                />
              </div>

              {/* Bid Start Date */}
              <div className="space-y-3 group">
                <Label htmlFor="bidStartDate" className="text-sm font-semibold text-gray-700 flex items-center">
                  Bid Start Date
                  <div className="w-2 h-2 bg-secondary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="bidStartDate"
                      variant={"outline"}
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-white/30 hover:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md",
                        !formData.bidStartDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {formData.bidStartDate ? format(formData.bidStartDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-white/30 rounded-xl shadow-2xl">
                    <Calendar
                      mode="single"
                      selected={formData.bidStartDate || undefined}
                      onSelect={(date) => handleDateChange('bidStartDate', date)}
                      disabled={(date) => date < today}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bid Start Time */}
              <div className="space-y-3 group">
                <Label htmlFor="bidStartTime" className="text-sm font-semibold text-gray-700 flex items-center">
                  Bid Start Time
                  <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <div className="flex items-center">
                  <Clock className="mr-3 h-5 w-5 text-primary" />
                  <Input
                    id="bidStartTime"
                    name="bidStartTime"
                    type="time"
                    value={formData.bidStartTime}
                    onChange={handleTimeChange}
                    className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>

              {/* Bid End Date */}
              <div className="space-y-3 group">
                <Label htmlFor="bidEndDate" className="text-sm font-semibold text-gray-700 flex items-center">
                  Bid End Date
                  <div className="w-2 h-2 bg-secondary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="bidEndDate"
                      variant={"outline"}
                      className={cn(
                        "w-full h-12 justify-start text-left font-normal bg-white/80 backdrop-blur-sm border-white/30 hover:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md",
                        !formData.bidEndDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-primary" />
                      {formData.bidEndDate ? format(formData.bidEndDate, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-white/95 backdrop-blur-xl border-white/30 rounded-xl shadow-2xl">
                    <Calendar
                      mode="single"
                      selected={formData.bidEndDate || undefined}
                      onSelect={(date) => handleDateChange('bidEndDate', date)}
                      disabled={(date) => date < today}
                      initialFocus
                      className="rounded-xl"
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Bid End Time */}
              <div className="space-y-3 group">
                <Label htmlFor="bidEndTime" className="text-sm font-semibold text-gray-700 flex items-center">
                  Bid End Time
                  <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
                </Label>
                <div className="flex items-center">
                  <Clock className="mr-3 h-5 w-5 text-primary" />
                  <Input
                    id="bidEndTime"
                    name="bidEndTime"
                    type="time"
                    value={formData.bidEndTime}
                    onChange={handleTimeChange}
                    className="h-12 bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg"
                  />
                </div>
              </div>
            </div>

            {/* Image Upload Section - Enhanced */}
            <div className="space-y-4 p-6 bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-white/30">
              <ImageUpload
                onImageSelect={handleImageSelect}
                currentImage={formData.imageUrl}
                label="Product Image"
              />
            </div>

            {/* Description */}
            <div className="space-y-3 group">
              <Label htmlFor="description" className="text-sm font-semibold text-gray-700 flex items-center">
                Description
                <div className="w-2 h-2 bg-primary rounded-full ml-2 group-focus-within:animate-pulse"></div>
              </Label>
              <Textarea 
                id="description" 
                name="description" 
                placeholder="Describe your product in detail..." 
                value={formData.description} 
                onChange={handleChange} 
                className="min-h-[120px] bg-white/80 backdrop-blur-sm border-white/30 focus:border-primary/50 rounded-xl transition-all duration-300 hover:shadow-md focus:shadow-lg resize-none"
              />
            </div>
          </CardContent>
          
          {/* Enhanced Footer */}
          <CardFooter className="p-8 bg-gradient-to-r from-gray-50/50 to-white/50 border-t border-white/20">
            <div className="flex flex-col sm:flex-row gap-4 w-full">
              <Button 
                type="button" 
                variant="outline" 
                className="w-full sm:w-auto h-12 rounded-xl border-2 border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-300 hover:shadow-md group" 
                onClick={() => navigate('/farmer/my-products')}
              >
                <X className="mr-2 h-4 w-4 group-hover:rotate-90 transition-transform duration-300" />
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="w-full sm:w-auto h-12 bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 group"
              >
                <Save className="mr-2 h-4 w-4 group-hover:scale-110 transition-transform duration-300" />
                {editMode ? 'Update Product' : 'Add Product'}
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default AddProduct;
