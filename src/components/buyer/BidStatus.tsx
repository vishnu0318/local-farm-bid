
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, TrendingUp, Clock } from 'lucide-react';

interface BidStatusProps {
  userBidAmount: number;
  highestBidAmount: number;
  isWinner: boolean;
  isActive: boolean;
  productName: string;
}

const BidStatus: React.FC<BidStatusProps> = ({ 
  userBidAmount, 
  highestBidAmount, 
  isWinner, 
  isActive,
  productName 
}) => {
  const getStatusInfo = () => {
    if (!isActive) {
      if (isWinner) {
        return {
          status: 'Won',
          message: 'Congratulations! You won this bid.',
          color: 'bg-green-100 text-green-800',
          icon: <TrendingUp className="h-4 w-4" />
        };
      } else {
        return {
          status: 'Lost',
          message: `There was a higher bid of ₹${highestBidAmount.toLocaleString()}. Better luck next time!`,
          color: 'bg-red-100 text-red-800',
          icon: <TrendingUp className="h-4 w-4" />
        };
      }
    } else {
      if (userBidAmount >= highestBidAmount) {
        return {
          status: 'Leading',
          message: 'You are currently the highest bidder!',
          color: 'bg-green-100 text-green-800',
          icon: <TrendingUp className="h-4 w-4" />
        };
      } else {
        return {
          status: 'Outbid',
          message: `There is a higher bid of ₹${highestBidAmount.toLocaleString()}. Consider increasing your bid.`,
          color: 'bg-yellow-100 text-yellow-800',
          icon: <Clock className="h-4 w-4" />
        };
      }
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className="border-l-4 border-l-primary">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-lg">{productName}</h4>
          <Badge className={statusInfo.color}>
            {statusInfo.icon}
            <span className="ml-1">{statusInfo.status}</span>
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Your Bid:</span>
            <div className="flex items-center font-semibold">
              <IndianRupee className="h-4 w-4 mr-1" />
              <span>{userBidAmount.toLocaleString()}</span>
            </div>
          </div>
          
          {!isWinner && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Current Highest:</span>
              <div className="flex items-center font-semibold text-red-600">
                <IndianRupee className="h-4 w-4 mr-1" />
                <span>{highestBidAmount.toLocaleString()}</span>
              </div>
            </div>
          )}
        </div>
        
        <p className="text-sm text-gray-600 mt-3 p-2 bg-gray-50 rounded">
          {statusInfo.message}
        </p>
      </CardContent>
    </Card>
  );
};

export default BidStatus;
