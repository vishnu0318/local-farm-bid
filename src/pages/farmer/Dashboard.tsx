
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import MarketPriceAnalytics from '@/components/farmer/MarketPriceAnalytics';
import { IndianRupee, TrendingUp, ShoppingBasket, Users } from 'lucide-react';

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');

  // Mock data for the dashboard
  const dashboardData = {
    totalEarnings: {
      week: 12500,
      month: 45000,
      year: 540000
    },
    activeListings: 5,
    pendingBids: 12,
    completedSales: 8
  };

  // Get earnings based on selected period
  const earnings = dashboardData.totalEarnings[selectedPeriod as keyof typeof dashboardData.totalEarnings];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-gray-600">Here's what's happening with your farm today</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 mr-1 text-green-500" />
              <div className="text-2xl font-bold">{dashboardData.totalEarnings.month.toLocaleString()}</div>
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>+12% from last month</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.activeListings}</div>
            <p className="text-xs text-gray-600 mt-1">Products in marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.pendingBids}</div>
            <p className="text-xs text-gray-600 mt-1">Bids awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.completedSales}</div>
            <p className="text-xs text-gray-600 mt-1">Successfully sold products</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Your Earnings</CardTitle>
            <CardDescription>Earnings summary across different time periods</CardDescription>
            <Tabs defaultValue="week" onValueChange={setSelectedPeriod}>
              <TabsList>
                <TabsTrigger value="week">This Week</TabsTrigger>
                <TabsTrigger value="month">This Month</TabsTrigger>
                <TabsTrigger value="year">This Year</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600 flex items-center justify-center">
                    <IndianRupee className="h-8 w-8 mr-1" />
                    <span>{earnings.toLocaleString()}</span>
                  </div>
                  <p className="text-gray-500 mt-2">
                    Total earnings for {selectedPeriod === 'week' ? 'this week' : selectedPeriod === 'month' ? 'this month' : 'this year'}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest bids and sales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded-sm">
                <p className="text-sm font-semibold">New bid received</p>
                <p className="text-xs text-gray-500">Organic Tomatoes - ₹45/kg</p>
                <p className="text-xs text-gray-400">10 minutes ago</p>
              </div>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded-sm">
                <p className="text-sm font-semibold">Auction ended</p>
                <p className="text-xs text-gray-500">Fresh Spinach - ₹35/kg</p>
                <p className="text-xs text-gray-400">2 hours ago</p>
              </div>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-3 rounded-sm">
                <p className="text-sm font-semibold">Payment received</p>
                <p className="text-xs text-gray-500">Organic Potatoes - ₹2500</p>
                <p className="text-xs text-gray-400">Yesterday</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Market Price Analytics Section */}
      <MarketPriceAnalytics className="mb-8" />
    </div>
  );
};

export default FarmerDashboard;
