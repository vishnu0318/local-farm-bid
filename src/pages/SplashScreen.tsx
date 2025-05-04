
import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { IndianRupee, Sprout, ShoppingBag } from 'lucide-react';

const SplashScreen = () => {
  const { user, isFarmer, isBuyer, loading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect authenticated users to their respective dashboards
  useEffect(() => {
    if (!loading && user) {
      if (isFarmer()) {
        navigate('/farmer');
      } else if (isBuyer()) {
        navigate('/buyer');
      }
    }
  }, [user, isFarmer, isBuyer, navigate, loading]);

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.3 }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { duration: 0.5 }
    }
  };

  const logoVariants = {
    hidden: { scale: 0.8, opacity: 0 },
    visible: { 
      scale: 1,
      opacity: 1,
      transition: { 
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-green-50 via-green-100 to-emerald-100">
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-md w-full text-center px-4"
      >
        <motion.div 
          variants={logoVariants}
          className="mb-10"
        >
          <div className="flex items-center justify-center">
            <span className="text-6xl font-bold text-green-600">Go</span>
            <IndianRupee className="h-16 w-16 text-green-700 mx-1" />
            <span className="text-6xl font-bold text-green-500">Fresh</span>
          </div>
          <p className="text-lg text-green-700 mt-2">Farm Fresh, Directly to You</p>
        </motion.div>
        
        <motion.div 
          variants={itemVariants} 
          className="bg-white p-8 rounded-xl shadow-lg border-t-4 border-green-500"
        >
          <motion.h2 variants={itemVariants} className="text-2xl font-semibold mb-6">Welcome to Go Fresh</motion.h2>
          <motion.p variants={itemVariants} className="text-gray-600 mb-8">
            Connect local farmers with buyers for the freshest produce directly from the source
          </motion.p>
          
          <div className="grid grid-cols-1 gap-6 mb-6">
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="border border-green-200 rounded-lg p-6 bg-green-50 hover:bg-green-100 transition-colors"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Sprout className="h-6 w-6 text-green-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-green-700 mb-2">I am a Farmer</h3>
              <p className="text-gray-600 mb-4">Sell your produce directly to local buyers</p>
              <Link to="/login?role=farmer">
                <Button className="w-full bg-green-600 hover:bg-green-700">Login as Farmer</Button>
              </Link>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.03 }}
              className="border border-blue-200 rounded-lg p-6 bg-blue-50 hover:bg-blue-100 transition-colors"
            >
              <div className="flex items-center justify-center mb-4">
                <div className="p-3 bg-blue-100 rounded-full">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
              </div>
              <h3 className="text-xl font-semibold text-blue-700 mb-2">I am a Buyer</h3>
              <p className="text-gray-600 mb-4">Find and purchase fresh local produce</p>
              <Link to="/login?role=buyer">
                <Button className="w-full bg-blue-600 hover:bg-blue-700">Login as Buyer</Button>
              </Link>
            </motion.div>
          </div>
          
          <motion.p variants={itemVariants} className="text-gray-500 text-sm">
            New to Go Fresh?{" "}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-medium">
              Create an account
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default SplashScreen;
