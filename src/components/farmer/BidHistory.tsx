
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Bid } from '@/types/marketplace';
import { getBidHistoryForFarmer, subscribeToBidChanges } from '@/services/bidService';
import { supabase } from '@/integrations/supabase/client';

interface BidHistoryProps {
  productId: string;
}

const BidHistory: React.FC<BidHistoryProps> = ({ productId }) => {
  const [bids, setBids] = useState<Bid[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch bid history
    const fetchBids = async () => {
      try {
        setLoading(true);
        const bidHistory = await getBidHistoryForFarmer(productId);
        setBids(bidHistory);
      } catch (error) {
        console.error('Error fetching bid history:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBids();

    // Subscribe to real-time bid updates
    const channel = subscribeToBidChanges(productId, () => {
      // When a new bid is placed, refresh the bid history
      fetchBids();
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (bids.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Bid History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-gray-500">
            No bids have been placed yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Bid History</span>
          <Badge>{bids.length} {bids.length === 1 ? 'bid' : 'bids'}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <span>Bidder</span>
            <div className="flex items-center gap-4">
              <span>Time</span>
              <span>Amount</span>
            </div>
          </div>
          
          <Separator />
          
          {bids.map((bid, index) => (
            <div key={bid.id} className="flex justify-between items-center py-1">
              <div className="font-medium">
                {bid.bidder_name}
                {index === 0 && <Badge className="ml-2 bg-green-600">Highest</Badge>}
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {format(new Date(bid.created_at), 'MMM d, HH:mm')}
                </span>
                <span className={`font-medium flex items-center ${index === 0 ? 'text-green-600' : ''}`}>
                  <IndianRupee className="h-4 w-4 mr-0.5" />
                  {bid.amount}
                </span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default BidHistory;
