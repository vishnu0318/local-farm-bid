
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const BuyerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Buyer Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Bids</CardTitle>
            <CardDescription>Your active bids</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">Active bids placed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Won Auctions</CardTitle>
            <CardDescription>Products you've won</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">Successfully won auctions</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
            <CardDescription>Products you can bid on</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">Products available in your area</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recommended Products</CardTitle>
          <CardDescription>Products you might be interested in</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 space-y-4">
            <p className="text-gray-500">No recommended products to display</p>
            <Link to="/buyer/browse-products">
              <Button>Browse All Products</Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerDashboard;
