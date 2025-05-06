
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import { useLocation } from '@/context/LocationContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { format, formatDistance } from 'date-fns';

interface Product {
  id: string;
  name: string;
  category: string;
  farmer_id: string;
  quantity: number;
  unit: string;
  price: number;
  image_url: string | null;
  bid_start: string | null;
  bid_end: string | null;
  farmer_name?: string;
  distance?: number;
  highest_bid?: number;
}

const Marketplace = () => {
  const navigate = useNavigate();
  const { currentLocation, requestLocationPermission, calculateDistance } = useLocation();
  const { toast } = useToast();
  
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState([50]); // in km
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch products from Supabase
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      
      try {
        // Fetch products that are available
        const { data: productsData, error } = await supabase
          .from('products')
          .select(`
            *,
            profiles:farmer_id(name)
          `)
          .eq('available', true);
        
        if (error) throw error;

        if (productsData) {
          // Process products data
          const productsWithMetadata = productsData.map((product: any) => ({
            ...product,
            farmer_name: product.profiles?.name || 'Unknown Farmer',
            highest_bid: 0
          }));
          
          // Calculate distance if location is available
          if (currentLocation) {
            const productsWithDistance = await Promise.all(productsWithMetadata.map(async (product: Product) => {
              // Mock coordinates for demonstration - in a real app, you'd need to geocode or store lat/lng
              const mockLat = parseFloat(`18.${product.id.charCodeAt(0) % 10}${product.id.charCodeAt(1) % 10}`);
              const mockLng = parseFloat(`73.${product.id.charCodeAt(2) % 10}${product.id.charCodeAt(3) % 10}`);
              
              const distance = calculateDistance(
                currentLocation.latitude,
                currentLocation.longitude,
                mockLat,
                mockLng
              );
              
              return { ...product, distance };
            }));
            
            setProducts(productsWithDistance);
          } else {
            setProducts(productsWithMetadata);
          }
        }
      } catch (error) {
        console.error('Error fetching products:', error);
        toast({
          title: "Error loading products",
          description: "Failed to load products. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentLocation, calculateDistance, toast]);
  
  // Filter products based on search query, distance, etc.
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let results = [...products];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        results = results.filter(product => 
          product.name.toLowerCase().includes(query) || 
          product.category.toLowerCase().includes(query) ||
          (product.farmer_name && product.farmer_name.toLowerCase().includes(query))
        );
      }
      
      // Filter by distance if we have location
      if (currentLocation) {
        results = results.filter(product => !product.distance || product.distance <= maxDistance[0]);
        
        // Sort by distance
        results.sort((a, b) => (a.distance || 999) - (b.distance || 999));
      }
      
      setFilteredProducts(results);
      setIsLoading(false);
    }, 300);
  }, [products, searchQuery, maxDistance, currentLocation]);
  
  const handleLocationRequest = async () => {
    try {
      await requestLocationPermission();
      toast({
        title: "Location access granted",
        description: "We can now show you nearby products.",
      });
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enable location services to see nearby products.",
        variant: "destructive",
      });
    }
  };
  
  // Get time remaining until auction ends
  const getAuctionStatus = (product: Product) => {
    if (!product.bid_start || !product.bid_end) return "No auction";
    
    const now = new Date();
    const bidStart = new Date(product.bid_start);
    const bidEnd = new Date(product.bid_end);
    
    if (now < bidStart) {
      return `Starts ${formatDistance(bidStart, now, { addSuffix: true })}`;
    } else if (now > bidEnd) {
      return "Ended";
    } else {
      return `Ends ${formatDistance(bidEnd, now, { addSuffix: true })}`;
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Local Crop Marketplace</h1>
            <p className="text-lg text-gray-600">
              Browse and bid on fresh produce from farmers in your area.
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
            {/* Search bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                type="search"
                placeholder="Search for crops, farmers..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            {/* Location button */}
            <div className="flex-none">
              <Button 
                variant="outline" 
                onClick={handleLocationRequest}
                className="flex items-center gap-2"
              >
                <MapPin size={18} />
                {currentLocation ? "Update Location" : "Enable Location"}
              </Button>
            </div>
            
            {/* Filters toggle */}
            <div className="flex-none">
              <Button 
                variant="secondary"
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2"
              >
                <Filter size={18} />
                Filters
              </Button>
            </div>
          </div>
          
          {/* Filters section */}
          {showFilters && (
            <div className="bg-gray-50 p-4 rounded-lg mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-semibold mb-2">Maximum Distance: {maxDistance[0]} km</h3>
                  <Slider
                    value={maxDistance}
                    onValueChange={setMaxDistance}
                    min={5}
                    max={100}
                    step={5}
                    disabled={!currentLocation}
                  />
                  {!currentLocation && (
                    <p className="text-xs text-amber-600 mt-1">
                      Enable location to use distance filter
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* Results count */}
          <div className="mb-4 flex justify-between items-center">
            <p className="text-sm text-gray-500">
              {isLoading ? "Loading..." : `${filteredProducts.length} products available`}
            </p>
          </div>
          
          {/* Products grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-80"></div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => {
                const auctionStatus = getAuctionStatus(product);
                const isActive = auctionStatus.includes("Ends");
                
                return (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => navigate(`/buyer/product/${product.id}`)}
                  >
                    <div className="aspect-w-16 aspect-h-9 relative">
                      <img 
                        src={product.image_url || '/placeholder.svg'} 
                        alt={product.name} 
                        className="object-cover w-full h-48"
                      />
                      <Badge className="absolute top-2 right-2">
                        {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                      </Badge>
                      
                      {product.bid_end && (
                        <Badge 
                          className={`absolute bottom-2 right-2 ${
                            isActive ? 'bg-green-600' : 
                            auctionStatus === "Ended" ? 'bg-red-600' : 
                            'bg-blue-600'
                          }`}
                        >
                          {auctionStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                      <div className="flex justify-between items-center mb-3">
                        <p className="text-sm text-gray-600">
                          {product.quantity} {product.unit} available
                        </p>
                        {product.distance && (
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin size={14} className="mr-1" />
                            {product.distance.toFixed(1)} km
                          </p>
                        )}
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="font-medium text-gray-900">
                          ₹{product.price}/{product.unit}
                        </p>
                        <Button size="sm" className="text-xs">View Details</Button>
                      </div>
                    </div>
                  </div>
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
      </main>
    </div>
  );
};

export default Marketplace;
