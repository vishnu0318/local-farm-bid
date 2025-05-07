
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface EmptyBidsStateProps {
  activeTab: string;
}

export const EmptyBidsState = ({ activeTab }: EmptyBidsStateProps) => {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-12">
        <p className="text-center text-gray-500 mb-4">
          {activeTab === 'active' ? "You don't have any active bids" :
           activeTab === 'won' ? "You haven't won any auctions yet" :
           "You haven't lost any auctions yet"}
        </p>
        {activeTab === 'active' && (
          <Link to="/buyer/browse-products">
            <Button>Browse Products</Button>
          </Link>
        )}
      </CardContent>
    </Card>
  );
};
