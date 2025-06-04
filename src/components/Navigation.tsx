
import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu, LogOut, User, Home, ShoppingCart, Package, Plus, History, CreditCard, Bell } from 'lucide-react';
import NotificationsDropdown from './NotificationsDropdown';
import { supabase } from '@/integrations/supabase/client';

const Navigation = () => {
  const { user, logout, profile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);

  // Get user role from user metadata
  const userRole = user?.user_metadata?.role;

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!user || !userRole) return;
      
      try {
        let query = supabase.from('notifications').select('*');
        
        if (userRole === 'farmer') {
          query = query.eq('farmer_id', user.id);
        } else if (userRole === 'buyer') {
          query = query.eq('bidder_id', user.id);
        }
        
        const { data } = await query.order('created_at', { ascending: false }).limit(10);
        setNotifications(data || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, [user, userRole]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getNavItems = () => {
    if (!user) return [];
    
    if (userRole === 'farmer') {
      return [
        { label: 'Dashboard', path: '/farmer/dashboard', icon: Home },
        { label: 'My Products', path: '/farmer/my-products', icon: Package },
        { label: 'Add Product', path: '/farmer/add-product', icon: Plus },
        { label: 'Payment Info', path: '/farmer/payment-info', icon: CreditCard },
        { label: 'Profile', path: '/farmer/profile', icon: User },
      ];
    } else if (userRole === 'buyer') {
      return [
        { label: 'Dashboard', path: '/buyer/dashboard', icon: Home },
        { label: 'Browse Products', path: '/buyer/browse-products', icon: ShoppingCart },
        { label: 'My Bids', path: '/buyer/my-bids', icon: Package },
        { label: 'Order History', path: '/buyer/order-history', icon: History },
        { label: 'Profile', path: '/buyer/profile', icon: User },
      ];
    }
    
    return [];
  };

  const navItems = getNavItems();

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const getUserDisplayName = () => {
    return profile?.name || user?.user_metadata?.name || user?.email?.split('@')[0] || 'User';
  };

  const renderNavItems = () => (
    <>
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
              isActive(item.path)
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
            }`}
            onClick={() => setIsOpen(false)}
          >
            <Icon className="h-4 w-4 mr-3" />
            {item.label}
          </Link>
        );
      })}
    </>
  );

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-xl font-bold text-green-600">AgriMarket</h1>
            </Link>
          </div>

          {user ? (
            <>
              {/* Desktop Navigation */}
              <div className="hidden md:flex items-center space-x-1">
                {renderNavItems()}
                
                <div className="flex items-center ml-4 space-x-2">
                  <NotificationsDropdown 
                    notifications={notifications}
                    userRole={userRole}
                  />
                  
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-700">
                      {getUserDisplayName()}
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                      {userRole}
                    </span>
                  </div>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mobile Navigation */}
              <div className="md:hidden flex items-center space-x-2">
                <NotificationsDropdown 
                  notifications={notifications}
                  userRole={userRole}
                />
                
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-80">
                    <div className="flex flex-col space-y-4 mt-6">
                      <div className="flex items-center space-x-2 pb-4 border-b">
                        <User className="h-5 w-5 text-gray-600" />
                        <div>
                          <p className="text-sm font-medium">{getUserDisplayName()}</p>
                          <p className="text-xs text-gray-500 capitalize">{userRole}</p>
                        </div>
                      </div>
                      
                      <div className="flex flex-col space-y-2">
                        {renderNavItems()}
                      </div>
                      
                      <div className="pt-4 border-t">
                        <Button
                          variant="ghost"
                          onClick={handleLogout}
                          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <LogOut className="h-4 w-4 mr-3" />
                          Logout
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
