
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from '@/context/AuthContext';
import MarketPriceAnalytics from '@/components/farmer/MarketPriceAnalytics';
import { IndianRupee, TrendingUp, ShoppingBasket, Users, Bell } from 'lucide-react';
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

  // Fetch real-time dashboard data
  useEffect(() => {
    if (!user) return;
    
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
        
        // 2. Fetch pending bids (products with bids)
        const { data: productsWithBids, error: bidsError } = await supabase
          .from('products')
          .select(`
            id,
            name,
            bids:bids(count)
          `)
          .eq('farmer_id', user.id)
          .eq('available', true)
          .not('bids', 'is', null);
          
        if (bidsError) {
          console.error('Error fetching products with bids:', bidsError);
        }
        
        // 3. Fetch completed sales
        const { count: completedSalesCount, error: salesError } = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('farmer_id', user.id)
          .eq('available', false)
          .eq('paid', true);
          
        if (salesError) {
          console.error('Error fetching completed sales:', salesError);
        }
        
        // 4. Calculate earnings
        const { data: earnings, error: earningsError } = await supabase
          .from('products')
          .select(`
            id,
            price,
            bids (amount)
          `)
          .eq('farmer_id', user.id)
          .eq('paid', true);
          
        if (earningsError) {
          console.error('Error fetching earnings:', earningsError);
        }
        
        // Calculate total earnings
        let totalEarnings = 0;
        if (earnings) {
          earnings.forEach(product => {
            // If product has bids, use the highest bid amount, otherwise use the product price
            if (product.bids && product.bids.length > 0) {
              const highestBid = Math.max(...product.bids.map((bid: any) => bid.amount));
              totalEarnings += highestBid;
            } else {
              totalEarnings += product.price;
            }
          });
        }
        
        // 5. Recent activities
        const fetchRecentActivities = async () => {
          // Get recent bids across all farmer's products
          const { data: products, error: productsError } = await supabase
            .from('products')
            .select('id, name')
            .eq('farmer_id', user.id);
            
          if (productsError) {
            console.error('Error fetching products for activities:', productsError);
            return [];
          }
          
          if (!products || products.length === 0) return [];
          
          const productIds = products.map(p => p.id);
          
          // Get recent bids
          const { data: recentBids, error: recentBidsError } = await supabase
            .from('bids')
            .select(`
              id,
              bidder_name,
              amount,
              created_at,
              product_id
            `)
            .in('product_id', productIds)
            .order('created_at', { ascending: false })
            .limit(5);
            
          if (recentBidsError) {
            console.error('Error fetching recent bids:', recentBidsError);
            return [];
          }
          
          // Transform bids to activities
          const bidActivities: RecentActivity[] = (recentBids || []).map(bid => {
            const productName = products.find(p => p.id === bid.product_id)?.name || 'Product';
            return {
              id: `bid-${bid.id}`,
              type: 'new_bid',
              title: 'New bid received',
              description: `${productName} - ₹${bid.amount} by ${bid.bidder_name}`,
              time: bid.created_at,
              timeAgo: formatDistanceToNow(new Date(bid.created_at), { addSuffix: true })
            };
          });
          
          return bidActivities;
        };
        
        const activities = await fetchRecentActivities();
        
        // Update the dashboard data state
        setDashboardStats({
          totalEarnings: {
            week: totalEarnings * 0.25, // Example calculation - replace with actual data
            month: totalEarnings,
            year: totalEarnings * 12 // Example calculation - replace with actual data
          },
          activeListings: activeListingsCount || 0,
          pendingBids: productsWithBids?.length || 0,
          completedSales: completedSalesCount || 0
        });
        
        setRecentActivities(activities);
        setLoading(false);
        
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
        setLoading(false);
      }
    };
    
    fetchDashboardData();
    
    // Subscribe to real-time updates for bids on farmer's products
    const setupRealtimeBids = async () => {
      // Get farmer's products first
      const { data: products, error } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user.id);
        
      if (error || !products) {
        console.error('Error fetching products for realtime updates:', error);
        return;
      }
      
      const productIds = products.map(p => p.id);
      
      if (productIds.length === 0) return;
      
      // Subscribe to bid changes
      const channel = supabase
        .channel('farmer-dashboard-updates')
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'bids',
            filter: `product_id=in.(${productIds.join(',')})` 
          }, 
          async (payload) => {
            console.log('New bid received in dashboard:', payload);
            const newBid = payload.new as Bid;
            
            // Get product name
            const { data: product } = await supabase
              .from('products')
              .select('name')
              .eq('id', newBid.product_id)
              .single();
              
            // Show notification
            toast.success(`New bid of ₹${newBid.amount} placed on ${product?.name || 'your product'} by ${newBid.bidder_name}`);
            setHasNewNotifications(true);
            
            // Update recent activities
            const newActivity: RecentActivity = {
              id: `bid-${newBid.id}`,
              type: 'new_bid',
              title: 'New bid received',
              description: `${product?.name || 'Your product'} - ₹${newBid.amount} by ${newBid.bidder_name}`,
              time: newBid.created_at,
              timeAgo: formatDistanceToNow(new Date(newBid.created_at), { addSuffix: true })
            };
            
            setRecentActivities(prev => [newActivity, ...prev].slice(0, 5));
            
            // Update dashboard stats
            setDashboardStats(prev => ({
              ...prev,
              pendingBids: prev.pendingBids + 1
            }));
          }
        )
        .subscribe();
        
      return channel;
    };
    
    const channel = setupRealtimeBids();
    
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
            className={`h-6 w-6 cursor-pointer ${hasNewNotifications ? 'text-red-500' : 'text-gray-400'}`}
            onClick={() => setHasNewNotifications(false)}
          />
          {hasNewNotifications && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 rounded-full flex items-center justify-center bg-red-500">
              !
            </Badge>
          )}
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
              <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.totalEarnings.month.toLocaleString()}</div>
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
            <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.activeListings}</div>
            <p className="text-xs text-gray-600 mt-1">Products in marketplace</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-500">Pending Bids</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? '...' : dashboardStats.pendingBids}</div>
            <p className="text-xs text-gray-600 mt-1">Bids awaiting your response</p>
          </CardContent>
        </Card>

        <Card>
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
      
      {/* Market Price Analytics Section */}
      <MarketPriceAnalytics className="mb-8" />
    </div>
  );
};

export default FarmerDashboard;
