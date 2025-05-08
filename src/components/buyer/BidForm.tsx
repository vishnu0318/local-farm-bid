
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Link } from 'react-router-dom';
import { IndianRupee, ArrowDown } from 'lucide-react';
import { placeBid } from '@/services/bidService';
import { Product } from '@/types/marketplace';

interface BidFormProps {
  product: Product;
  onBidSuccess: () => void;
  currentHighestBid: number;
  isWinner?: boolean;
}

const BidForm = ({ product, onBidSuccess, currentHighestBid, isWinner }: BidFormProps) => {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState<number>(currentHighestBid > 0 ? currentHighestBid + 5 : product?.price + 5 || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if bidding period has ended or not started
  const getBidStatus = () => {
    const now = new Date();
    
    if (!product.bid_start || !product.bid_end) {
      return { canBid: false, message: "Bidding not available for this product" };
    }
    
    const startTime = new Date(product.bid_start);
    const endTime = new Date(product.bid_end);
    
    if (now < startTime) {
      return { canBid: false, message: "Bidding has not started yet" };
    }
    
    if (now > endTime) {
      return { canBid: false, message: "Bidding has ended" };
    }
    
    return { canBid: true, message: "" };
  };
  
  const bidStatus = getBidStatus();
  
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to place a bid");
      return;
    }
    
    if (!bidStatus.canBid) {
      toast.error(bidStatus.message);
      return;
    }
    
    if (bidAmount <= currentHighestBid) {
      toast.error(`Your bid must be higher than the current bid (₹${currentHighestBid})`);
      return;
    }
    
    if (bidAmount <= product.price) {
      toast.error(`Your bid must be higher than the base price (₹${product.price})`);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const result = await placeBid(
        product.id,
        user.id,
        user.user_metadata?.name || user.email?.split('@')[0] || 'Anonymous',
        bidAmount
      );
      
      if (result.success) {
        toast.success("Your bid has been placed successfully!");
        onBidSuccess();
        setBidAmount(bidAmount + 5);
      } else {
        toast.error(result.error || "Failed to place bid. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to place bid. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // If user won the auction
  if (isWinner) {
    return (
      <Card className="p-6 border-2 border-green-500">
        <CardContent className="p-0 space-y-4">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-green-600">Congratulations!</h3>
            <p className="text-gray-600">You've won this auction.</p>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-500">Your Winning Bid</p>
              <p className="text-xl font-bold flex items-center text-green-600">
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {currentHighestBid}
              </p>
            </div>
          </div>
          
          <Link to={`/buyer/payment-details?product=${product.id}`} className="w-full">
            <Button className="w-full bg-green-600 hover:bg-green-700">Complete Purchase</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // If bidding has ended, show a message
  if (!bidStatus.canBid) {
    return (
      <Card className="p-6">
        <CardContent className="p-0 text-center">
          <h3 className="font-semibold text-lg mb-2">{bidStatus.message}</h3>
          <p className="text-gray-600 mb-4">
            This auction is currently not accepting bids.
          </p>
          <Link to="/buyer/browse-products">
            <Button variant="outline" className="w-full">
              Browse More Products
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <Card className="p-6">
        <CardContent className="p-0 text-center">
          <h3 className="font-semibold text-lg mb-2">Login Required</h3>
          <p className="text-gray-600 mb-4">
            Please log in as a buyer to place bids on products.
          </p>
          <Link to="/login?role=buyer">
            <Button className="w-full">
              Login to Bid
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="p-6">
      <CardContent className="p-0">
        <h3 className="font-semibold text-lg mb-4">Place Your Bid</h3>
        
        <div className="mb-6">
          <p className="text-sm text-gray-600">Current Highest Bid</p>
          <div className="flex items-center">
            <IndianRupee className="h-4 w-4 mr-0.5 text-green-600" />
            <p className="text-xl font-bold text-green-600">{currentHighestBid}</p>
          </div>
        </div>
        
        <form onSubmit={handleBidSubmit} className="space-y-4">
          <div>
            <label htmlFor="bidAmount" className="block text-sm font-medium text-gray-700 mb-1">
              Your Bid Amount (₹)
            </label>
            <div className="relative">
              <Input
                id="bidAmount"
                type="number"
                value={bidAmount}
                onChange={(e) => setBidAmount(Number(e.target.value))}
                min={currentHighestBid + 1}
                step={1}
                required
                className="pl-7 w-full"
              />
              <span className="absolute left-2 top-1/2 -translate-y-1/2">
                <IndianRupee className="h-4 w-4 text-gray-500" />
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Minimum bid: ₹{currentHighestBid + 1}
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
      </CardContent>
    </Card>
  );
};

export default BidForm;
