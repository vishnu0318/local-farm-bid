
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Crop, useData } from '@/context/DataContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Link } from 'react-router-dom';

interface BidFormProps {
  crop: Crop;
}

const BidForm = ({ crop }: BidFormProps) => {
  const { user, isBuyer } = useAuth();
  const { placeBid } = useData();
  const [bidAmount, setBidAmount] = useState<number>(crop.currentBid + 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to place a bid");
      return;
    }
    
    if (!isBuyer()) {
      toast.error("Only buyers can place bids");
      return;
    }
    
    if (bidAmount <= crop.currentBid) {
      toast.error(`Your bid must be higher than the current bid (₹${crop.currentBid})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      placeBid(crop.id, user.id, user.name, bidAmount);
      toast.success("Your bid has been placed successfully!");
      
      // Reset bid amount to new minimum
      setBidAmount(bidAmount + 5);
    } catch (error) {
      toast.error("Failed to place bid. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user is a farmer, show a message instead of the bid form
  if (user?.role === 'farmer') {
    return (
      <Card className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-2">Farmers Cannot Bid</h3>
        <p className="text-gray-600 mb-4">
          As a farmer, you cannot place bids on crops. You can only list your own crops for auction.
        </p>
        <Link to="/marketplace">
          <Button variant="outline" className="w-full">
            Browse Marketplace
          </Button>
        </Link>
      </Card>
    );
  }
  
  // If not logged in, show login prompt
  if (!user) {
    return (
      <Card className="p-4 text-center">
        <h3 className="font-semibold text-lg mb-2">Login Required</h3>
        <p className="text-gray-600 mb-4">
          Please log in as a buyer to place bids on crops.
        </p>
        <Link to="/login">
          <Button className="w-full">
            Login to Bid
          </Button>
        </Link>
      </Card>
    );
  }
  
  return (
    <Card className="p-4">
      <h3 className="font-semibold text-lg mb-2">Place Your Bid</h3>
      
      <div className="mb-4">
        <p className="text-sm text-gray-600">Current Highest Bid</p>
        <p className="text-xl font-bold text-farmgreen-600">₹{crop.currentBid}</p>
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
            min={crop.currentBid + 1}
            step={1}
            required
            className="w-full"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Minimum bid: ₹{crop.currentBid + 1}
          </p>
        </div>
        
        <Button 
          type="submit" 
          className="w-full" 
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Place Bid'}
        </Button>
      </form>
    </Card>
  );
};

export default BidForm;
