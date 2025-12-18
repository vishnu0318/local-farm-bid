
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { IndianRupee, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, Bid } from '@/types/marketplace';

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    activeBids: 0,
    wonAuctions: 0,
    availableProducts: 0
  });
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Fetch bids
        const { data: bidsData, error: bidsError } = await supabase
          .from('bids')
          .select('*, product:product_id(*)')
          .eq('buyer_id', user.id)
          .order('created_at', { ascending: false });

        if (bidsError) throw bidsError;

        // Count active bids and won auctions
        let activeBidsCount = 0;
        let wonAuctionsCount = 0;

        if (bidsData && bidsData.length > 0) {
          setRecentBids(bidsData.slice(0, 3));
          
          // Process each bid to determine if active or won
          const now = new Date();
          
          for (const bid of bidsData) {
            if (!bid.product) continue;
            
            // Is auction ended?
            if (bid.product.bid_end && new Date(bid.product.bid_end) < now) {
              // Check if this user is the highest bidder
              const { data: highestBid } = await supabase
                .from('bids')
                .select('buyer_id, amount')
                .eq('product_id', bid.product_id)
                .order('amount', { ascending: false })
                .limit(1)
                .single();
              
              if (highestBid && highestBid.buyer_id === user.id) {
                wonAuctionsCount++;
              }
            } else {
              activeBidsCount++;
            }
          }
        }
        
        // Fetch available products
        const { count: availableCount, error: countError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('available', true)
          .gt('bid_end', new Date().toISOString());
          
        if (countError) throw countError;
        
        // Fetch recommended products
        const { data: recommendedProducts, error: recError } = await supabase
          .from('products')
          .select('*')
          .eq('available', true)
          .gt('bid_end', new Date().toISOString())
          .limit(3);
        
        if (recError) throw recError;
        
        setRecommendations(recommendedProducts || []);
        
        // Update stats
        setStats({
          activeBids: activeBidsCount,
          wonAuctions: wonAuctionsCount,
          availableProducts: availableCount || 0
        });
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
    
    // Set up a channel to listen for new bids
    const channel = supabase
      .channel('public:bids')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bids',
          filter: `buyer_id=eq.${user?.id}`
        }, 
        () => {
          // Refresh data when there's a change to the user's bids
          fetchDashboardData();
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Format time remaining for auction
  const getTimeRemaining = (endTimeStr: string): string => {
    const endTime = new Date(endTimeStr);
    const now = new Date();
    
    if (now >= endTime) return "Ended";
    
    const diff = endTime.getTime() - now.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      return `${hours}h ${minutes}m`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Link to="/buyer/my-bids?tab=active" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>My Bids</CardTitle>
              <CardDescription>Your active bids</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.activeBids}</div>
              <p className="text-sm text-gray-500">Active bids placed</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/buyer/my-bids?tab=won" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Won Auctions</CardTitle>
              <CardDescription>Products you've won</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.wonAuctions}</div>
              <p className="text-sm text-gray-500">Successfully won auctions</p>
            </CardContent>
          </Card>
        </Link>
        
        <Link to="/buyer/browse-products" className="block">
          <Card className="transition-shadow hover:shadow-md">
            <CardHeader>
              <CardTitle>Available Products</CardTitle>
              <CardDescription>Products you can bid on</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stats.availableProducts}</div>
              <p className="text-sm text-gray-500">Products available in your area</p>
            </CardContent>
          </Card>
        </Link>
      </div>
      
      {recentBids.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bids</CardTitle>
            <CardDescription>Your most recent bidding activity</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentBids.map((bid) => (
                <Link to={`/buyer/product/${bid.product_id}`} key={bid.id}>
                  <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      {bid.product?.image_url && (
                        <img 
                          src={bid.product.image_url} 
                          alt={bid.product?.name} 
                          className="h-10 w-10 rounded object-cover" 
                        />
                      )}
                      <div>
                        <p className="font-medium">{bid.product?.name}</p>
                        <p className="text-xs text-gray-500">
                          {bid.product?.bid_end && `Ends in: ${getTimeRemaining(bid.product.bid_end)}`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center font-medium">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {bid.amount}
                      </div>
                      <p className="text-xs text-gray-500">Your bid</p>
                    </div>
                  </div>
                </Link>
              ))}
              {recentBids.length > 0 && (
                <div className="text-center mt-4">
                  <Link to="/buyer/my-bids">
                    <Button variant="outline">View All Bids</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Recommended Products</CardTitle>
          <CardDescription>Products you might be interested in</CardDescription>
        </CardHeader>
        <CardContent>
          {recommendations.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-3">
              {recommendations.map((product) => (
                <Link to={`/buyer/product/${product.id}`} key={product.id} className="block">
                  <div className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-32 bg-gray-100">
                      {product.image_url ? (
                        <img 
                          src={product.image_url} 
                          alt={product.name} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div className="p-3">
                      <h4 className="font-medium line-clamp-1">{product.name}</h4>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-sm flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {product.price}
                        </span>
                        {product.bid_end && (
                          <span className="text-xs text-gray-500">
                            {getTimeRemaining(product.bid_end)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <p className="text-gray-500">No recommended products to display</p>
              <Link to="/buyer/browse-products">
                <Button>Browse All Products</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerDashboard;
