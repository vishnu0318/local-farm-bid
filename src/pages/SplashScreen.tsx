
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const SplashScreen = () => {
  const { user, isFarmer, isBuyer } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (user) {
      if (isFarmer()) {
        navigate('/farmer');
      } else if (isBuyer()) {
        navigate('/buyer');
      }
    }
  }, [user, isFarmer, isBuyer, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 to-green-100 p-4">
      <div className="max-w-md w-full text-center">
        <h1 className="text-5xl font-bold text-green-600 mb-8">Go Fresh</h1>
        
        <div className="bg-white p-8 rounded-xl shadow-lg">
          <h2 className="text-2xl font-semibold mb-6">Welcome to Go Fresh</h2>
          <p className="text-gray-600 mb-8">
            Connect local farmers with buyers for the freshest produce directly from the source
          </p>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="border border-green-200 rounded-lg p-6 bg-green-50 hover:bg-green-100 transition-colors">
              <h3 className="text-xl font-semibold text-green-700 mb-2">I am a Farmer</h3>
              <p className="text-gray-600 mb-4">Sell your produce directly to local buyers</p>
              <Link to="/login?role=farmer">
                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Farmer</Button>
              </Link>
            </div>
            
            <div className="border border-blue-200 rounded-lg p-6 bg-blue-50 hover:bg-blue-100 transition-colors">
              <h3 className="text-xl font-semibold text-blue-700 mb-2">I am a Buyer</h3>
              <p className="text-gray-600 mb-4">Find and purchase fresh local produce</p>
              <Link to="/login?role=buyer">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Login as Buyer</Button>
              </Link>
            </div>
          </div>
          
          <p className="text-gray-500 text-sm">
            New to Go Fresh?{" "}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SplashScreen;
