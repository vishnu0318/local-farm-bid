
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { toast } from "sonner";
import { format, formatDistance, differenceInSeconds } from 'date-fns';
import Navigation from '@/components/Navigation';
import { Clock, MapPin, User, ArrowLeft, IndianRupee } from 'lucide-react';

interface Bid {
  id: string;
  product_id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  category: string;
  description: string | null;
  price: number;
  quantity: number;
  unit: string;
  farmer_id: string;
  image_url: string | null;
  bid_start: string | null;
  bid_end: string | null;
  available: boolean;
  farmer_name?: string;
  highest_bid?: number;
  highest_bidder_id?: string;
  highest_bidder_name?: string;
  bids?: Bid[];
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentLocation, calculateDistance } = useLocation();
  
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [bidAmount, setBidAmount] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [auctionStatus, setAuctionStatus] = useState<string>('');
  const [farmerDetails, setFarmerDetails] = useState<{name: string, area: string} | null>(null);
  const [userHasWon, setUserHasWon] = useState(false);
  
  // Fetch product details and bids
  useEffect(() => {
    const fetchProductData = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Fetch product with farmer name
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            profiles:farmer_id(name, address)
          `)
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        
        if (productData) {
          const formattedProduct: Product = {
            ...productData,
            farmer_name: productData.profiles?.name || 'Unknown Farmer',
            highest_bid: 0,
            highest_bidder_id: '',
            highest_bidder_name: '',
          };
          
          setProduct(formattedProduct);
          setBidAmount(formattedProduct.price + 5);
          
          // Set farmer details (will only show to winner)
          if (productData.profiles) {
            const address = productData.profiles.address || '';
            const area = address.split(',').slice(-2, -1)[0]?.trim() || 'Unknown Location';
            
            setFarmerDetails({
              name: productData.profiles.name || 'Unknown Farmer',
              area
            });
          }
          
          // Fetch all bids for this product
          const { data: bidsData, error: bidsError } = await supabase
            .from('bids')
            .select('*')
            .eq('product_id', id)
            .order('amount', { ascending: false });
          
          if (bidsError) throw bidsError;
          
          if (bidsData && bidsData.length > 0) {
            setBids(bidsData);
            
            // Set highest bid
            const highestBid = bidsData[0];
            setProduct(prev => prev ? {
              ...prev,
              highest_bid: highestBid.amount,
              highest_bidder_id: highestBid.bidder_id,
              highest_bidder_name: highestBid.bidder_name
            } : null);
            
            // Check if current user won the auction
            const now = new Date();
            const bidEnd = formattedProduct.bid_end ? new Date(formattedProduct.bid_end) : null;
            const isEnded = bidEnd && now > bidEnd;
            const isWinner = user && highestBid.bidder_id === user.id;
            
            setUserHasWon(isEnded && isWinner);
            
            // Set minimum bid amount
            if (highestBid) {
              setBidAmount(highestBid.amount + 5);
            }
          }
          
          // Calculate distance if location is available
          if (currentLocation && productData.profiles?.address) {
            // Mock coordinates extraction - in a real app, you'd need to geocode the address
            const mockLat = parseFloat(`18.${productData.id.charCodeAt(0) % 10}${productData.id.charCodeAt(1) % 10}`);
            const mockLng = parseFloat(`73.${productData.id.charCodeAt(2) % 10}${productData.id.charCodeAt(3) % 10}`);
            
            const calculatedDistance = calculateDistance(
              currentLocation.latitude,
              currentLocation.longitude,
              mockLat,
              mockLng
            );
            
            setDistance(calculatedDistance);
          }
        }
      } catch (error) {
        console.error('Error fetching product:', error);
        toast.error('Failed to load product details.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductData();
    
    // Update time remaining every second
    const interval = setInterval(() => {
      if (product?.bid_end) {
        updateAuctionStatus(product.bid_end, product.bid_start);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [id, user, currentLocation, calculateDistance]);
  
  // Update auction status on product change
  useEffect(() => {
    if (product) {
      updateAuctionStatus(product.bid_end, product.bid_start);
    }
  }, [product]);
  
  // Update auction status and time remaining
  const updateAuctionStatus = (endTimeStr: string | null, startTimeStr: string | null) => {
    if (!endTimeStr) {
      setTimeRemaining('No deadline set');
      setAuctionStatus('No auction scheduled');
      return;
    }
    
    const now = new Date();
    const endTime = new Date(endTimeStr);
    const startTime = startTimeStr ? new Date(startTimeStr) : null;
    
    if (now >= endTime) {
      setTimeRemaining('Auction ended');
      setAuctionStatus('Ended');
      return;
    }
    
    if (startTime && now < startTime) {
      setTimeRemaining(`Starts ${formatDistance(startTime, now, { addSuffix: true })}`);
      setAuctionStatus('Scheduled');
      return;
    }
    
    const totalSeconds = differenceInSeconds(endTime, now);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    
    setTimeRemaining(`${hours}h ${minutes}m ${seconds}s`);
    setAuctionStatus('Active');
  };
  
  // Place bid
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please log in to place a bid');
      return;
    }
    
    if (!product) return;
    
    // Check if auction is active
    const now = new Date();
    const bidStart = product.bid_start ? new Date(product.bid_start) : null;
    const bidEnd = product.bid_end ? new Date(product.bid_end) : null;
    
    if (bidStart && now < bidStart) {
      toast.error('This auction has not started yet');
      return;
    }
    
    if (bidEnd && now > bidEnd) {
      toast.error('This auction has ended');
      return;
    }
    
    // Check if bid is higher than current highest or base price
    const currentHighest = product.highest_bid || product.price;
    if (bidAmount <= currentHighest) {
      toast.error(`Your bid must be higher than the current highest bid (₹${currentHighest})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Insert bid into Supabase
      const { data: bidData, error: bidError } = await supabase
        .from('bids')
        .insert([
          {
            product_id: product.id,
            bidder_id: user.id,
            bidder_name: user.name || user.email?.split('@')[0] || 'Anonymous',
            amount: bidAmount,
          }
        ])
        .select()
        .single();
      
      if (bidError) throw bidError;
      
      // Update local state
      setBids(prevBids => [bidData, ...prevBids]);
      setProduct(prev => prev ? {
        ...prev,
        highest_bid: bidAmount,
        highest_bidder_id: user.id,
        highest_bidder_name: user.name || user.email?.split('@')[0] || 'Anonymous'
      } : null);
      
      // Increase bid amount for next bid
      setBidAmount(bidAmount + 5);
      
      toast.success('Your bid has been placed successfully!');
    } catch (error) {
      console.error('Error placing bid:', error);
      toast.error('Failed to place bid. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 flex justify-center items-center">
          <p>Loading product details...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 py-6 flex-1 flex justify-center items-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Product Not Found</h2>
            <p className="text-gray-600 mb-4">The product you're looking for doesn't exist or has been removed.</p>
            <Link to="/buyer/browse-products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const isAuctionActive = auctionStatus === 'Active';
  const isAuctionEnded = auctionStatus === 'Ended';
  const isUserHighestBidder = user && product.highest_bidder_id === user.id;

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/buyer/browse-products" className="flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft size={16} className="mr-1" />
              Back to Browse Products
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Product details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Product image */}
                <div className="h-64 bg-gray-100 relative">
                  <img 
                    src={product.image_url || '/placeholder.svg'} 
                    alt={product.name} 
                    className="w-full h-full object-cover"
                  />
                  <Badge 
                    className={`absolute top-4 right-4 ${
                      isAuctionActive ? 'bg-green-600' : 
                      isAuctionEnded ? 'bg-red-600' : 'bg-gray-600'
                    }`}
                  >
                    {auctionStatus}
                  </Badge>
                </div>
                
                {/* Product info */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">{product.name}</h1>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl font-semibold text-gray-900">₹{product.price}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    {distance !== null && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin size={16} className="mr-1" />
                        <span>{distance.toFixed(1)} km away</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-1" />
                      <span>{timeRemaining}</span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{product.description || "No description available."}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Quantity Available</p>
                      <p className="text-lg font-semibold">{product.quantity} {product.unit}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Highest Bid</p>
                      <p className="text-xl font-bold text-green-600">
                        ₹{product.highest_bid || product.price}
                      </p>
                    </div>
                  </div>
                  
                  {userHasWon && farmerDetails && (
                    <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h3 className="text-lg font-semibold text-green-800 mb-2">
                        Congratulations! You won this auction
                      </h3>
                      <p className="mb-3 text-green-700">
                        You can contact the farmer to arrange delivery and payment
                      </p>
                      <div className="space-y-2">
                        <div className="flex">
                          <span className="font-medium w-24 text-gray-600">Farmer:</span>
                          <span>{farmerDetails.name}</span>
                        </div>
                        <div className="flex">
                          <span className="font-medium w-24 text-gray-600">Area:</span>
                          <span>{farmerDetails.area}</span>
                        </div>
                      </div>
                    </div>
                  )}
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
                      {bids.length > 0 ? (
                        <div className="space-y-4">
                          {bids.map((bid) => (
                            <div 
                              key={bid.id} 
                              className={`flex justify-between items-center p-3 border-b last:border-0 ${
                                user && bid.bidder_id === user.id ? 'bg-green-50' : ''
                              }`}
                            >
                              <div className="flex items-center">
                                <User size={16} className="text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium">
                                    {user && bid.bidder_id === user.id 
                                      ? 'You' 
                                      : bid.bidder_name || 'Anonymous'}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(bid.created_at).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-green-600">₹{bid.amount}</p>
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
                          <p>{product.category}</p>
                        </div>
                        {product.bid_start && (
                          <div>
                            <h3 className="text-sm font-medium text-gray-500">Bid Start Time</h3>
                            <p>{new Date(product.bid_start).toLocaleString()}</p>
                          </div>
                        )}
                        {product.bid_end && (
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
            
            {/* Right column - Bidding */}
            <div className="lg:col-span-1">
              <Card className="p-6">
                {!user ? (
                  <div className="text-center">
                    <h3 className="font-semibold text-lg mb-2">Login Required</h3>
                    <p className="text-gray-600 mb-4">
                      Please log in as a buyer to place bids on products.
                    </p>
                    <Link to="/login">
                      <Button className="w-full">
                        Login to Bid
                      </Button>
                    </Link>
                  </div>
                ) : isAuctionEnded ? (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Auction Ended</h3>
                    <p className="text-gray-600 mb-4">
                      This auction has ended and is no longer accepting bids.
                    </p>
                    
                    {isUserHighestBidder ? (
                      <div>
                        <div className="bg-green-50 p-4 rounded-lg mb-4">
                          <p className="font-semibold text-green-800">Congratulations!</p>
                          <p className="text-green-700">You won this auction with the highest bid.</p>
                        </div>
                        
                        {userHasWon && (
                          <div className="mt-4">
                            <h3 className="font-medium text-lg mb-2">Payment Options</h3>
                            <div className="space-y-2">
                              <Button className="w-full">Cash on Delivery</Button>
                              <Button className="w-full">UPI Payment</Button>
                              <Button className="w-full">Card Payment</Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link to="/buyer/browse-products">
                        <Button variant="outline" className="w-full">
                          Browse More Products
                        </Button>
                      </Link>
                    )}
                  </div>
                ) : !isAuctionActive ? (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Auction Not Started</h3>
                    <p className="text-gray-600 mb-4">
                      This auction has not started yet. Check back later to place your bid.
                    </p>
                    <p className="text-sm font-medium">
                      {timeRemaining}
                    </p>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-semibold text-lg mb-2">Place Your Bid</h3>
                    
                    <div className="mb-4">
                      <p className="text-sm text-gray-600">Current Highest Bid</p>
                      <div className="flex items-center">
                        <IndianRupee className="h-4 w-4 mr-0.5 text-green-600" />
                        <p className="text-xl font-bold text-green-600">
                          {product.highest_bid || product.price}
                        </p>
                      </div>
                      {product.highest_bidder_id && (
                        <p className="text-sm text-gray-500">
                          by {
                            user && product.highest_bidder_id === user.id ? 
                            'You' : product.highest_bidder_name || 'Anonymous'
                          }
                        </p>
                      )}
                    </div>
                    
                    <form onSubmit={handleBidSubmit}>
                      <div className="mb-4">
                        <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
                          Your Bid Amount (₹)
                        </label>
                        <Input
                          id="bidAmount"
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(Number(e.target.value))}
                          min={(product.highest_bid || product.price) + 1}
                          step={1}
                          required
                          className="w-full"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Minimum bid: ₹{(product.highest_bid || product.price) + 1}
                        </p>
                      </div>
                      
                      <Button 
                        type="submit" 
                        className="w-full bg-green-600 hover:bg-green-700" 
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Processing...' : 'Place Bid'}
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
              
              <div className="mt-4">
                <Link to="/buyer/my-bids">
                  <Button variant="outline" className="w-full">
                    View My Bids
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProductDetail;
