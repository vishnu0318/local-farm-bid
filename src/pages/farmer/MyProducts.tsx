
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash, Plus, IndianRupee, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, deleteProduct } from '@/services/productService';
import { format, formatDistance, isAfter, isBefore } from 'date-fns';

const MyProducts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from Supabase
  useEffect(() => {
    if (!user) return;

    const fetchProducts = async () => {
      try {
        console.log("Fetching products for user:", user.id);
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .eq('farmer_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching products:', error);
          toast({
            title: "Failed to load products",
            description: error.message,
            variant: "destructive"
          });
          return;
        }

        console.log("Products fetched:", data);
        
        if (!data || data.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }

        // Transform to our product format
        setProducts(data as Product[]);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();

    // Set up a timer to refresh product status based on bid times
    const timer = setInterval(() => {
      setProducts(currentProducts => 
        currentProducts.map(product => {
          const now = new Date();
          const bidEnd = product.bid_end ? new Date(product.bid_end) : null;
          
          // Update product status if bid has ended
          if (bidEnd && isBefore(bidEnd, now) && product.available) {
            return { ...product, available: false };
          }
          
          return product;
        })
      );
    }, 60000); // Check every minute
    
    return () => clearInterval(timer);
  }, [user, toast]);

  const handleDelete = async (productId: string) => {
    try {
      const result = await deleteProduct(productId);

      if (!result.success) {
        console.error('Error deleting product:', result.error);
        toast({
          title: "Delete Failed",
          description: result.error,
          variant: "destructive"
        });
        return;
      }

      // Filter out the deleted product
      setProducts(products.filter(product => product.id !== productId));
      
      toast({
        title: "Product Deleted",
        description: "Your product has been successfully deleted.",
      });
    } catch (err) {
      console.error('Error deleting product:', err);
      toast({
        title: "Delete Failed",
        description: "An unexpected error occurred",
        variant: "destructive"
      });
    }
  };

  const handleEdit = (product: Product) => {
    // Navigate to edit page with product data
    navigate(`/farmer/edit-product/${product.id}`, { 
      state: { product } 
    });
  };
  
  const handleView = (productId: string) => {
    // Navigate to product detail page
    navigate(`/farmer/product/${productId}`);
  };
  
  // Function to get bid status and time information
  const getBidTimeInfo = (product: Product) => {
    const now = new Date();
    const bidStart = product.bid_start ? new Date(product.bid_start) : null;
    const bidEnd = product.bid_end ? new Date(product.bid_end) : null;
    
    if (!bidStart || !bidEnd) {
      return { status: 'No auction', timeRemaining: 'N/A' };
    }
    
    if (isBefore(now, bidStart)) {
      return { 
        status: 'Upcoming', 
        timeRemaining: `Starts ${formatDistance(bidStart, now, { addSuffix: true })}` 
      };
    }
    
    if (isAfter(now, bidEnd)) {
      return { status: 'Ended', timeRemaining: `Ended ${formatDistance(bidEnd, now, { addSuffix: true })}` };
    }
    
    return { 
      status: 'Active', 
      timeRemaining: `Ends ${formatDistance(bidEnd, now, { addSuffix: true })}` 
    };
  };

  return (
    <div className="w-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold">My Products</h1>
        <Link to="/farmer/add-product">
          <Button className="flex items-center gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            <span>Add New Product</span>
          </Button>
        </Link>
      </div>
      
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <p>Loading your products...</p>
        </div>
      ) : products.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="mb-4 text-center text-gray-500">You haven't listed any products yet</p>
            <Link to="/farmer/add-product">
              <Button>Add Your First Product</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const bidInfo = getBidTimeInfo(product);
            
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img 
                    src={product.image_url} 
                    alt={product.name} 
                    className="object-cover w-full h-32 sm:h-48 rounded-t-lg"
                  />
                  <Badge 
                    className="absolute top-2 right-2" 
                    variant={
                      bidInfo.status === 'Active' ? 'default' : 
                      bidInfo.status === 'Upcoming' ? 'secondary' : 'outline'
                    }
                  >
                    {bidInfo.status}
                  </Badge>
                </div>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-base sm:text-lg">{product.name}</CardTitle>
                  <CardDescription className="text-sm">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)} • {product.quantity} {product.unit}
                  </CardDescription>
                </CardHeader>
                <CardContent className="py-2 px-4">
                  <div className="mb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs sm:text-sm text-gray-500">Base Price</p>
                        <p className="text-base sm:text-lg font-medium flex items-center">
                          <IndianRupee className="h-3 w-3 sm:h-4 sm:w-4 mr-0.5" />
                          {product.price}/{product.unit}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center text-xs sm:text-sm text-gray-500">
                          <Clock className="h-3 w-3 mr-1" />
                          <span>{bidInfo.timeRemaining}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-xs sm:text-sm text-gray-500">
                      Added: {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Recently'}
                    </p>
                    <div className="flex space-x-1 sm:space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handleView(product.id)}
                      >
                        <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-8 h-8 p-0"
                        onClick={() => handleEdit(product)}
                      >
                        <Edit className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="w-8 h-8 p-0 text-red-500 hover:text-red-600"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
