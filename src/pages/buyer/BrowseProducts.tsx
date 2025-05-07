
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Eye, IndianRupee, Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLocation as useLocationContext } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { Product } from '@/types/marketplace';

const BrowseProducts = () => {
  const navigate = useNavigate();
  const { currentLocation, requestLocationPermission, calculateDistance } = useLocationContext();
  const { user } = useAuth();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    maxPrice: [500],
    minBids: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      try {
        // Fetch products that are available
        const { data: productsData, error } = await supabase
          .from('products')
          .select('*')
          .eq('available', true);
        
        if (error) throw error;

        if (productsData) {
          // Process products to include additional metadata
          const productsWithMetadata = await Promise.all(productsData.map(async (product: Product) => {
            // Fetch farmer name
            const { data: farmerData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', product.farmer_id)
              .single();
            
            // Fetch bids count and highest bid
            const { data: bidsData, error: bidsError } = await supabase
              .from('bids')
              .select('amount')
              .eq('product_id', product.id)
              .order('amount', { ascending: false });
            
            const highestBid = bidsData && bidsData.length > 0 ? bidsData[0].amount : null;
            const bidsCount = bidsData ? bidsData.length : 0;
            
            // Calculate distance if we have user's location
            let distance: number | undefined = undefined;
            if (currentLocation) {
              // Fetch farmer's location from profile
              const { data: farmerProfile } = await supabase
                .from('profiles')
                .select('address')
                .eq('id', product.farmer_id)
                .single();
              
              if (farmerProfile?.address) {
                // Mock coordinates extraction - in a real app, you'd need to geocode the address
                // or store lat/lng directly in the database
                const mockLat = parseFloat(`18.${product.id.charCodeAt(0) % 10}${product.id.charCodeAt(1) % 10}`);
                const mockLng = parseFloat(`73.${product.id.charCodeAt(2) % 10}${product.id.charCodeAt(3) % 10}`);
                
                distance = calculateDistance(
                  currentLocation.latitude,
                  currentLocation.longitude,
                  mockLat,
                  mockLng
                );
              }
            }
            
            return { 
              ...product,
              farmer_name: farmerData?.name || 'Unknown Farmer',
              distance,
              highest_bid: highestBid || product.price,
              bids_count: bidsCount
            };
          }));
          
          setProducts(productsWithMetadata);
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast.error('Failed to load products. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
    
    // Set up interval to update time remaining
    const interval = setInterval(() => {
      setProducts(prevProducts => prevProducts.map(product => ({
        ...product,
        timeLeft: getTimeRemaining(product.bid_end)
      })));
    }, 1000);

    // Set up real-time subscription for product changes
    const channel = supabase
      .channel('public:products')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'products'
        }, 
        () => {
          // Refresh products when there's a change
          fetchProducts();
        }
      )
      .subscribe();

    return () => {
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [currentLocation, calculateDistance]);

  // Filter products based on search, category, price, etc.
  useEffect(() => {
    let results = [...products];
    
    // Filter by search query
    if (filters.search) {
      const query = filters.search.toLowerCase();
      results = results.filter(product => 
        product.name.toLowerCase().includes(query) || 
        product.category.toLowerCase().includes(query) ||
        (product.farmer_name && product.farmer_name.toLowerCase().includes(query))
      );
    }
    
    // Filter by category
    if (filters.category !== 'all') {
      results = results.filter(product => product.category.toLowerCase() === filters.category.toLowerCase());
    }
    
    // Filter by price
    results = results.filter(product => product.price <= filters.maxPrice[0]);
    
    // Filter by distance if location is available
    if (currentLocation) {
      results = results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
    }
    
    // Filter active auctions
    results = results.filter(product => {
      const now = new Date();
      const bidStart = product.bid_start ? new Date(product.bid_start) : null;
      const bidEnd = product.bid_end ? new Date(product.bid_end) : null;
      
      // Only show products with active auctions or auctions that haven't started yet
      return !bidEnd || now <= bidEnd;
    });
    
    setFilteredProducts(results);
  }, [products, filters, currentLocation]);

  // Get time remaining until auction ends
  const getTimeRemaining = (endTimeStr: string | null | undefined): string => {
    if (!endTimeStr) return "No deadline";
    
    const endTime = new Date(endTimeStr);
    const now = new Date();
    
    if (now >= endTime) return "Auction ended";
    
    const timeDiff = endTime.getTime() - now.getTime();
    
    // Format countdown
    const days = Math.floor(timeDiff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((timeDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    let timeString = '';
    if (days > 0) timeString += `${days}d `;
    if (hours > 0 || days > 0) timeString += `${hours}h `;
    if (minutes > 0 || hours > 0 || days > 0) timeString += `${minutes}m `;
    timeString += `${seconds}s`;
    
    return timeString;
  };

  // Handle filter changes
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

  const handleLocationRequest = async () => {
    try {
      await requestLocationPermission();
      toast.success("Location access granted");
    } catch (error) {
      toast.error("Location access denied");
    }
  };

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
                <span>₹{filters.maxPrice[0]}</span>
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
          
          <div className="mt-4">
            <Button 
              variant="outline" 
              onClick={handleLocationRequest}
              className="flex items-center gap-2"
              type="button"
            >
              {currentLocation ? "Update Location" : "Enable Location"}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* Results count */}
      <div className="mb-4 flex justify-between items-center">
        <p className="text-sm text-gray-500">
          {isLoading ? "Loading..." : `${filteredProducts.length} products available`}
        </p>
      </div>
      
      {/* Products grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-500 mb-4" />
          <p className="text-gray-500">Loading products...</p>
        </div>
      ) : filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            const now = new Date();
            const bidStart = product.bid_start ? new Date(product.bid_start) : null;
            const bidEnd = product.bid_end ? new Date(product.bid_end) : null;
            
            let auctionStatus = "No auction";
            if (bidStart && bidEnd) {
              if (now < bidStart) {
                auctionStatus = "Starts soon";
              } else if (now >= bidStart && now <= bidEnd) {
                auctionStatus = "Active";
              } else {
                auctionStatus = "Ended";
              }
            }
            
            const timeLeft = product.timeLeft || getTimeRemaining(product.bid_end);
            
            return (
              <Card key={product.id} className="overflow-hidden hover:shadow-md transition-all">
                <div className="aspect-w-16 aspect-h-9 relative">
                  <img 
                    src={product.image_url || '/placeholder.svg'} 
                    alt={product.name} 
                    className="object-cover w-full h-48 rounded-t-lg"
                  />
                  <Badge className="absolute top-2 right-2">
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </Badge>
                  
                  {bidStart && bidEnd && (
                    <Badge className={`absolute bottom-2 right-2 ${auctionStatus === 'Active' ? 'bg-green-600' : 'bg-gray-600'}`}>
                      {auctionStatus}
                    </Badge>
                  )}
                </div>
                <CardHeader>
                  <CardTitle>{product.name}</CardTitle>
                  <CardDescription>
                    {product.distance ? `${product.distance.toFixed(1)} km away` : "Distance unknown"} • {product.quantity} {product.unit} available
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
                        {product.highest_bid}/{product.unit}
                      </p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-1 text-gray-500" />
                      <p className="text-sm text-gray-500">
                        {timeLeft}
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
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <h3 className="text-lg font-medium text-gray-900 mb-1">No products found</h3>
          <p className="text-gray-500">
            Try adjusting your search or filters to see more results.
          </p>
        </div>
      )}
    </div>
  );
};

export default BrowseProducts;
