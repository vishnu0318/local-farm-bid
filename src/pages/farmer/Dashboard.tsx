
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const FarmerDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Farmer Dashboard</h1>
      
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>My Products</CardTitle>
            <CardDescription>Your listed products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">Products currently listed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Auctions</CardTitle>
            <CardDescription>Products with active bidding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">0</div>
            <p className="text-sm text-gray-500">Active auctions running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Total Earnings</CardTitle>
            <CardDescription>Your total earnings to date</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$0.00</div>
            <p className="text-sm text-gray-500">From 0 completed sales</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions on your products</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">No recent activity to display</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerDashboard;
