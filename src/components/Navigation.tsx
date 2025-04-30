
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, User, LogOut, ShoppingBasket, Map } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";

const Navigation = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <ShoppingBasket className="h-8 w-8 text-farmgreen-500" />
              <span className="ml-2 text-xl font-bold text-farmgreen-500">FarmBid Local</span>
            </Link>
          </div>
          
          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link to="/marketplace" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-farmgreen-500">
              Marketplace
            </Link>
            
            <Link to="/how-it-works" className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-farmgreen-500">
              How It Works
            </Link>

            {isAuthenticated ? (
              <>
                <Link 
                  to={user?.role === 'farmer' ? "/my-listings" : "/my-bids"} 
                  className="px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-farmgreen-500"
                >
                  {user?.role === 'farmer' ? "My Listings" : "My Bids"}
                </Link>
                
                <div className="relative ml-3">
                  <div className="flex items-center space-x-3">
                    <Link to="/profile" className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-farmgreen-500">
                      <User size={16} />
                      <span>{user?.name}</span>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={logout}
                      className="flex items-center space-x-1"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex space-x-2">
                <Link to="/login">
                  <Button variant="outline" size="sm">Login</Button>
                </Link>
                <Link to="/register">
                  <Button size="sm">Sign Up</Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-farmgreen-500 focus:outline-none"
              aria-expanded="false"
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
      <div className={`${isMenuOpen ? 'block' : 'hidden'} md:hidden`}>
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          <Link 
            to="/marketplace" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
            onClick={() => setIsMenuOpen(false)}
          >
            Marketplace
          </Link>
          
          <Link 
            to="/how-it-works" 
            className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
            onClick={() => setIsMenuOpen(false)}
          >
            How It Works
          </Link>

          {isAuthenticated && (
            <Link 
              to={user?.role === 'farmer' ? "/my-listings" : "/my-bids"} 
              className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
              onClick={() => setIsMenuOpen(false)}
            >
              {user?.role === 'farmer' ? "My Listings" : "My Bids"}
            </Link>
          )}
        </div>
        
        {/* Mobile navigation actions */}
        <div className="pt-4 pb-3 border-t border-gray-200">
          {isAuthenticated ? (
            <>
              <div className="flex items-center px-5">
                <div className="ml-3">
                  <div className="text-base font-medium text-gray-800">{user?.name}</div>
                  <div className="text-sm font-medium text-gray-500">{user?.role}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <Link 
                  to="/profile" 
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                  className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
                >
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="mt-3 px-2 space-y-1">
              <Link 
                to="/login" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </Link>
              <Link 
                to="/register" 
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:bg-farmgreen-50 hover:text-farmgreen-500"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
