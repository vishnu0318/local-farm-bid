
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash, Plus, Calendar, Clock, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Product, deleteProduct } from '@/services/productService';

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

        // Transform to our product format
        const formattedProducts: Product[] = data.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          unit: item.unit,
          price: item.price,
          description: item.description || '',
          status: item.available ? 'active' : 'pending',
          image_url: item.image_url || 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
          farmer_id: item.farmer_id,
          created_at: item.created_at,
          available: item.available
        }));

        setProducts(formattedProducts);
      } catch (err) {
        console.error('Error fetching products:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">My Products</h1>
        <Link to="/farmer/add-product">
          <Button className="flex items-center gap-2">
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
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <Card key={product.id} className="overflow-hidden">
              <div className="aspect-w-16 aspect-h-9 relative">
                <img 
                  src={product.image_url} 
                  alt={product.name} 
                  className="object-cover w-full h-48 rounded-t-lg"
                />
                <Badge className="absolute top-2 right-2" variant={product.status === 'active' ? 'default' : 'outline'}>
                  {product.status === 'active' ? 'Active' : 'Pending'}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)} · {product.quantity} {product.unit}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-lg font-medium flex items-center">
                        <IndianRupee className="h-4 w-4 mr-0.5" />
                        {product.price}/{product.unit}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    Added: {product.created_at ? new Date(product.created_at).toLocaleDateString() : 'Recently'}
                  </p>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="icon"
                      onClick={() => handleView(product.id)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      onClick={() => handleEdit(product)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="icon" 
                      className="text-red-500 hover:text-red-600"
                      onClick={() => handleDelete(product.id)}
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyProducts;
