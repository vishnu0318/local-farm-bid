
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye, IndianRupee } from 'lucide-react';
import { format } from 'date-fns';
import { Bid } from '@/types/marketplace';
import { useAuth } from '@/context/AuthContext';
import { BidStatus } from '@/hooks/useBidsData';

interface BidCardProps {
  bid: Bid;
  bidStatus: BidStatus;
  timeLeft: string;
  activeTab: string;
}

export const BidCard = ({ bid, bidStatus, timeLeft, activeTab }: BidCardProps) => {
  const { user } = useAuth();
  const isWon = bidStatus.status === 'won';
  const isActive = activeTab === 'active';
  
  return (
    <Card key={bid.id} className="overflow-hidden h-full flex flex-col">
      <div className="aspect-w-16 aspect-h-9 relative">
        <img 
          src={bid.product?.image_url || '/placeholder.svg'} 
          alt={bid.product?.name} 
          className="object-cover w-full h-48 rounded-t-lg"
        />
        <Badge 
          className={`absolute top-2 right-2 ${
            bidStatus.status === 'winning' ? 'bg-green-600' : 
            bidStatus.status === 'won' ? 'bg-green-600' :
            bidStatus.status === 'lost' ? 'bg-red-600' :
            'bg-amber-600'
          }`}
        >
          {bidStatus.label}
        </Badge>
      </div>
      <CardHeader className="p-4 pb-2">
        <CardTitle className="text-lg">{bid.product?.name}</CardTitle>
        <p className="text-sm text-gray-500">
          {isWon ? `By ${bid.product?.farmer_name}` : 
          isActive ? `${timeLeft}` : 
          `Bid placed on ${format(new Date(bid.created_at), 'MMM d, yyyy')}`}
        </p>
      </CardHeader>
      <CardContent className="p-4 pt-0 flex-grow flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-gray-500">Your Bid</p>
            <p className="text-lg font-medium flex items-center">
              <IndianRupee className="h-4 w-4 mr-0.5" />
              {bid.amount}
            </p>
          </div>
          {(isActive || activeTab === 'lost') && (
            <div className="text-right">
              <p className="text-sm text-gray-500">Highest Bid</p>
              <p className={`text-lg font-medium flex items-center justify-end ${
                bidStatus.status === 'winning' || bidStatus.status === 'won' ? 
                'text-green-600' : 'text-red-500'
              }`}>
                <IndianRupee className="h-4 w-4 mr-0.5" />
                {bid.product?.highest_bid || bid.amount}
              </p>
            </div>
          )}
        </div>
        <div className="mt-auto flex justify-between items-center gap-2">
          <Link to={`/buyer/product/${bid.product_id}`} className="flex-1">
            <Button className="text-xs h-9 w-full flex items-center gap-1" variant="outline">
              <Eye className="h-3 w-3" />
              <span>View</span>
            </Button>
          </Link>
          {bidStatus.status === 'outbid' && (
            <Link to={`/buyer/product/${bid.product_id}`} className="flex-1">
              <Button className="text-xs h-9 w-full">
                Increase Bid
              </Button>
            </Link>
          )}
          {bidStatus.status === 'won' && (
            <Link to={`/buyer/payment-details?product=${bid.product_id}`} className="flex-1">
              <Button className="text-xs h-9 w-full">
                Pay Now
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
