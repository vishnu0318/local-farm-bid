
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Bid } from '@/types/marketplace';
import { Badge } from '@/components/ui/badge';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ProductBidCounterProps {
  productId: string;
}

const ProductBidCounter: React.FC<ProductBidCounterProps> = ({ productId }) => {
  const [bidCount, setBidCount] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [recentBids, setRecentBids] = useState<Bid[]>([]);
  const [newBidNotification, setNewBidNotification] = useState<boolean>(false);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Count bids
        const { count: bidCountResult, error: countError } = await supabase
          .from('bids')
          .select('id', { count: 'exact', head: true })
          .eq('product_id', productId);
          
        if (countError) {
          console.error('Error counting bids:', countError);
        } else {
          setBidCount(bidCountResult || 0);
        }
        
        // Get recent bids
        const { data: recentBidsData, error: recentBidsError } = await supabase
          .from('bids')
          .select('id, bidder_name, amount, created_at')
          .eq('product_id', productId)
          .order('created_at', { ascending: false })
          .limit(5);
          
        if (recentBidsError) {
          console.error('Error fetching recent bids:', recentBidsError);
        } else {
          setRecentBids(recentBidsData as Bid[]);
        }
        
        // Get highest bid
        const { data: highestBidData, error: bidError } = await supabase
          .from('bids')
          .select('amount')
          .eq('product_id', productId)
          .order('amount', { ascending: false })
          .limit(1)
          .single();
          
        if (bidError) {
          if (bidError.code !== 'PGRST116') { // If not "no rows found"
            console.error('Error fetching highest bid:', bidError);
          }
          
          // If no bids yet, get product base price
          const { data: productData, error: productError } = await supabase
            .from('products')
            .select('price')
            .eq('id', productId)
            .single();
            
          if (productError) {
            console.error('Error fetching product price:', productError);
          } else {
            setHighestBid(productData.price);
          }
        } else {
          setHighestBid(highestBidData.amount);
        }
      } catch (error) {
        console.error('Error fetching bid data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time bid updates
    const channel = supabase
      .channel(`product-bids-${productId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'bids',
          filter: `product_id=eq.${productId}`
        }, 
        (payload) => {
          console.log('New bid received:', payload);
          const newBid = payload.new as Bid;
          
          // Update bid count
          setBidCount(prev => prev + 1);
          
          // Update recent bids
          setRecentBids(prev => {
            // Add new bid to the top of the list
            const updatedBids = [newBid, ...prev].slice(0, 5);
            return updatedBids;
          });
          
          // Show notification
          setNewBidNotification(true);
          toast.success(`New bid of ₹${newBid.amount} placed by ${newBid.bidder_name}`, {
            id: `bid-${newBid.id}`,
            duration: 5000,
          });
          
          // Update highest bid if this one is higher
          if (newBid.amount > highestBid) {
            setHighestBid(newBid.amount);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId, highestBid]);

  // Clear notification when viewed
  const clearNotification = () => {
    setNewBidNotification(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg">Bids Overview</h3>
          <div className="relative">
            <Bell className={`h-6 w-6 ${newBidNotification ? 'text-red-500' : 'text-gray-400'}`} onClick={clearNotification} />
            {newBidNotification && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full flex items-center justify-center bg-red-500">
                !
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h4 className="font-semibold text-lg">Total Bids</h4>
            <p className="text-3xl font-bold mt-1">{loading ? '...' : bidCount}</p>
          </div>
          
          <div className="text-right">
            <h4 className="font-semibold text-lg">Highest Bid</h4>
            <p className="text-3xl font-bold mt-1 flex items-center justify-end text-green-600">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {loading ? '...' : highestBid}
            </p>
          </div>
        </div>
        
        {recentBids.length > 0 && (
          <div>
            <h4 className="font-semibold mb-2">Recent Bids</h4>
            <div className="space-y-2 max-h-48 overflow-auto">
              {recentBids.map(bid => (
                <div key={bid.id} className="bg-gray-50 p-2 rounded-md flex justify-between items-center">
                  <div>
                    <p className="font-medium">{bid.bidder_name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <p className="font-semibold flex items-center">
                    <IndianRupee className="h-3 w-3 mr-0.5" />
                    {bid.amount}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductBidCounter;
