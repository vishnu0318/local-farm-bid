
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, Edit, Trash, Plus } from 'lucide-react';

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Organic Tomatoes',
    category: 'vegetables',
    quantity: '50',
    unit: 'kg',
    price: '2.99',
    status: 'active',
    bids: 3,
    highestBid: '3.25',
    imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
  },
  {
    id: 'p2',
    name: 'Fresh Apples',
    category: 'fruits',
    quantity: '100',
    unit: 'kg',
    price: '1.99',
    status: 'pending',
    bids: 0,
    highestBid: null,
    imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a',
  }
];

const MyProducts = () => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);

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
            <Card key={product.id}>
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
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="text-lg font-medium">${product.price}/{product.unit}</p>
                  </div>
                  {product.bids > 0 && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Highest Bid</p>
                      <p className="text-lg font-medium text-green-600">${product.highestBid}/{product.unit}</p>
                    </div>
                  )}
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {product.bids} {product.bids === 1 ? 'bid' : 'bids'}
                  </p>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="icon">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon" className="text-red-500 hover:text-red-600">
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
