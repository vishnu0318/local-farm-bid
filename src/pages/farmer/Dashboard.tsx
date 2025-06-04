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

  // Enhanced fetch function with real-time payment tracking
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch active listings count
      const { count: activeListingsCount, error: activeListingsError } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('farmer_id', user.id)
        .eq('available', true);
        
      if (activeListingsError) {
        console.error('Error fetching active listings:', activeListingsError);
      }
      
      // 2. Fetch pending bids count (products with active bids)
      const { data: productsWithBids, error: bidsError } = await supabase
        .from('products')
        .select(`
          id,
          name,
          bids:bids(count)
        `)
        .eq('farmer_id', user.id)
        .eq('available', true);
        
      if (bidsError) {
        console.error('Error fetching products with bids:', bidsError);
      }
      
      const pendingBidsCount = productsWithBids?.filter(p => p.bids && p.bids.length > 0).length || 0;
      
      // 3. Fetch completed sales count from orders table
      const { data: farmerProducts } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user.id);
        
      const productIds = farmerProducts?.map(p => p.id) || [];
      
      let completedSalesCount = 0;
      let totalEarnings = 0;
      let weeklyEarnings = 0;
      let yearlyEarnings = 0;
      
      if (productIds.length > 0) {
        // Get completed orders (payments received)
        const { data: completedOrders, error: ordersError } = await supabase
          .from('orders')
          .select('*')
          .in('product_id', productIds)
          .eq('payment_status', 'completed');
          
        if (ordersError) {
          console.error('Error fetching completed orders:', ordersError);
        } else {
          completedSalesCount = completedOrders?.length || 0;
          
          // Calculate earnings
          const now = new Date();
          const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          const oneYearAgo = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          
          completedOrders?.forEach(order => {
            const orderDate = new Date(order.payment_date || order.created_at);
            totalEarnings += order.amount;
            
            if (orderDate >= oneWeekAgo) {
              weeklyEarnings += order.amount;
            }
            if (orderDate >= oneYearAgo) {
              yearlyEarnings += order.amount;
            }
          });
        }
      }
      
      // 4. Recent activities from orders
      const fetchRecentActivities = async () => {
        if (productIds.length === 0) return [];
        
        const { data: recentOrders } = await supabase
          .from('orders')
          .select(`
            *,
            product:product_id(name)
          `)
          .in('product_id', productIds)
          .eq('payment_status', 'completed')
          .order('payment_date', { ascending: false })
          .limit(3);
          
        const orderActivities: RecentActivity[] = (recentOrders || []).map(order => ({
          id: `payment-${order.id}`,
          type: 'payment_received',
          title: 'Payment received',
          description: `${order.product?.name || 'Product'} - ₹${order.amount}`,
          time: order.payment_date || order.created_at,
          timeAgo: formatDistanceToNow(new Date(order.payment_date || order.created_at), { addSuffix: true })
        }));
        
        // Also get recent bids
        const { data: recentBids } = await supabase
          .from('bids')
          .select(`
            *,
            product:product_id(name)
          `)
          .in('product_id', productIds)
          .order('created_at', { ascending: false })
          .limit(2);
          
        const bidActivities: RecentActivity[] = (recentBids || []).map(bid => ({
          id: `bid-${bid.id}`,
          type: 'new_bid',
          title: 'New bid received',
          description: `${bid.product?.name || 'Product'} - ₹${bid.amount} by ${bid.bidder_name}`,
          time: bid.created_at,
          timeAgo: formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })
        }));
        
        return [...orderActivities, ...bidActivities]
          .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 5);
      };
      
      const activities = await fetchRecentActivities();
      
      // Update the dashboard data state
      setDashboardStats({
        totalEarnings: {
          week: weeklyEarnings,
          month: totalEarnings, // Monthly earnings (current month)
          year: yearlyEarnings
        },
        activeListings: activeListingsCount || 0,
        pendingBids: pendingBidsCount,
        completedSales: completedSalesCount
      });
      
      setRecentActivities(activities);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  // Fetch real-time dashboard data
  useEffect(() => {
    if (!user) return;
    
    fetchDashboardData();
    
    // Set up real-time listeners for both bids and orders
    const setupRealtimeUpdates = async () => {
      const { data: products } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user.id);
        
      if (!products) return null;
      
      const productIds = products.map(p => p.id);
      
      if (productIds.length === 0) return null;
      
      // Subscribe to both bid and order changes
      return supabase
        .channel('farmer-dashboard-updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'bids',
            filter: `product_id=in.(${productIds.join(',')})` 
          }, 
          async (payload) => {
            console.log('New bid received:', payload);
            toast.success(`New bid received!`);
            setHasNewNotifications(true);
            // Refresh dashboard data
            fetchDashboardData();
          }
        )
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'orders',
            filter: `product_id=in.(${productIds.join(',')})`
          },
          async (payload) => {
            console.log('New payment received:', payload);
            const newOrder = payload.new as any;
            if (newOrder.payment_status === 'completed') {
              toast.success(`Payment of ₹${newOrder.amount} received!`);
              setHasNewNotifications(true);
              // Refresh dashboard data immediately
              fetchDashboardData();
            }
          }
        )
        .on('postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'orders',
            filter: `product_id=in.(${productIds.join(',')})`
          },
          async (payload) => {
            console.log('Order updated:', payload);
            const updatedOrder = payload.new as any;
            if (updatedOrder.payment_status === 'completed') {
              toast.success(`Payment of ₹${updatedOrder.amount} confirmed!`);
              setHasNewNotifications(true);
              // Refresh dashboard data immediately
              fetchDashboardData();
            }
          }
        )
        .subscribe();
    };
    
    let channel: any = null;
    
    setupRealtimeUpdates().then(result => {
      channel = result;
    });
    
    // Cleanup
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
    
  }, [user]);

  // Get earnings based on selected period
  const earnings = dashboardStats.totalEarnings[selectedPeriod as keyof typeof dashboardStats.totalEarnings];
  
  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
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
      
      {/* Recent Sales Section */}
      <div className="mb-8">
        <RecentSales />
      </div>
      
      {/* Market Price Analytics Section */}
      <MarketPriceAnalytics className="mb-8" />
    </div>
  );
};

export default FarmerDashboard;
