
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import MarketPriceAnalytics from '@/components/farmer/MarketPriceAnalytics';
import RecentSales from '@/components/farmer/RecentSales';
import { IndianRupee, TrendingUp, ShoppingBasket, Users, Bell, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { Bid, Product } from '@/types/marketplace';
import { Badge } from "@/components/ui/badge";
import { toast } from 'sonner';

type RecentActivity = {
  id: string;
  type: 'new_bid' | 'auction_ended' | 'payment_received';
  title: string;
  description: string;
  time: string;
  timeAgo: string;
};

type DashboardStats = {
  totalEarnings: {
    week: number;
    month: number;
    year: number;
  };
  activeListings: number;
  pendingBids: number;
  completedSales: number;
};

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalEarnings: {
      week: 0,
      month: 0,
      year: 0
    },
    activeListings: 0,
    pendingBids: 0,
    completedSales: 0
  });
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      console.log('Fetching dashboard data for farmer:', user.id);
      
      // Fetch active listings count
      const { count: activeListingsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id)
        .eq('available', true);
        
      // Fetch products with bids count
      const { data: productsWithBids } = await supabase
        .from('products')
        .select(`
          id,
          name,
          bids:bids(count)
        `)
        .eq('farmer_id', user.id)
        .eq('available', true);
        
      const pendingBidsCount = productsWithBids?.filter(p => p.bids && p.bids.length > 0).length || 0;
      
      // Get farmer's products for order calculations
      const { data: farmerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user.id);
        
      const productIds = farmerProducts?.map(p => p.id) || [];
      
      let completedSalesCount = 0;
      let weeklyEarnings = 0;
      let monthlyEarnings = 0;
      let yearlyEarnings = 0;
      
      if (productIds.length > 0) {
        // Get completed sales
        const { data: completedSales } = await supabase
          .from('sales')
          .select('*')
          .in('product_id', productIds)
          .eq('payment_status', 'completed');
          
        if (completedSales) {
          completedSalesCount = completedSales.length;
          
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          completedSales.forEach(sale => {
            const saleDate = new Date(sale.created_at);
            
            if (saleDate >= oneWeekAgo) {
              weeklyEarnings += sale.total_amount;
            }
            if (saleDate >= oneMonthAgo) {
              monthlyEarnings += sale.total_amount;
            }
            if (saleDate >= oneYearAgo) {
              yearlyEarnings += sale.total_amount;
            }
          });
        }
      }
      
      // Fetch recent activities
      const activities: RecentActivity[] = [];
      
      if (productIds.length > 0) {
        // Recent payments from sales
        const { data: recentSales } = await supabase
          .from('sales')
          .select(`
            *,
            product:products(name)
          `)
          .in('product_id', productIds)
          .eq('payment_status', 'completed')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (recentSales) {
          recentSales.forEach(sale => {
            activities.push({
              id: `payment-${sale.id}`,
              type: 'payment_received',
              title: 'Payment received',
              description: `${sale.product?.name || 'Product'} - ₹${sale.total_amount}`,
              time: sale.created_at,
              timeAgo: formatDistanceToNow(new Date(sale.created_at), { addSuffix: true })
            });
          });
        }
        
        // Recent bids
        const { data: recentBids } = await supabase
          .from('bids')
          .select(`
            *,
            product:product_id(name)
          `)
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(2);
          
        if (recentBids) {
          recentBids.forEach(bid => {
            activities.push({
              id: `bid-${bid.id}`,
              type: 'new_bid',
              title: 'New bid received',
              description: `${bid.product?.name || 'Product'} - ₹${bid.amount} by ${bid.bidder_name}`,
              time: bid.created_at,
              timeAgo: formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })
            });
          });
        }
      }
      
      // Sort activities by time
      activities.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
      
      setDashboardStats({
        totalEarnings: {
          week: weeklyEarnings,
          month: monthlyEarnings,
          year: yearlyEarnings
        },
        activeListings: activeListingsCount || 0,
        pendingBids: pendingBidsCount,
        completedSales: completedSalesCount
      });
      
      setRecentActivities(activities.slice(0, 5));
      console.log('Dashboard data updated:', {
        activeListingsCount,
        pendingBidsCount,
        completedSalesCount,
        monthlyEarnings
      });
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    
    fetchDashboardData();
    
    // Set up real-time listeners with better error handling
    let channel: any = null;
    
    const setupRealtimeUpdates = async () => {
      try {
        const { data: products } = await supabase
          .from('products')
          .select('id')
          .eq('farmer_id', user.id);
          
        if (!products || products.length === 0) return;
        
        const productIds = products.map(p => p.id);
        console.log('Setting up real-time for products:', productIds);
        
        channel = supabase
          .channel('farmer-dashboard-realtime')
          .on('postgres_changes', 
            { 
              event: '*', 
              schema: 'public', 
              table: 'bids'
            }, 
            async (payload) => {
              console.log('Bid change detected:', payload);
              const bidData = payload.new as any;
              if (bidData && productIds.includes(bidData.product_id)) {
                toast.success('New bid received!');
                setHasNewNotifications(true);
                await fetchDashboardData();
              }
            }
          )
          .on('postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'sales'
            },
            async (payload) => {
              console.log('Sale change detected:', payload);
              const saleData = payload.new as any;
              if (saleData && productIds.includes(saleData.product_id)) {
                if (saleData.payment_status === 'completed') {
                  toast.success(`Payment of ₹${saleData.total_amount} received!`);
                  setHasNewNotifications(true);
                  await fetchDashboardData();
                }
              }
            }
          )
          .subscribe((status) => {
            console.log('Real-time subscription status:', status);
          });
          
      } catch (error) {
        console.error('Error setting up real-time updates:', error);
      }
    };
    
    setupRealtimeUpdates();
    
    // Cleanup
    return () => {
      if (channel) {
        console.log('Cleaning up real-time channel');
        supabase.removeChannel(channel);
      }
    };
    
  }, [user?.id]);

  const earnings = dashboardStats.totalEarnings[selectedPeriod as keyof typeof dashboardStats.totalEarnings];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.name || 'Farmer'}</h1>
          <p className="text-gray-600">Here's what's happening with your farm today</p>
        </div>
        <div className="relative mt-4 md:mt-0">
          <Bell 
            className={`h-6 w-6 cursor-pointer hover:scale-110 transition-transform ${hasNewNotifications ? 'text-red-500' : 'text-gray-400'}`}
            onClick={() => setHasNewNotifications(false)}
          />
          {hasNewNotifications && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full flex items-center justify-center bg-red-500 animate-pulse">
              !
            </Badge>
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Monthly Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <IndianRupee className="h-4 w-4 mr-1 text-green-500" />
              <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.totalEarnings.month.toLocaleString()}</div>
            </div>
            <p className="text-xs text-green-600 flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              <span>Updated in real-time</span>
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Active Listings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.activeListings}</div>
            <p className="text-xs text-gray-600 mt-1">Products in marketplace</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.pendingBids}</div>
            <p className="text-xs text-gray-600 mt-1">Bids awaiting your response</p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Completed Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.completedSales}</div>
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
                    <span>{loading ? '...' : earnings.toLocaleString()}</span>
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
            {loading ? (
              <div className="flex justify-center py-10">
                <div className="h-8 w-8 rounded-full border-2 border-gray-300 border-t-green-600 animate-spin"></div>
              </div>
            ) : recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    className={`
                      border-l-4 p-3 rounded-sm
                      ${activity.type === 'new_bid' ? 'bg-green-50 border-green-500' : 
                        activity.type === 'auction_ended' ? 'bg-blue-50 border-blue-500' : 
                        'bg-amber-50 border-amber-500'}
                    `}
                  >
                    <p className="text-sm font-semibold">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.description}</p>
                    <p className="text-xs text-gray-400">{activity.timeAgo}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-10">No recent activity</p>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div className="mb-8">
        <RecentSales />
      </div>
      
      <MarketPriceAnalytics className="mb-8" />
    </div>
  );
};

export default FarmerDashboard;
