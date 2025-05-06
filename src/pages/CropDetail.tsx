
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Clock, MapPin, ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData, Bid as DataBid } from '@/context/DataContext';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Navigation from '@/components/Navigation';
import BidForm from '@/components/BidForm';
import { getProductById, getProductBids } from '@/services/productService';
import { Product, Bid } from '@/services/productService';
import { format, formatDistance, differenceInSeconds, isBefore, isAfter } from 'date-fns';

const CropDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { crops, bids } = useData(); // Keep for backwards compatibility
  const { toast } = useToast();
  const { currentLocation, calculateDistance } = useLocation();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [productBids, setProductBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0, isEnded: true });
  
  // For backwards compatibility
  const [cropBids, setCropBids] = useState<DataBid[]>([]);
  const crop = crops.find(c => c.id === id);
  
  // Calculate time remaining until auction ends
  const calculateTimeRemaining = (endTime: Date | null) => {
    if (!endTime) return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
    
    const now = new Date();
    if (isBefore(endTime, now)) {
      return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
    }
    
    const totalSeconds = differenceInSeconds(endTime, now);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    return { hours, minutes, seconds, isEnded: false };
  };
  
  // Fetch product and bids
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      
      setLoading(true);
      
      try {
        // First try to get from Supabase
        const productData = await getProductById(id);
        
        if (productData) {
          setProduct(productData);
          
          // Set initial time remaining
          if (productData.bid_end) {
            const bidEndDate = new Date(productData.bid_end);
            setTimeRemaining(calculateTimeRemaining(bidEndDate));
          }
          
          // Fetch bids for this product (if available)
          const bidsData = await getProductBids(id);
          setProductBids(bidsData);
        } else if (crop) {
          // Fall back to context data if available
          const filteredBids = bids.filter(bid => bid.cropId === id);
          setCropBids(filteredBids.sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          ));
        } else {
          // No data found
          toast({
            title: "Product Not Found",
            description: "The product you're looking for doesn't exist or has been removed.",
            variant: "destructive"
          });
          navigate('/farmer/my-products');
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast({
          title: "Error",
          description: "Failed to load product details",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductData();
    
    // Update time remaining every second
    const interval = setInterval(() => {
      if (product?.bid_end) {
        const bidEndDate = new Date(product.bid_end);
        setTimeRemaining(calculateTimeRemaining(bidEndDate));
      } else if (crop?.endTime) {
        setTimeRemaining(calculateTimeRemaining(new Date(crop.endTime)));
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [id, toast, navigate, crop, bids, product?.bid_end]);
  
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <p>Loading product details...</p>
        </main>
      </div>
    );
  }
  
  if (!product && !crop) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/farmer/my-products">
              <Button>Back to My Products</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  // Get auction status
  const getAuctionStatus = () => {
    const now = new Date();
    
    if (product?.bid_start && product?.bid_end) {
      const bidStart = new Date(product.bid_start);
      const bidEnd = new Date(product.bid_end);
      
      if (isBefore(now, bidStart)) {
        return `Auction starts ${formatDistance(bidStart, now, { addSuffix: true })}`;
      } else if (isAfter(now, bidEnd)) {
        return "Auction has ended";
      } else {
        return "Auction is active";
      }
    }
    
    return "No auction scheduled";
  };
  
  // Use either Supabase product or context crop
  const productTitle = product?.name || crop?.title || '';
  const productDescription = product?.description || crop?.description || '';
  const productImage = product?.image_url || crop?.image || '/placeholder.svg';
  const productPrice = product?.price || crop?.basePrice || 0;
  const productQuantity = product?.quantity || crop?.quantity || 0;
  const productUnit = product?.unit || crop?.unit || 'kg';
  
  const distance = currentLocation && crop?.location ? 
    calculateDistance(
      currentLocation.latitude, 
      currentLocation.longitude, 
      crop.location.latitude, 
      crop.location.longitude
    ).toFixed(1) : 
    null;
    
  const formattedTime = `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  const auctionStatus = getAuctionStatus();
  
  // Check if current user is the farmer who posted this product
  const isOwner = user?.id === (product?.farmer_id || crop?.farmerId);
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/farmer/my-products" className="flex items-center text-farmgreen-600 hover:text-farmgreen-700">
              <ArrowLeft size={16} className="mr-1" />
              Back to My Products
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Product details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Product image */}
                <div className="h-64 bg-gray-100 relative">
                  <img 
                    src={productImage} 
                    alt={productTitle} 
                    className="w-full h-full object-cover"
                  />
                  {timeRemaining.isEnded ? (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Auction Ended
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-farmgreen-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Active Auction
                    </div>
                  )}
                  
                  {isOwner && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Your Listing
                    </div>
                  )}
                </div>
                
                {/* Product info */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{productTitle}</h1>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl font-semibold">₹{productPrice}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">by {profile?.name || 'You'}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    {distance && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-1" />
                        <span>{distance ? `${distance} km away` : 'Distance unknown'}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-1" />
                      <span>
                        {timeRemaining.isEnded 
                          ? auctionStatus
                          : `Ends in ${formattedTime}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{productDescription}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Quantity Available</p>
                      <p className="text-lg font-semibold">{productQuantity} {productUnit}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Price</p>
                      <p className="text-xl font-bold text-farmgreen-600">₹{productPrice}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs for bids history */}
              <div className="mt-8">
                <Tabs defaultValue="bids">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bids">Bid History</TabsTrigger>
                    <TabsTrigger value="details">Product Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bids">
                    <Card className="p-6">
                      {/* Show bids from either source */}
                      {(productBids.length > 0 || cropBids.length > 0) ? (
                        <div className="space-y-4">
                          {productBids.map((bid) => (
                            <div 
                              key={bid.id} 
                              className="flex justify-between items-center p-3 border-b last:border-0"
                            >
                              <div className="flex items-center">
                                <User size={16} className="text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium">{bid.bidder_name}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(bid.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-farmgreen-600">₹{bid.amount}</p>
                              </div>
                            </div>
                          ))}
                          {cropBids.map((bid) => (
                            <div 
                              key={bid.id} 
                              className="flex justify-between items-center p-3 border-b last:border-0"
                            >
                              <div className="flex items-center">
                                <User size={16} className="text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium">{bid.bidderName}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(bid.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-farmgreen-600">₹{bid.amount}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No bids have been placed yet.
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="details">
                    <Card className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Category</h3>
                          <p>{product?.category || 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Listed On</h3>
                          <p>{product?.created_at ? new Date(product.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Status</h3>
                          <p>{product?.available ? 'Available' : 'Not Available'}</p>
                        </div>
                        {product?.bid_start && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Bid Start Time</h3>
                            <p>{new Date(product.bid_start).toLocaleString()}</p>
                          </div>
                        )}
                        {product?.bid_end && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Bid End Time</h3>
                            <p>{new Date(product.bid_end).toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Right column - Actions */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                <h3 className="font-semibold text-lg mb-4">Product Status</h3>
                
                <div className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Current Status</p>
                    <p className="font-semibold">
                      {auctionStatus}
                    </p>
                  </div>
                  
                  {!timeRemaining.isEnded && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Time Remaining</p>
                      <p className="font-semibold">{formattedTime}</p>
                    </div>
                  )}
                  
                  {(productBids.length > 0 || cropBids.length > 0) && (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total Bids</p>
                      <p className="font-semibold">{productBids.length || cropBids.length}</p>
                    </div>
                  )}
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-500">Listed Price</p>
                    <p className="text-xl font-bold text-farmgreen-600">
                      ₹{productPrice}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => navigate(`/farmer/edit-product/${id}`)}
                    >
                      Edit Product
                    </Button>
                    <Button 
                      variant="default" 
                      className="w-full"
                      onClick={() => navigate('/farmer/my-products')}
                    >
                      Back to Products
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CropDetail;
