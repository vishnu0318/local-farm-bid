
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bid } from '@/types/marketplace';
import { formatDistance } from 'date-fns';
import { getUserBidsWithProducts } from '@/services/bidService';
import { supabase } from '@/integrations/supabase/client';

export type BidStatus = {
  status: 'winning' | 'outbid' | 'won' | 'lost';
  label: string;
};

export const useBidsData = () => {
  const { user } = useAuth();
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
        // Fetch actual bids from the database
        const userBids = await getUserBidsWithProducts(user.id);
        
        if (userBids.length > 0) {
          // For each bid, check if user is still the highest bidder
          const enrichedBids = await Promise.all(userBids.map(async (bid) => {
            const { data: highestBid } = await supabase
              .from('bids')
              .select('bidder_id, amount')
              .eq('product_id', bid.product_id)
              .order('amount', { ascending: false })
              .limit(1)
              .single();
              
            const isHighestBidder = highestBid && highestBid.bidder_id === user.id;
            
            // Add the highest_bidder_id property to the product
            if (bid.product) {
              bid.product.highest_bidder_id = isHighestBidder ? user.id : (highestBid?.bidder_id || '');
            }
            
            return bid;
          }));
          
          setBids(enrichedBids);
        } else {
          setBids([]);
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching bids:', error);
        setIsLoading(false);
      }
    };
    
    fetchMyBids();
    
    // Set up a channel to listen for new bids
    const channel = supabase
      .channel('public:bids')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'bids',
          filter: `bidder_id=eq.${user?.id}`
        }, 
        () => {
          // Refresh data when there's a change to the user's bids
          fetchMyBids();
        }
      )
      .subscribe();
    
    // Refresh bids status periodically
    const intervalId = setInterval(() => {
      setBids(prevBids => prevBids.map(bid => {
        if (!bid.product) return bid;
        
        const endTime = bid.product.bid_end ? new Date(bid.product.bid_end) : null;
        const now = new Date();
        
        let timeLeft = "No deadline";
        if (endTime) {
          if (now >= endTime) {
            timeLeft = "Ended";
          } else {
            timeLeft = formatDistance(endTime, now, { addSuffix: false }) + " left";
          }
        }
        
        return {
          ...bid,
          product: {
            ...bid.product,
            timeLeft
          }
        };
      }));
    }, 60000); // Refresh every minute
    
    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Determine bid status
  const getBidStatus = (bid: Bid): BidStatus => {
    const now = new Date();
    const bidEnd = bid.product?.bid_end ? new Date(bid.product.bid_end) : null;
    const isEnded = bidEnd && now > bidEnd;
    
    if (isEnded) {
      // Auction has ended
      if (bid.product?.highest_bidder_id === user?.id) {
        return { status: 'won', label: 'Won' };
      } else {
        return { status: 'lost', label: 'Lost' };
      }
    } else {
      // Auction is still active
      if (bid.product?.highest_bidder_id === user?.id) {
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
  const getFilteredBids = (activeTab: string) => {
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

  return {
    isLoading,
    getFilteredBids,
    getBidStatus,
    getTimeRemaining,
  };
};
