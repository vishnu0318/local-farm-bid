
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Link, useNavigate } from 'react-router-dom';
import { IndianRupee } from 'lucide-react';
import { Product, placeBid } from '@/services/productService';
import { supabase } from '@/integrations/supabase/client';

interface BidFormProps {
  crop: Product;
}

const BidForm = ({ crop }: BidFormProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState<number>(() => {
    return crop.currentBid ? crop.currentBid + 5 : crop.price + 5;
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isBiddingEnded = () => {
    const now = new Date();
    const endTimeStr = crop?.bid_end ?? null;
    if (!endTimeStr) return false;
    const endTime = new Date(endTimeStr);
    return now > endTime;
  };

  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to place a bid');
      return;
    }

    if (!user.user_metadata?.role || user.user_metadata.role !== 'buyer') {
      toast.error('Only buyers can place bids');
      return;
    }

    if (isBiddingEnded()) {
      toast.error('This auction has ended');
      return;
    }

    if (bidAmount <= (crop.currentBid || 0)) {
      toast.error(`Your bid must be higher than the current bid (₹${crop.currentBid})`);
      return;
    }

    if (bidAmount <= crop.price) {
      toast.error(`Your bid must be higher than the base price (₹${crop.price})`);
      return;
    }

    setIsSubmitting(true);

    try {
      const bidUserName = user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous';
      
      const result = await placeBid(
        crop,
        { id: user.id, name: bidUserName },
        bidAmount
      );
  
      if (result.success) {
        toast.success('Your bid has been placed successfully!');
        setBidAmount(bidAmount + 5);
        
        // Navigate to My Bids page to see the bid
        setTimeout(() => {
          navigate('/buyer/my-bids');
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to place bid. Please try again.');
      }
    } catch (error) {
      console.error(error);
      toast.error('Unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isBiddingEnded()) {
    return (
      <Card className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-2">Auction Ended</h3>
        <p className="text-gray-600 mb-4">
          This auction has ended and is no longer accepting bids.
        </p>
        <Link to="/buyer/browse-products">
          <Button variant="outline" className="w-full">
            Browse More Products
          </Button>
        </Link>
      </Card>
    );
  }

  if (user?.user_metadata?.role === 'farmer') {
    return (
      <Card className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-2">Farmers Cannot Bid</h3>
        <p className="text-gray-600 mb-4">
          As a farmer, you cannot place bids on crops. You can only list your own crops for auction.
        </p>
        <Link to="/farmer/add-product">
          <Button variant="outline" className="w-full">
            List Your Products
          </Button>
        </Link>
      </Card>
    );
  }

  if (!user) {
    return (
      <Card className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-2">Login Required</h3>
        <p className="text-gray-600 mb-4">
          Please log in as a buyer to place bids on crops.
        </p>
        <Link to="/login?role=buyer">
          <Button className="w-full">Login to Bid</Button>
        </Link>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-2">Place Your Bid</h3>

      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Highest Bid</p>
        <div className="flex items-center">
          <IndianRupee className="h-4 w-4 mr-0.5 text-green-600" />
          <p className="text-xl font-bold text-green-600">
            {crop.currentBid || crop.price}
          </p>
        </div>
        {crop.highestBidderName && (
          <p className="text-sm text-gray-500">by {crop.highestBidderName}</p>
        )}
      </div>

      <form onSubmit={handleBidSubmit}>
        <div className="mb-4">
          <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Your Bid Amount (₹)
          </label>
          <Input
            id="bidAmount"
            type="number"
            value={bidAmount}
            onChange={(e) => setBidAmount(Number(e.target.value))}
            min={(crop.currentBid || crop.price) + 1}
            step={1}
            required
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum bid: ₹{(crop.currentBid || crop.price) + 1}
          </p>
        </div>

        <Button
          type="submit"
          className="w-full bg-green-600 hover:bg-green-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Place Bid'}
        </Button>
      </form>
    </Card>
  );
};

export default BidForm;
