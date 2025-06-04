
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
        if (payload.new && payload.new.farmer_id === profile?.id) {
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">
            {profile.role === 'farmer' ? 'Farmer Portal' : 'Buyer Portal'}
          </h2>
          <p className="text-sm text-gray-600">{profile.name}</p>
        </div>
        
        <nav className="p-4">
          <ul className="space-y-2">
            {currentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <li key={item.path}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-start"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="mr-3 h-4 w-4" />
                    {item.label}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <Separator className="mb-4" />
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
          >
            <LogOut className="mr-3 h-4 w-4" />
            Logout
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <header className="bg-white shadow-sm border-b p-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold text-gray-800">
              Go Fresh Marketplace
            </h1>
            
            <div className="flex items-center space-x-4">
              <NotificationsDropdown 
                notifications={notifications}
                unreadCount={unreadNotifications}
                markAllAsRead={markAllAsRead}
              />
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <span className="text-sm font-medium">{profile.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
