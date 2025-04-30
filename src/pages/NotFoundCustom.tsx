
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

const NotFoundCustom = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="text-center px-4 sm:px-6 lg:px-8">
          <h1 className="text-6xl font-bold text-farmgreen-500 mb-4">404</h1>
          <h2 className="text-3xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-lg mx-auto">
            The page you're looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/">
              <Button>Back to Home</Button>
            </Link>
            <Link to="/marketplace">
              <Button variant="outline">Browse Marketplace</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default NotFoundCustom;
