
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Clock, IndianRupee, Loader2, MapPin, User, CalendarCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { format, formatDistance } from 'date-fns';
import BidForm from '@/components/buyer/BidForm';
import { Bid, Product, FarmerProfile } from '@/types/marketplace';

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [farmer, setFarmer] = useState<FarmerProfile | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [isWinner, setIsWinner] = useState(false);
  
  // Function to check if auction is ended
  const isAuctionEnded = () => {
    if (!product || !product.bid_end) return false;
    
    const now = new Date();
    const endTime = new Date(product.bid_end);
    return now > endTime;
  };
  
  // Function to fetch product and related data
  const fetchProductData = async () => {
    if (!id) return;
    
    setIsLoading(true);
    
    try {
      // Get product data
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select(`
          *,
          profiles:farmer_id (*)
        `)
        .eq('id', id)
        .single();
      
      if (productError) throw productError;
      
      if (productData) {
        const formattedProduct = {
          ...productData,
          farmer_name: productData.profiles?.name || 'Unknown Farmer',
        };
        
        setProduct(formattedProduct);
        
        // Only expose farmer details to the auction winner after auction ends
        const auctionEnded = productData.bid_end && new Date() > new Date(productData.bid_end);
        
        // Get bids for this product
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('product_id', id)
          .order('amount', { ascending: false });
        
        if (bidsError) throw bidsError;
        
        if (bidsData && bidsData.length > 0) {
          setBids(bidsData);
          setHighestBid(bidsData[0].amount);
          
          // Check if current user is the highest bidder
          if (user && bidsData[0].bidder_id === user.id) {
            setIsWinner(true);
            
            // If auction ended and user is winner, get farmer details
            if (auctionEnded) {
              setFarmer(productData.profiles as FarmerProfile);
            }
          }
        } else {
          // No bids yet, set starting price
          setHighestBid(productData.price);
        }
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      toast.error('Failed to load product details');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Fetch product data on mount and ID change
  useEffect(() => {
    fetchProductData();
    
    // Set up interval to refresh remaining time
    const interval = setInterval(() => {
      if (product?.bid_end) {
        // Force re-render to update time remaining
        setProduct(prevProduct => prevProduct ? {...prevProduct} : null);
      }
    }, 1000);
    
    return () => clearInterval(interval);
  }, [id]);
  
  // Calculate time remaining
  const getTimeRemaining = () => {
    if (!product || !product.bid_end) return "No deadline";
    
    const endTime = new Date(product.bid_end);
    const now = new Date();
    
    if (now >= endTime) return "Auction ended";
    
    // Calculate days, hours, minutes, seconds
    const diffMs = endTime.getTime() - now.getTime();
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
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
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold mb-2">Product Not Found</h2>
        <p className="mb-6 text-gray-500">
          The product you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/buyer/browse-products">
          <Button>Browse Products</Button>
        </Link>
      </div>
    );
  }
  
  const auctionEnded = isAuctionEnded();
  const timeRemaining = getTimeRemaining();
  
  return (
    <div>
      <div className="mb-4">
        <Link to="/buyer/browse-products">
          <Button variant="outline" size="sm">
            &larr; Back to Browse
          </Button>
        </Link>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {/* Product Image and Details */}
        <div className="md:col-span-2">
          <Card>
            <div className="relative">
              <img 
                src={product.image_url || '/placeholder.svg'} 
                alt={product.name} 
                className="w-full h-[300px] object-cover rounded-t-lg"
              />
              <Badge className="absolute top-4 right-4">
                {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
              </Badge>
            </div>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-2xl">{product.name}</CardTitle>
                  <CardDescription className="flex items-center mt-1">
                    <MapPin className="h-4 w-4 mr-1" /> {/* Approximated location for privacy */}
                    {farmer && isWinner && auctionEnded ? farmer.address : 'Location details available after winning bid'}
                  </CardDescription>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Base Price</p>
                  <p className="text-xl font-medium flex items-center">
                    <IndianRupee className="h-5 w-5 mr-0.5" />
                    {product.price}/{product.unit}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-gray-500">Quantity Available</p>
                  <p className="font-medium">{product.quantity} {product.unit}</p>
                </div>
                <div className="flex items-center bg-amber-50 px-3 py-1 rounded-full">
                  <Clock className="h-4 w-4 text-amber-500 mr-1" />
                  <p className={`text-sm ${auctionEnded ? 'text-red-500' : 'text-amber-500'}`}>
                    {timeRemaining}
                  </p>
                </div>
              </div>
              
              <div className="mb-6">
                <h3 className="font-semibold mb-2">Product Description</h3>
                <p className="text-gray-700">
                  {product.description || 'No description provided.'}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                  <CalendarCheck className="h-4 w-4 mr-1" />
                  <p className="text-sm">{product.bid_end ? `Auction ends: ${new Date(product.bid_end).toLocaleString()}` : 'No auction deadline'}</p>
                </div>
                
                <div className="bg-gray-100 px-3 py-1 rounded-full flex items-center">
                  <User className="h-4 w-4 mr-1" />
                  <p className="text-sm">
                    {isWinner && auctionEnded 
                      ? `Farmer: ${product.farmer_name}` 
                      : 'Farmer details available after winning'}
                  </p>
                </div>
              </div>
              
              {isWinner && auctionEnded && farmer && (
                <div className="mt-6 p-4 border rounded-md bg-green-50">
                  <h3 className="font-semibold text-green-700 mb-2">Congratulations! You've Won This Auction</h3>
                  <div className="space-y-2">
                    <p><strong>Farmer:</strong> {farmer.name}</p>
                    {farmer.phone && <p><strong>Contact:</strong> {farmer.phone}</p>}
                    {farmer.address && <p><strong>Address:</strong> {farmer.address}</p>}
                    <p className="text-sm text-gray-600">Please contact the farmer to arrange delivery and payment.</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        {/* Bid Section */}
        <div>
          <BidForm 
            product={product} 
            onBidSuccess={fetchProductData}
            currentHighestBid={highestBid}
            isWinner={isWinner && auctionEnded}
          />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Bid History</CardTitle>
            </CardHeader>
            <CardContent>
              {bids.length === 0 ? (
                <p className="text-center text-gray-500 py-4">No bids placed yet. Be the first!</p>
              ) : (
                <div className="space-y-3">
                  {bids.slice(0, 5).map((bid) => (
                    <div key={bid.id} className="flex justify-between border-b pb-2">
                      <div>
                        <p className="font-medium">{bid.bidder_id === user?.id ? "You" : bid.bidder_name}</p>
                        <p className="text-xs text-gray-500">{format(new Date(bid.created_at), 'MMM d, yyyy, hh:mm a')}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {bid.amount}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {bids.length > 5 && (
                    <p className="text-center text-sm text-gray-500">
                      +{bids.length - 5} more bids
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
