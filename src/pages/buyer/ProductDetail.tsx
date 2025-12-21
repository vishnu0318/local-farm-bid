import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import BidForm from '@/components/buyer/BidForm';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Loader2, MapPin, IndianRupee, Timer, CheckCircle } from 'lucide-react';
import { formatDistance, format, isAfter, isBefore } from 'date-fns';
import { Product, FarmerProfile, Bid } from '@/types/marketplace';
import { getProductBids, subscribeToBidChanges } from '@/services/bidService';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('details');
  const [highestBid, setHighestBid] = useState<number>(0);
  const [isUserHighestBidder, setIsUserHighestBidder] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<string>('');
  const [auctionEnded, setAuctionEnded] = useState(false);
  const [productPaid, setProductPaid] = useState(false);
  const [userHasPaid, setUserHasPaid] = useState(false);

  // Check if user has paid for this product
  const checkUserPaymentStatus = async () => {
    if (!id || !user?.id) return;
    
    try {
      const { data: userSale, error } = await supabase
        .from('sales')
        .select('payment_status, total_amount')
        .eq('product_id', id)
        .eq('buyer_id', user.id)
        .eq('payment_status', 'completed')
        .maybeSingle();
        
      if (!error && userSale) {
        setUserHasPaid(true);
        console.log('User has already paid for this product');
      }
    } catch (error) {
      console.log('User has not paid for this product yet');
    }
  };

  // Fetch product details and bids
  useEffect(() => {
    const fetchProductDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      
      try {
        // Fetch product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();
        
        if (productError) throw productError;
        
        setProduct(productData);
        // Check if product is paid based on sales table
        const { data: salesData } = await supabase
          .from('sales')
          .select('payment_status')
          .eq('product_id', id)
          .eq('payment_status', 'completed')
          .maybeSingle();
        setProductPaid(!!salesData);
        
        // Fetch farmer details separately
        if (productData?.farmer_id) {
          const { data: farmerData, error: farmerError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', productData.farmer_id)
            .single();
            
          if (!farmerError && farmerData) {
            setFarmer(farmerData);
          }
        }
        
        // Check auction status
        if (productData?.bid_end) {
          const endTime = new Date(productData.bid_end);
          const now = new Date();
          setAuctionEnded(isAfter(now, endTime));
          updateTimeRemaining(endTime);
        }
        
        // Fetch bids
        const productBids = await getProductBids(id);
        setBids(productBids);
        
        // Set highest bid and check if user is highest bidder
        if (productBids.length > 0) {
          const maxBid = productBids[0]; // Assuming bids are sorted by amount desc
          setHighestBid(maxBid.amount);
          
          if (user && maxBid.buyer_id === user.id) {
            setIsUserHighestBidder(true);
          }
        } else {
          setHighestBid(productData?.price || 0);
        }
        
        // Check user payment status
        await checkUserPaymentStatus();
      } catch (error) {
        console.error('Error fetching product details:', error);
        toast.error('Failed to load product details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProductDetails();
    
    // Set up timer to update remaining time
    const timer = setInterval(() => {
      if (product?.bid_end) {
        const endTime = new Date(product.bid_end);
        updateTimeRemaining(endTime);
        
        const now = new Date();
        if (isAfter(now, endTime)) {
          setAuctionEnded(true);
          clearInterval(timer);
        }
      }
    }, 1000);
    
    // Set up real-time subscription to bids and payments
    let channel: any;
    if (id) {
      channel = subscribeToBidChanges(id, async () => {
        console.log("Received new bid for product", id);
        const refreshedBids = await getProductBids(id);
        setBids(refreshedBids);
        
        // Update highest bid status
        if (refreshedBids.length > 0) {
          const maxBid = refreshedBids[0]; // Assuming bids are sorted by amount desc
          setHighestBid(maxBid.amount);
          
          if (user && maxBid.buyer_id === user.id) {
            setIsUserHighestBidder(true);
          } else {
            setIsUserHighestBidder(false);
          }
        }
      });

      // Also listen to sales updates to refresh payment status
      const salesChannel = supabase
        .channel('product-sales')
        .on('postgres_changes', 
          { 
            event: '*', 
            schema: 'public', 
            table: 'sales',
            filter: `product_id=eq.${id}`
          }, 
          async (payload) => {
            console.log('Sales update received:', payload);
            await checkUserPaymentStatus();
            
            // Also refresh product data to check if it's been marked as paid
            const { data: salesData } = await supabase
              .from('sales')
              .select('payment_status')
              .eq('product_id', id)
              .eq('payment_status', 'completed')
              .maybeSingle();
              
            setProductPaid(!!salesData);
          }
        )
        .subscribe();
    }
    
    return () => {
      clearInterval(timer);
      if (channel) supabase.removeChannel(channel);
    };
  }, [id, user]);
  
  // Function to handle successful bid placement
  const handleBidSuccess = async () => {
    if (!id) return;
    
    try {
      // Refresh bids
      const refreshedBids = await getProductBids(id);
      setBids(refreshedBids);
      
      // Update highest bid status
      if (refreshedBids.length > 0) {
        const maxBid = refreshedBids[0]; // Assuming bids are sorted by amount desc
        setHighestBid(maxBid.amount);
        
        if (user && maxBid.buyer_id === user.id) {
          setIsUserHighestBidder(true);
          toast.success('You are now the highest bidder!');
        } else {
          setIsUserHighestBidder(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing bids:', error);
    }
  };
  
  // Update time remaining in a readable format
  const updateTimeRemaining = (endTime: Date) => {
    const now = new Date();
    
    if (isAfter(now, endTime)) {
      setTimeRemaining('Auction ended');
      setAuctionEnded(true);
      return;
    }
    
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
    
    setTimeRemaining(timeString);
  };
  
  // Check if bidding has started
  const hasBiddingStarted = () => {
    if (!product?.bid_start) return true; // If no start time, bidding is always open
    
    const startTime = new Date(product.bid_start);
    const now = new Date();
    return isAfter(now, startTime);
  };
  
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading product details...</p>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="text-center py-16">
        <h2 className="text-2xl font-bold text-red-600 mb-4">Product Not Found</h2>
        <p className="text-gray-600 mb-6">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Button variant="outline" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </div>
    );
  }
  
  return (
    <div className="max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Product image and details */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="relative h-[300px] md:h-[400px]">
              <img
                src={product.image_url || '/placeholder.svg'}
                alt={product.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Badge className="text-sm">{product.category}</Badge>
                
                {product.bid_start && product.bid_end && (
                  <Badge variant={auctionEnded ? "destructive" : hasBiddingStarted() ? "default" : "outline"} className="text-sm">
                    {auctionEnded ? "Auction Ended" : hasBiddingStarted() ? "Auction Active" : "Auction Starting Soon"}
                  </Badge>
                )}
              </div>
              
              {product.bid_start && product.bid_end && !auctionEnded && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <Timer className="mr-2 h-5 w-5" />
                    {hasBiddingStarted() ? (
                      <span>Ends in: <strong>{timeRemaining}</strong></span>
                    ) : (
                      <span>Starts in: <strong>{formatDistance(new Date(product.bid_start), new Date(), { addSuffix: false })}</strong></span>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h1 className="text-3xl font-bold">{product.name}</h1>
                  <p className="text-gray-600">
                    {product.quantity} {product.unit} available
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="text-2xl font-bold flex items-center justify-end">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {product.price}
                    <span className="text-sm font-normal ml-1">/{product.unit}</span>
                  </p>
                </div>
              </div>

              <Tabs defaultValue="details" onValueChange={setActiveTab} className="mt-6">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="bids">Bids ({bids.length})</TabsTrigger>
                  <TabsTrigger value="shipping">Shipping</TabsTrigger>
                </TabsList>
                
                <TabsContent value="details" className="mt-4">
                  <div className="prose max-w-none">
                    <p className="text-gray-800">{product.description || "No description available."}</p>
                    
                    <div className="mt-4">
                      <h3 className="font-medium text-lg">Product Information</h3>
                      <div className="grid grid-cols-2 gap-4 mt-2">
                        <div>
                          <p className="text-sm text-gray-500">Category</p>
                          <p>{product.category}</p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">Quantity Available</p>
                          <p>{product.quantity} {product.unit}</p>
                        </div>
                        {auctionEnded && isUserHighestBidder && farmer && (
                          <>
                            <div>
                              <p className="text-sm text-gray-500">Farmer Name</p>
                              <p>{farmer.name || "Unknown"}</p>
                            </div>
                            {farmer.phone && (
                              <div>
                                <p className="text-sm text-gray-500">Contact</p>
                                <p>{farmer.phone}</p>
                              </div>
                            )}
                            {farmer.address && (
                              <div className="col-span-2">
                                <p className="text-sm text-gray-500">Location</p>
                                <p className="flex items-center">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  {farmer.address}
                                </p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="bids" className="mt-4">
                  {bids.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      {auctionEnded ? "No bids were placed for this product." : "No bids yet. Be the first to bid!"}
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex justify-between font-medium text-sm text-gray-500 px-2 py-1">
                        <span>Bidder</span>
                        <span>Amount</span>
                      </div>
                      <Separator />
                      {bids.map((bid, index) => (
                        <div key={bid.id} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <span className={`font-medium ${index === 0 ? 'text-green-600' : ''}`}>
                              {bid.buyer_id === user?.id ? 'You' : bid.bidder_name}
                            </span>
                            {index === 0 && <Badge className="ml-2 bg-green-600">Highest</Badge>}
                          </div>
                          <span className={`font-medium flex items-center ${index === 0 ? 'text-green-600' : ''}`}>
                            <IndianRupee className="h-4 w-4 mr-0.5" />
                            {bid.amount}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="shipping" className="mt-4">
                  <div className="prose max-w-none">
                    <p>Shipping information will be provided after winning the auction.</p>
                    <p className="mt-2">Available payment methods:</p>
                    <ul className="list-disc ml-5 mt-2">
                      <li>Cash on Delivery</li>
                      <li>UPI Payment</li>
                      <li>Credit/Debit Card</li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
        
        {/* Bidding section */}
        <div>
          {/* If user won the auction and has already paid, show purchase completed */}
          {auctionEnded && isUserHighestBidder && userHasPaid && (
            <Card className="p-6 border-2 border-green-500 mb-6">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-green-600 mb-4" />
                  <h3 className="text-xl font-semibold text-green-600">Purchase Completed!</h3>
                  <p className="text-gray-600">You have successfully purchased this product.</p>
                  <Badge className="mt-2 bg-green-600">Payment Completed</Badge>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Amount Paid</p>
                    <p className="text-xl font-bold flex items-center text-green-600">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {highestBid}
                    </p>
                  </div>
                </div>

                <Separator />
                
                <div>
                  <p className="text-sm text-gray-500 mb-1">Farmer Details</p>
                  {farmer && (
                    <div className="space-y-1">
                      <p className="font-medium">{farmer.name || "Unknown"}</p>
                      {farmer.phone && <p className="text-sm">{farmer.phone}</p>}
                      {farmer.address && (
                        <p className="text-sm flex items-center">
                          <MapPin className="h-3 w-3 mr-1" />
                          {farmer.address}
                        </p>
                      )}
                    </div>
                  )}
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/buyer/order-history">View Order History</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* If user won the auction but hasn't paid yet */}
          {auctionEnded && isUserHighestBidder && !userHasPaid && !productPaid && (
            <Card className="p-6 border-2 border-yellow-500 mb-6">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 mx-auto text-yellow-500 mb-4" />
                  <h3 className="text-xl font-semibold text-yellow-600">Congratulations!</h3>
                  <p className="text-gray-600">You won this auction with the highest bid!</p>
                  <Badge className="mt-2 bg-yellow-500">Winner</Badge>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-500">Winning Bid</p>
                    <p className="text-xl font-bold flex items-center text-yellow-600">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {highestBid}
                    </p>
                  </div>
                </div>
                
                <Button className="w-full" asChild>
                  <Link to={`/buyer/payment/${id}`}>Proceed to Payment</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* If auction ended but user didn't win */}
          {auctionEnded && !isUserHighestBidder && bids.length > 0 && (
            <Card className="p-6 mb-6">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-gray-600">Auction Ended</h3>
                  <p className="text-gray-500 mt-2">This auction has ended. You did not win this time.</p>
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Winning Bid</p>
                    <p className="text-xl font-bold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {highestBid}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/buyer/browse">Browse More Products</Link>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* If auction is ongoing and user can bid */}
          {!auctionEnded && hasBiddingStarted() && user && (
            <BidForm 
              product={product} 
              currentHighestBid={highestBid} 
              onBidSuccess={handleBidSuccess} 
            />
          )}

          {/* If auction hasn't started yet */}
          {!auctionEnded && !hasBiddingStarted() && product.bid_start && (
            <Card className="p-6 mb-6">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <Timer className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-xl font-semibold">Auction Starting Soon</h3>
                  <p className="text-gray-500 mt-2">
                    Bidding opens {formatDistance(new Date(product.bid_start), new Date(), { addSuffix: true })}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* If user is not logged in */}
          {!user && (
            <Card className="p-6 mb-6">
              <CardContent className="p-0 space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-semibold">Login to Bid</h3>
                  <p className="text-gray-500 mt-2">
                    Please login or create an account to place bids.
                  </p>
                </div>
                
                <Button className="w-full" asChild>
                  <Link to="/login">Login to Bid</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;