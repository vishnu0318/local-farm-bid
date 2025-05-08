
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
import { countProductBids, getHighestBid, subscribeToBidChanges } from '@/services/bidService';
import { supabase } from '@/integrations/supabase/client';

interface ProductBidCounterProps {
  productId: string;
}

const ProductBidCounter: React.FC<ProductBidCounterProps> = ({ productId }) => {
  const [bidCount, setBidCount] = useState<number>(0);
  const [highestBid, setHighestBid] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Fetch initial data
    const fetchData = async () => {
      try {
        setLoading(true);
        const [count, highest] = await Promise.all([
          countProductBids(productId),
          getHighestBid(productId)
        ]);
        
        setBidCount(count);
        setHighestBid(highest);
      } catch (error) {
        console.error('Error fetching bid data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Subscribe to real-time bid updates
    const channel = subscribeToBidChanges(productId, () => {
      // When a new bid comes in, refresh the bid count and highest bid
      fetchData();
    });
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [productId]);

  return (
    <Card>
      <CardContent className="p-6 flex justify-between items-center">
        <div>
          <h3 className="font-semibold text-lg">Bids Received</h3>
          <p className="text-3xl font-bold mt-1">{loading ? '...' : bidCount}</p>
        </div>
        
        <div className="text-right">
          <h3 className="font-semibold text-lg">Current Highest</h3>
          <p className="text-3xl font-bold mt-1 flex items-center justify-end text-green-600">
            <IndianRupee className="h-5 w-5 mr-0.5" />
            {loading ? '...' : highestBid}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductBidCounter;
