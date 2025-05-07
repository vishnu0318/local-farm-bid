
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Bid } from '@/types/marketplace';
import { formatDistance } from 'date-fns';
import { mockProducts } from '@/services/mockData';

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
        // Create mock bids data based on the mock products
        // In a real implementation, we would fetch from Supabase
        const mockBids: Bid[] = mockProducts
          .filter(product => Math.random() > 0.3) // Randomly select some products to have bids on
          .map(product => {
            // For products where user is highest bidder
            const isHighestBidder = product.highest_bidder_id === "current_user_id" || product.highest_bidder_id === user.id;
            const bidAmount = isHighestBidder ? product.highest_bid || product.price : Math.floor((product.highest_bid || product.price) * 0.9);
            
            return {
              id: `bid-${product.id}`,
              product_id: product.id,
              bidder_id: user.id,
              bidder_name: user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
              amount: bidAmount,
              created_at: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)).toISOString(), // Random date in the last week
              product: {
                ...product,
                highest_bidder_id: isHighestBidder ? user.id : `other-bidder-${Math.floor(Math.random() * 1000)}`
              }
            };
          });
        
        setTimeout(() => {
          setBids(mockBids);
          setIsLoading(false);
        }, 800); // Simulate loading delay
      } catch (error) {
        console.error('Error fetching bids:', error);
        setIsLoading(false);
      }
    };
    
    fetchMyBids();
    
    // Set up interval to refresh bids status
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
    
    return () => clearInterval(intervalId);
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
