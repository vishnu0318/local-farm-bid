
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { IndianRupee } from 'lucide-react';

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
            <div className="text-3xl font-bold">2</div>
            <p className="text-sm text-gray-500">Products currently listed</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Auctions</CardTitle>
            <CardDescription>Products with active bidding</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1</div>
            <p className="text-sm text-gray-500">Active auctions running</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Monthly Earnings</CardTitle>
            <CardDescription>Your earnings this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold flex items-center">
              <IndianRupee className="h-6 w-6 mr-1" />5,250.00
            </div>
            <p className="text-sm text-gray-500">From 3 completed sales</p>
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest actions on your products</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <p className="font-medium">New Bid on Organic Tomatoes</p>
                <p className="text-sm text-gray-500">Highest bid: ₹225/kg</p>
              </div>
              <p className="text-sm text-gray-500">2 hours ago</p>
            </div>
            <div className="flex items-center justify-between pb-2 border-b">
              <div>
                <p className="font-medium">Sale Completed: Organic Potatoes</p>
                <p className="text-sm text-gray-500">Final price: ₹180/kg</p>
              </div>
              <p className="text-sm text-gray-500">2 days ago</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Payment Received: ₹1,800</p>
                <p className="text-sm text-gray-500">For Organic Potatoes</p>
              </div>
              <p className="text-sm text-gray-500">2 days ago</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FarmerDashboard;
