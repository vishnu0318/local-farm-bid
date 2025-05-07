
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye, IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { format, formatDistance } from 'date-fns';
import { Bid, Product } from '@/types/marketplace';

const MyBids = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchMyBids = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      
      try {
        // First get all user bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*')
          .eq('bidder_id', user.id)
          .order('created_at', { ascending: false });
        
        if (bidsError) throw bidsError;
        
        if (bidsData) {
          // Get product details for each bid
          const enrichedBids = await Promise.all(bidsData.map(async (bid) => {
            // Get product information for this bid
            const { data: productData, error: productError } = await supabase
              .from('products')
              .select('*')
              .eq('id', bid.product_id)
              .single();
            
            if (productError) {
              console.error('Error fetching product:', productError);
              return null;
            }
            
            // Get farmer information separately
            const { data: farmerData } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', productData.farmer_id)
              .single();
              
            // Get highest bid for this product
            const { data: highestBidData, error: highestBidError } = await supabase
              .from('bids')
              .select('bidder_id, amount')
              .eq('product_id', bid.product_id)
              .order('amount', { ascending: false })
              .limit(1)
              .single();
            
            const enrichedBid: Bid = {
              ...bid,
              product: {
                ...productData,
                farmer_name: farmerData?.name || 'Unknown Farmer',
                highest_bid: highestBidData?.amount || bid.amount,
                highest_bidder_id: highestBidData?.bidder_id || null
              }
            };
            
            return enrichedBid;
          }));
          
          // Filter out null values (failed fetches)
          setBids(enrichedBids.filter(Boolean) as Bid[]);
        }
      } catch (error) {
        console.error('Error fetching bids:', error);
        toast.error('Failed to load your bids');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMyBids();
    
    // Set up interval to refresh bids status
    const intervalId = setInterval(fetchMyBids, 60000); // Refresh every minute
    
    return () => clearInterval(intervalId);
  }, [user]);
  
  if (!user) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">My Bids</h1>
        <Card className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Please Log In</h2>
          <p className="mb-6 text-gray-600">
            You need to be logged in to view your bids
          </p>
          <Link to="/login">
            <Button>Log In</Button>
          </Link>
        </Card>
      </div>
    );
  }
  
  // Determine bid status
  const getBidStatus = (bid: Bid) => {
    const now = new Date();
    const bidEnd = bid.product?.bid_end ? new Date(bid.product.bid_end) : null;
    const isEnded = bidEnd && now > bidEnd;
    
    if (isEnded) {
      // Auction has ended
      if (bid.product?.highest_bidder_id === user.id) {
        return { status: 'won', label: 'Won' };
      } else {
        return { status: 'lost', label: 'Lost' };
      }
    } else {
      // Auction is still active
      if (bid.product?.highest_bidder_id === user.id) {
        return { status: 'winning', label: 'Winning' };
      } else {
        return { status: 'outbid', label: 'Outbid' };
      }
    }
  };
  
  // Calculate time remaining
  const getTimeRemaining = (endTimeStr: string | null | undefined) => {
    if (!endTimeStr) return "No deadline";
    
    const endTime = new Date(endTimeStr);
    const now = new Date();
    
    if (now >= endTime) return "Ended";
    
    return formatDistance(endTime, now, { addSuffix: false }) + " left";
  };
  
  // Filter bids based on active tab
  const getFilteredBids = () => {
    const activeBids = bids.filter(bid => {
      const now = new Date();
      const bidEnd = bid.product?.bid_end ? new Date(bid.product.bid_end) : null;
      return !bidEnd || now <= bidEnd;
    });
    
    const completedBids = bids.filter(bid => {
      const now = new Date();
      const bidEnd = bid.product?.bid_end ? new Date(bid.product.bid_end) : null;
      return bidEnd && now > bidEnd;
    });
    
    const wonBids = completedBids.filter(bid => 
      getBidStatus(bid).status === 'won'
    );
    
    const lostBids = completedBids.filter(bid => 
      getBidStatus(bid).status === 'lost'
    );
    
    switch (activeTab) {
      case 'active': return activeBids;
      case 'won': return wonBids;
      case 'lost': return lostBids;
      default: return activeBids;
    }
  };
  
  const filteredBids = getFilteredBids();

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Bids</h1>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="active">Active Bids</TabsTrigger>
          <TabsTrigger value="won">Won Auctions</TabsTrigger>
          <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
            <p className="text-gray-500">Loading your bids...</p>
          </div>
        ) : (
          <TabsContent value={activeTab}>
            {filteredBids.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <p className="text-center text-gray-500 mb-4">
                    {activeTab === 'active' ? "You don't have any active bids" :
                     activeTab === 'won' ? "You haven't won any auctions yet" :
                     "You haven't lost any auctions yet"}
                  </p>
                  {activeTab === 'active' && (
                    <Link to="/buyer/browse-products">
                      <Button>Browse Products</Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBids.map((bid) => {
                  const bidStatus = getBidStatus(bid);
                  const timeLeft = getTimeRemaining(bid.product?.bid_end);
                  const isActive = activeTab === 'active';
                  const isWon = activeTab === 'won';
                  
                  return (
                    <Card key={bid.id}>
                      <div className="aspect-w-16 aspect-h-9 relative">
                        <img 
                          src={bid.product?.image_url || '/placeholder.svg'} 
                          alt={bid.product?.name} 
                          className="object-cover w-full h-48 rounded-t-lg"
                        />
                        <Badge 
                          className={`absolute top-2 right-2 ${
                            bidStatus.status === 'winning' ? 'bg-green-600' : 
                            bidStatus.status === 'won' ? 'bg-green-600' :
                            bidStatus.status === 'lost' ? 'bg-red-600' :
                            'bg-amber-600'
                          }`}
                        >
                          {bidStatus.label}
                        </Badge>
                      </div>
                      <CardHeader>
                        <CardTitle>{bid.product?.name}</CardTitle>
                        <CardDescription>
                          {isWon ? `By ${bid.product?.farmer_name}` : 
                           isActive ? `${timeLeft}` : 
                           `Bid placed on ${format(new Date(bid.created_at), 'MMM d, yyyy')}`}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="text-sm text-gray-500">Your Bid</p>
                            <p className="text-lg font-medium flex items-center">
                              <IndianRupee className="h-4 w-4 mr-0.5" />
                              {bid.amount}
                            </p>
                          </div>
                          {(isActive || activeTab === 'lost') && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Highest Bid</p>
                              <p className={`text-lg font-medium flex items-center justify-end ${
                                bidStatus.status === 'winning' || bidStatus.status === 'won' ? 
                                'text-green-600' : 'text-red-500'
                              }`}>
                                <IndianRupee className="h-4 w-4 mr-0.5" />
                                {bid.product?.highest_bid || bid.amount}
                              </p>
                            </div>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <Link to={`/buyer/product/${bid.product_id}`}>
                            <Button className="flex items-center gap-2" variant="outline">
                              <Eye className="h-4 w-4" />
                              <span>View Product</span>
                            </Button>
                          </Link>
                          {bidStatus.status === 'outbid' && (
                            <Link to={`/buyer/product/${bid.product_id}`}>
                              <Button>
                                Increase Bid
                              </Button>
                            </Link>
                          )}
                          {bidStatus.status === 'won' && (
                            <Link to={`/buyer/payment-details?product=${bid.product_id}`}>
                              <Button>
                                Complete Purchase
                              </Button>
                            </Link>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MyBids;
