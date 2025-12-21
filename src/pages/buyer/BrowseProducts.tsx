
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Timer, MapPin, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Product } from '@/types/marketplace';
import { toast } from "sonner";
import { formatDistance } from 'date-fns';
import { getHighestBid } from '@/services/bidService';

const BrowseProducts = () => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [category, setCategory] = useState('all');
  const [sortBy, setSortBy] = useState('price-low');

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      
      try {
        // Fetch actual products from Supabase
        const { data: fetchedProducts, error } = await supabase
          .from('products')
          .select('*')
          .eq('available', true);
        
        if (error) throw error;
        
        if (!fetchedProducts || fetchedProducts.length === 0) {
          setProducts([]);
          setLoading(false);
          return;
        }
        
        // Add timeLeft property to each product
        const productsWithTimeLeft = await Promise.all(fetchedProducts.map(async (product) => {
          const endTime = product.bid_end ? new Date(product.bid_end) : null;
          const now = new Date();
          
          let timeLeft = "No deadline";
          if (endTime) {
            if (now >= endTime) {
              timeLeft = "Ended";
            } else {
              timeLeft = formatDistance(endTime, now, { addSuffix: false }) + " left";
            }
          }
          
          // Get highest bid for product
          const highestBid = await getHighestBid(product.id);
          
          // Check if current user is the highest bidder
          let isUserHighestBidder = false;
          if (user) {
            const { data: highestBidData, error: bidError } = await supabase
              .from('bids')
              .select('buyer_id')
              .eq('product_id', product.id)
              .order('bid_price', { ascending: false })
              .limit(1)
              .maybeSingle();
            
            if (!bidError && highestBidData) {
              isUserHighestBidder = highestBidData.buyer_id === user.id;
            }
          }
          
          return { 
            ...product, 
            timeLeft,
            highest_bid: highestBid,
            highest_bidder_id: isUserHighestBidder ? user?.id : undefined,
          };
        }));
        
        setProducts(productsWithTimeLeft);
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
    
    // Set up interval to update time left
    const intervalId = setInterval(() => {
      setProducts(prevProducts => prevProducts.map(product => {
        const endTime = product.bid_end ? new Date(product.bid_end) : null;
        const now = new Date();
        
        let timeLeft = "No deadline";
        if (endTime) {
          if (now >= endTime) {
            timeLeft = "Ended";
          } else {
            timeLeft = formatDistance(endTime, now, { addSuffix: false }) + " left";
          }
        }
        
        return { ...product, timeLeft };
      }));
    }, 60000); // Update every minute
    
    return () => clearInterval(intervalId);
  }, [user]);

  // Filter products based on search term and category
  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });
  
  // Sort products
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return (a.highest_bid || a.price) - (b.highest_bid || b.price);
      case 'price-high':
        return (b.highest_bid || b.price) - (a.highest_bid || a.price);
      case 'ending-soon':
        // Sort by end date, items with no end date go last
        if (!a.bid_end) return 1;
        if (!b.bid_end) return -1;
        return new Date(a.bid_end).getTime() - new Date(b.bid_end).getTime();
      default:
        return 0;
    }
  });

  // Get unique categories from products
  const categories = ['all', ...new Set(products.map(product => product.category))];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Browse Products</h1>
      
      {/* Search and filters */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col gap-4 md:flex-row">
          <div className="flex w-full items-center space-x-2">
            <Search className="h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row sm:space-x-2 space-y-2 sm:space-y-0">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat === 'all' ? 'All Categories' : cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="ending-soon">Ending Soon</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Products grid */}
      {loading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Card key={item} className="overflow-hidden">
              <div className="h-48 bg-gray-200" />
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded-md w-3/4 mb-2" />
                <div className="h-4 bg-gray-200 rounded-md w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded-md w-full" />
                  <div className="h-4 bg-gray-200 rounded-md w-3/4" />
                </div>
              </CardContent>
              <CardFooter>
                <div className="h-10 bg-gray-200 rounded-md w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : sortedProducts.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-2xl font-semibold text-gray-600 mb-2">No products found</h2>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {sortedProducts.map((product) => {
            const isAuctionEnded = product.bid_end && new Date() > new Date(product.bid_end);
            const isUserHighestBidder = user && product.highest_bidder_id === user.id;
            const hasWonAuction = isAuctionEnded && isUserHighestBidder;
            
            return (
              <Card key={product.id} className="overflow-hidden">
                <div className="relative">
                  <img 
                    src={product.image_url || '/placeholder.svg'} 
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                  {product.timeLeft && product.timeLeft !== "No deadline" && (
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-md flex items-center text-xs font-medium ${
                      product.timeLeft === "Ended" ? "bg-gray-700 text-white" : "bg-white text-black shadow"
                    }`}>
                      <Timer className="h-3 w-3 mr-1" />
                      {product.timeLeft}
                    </div>
                  )}
                </div>
                
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle>{product.name}</CardTitle>
                    {hasWonAuction && (
                      <Badge className="bg-green-600">Won</Badge>
                    )}
                  </div>
                  <CardDescription className="flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {product.farmer_id || "Unknown location"}
                  </CardDescription>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label>Quantity</Label>
                      <p>{product.quantity} {product.unit}</p>
                    </div>
                    <div>
                      <Label>Current Bid</Label>
                      <p className="font-medium flex items-center">
                        <IndianRupee className="h-4 w-4 mr-0.5" /> 
                        {product.highest_bid || product.price}
                      </p>
                    </div>
                    {product.description && (
                      <p className="text-sm text-gray-600 line-clamp-2">{product.description}</p>
                    )}
                  </div>
                </CardContent>
                
                <CardFooter>
                  <Link to={`/buyer/product/${product.id}`} className="w-full">
                    <Button 
                      className="w-full"
                      variant={hasWonAuction ? "default" : "outline"}
                    >
                      {hasWonAuction ? "Complete Purchase" : "View Details"}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BrowseProducts;
