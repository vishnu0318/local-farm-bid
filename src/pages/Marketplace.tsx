
import { useState, useEffect } from 'react';
import { MapPin, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useToast } from '@/hooks/use-toast';
import Navigation from '@/components/Navigation';
import CropCard from '@/components/CropCard';
import { useData, Crop } from '@/context/DataContext';
import { useLocation } from '@/context/LocationContext';

const Marketplace = () => {
  const { crops } = useData();
  const { currentLocation, requestLocationPermission } = useLocation();
  const { toast } = useToast();
  
  const [filteredCrops, setFilteredCrops] = useState<Crop[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [maxDistance, setMaxDistance] = useState([50]); // in km
  const [showFilters, setShowFilters] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter crops based on search query, distance, etc.
  useEffect(() => {
    setIsLoading(true);
    
    // Simulate API call delay
    setTimeout(() => {
      let results = [...crops];
      
      // Filter by search query
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        results = results.filter(crop => 
          crop.title.toLowerCase().includes(query) || 
          crop.description.toLowerCase().includes(query) ||
          crop.farmerName.toLowerCase().includes(query)
        );
      }
      
      // Filter by distance if we have location
      if (currentLocation) {
        const { calculateDistance } = useLocation();
        results = results.filter(crop => {
          const distance = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            crop.location.latitude,
            crop.location.longitude
          );
          return distance <= maxDistance[0];
        });
      }
      
      // Sort by distance if we have location
      if (currentLocation) {
        const { calculateDistance } = useLocation();
        results.sort((a, b) => {
          const distanceA = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            a.location.latitude,
            a.location.longitude
          );
          const distanceB = calculateDistance(
            currentLocation.latitude,
            currentLocation.longitude,
            b.location.latitude,
            b.location.longitude
          );
          return distanceA - distanceB;
        });
      }
      
      setFilteredCrops(results);
      setIsLoading(false);
    }, 500);
  }, [crops, searchQuery, maxDistance, currentLocation]);
  
  const handleLocationRequest = async () => {
    try {
      await requestLocationPermission();
      toast({
        title: "Location access granted",
        description: "We can now show you nearby crops.",
      });
    } catch (error) {
      toast({
        title: "Location access denied",
        description: "Please enable location services to see nearby crops.",
        variant: "destructive",
      });
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
              {isLoading ? "Loading..." : `${filteredCrops.length} crops available`}
            </p>
          </div>
          
          {/* Crops grid */}
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-gray-100 animate-pulse rounded-lg h-80"></div>
              ))}
            </div>
          ) : filteredCrops.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCrops.map((crop) => (
                <CropCard key={crop.id} crop={crop} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-1">No crops found</h3>
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
