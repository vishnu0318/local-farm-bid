
import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Menu, X, LogOut, User } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/integrations/supabase/client';
import { Notification } from '@/types/marketplace';
import NotificationsDropdown from './NotificationsDropdown';

const Navigation = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Fetch notifications for the user
  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      let query;
      
      if (user.role === 'farmer') {
        query = supabase
          .from('notifications')
          .select('*')
          .eq('farmer_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
      } else {
        query = supabase
          .from('notifications')
          .select('*')
          .eq('bidder_id', user.id)
          .order('created_at', { ascending: false })
          .limit(10);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching notifications:', error);
        return;
      }
      
      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    };

    fetchNotifications();

    // Set up real-time subscription for new notifications
    const channel = supabase
      .channel('notifications-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: user.role === 'farmer' 
            ? `farmer_id=eq.${user.id}` 
            : `bidder_id=eq.${user.id}`
        },
        (payload) => {
          const newNotification = payload.new as Notification;
          setNotifications(prev => [newNotification, ...prev].slice(0, 10));
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAllAsRead = async () => {
    if (!user || notifications.length === 0) return;
    
    try {
      let query;
      
      if (user.role === 'farmer') {
        query = supabase
          .from('notifications')
          .update({ read: true })
          .eq('farmer_id', user.id)
          .eq('read', false);
      } else {
        query = supabase
          .from('notifications')
          .update({ read: true })
          .eq('bidder_id', user.id)
          .eq('read', false);
      }
      
      await query;
      
      // Update local state
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking notifications as read:', error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <nav className="bg-white shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="text-xl font-bold text-green-600">
                FarmConnect
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {user ? (
                user.role === 'farmer' ? (
                  // Farmer navigation
                  <>
                    <Link
                      to="/farmer/dashboard"
                      className={`${
                        location.pathname === '/farmer/dashboard'
                          ? 'border-green-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      to="/farmer/products"
                      className={`${
                        location.pathname === '/farmer/products'
                          ? 'border-green-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      My Products
                    </Link>
                    <Link
                      to="/farmer/add-product"
                      className={`${
                        location.pathname === '/farmer/add-product'
                          ? 'border-green-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Add Product
                    </Link>
                    <Link
                      to="/farmer/sales-history"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Sales History
                    </Link>
                  </>
                ) : (
                  // Buyer navigation
                  <>
                    <Link
                      to="/buyer/marketplace"
                      className={`${
                        location.pathname === '/buyer/marketplace'
                          ? 'border-green-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      Marketplace
                    </Link>
                    <Link
                      to="/buyer/my-bids"
                      className={`${
                        location.pathname === '/buyer/my-bids'
                          ? 'border-green-500 text-gray-900'
                          : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                      } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                    >
                      My Bids
                    </Link>
                    <Link
                      to="/buyer/order-history"
                      className="text-gray-700 hover:text-green-600 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Order History
                    </Link>
                  </>
                )
              ) : (
                // Public navigation
                <>
                  <Link
                    to="/about"
                    className={`${
                      location.pathname === '/about'
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    About
                  </Link>
                  <Link
                    to="/contact"
                    className={`${
                      location.pathname === '/contact'
                        ? 'border-green-500 text-gray-900'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                  >
                    Contact
                  </Link>
                </>
              )}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user ? (
              <>
                {/* Notifications */}
                <div className="ml-3 relative">
                  <NotificationsDropdown 
                    notifications={notifications}
                    unreadCount={unreadCount}
                    markAllAsRead={markAllAsRead}
                  />
                </div>
                
                {/* Profile dropdown */}
                <div className="ml-3 relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative rounded-full p-1 text-gray-400 hover:text-gray-500 focus:outline-none">
                        <span className="sr-only">Open user menu</span>
                        <Avatar>
                          <AvatarImage src="" />
                          <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </>
            ) : (
              <div className="flex space-x-4">
                <Link to="/login">
                  <Button variant="outline">Login</Button>
                </Link>
                <Link to="/register">
                  <Button>Register</Button>
                </Link>
              </div>
            )}
          </div>
          <div className="-mr-2 flex items-center sm:hidden">
            {/* Mobile menu button */}
            <button
              onClick={toggleMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            >
              <span className="sr-only">Open main menu</span>
              {isMenuOpen ? (
                <X className="block h-6 w-6" aria-hidden="true" />
              ) : (
                <Menu className="block h-6 w-6" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {user ? (
              user.role === 'farmer' ? (
                // Farmer mobile navigation
                <>
                  <Link
                    to="/farmer/dashboard"
                    className={`${
                      location.pathname === '/farmer/dashboard'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={toggleMenu}
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/farmer/products"
                    className={`${
                      location.pathname === '/farmer/products'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={toggleMenu}
                  >
                    My Products
                  </Link>
                  <Link
                    to="/farmer/add-product"
                    className={`${
                      location.pathname === '/farmer/add-product'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={toggleMenu}
                  >
                    Add Product
                  </Link>
                  <Link
                    to="/farmer/sales-history"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-base font-medium"
                    onClick={toggleMenu}
                  >
                    Sales History
                  </Link>
                </>
              ) : (
                // Buyer mobile navigation
                <>
                  <Link
                    to="/buyer/marketplace"
                    className={`${
                      location.pathname === '/buyer/marketplace'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={toggleMenu}
                  >
                    Marketplace
                  </Link>
                  <Link
                    to="/buyer/my-bids"
                    className={`${
                      location.pathname === '/buyer/my-bids'
                        ? 'bg-green-50 border-green-500 text-green-700'
                        : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                    } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                    onClick={toggleMenu}
                  >
                    My Bids
                  </Link>
                  <Link
                    to="/buyer/order-history"
                    className="block pl-3 pr-4 py-2 border-l-4 border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 text-base font-medium"
                    onClick={toggleMenu}
                  >
                    Order History
                  </Link>
                </>
              )
            ) : (
              // Public mobile navigation
              <>
                <Link
                  to="/about"
                  className={`${
                    location.pathname === '/about'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={toggleMenu}
                >
                  About
                </Link>
                <Link
                  to="/contact"
                  className={`${
                    location.pathname === '/contact'
                      ? 'bg-green-50 border-green-500 text-green-700'
                      : 'border-transparent text-gray-500 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
                  onClick={toggleMenu}
                >
                  Contact
                </Link>
              </>
            )}
          </div>
          {user ? (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="flex items-center px-4">
                <div className="flex-shrink-0">
                  <Avatar>
                    <AvatarImage src="" />
                    <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                  </Avatar>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user.email}</div>
                </div>
                <div className="ml-auto flex-shrink-0 relative">
                  <NotificationsDropdown 
                    notifications={notifications}
                    unreadCount={unreadCount}
                    markAllAsRead={markAllAsRead}
                    isMobile={true}
                  />
                </div>
              </div>
              <div className="mt-3 space-y-1">
                <Link
                  to="/profile"
                  className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                  onClick={toggleMenu}
                >
                  Your Profile
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    toggleMenu();
                  }}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Sign out
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-4 pb-3 border-t border-gray-200">
              <div className="space-y-1 px-4">
                <Link
                  to="/login"
                  className="block text-center py-2 rounded-md text-base font-medium text-white bg-green-600 hover:bg-green-700"
                  onClick={toggleMenu}
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="block text-center py-2 rounded-md text-base font-medium text-green-700 bg-green-100 hover:bg-green-200 mt-2"
                  onClick={toggleMenu}
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navigation;
