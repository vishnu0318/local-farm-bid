
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash, Plus, Calendar, Clock, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Organic Tomatoes',
    category: 'vegetables',
    subCategory: 'leafy',
    quantity: '50',
    unit: 'kg',
    price: '200',
    description: 'Fresh organic tomatoes grown without pesticides',
    status: 'active',
    bids: 3,
    highestBid: '225',
    imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
    bidStart: '2025-05-01T10:00:00',
    bidEnd: '2025-05-10T18:00:00',
  },
  {
    id: 'p2',
    name: 'Fresh Apples',
    category: 'fruits',
    subCategory: 'seasonal',
    quantity: '100',
    unit: 'kg',
    price: '150',
    description: 'Freshly harvested apples from our orchard',
    status: 'pending',
    bids: 0,
    highestBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a',
    bidStart: '2025-05-05T09:00:00',
    bidEnd: '2025-05-15T17:00:00',
  }
];

const MyProducts = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState(MOCK_PRODUCTS);

  const handleDelete = (productId: string) => {
    // Filter out the deleted product
    setProducts(products.filter(product => product.id !== productId));
    
    toast({
      title: "Product Deleted",
      description: "Your product has been successfully deleted.",
    });
  };

  const handleEdit = (product) => {
    // Navigate to edit page with product data
    navigate(`/farmer/edit-product/${product.id}`, { 
      state: { product } 
    });
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
      
      {products.length === 0 ? (
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
                  src={product.imageUrl} 
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
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <div className="flex items-center text-gray-500 text-sm">
                      <Calendar className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(product.bidStart).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-end text-gray-500 text-sm">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {new Date(product.bidEnd).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-lg font-medium flex items-center">
                        <IndianRupee className="h-4 w-4 mr-0.5" />
                        {product.price}/{product.unit}
                      </p>
                    </div>
                    {product.bids > 0 && (
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Highest Bid</p>
                        <p className="text-lg font-medium text-green-600 flex items-center justify-end">
                          <IndianRupee className="h-4 w-4 mr-0.5" />
                          {product.highestBid}/{product.unit}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {product.bids} {product.bids === 1 ? 'bid' : 'bids'}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
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
