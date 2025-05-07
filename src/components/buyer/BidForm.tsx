
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { IndianRupee, Loader2, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Product } from "@/types/marketplace";
import { Link } from "react-router-dom";
import { placeBid } from "@/services/bidService";

interface BidFormProps {
  product: Product;
  onBidSuccess: () => void;
  currentHighestBid: number;
  isWinner: boolean;
}

export default function BidForm({ product, onBidSuccess, currentHighestBid, isWinner }: BidFormProps) {
  const { user } = useAuth();
  const [bidAmount, setBidAmount] = useState(currentHighestBid + 5);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Check if bidding period has ended
  const isBiddingEnded = () => {
    if (!product.bid_end) return false;
    
    const now = new Date();
    const endTime = new Date(product.bid_end);
    return now > endTime;
  };
  
  // Check if bidding has started
  const isBiddingStarted = () => {
    if (!product.bid_start) return true; // If no start time specified, bidding is open
    
    const now = new Date();
    const startTime = new Date(product.bid_start);
    return now >= startTime;
  };
  
  const handleBidSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Please log in to place a bid");
      return;
    }
    
    if (isBiddingEnded()) {
      toast.error("This auction has ended");
      return;
    }
    
    if (!isBiddingStarted()) {
      toast.error("This auction has not started yet");
      return;
    }
    
    if (bidAmount <= currentHighestBid) {
      toast.error(`Your bid must be higher than the current highest bid (₹${currentHighestBid})`);
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
      
      if (!result.success) {
        throw new Error(result.error || "Failed to place bid");
      }
      
      toast.success("Your bid has been placed successfully!");
      setBidAmount(bidAmount + 5);
      onBidSuccess(); // Refresh product data
    } catch (error: any) {
      toast.error(error.message || "Failed to place bid. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // If bidding has ended and user is not the winner
  if (isBiddingEnded() && !isWinner) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Auction Ended</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            This auction has ended and is no longer accepting bids.
          </p>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-500">Final Price:</span>
            <span className="font-medium flex items-center">
              <IndianRupee className="h-4 w-4 mr-0.5" />
              {currentHighestBid}
            </span>
          </div>
        </CardContent>
        <CardFooter>
          <Link to="/buyer/browse-products" className="w-full">
            <Button variant="outline" className="w-full">
              Browse More Products
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  // If bidding has ended and user is the winner
  if (isBiddingEnded() && isWinner) {
    return (
      <Card className="border-green-500 border-2">
        <CardHeader className="bg-green-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-green-700">You Won This Auction!</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <p className="text-gray-700 mb-4">
            Congratulations! Your bid was the highest. Complete your purchase to claim this product.
          </p>
          <div className="flex items-center justify-between mb-6">
            <span className="text-sm font-medium">Your Winning Bid:</span>
            <span className="font-bold text-green-600 flex items-center text-xl">
              <IndianRupee className="h-5 w-5 mr-0.5" />
              {currentHighestBid}
            </span>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg mb-4">
            <h3 className="font-medium mb-2">Product Details</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-gray-600">Product:</span>
              <span className="font-medium">{product.name}</span>
              
              <span className="text-gray-600">Quantity:</span>
              <span className="font-medium">{product.quantity} {product.unit}</span>
              
              <span className="text-gray-600">Seller:</span>
              <span className="font-medium">{product.farmer_name}</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Link to={`/buyer/payment-details?product=${product.id}`} className="w-full">
            <Button className="w-full">Complete Purchase</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  // If user not logged in
  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Login Required</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Please log in to place a bid on this product.
          </p>
        </CardContent>
        <CardFooter>
          <Link to="/login?role=buyer" className="w-full">
            <Button className="w-full">Login to Bid</Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }
  
  // Normal bidding form
  return (
    <Card>
      <CardHeader>
        <CardTitle>Place Your Bid</CardTitle>
      </CardHeader>
      <form onSubmit={handleBidSubmit}>
        <CardContent>
          <div className="mb-4">
            <div className="flex justify-between mb-1">
              <span className="text-sm text-gray-500">Current Highest Bid</span>
              <span className="text-green-600 font-medium flex items-center">
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {currentHighestBid}
              </span>
            </div>
            {!isBiddingStarted() && (
              <div className="text-sm text-amber-600 mb-4">
                Bidding starts at {new Date(product.bid_start!).toLocaleString()}
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bidAmount">Your Bid (₹)</Label>
            <Input
              type="number"
              id="bidAmount"
              value={bidAmount}
              onChange={(e) => setBidAmount(Number(e.target.value))}
              min={currentHighestBid + 1}
              step="1"
              disabled={!isBiddingStarted() || isSubmitting}
            />
            <p className="text-xs text-gray-500">
              Minimum bid: ₹{currentHighestBid + 1}
            </p>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={!isBiddingStarted() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Place Bid'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
