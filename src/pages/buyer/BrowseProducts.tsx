
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Eye, IndianRupee } from 'lucide-react';

const MOCK_PRODUCTS = [
  {
    id: 'p1',
    name: 'Organic Tomatoes',
    category: 'vegetables',
    farmer: 'Green Valley Farm',
    quantity: '50',
    unit: 'kg',
    price: '200',
    bids: 3,
    highestBid: '225',
    timeLeft: '2 days',
    imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
    bidEnd: '2025-05-10T18:00:00', // Added bid end time
  },
  {
    id: 'p2',
    name: 'Fresh Apples',
    category: 'fruits',
    farmer: 'Orchard Hills',
    quantity: '100',
    unit: 'kg',
    price: '150',
    bids: 5,
    highestBid: '175',
    timeLeft: '1 day',
    imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a',
    bidEnd: '2025-05-08T18:00:00',
  },
  {
    id: 'p3',
    name: 'Organic Carrots',
    category: 'vegetables',
    farmer: 'Sunny Fields',
    quantity: '30',
    unit: 'kg',
    price: '120',
    bids: 2,
    highestBid: '135',
    timeLeft: '3 days',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37',
    bidEnd: '2025-05-12T18:00:00',
  },
];

const BrowseProducts = () => {
  const [products, setProducts] = useState(MOCK_PRODUCTS);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    maxPrice: [500], // Changed to a higher value in INR
    minBids: 0,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      search: e.target.value,
    });
  };

  const handleCategoryChange = (value: string) => {
    setFilters({
      ...filters,
      category: value,
    });
  };

  const handlePriceChange = (value: number[]) => {
    setFilters({
      ...filters,
      maxPrice: value,
    });
  };

  // Check if bid is still active (not expired)
  const isBidActive = (endTimeStr: string) => {
    const endTime = new Date(endTimeStr);
    const now = new Date();
    return endTime > now;
  };

  // Filter active bids
  const activeBids = products.filter(product => isBidActive(product.bidEnd));

  // Filtered products based on search and filters
  const filteredProducts = activeBids.filter(product => {
    return (
      product.name.toLowerCase().includes(filters.search.toLowerCase()) &&
      (filters.category === 'all' || product.category === filters.category) && 
      parseFloat(product.price) <= filters.maxPrice[0]
    );
  });

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Browse Products</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filters</CardTitle>
          <CardDescription>Narrow down your product search</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <Input 
                id="search" 
                placeholder="Search products" 
                value={filters.search}
                onChange={handleSearchChange}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select 
                value={filters.category} 
                onValueChange={handleCategoryChange}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  <SelectItem value="vegetables">Vegetables</SelectItem>
                  <SelectItem value="fruits">Fruits</SelectItem>
                  <SelectItem value="grains">Grains</SelectItem>
                  <SelectItem value="dairy">Dairy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <div className="flex justify-between">
                <Label htmlFor="price">Max Price (₹ per unit)</Label>
                <span>₹{filters.maxPrice[0].toFixed(2)}</span>
              </div>
              <Slider 
                id="price"
                min={0}
                max={500}
                step={10}
                value={filters.maxPrice}
                onValueChange={handlePriceChange}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {filteredProducts.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500">No products found matching your criteria</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProducts.map((product) => (
            <Card key={product.id}>
              <div className="aspect-w-16 aspect-h-9 relative">
                <img 
                  src={product.imageUrl} 
                  alt={product.name} 
                  className="object-cover w-full h-48 rounded-t-lg"
                />
                <Badge className="absolute top-2 right-2">
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </Badge>
              </div>
              <CardHeader>
                <CardTitle>{product.name}</CardTitle>
                <CardDescription>
                  By {product.farmer} · {product.quantity} {product.unit} available
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Base Price</p>
                    <p className="text-lg font-medium flex items-center">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {product.price}/{product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Highest Bid</p>
                    <p className="text-lg font-medium text-green-600 flex items-center justify-end">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {product.highestBid}/{product.unit}
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-500">
                      {product.bids} {product.bids === 1 ? 'bid' : 'bids'} · {product.timeLeft} left
                    </p>
                  </div>
                  <Link to={`/buyer/product/${product.id}`}>
                    <Button className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      <span>View Details</span>
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default BrowseProducts;
