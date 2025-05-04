
import { ReactNode } from 'react';
import { Navigate, Outlet, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarTrigger,
  SidebarInset
} from '@/components/ui/sidebar';
import { Home, Package, CreditCard, Settings, LogOut, User, Plus, List } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MainLayoutProps {
  userRole: 'farmer' | 'buyer';
}

const MainLayout = ({ userRole }: MainLayoutProps) => {
  const { user, logout, isFarmer, isBuyer } = useAuth();
  const location = useLocation();
  
  // Redirect if user is not authenticated or has wrong role
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if ((userRole === 'farmer' && !isFarmer()) || (userRole === 'buyer' && !isBuyer())) {
    return <Navigate to="/" />;
  }

  const getFarmerNavItems = () => [
    { icon: Home, title: 'Dashboard', path: '/farmer' },
    { icon: Plus, title: 'Add Product', path: '/farmer/add-product' },
    { icon: Package, title: 'My Products', path: '/farmer/my-products' },
    { icon: CreditCard, title: 'Payment Info', path: '/farmer/payment-info' },
    { icon: User, title: 'Profile', path: '/farmer/profile' },
  ];

  const getBuyerNavItems = () => [
    { icon: Home, title: 'Dashboard', path: '/buyer' },
    { icon: Package, title: 'Browse Products', path: '/buyer/browse-products' },
    { icon: List, title: 'My Bids', path: '/buyer/my-bids' },
    { icon: CreditCard, title: 'Payment Details', path: '/buyer/payment-details' },
    { icon: User, title: 'Profile', path: '/buyer/profile' },
  ];

  const navItems = userRole === 'farmer' ? getFarmerNavItems() : getBuyerNavItems();

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link to={userRole === 'farmer' ? '/farmer' : '/buyer'}>
              <div className="flex items-center gap-2">
                <Package className="h-6 w-6 text-green-600" />
                <span className="text-xl font-bold">Go Fresh</span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === item.path}
                  >
                    <Link to={item.path}>
                      <item.icon className="h-5 w-5" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <div className="p-4">
              <Button 
                variant="outline" 
                className="w-full flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                onClick={logout}
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <SidebarInset className="p-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <SidebarTrigger className="h-8 w-8 lg:hidden" />
            </div>
            <div className="text-sm text-gray-500">
              Welcome, {user?.name} ({userRole})
            </div>
          </div>
          
          <Outlet />
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default MainLayout;
