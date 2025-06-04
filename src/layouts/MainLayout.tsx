
import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  User, 
  ShoppingBag, 
  DollarSign, 
  Package, 
  Plus, 
  Home, 
  Bell,
  History,
  Receipt,
  TrendingUp,
  CreditCard,
  LogOut
} from 'lucide-react';
import NotificationsDropdown from '@/components/NotificationsDropdown';
import { toast } from 'sonner';

const MainLayout = () => {
  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (user && profile) {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('farmer_id', profile.id)
          .eq('read', false);

        if (error) {
          console.error('Error fetching notifications:', error);
        } else {
          setUnreadNotifications(data?.length || 0);
          setNotifications(data || []);
        }
      }
    };

    fetchNotifications();

    const notificationListener = supabase
      .channel('public:notifications')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, (payload) => {
        if (payload.new && typeof payload.new === 'object' && 'farmer_id' in payload.new && payload.new.farmer_id === profile?.id) {
          fetchNotifications();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationListener);
    };
  }, [user, profile]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Logged out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Error logging out');
    }
  };

  const markAllAsRead = async () => {
    if (user && profile) {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('farmer_id', profile.id)
        .eq('read', false);

      if (error) {
        console.error('Error marking notifications as read:', error);
        toast.error('Error marking notifications as read');
      } else {
        setUnreadNotifications(0);
        setNotifications([]);
        toast.success('All notifications marked as read');
      }
    }
  };

  const buyerNavItems = [
    { path: '/buyer/dashboard', label: 'Dashboard', icon: Home },
    { path: '/buyer/browse-products', label: 'Browse Products', icon: ShoppingBag },
    { path: '/buyer/my-bids', label: 'My Bids', icon: DollarSign },
    { path: '/buyer/order-history', label: 'Order History', icon: History },
    { path: '/buyer/profile', label: 'Profile', icon: User },
  ];

  const farmerNavItems = [
    { path: '/farmer/dashboard', label: 'Dashboard', icon: Home },
    { path: '/farmer/my-products', label: 'My Products', icon: Package },
    { path: '/farmer/add-product', label: 'Add Product', icon: Plus },
    { path: '/farmer/sales-history', label: 'Sales History', icon: TrendingUp },
    { path: '/farmer/payment-info', label: 'Payment Info', icon: CreditCard },
    { path: '/farmer/profile', label: 'Profile', icon: User },
  ];

  const currentNavItems = profile?.role === 'farmer' ? farmerNavItems : buyerNavItems;

  if (!user || !profile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent shadow-lg"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50 to-blue-50 flex">
      {/* Static Sidebar with Glass Effect */}
      <div className="w-72 bg-white/80 backdrop-blur-xl shadow-2xl border-r border-white/20 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-secondary/5"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary animate-pulse"></div>
        
        {/* Header */}
        <div className="relative p-6 border-b border-white/20 bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex items-center space-x-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform duration-300">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {profile.role === 'farmer' ? 'Farmer Portal' : 'Buyer Portal'}
              </h2>
              <p className="text-sm text-gray-600 font-medium">{profile.name}</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="relative p-4 flex-1">
          <ul className="space-y-2">
            {currentNavItems.map((item, index) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path} 
                    className="transform transition-all duration-300 hover:scale-105"
                    style={{ animationDelay: `${index * 100}ms` }}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start h-12 group relative overflow-hidden ${
                      isActive 
                        ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg hover:shadow-xl" 
                        : "hover:bg-white/60 hover:shadow-md"
                    } transition-all duration-300 rounded-xl`}
                    onClick={() => navigate(item.path)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
                    <Icon className={`mr-3 h-5 w-5 ${isActive ? 'text-white' : 'text-primary'} transition-colors duration-300`} />
                    <span className="font-medium">{item.label}</span>
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Static Logout Button at Bottom */}
        <div className="relative p-4 border-t border-white/20 bg-gradient-to-r from-red-50/50 to-orange-50/50">
          <Button
            variant="ghost"
            className="w-full justify-start h-12 text-red-600 hover:text-red-700 hover:bg-red-50/80 group relative overflow-hidden transition-all duration-300 rounded-xl"
            onClick={handleLogout}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-red-100/0 via-red-100/50 to-red-100/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>
            <LogOut className="mr-3 h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
            <span className="font-medium">Logout</span>
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Enhanced Top Bar */}
        <header className="bg-white/90 backdrop-blur-xl shadow-lg border-b border-white/20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-secondary/5"></div>
          <div className="relative p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent animate-pulse">
                  Go Fresh Marketplace
                </h1>
                <div className="hidden md:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-gray-600 font-medium">Live</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-6">
                <NotificationsDropdown 
                  notifications={notifications}
                  unreadCount={unreadNotifications}
                  markAllAsRead={markAllAsRead}
                />
                <div className="flex items-center space-x-3 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg hover:shadow-xl transition-all duration-300 group">
                  <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{profile.name}</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Enhanced Page Content */}
        <main className="flex-1 p-8 overflow-auto relative">
          <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-white/20 pointer-events-none"></div>
          <div className="relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
