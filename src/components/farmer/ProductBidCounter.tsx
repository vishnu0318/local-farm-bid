
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';
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
          setBidCount(prev => prev + 1);
          
          // Update highest bid if this one is higher
          const newBid = payload.new as { amount: number };
          if (newBid.amount > highestBid) {
            setHighestBid(newBid.amount);
          }
        }
      )
      .subscribe();
    
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
