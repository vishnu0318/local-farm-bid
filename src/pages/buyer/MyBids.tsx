
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { toast } from "sonner";
import { BidCard } from '@/components/buyer/BidCard';
import { EmptyBidsState } from '@/components/buyer/EmptyBidsState';
import { LoadingState } from '@/components/buyer/LoadingState';
import { NotLoggedInState } from '@/components/buyer/NotLoggedInState';
import { useBidsData } from '@/hooks/useBidsData';

const MyBids = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('active');
  const { isLoading, getFilteredBids, getBidStatus, getTimeRemaining } = useBidsData();
  
  if (!user) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">My Bids</h1>
        <NotLoggedInState />
      </div>
    );
  }

  const filteredBids = getFilteredBids(activeTab);

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Bids</h1>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="active">Active Bids</TabsTrigger>
          <TabsTrigger value="won">Won Auctions</TabsTrigger>
          <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
        </TabsList>
        
        {isLoading ? (
          <LoadingState />
        ) : (
          <TabsContent value={activeTab}>
            {filteredBids.length === 0 ? (
              <EmptyBidsState activeTab={activeTab} />
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredBids.map((bid) => {
                  const bidStatus = getBidStatus(bid);
                  const timeLeft = bid.product ? getTimeRemaining(bid.product.bid_end) : "Unknown";
                  
                  return (
                    <BidCard 
                      key={bid.id}
                      bid={bid}
                      bidStatus={bidStatus}
                      timeLeft={timeLeft}
                      activeTab={activeTab}
                    />
                  );
                })}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default MyBids;
