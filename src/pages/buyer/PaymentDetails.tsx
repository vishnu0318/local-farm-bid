
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle, Loader2, IndianRupee, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { createPaymentIntent, processCodPayment, processUpiPayment } from '@/services/paymentService';
import { getProductById } from '@/services/productService';
import { getHighestBid } from '@/services/bidService';
import { Product } from '@/types/marketplace';
import { toast } from "sonner";

const PaymentDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cod' | 'upi'>('card');
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [upiId, setUpiId] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [bidAmount, setBidAmount] = useState<number>(0);

  // Extract product ID from query params
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('product');

  useEffect(() => {
    const fetchProductDetails = async () => {
      setLoading(true);
      
      if (!productId) {
        toast.error("No product specified for payment");
        navigate('/buyer/my-bids');
        return;
      }
      
      // Try to fetch the product from the database
      let foundProduct: Product | null = null;
      
      try {
        foundProduct = await getProductById(productId);
        
        if (!foundProduct) {
          toast.error("Product not found");
          navigate('/buyer/my-bids');
          return;
        }
        
        // Get highest bid amount
        const highestBid = await getHighestBid(productId);
        setBidAmount(highestBid);
        
        setProduct(foundProduct);
        
        // If user has an address in their profile, use it as default
        if (user) {
          const { data: profileData } = await supabase
            .from('profiles')
            .select('address')
            .eq('id', user.id)
            .single();
            
          if (profileData?.address) {
            setDeliveryAddress(profileData.address);
          }
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
        navigate('/buyer/my-bids');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProductDetails();
  }, [productId, navigate, user]);

  const handlePayNow = async () => {
    if (!user || !product) return;
    
    setPaymentStatus('processing');
    
    try {
      if (!deliveryAddress) {
        toast.error("Please enter a delivery address");
        setPaymentStatus('idle');
        return;
      }
      
      if (paymentMethod === 'upi' && !upiId) {
        toast.error("Please enter your UPI ID");
        setPaymentStatus('idle');
        return;
      }
      
      // Process payment based on selected method
      if (paymentMethod === 'card') {
        // Create a Stripe payment intent
        const amount = bidAmount; // Use bid amount
        const { clientSecret, error } = await createPaymentIntent({
          amount: amount,
          productId: product.id,
          productName: product.name,
          paymentMethod: 'card',
        });
        
        if (error || !clientSecret) {
          toast.error(error || "Payment failed. Please try again.");
          setPaymentStatus('error');
          return;
        }
        
        // Redirect to Stripe checkout
        // In a real integration, we would use Stripe Elements here
        // For now, just simulate success
        toast.success("Payment processed successfully!");
        setPaymentStatus('success');
        
        // Redirect to success page after a delay
        setTimeout(() => {
          navigate('/buyer/my-bids');
        }, 2000);
      } 
      else if (paymentMethod === 'upi') {
        // Process UPI payment
        const result = await processUpiPayment(product.id, bidAmount, upiId);
        if (result.success) {
          toast.success(result.message || "UPI payment processed successfully!");
          setPaymentStatus('success');
          
          // Redirect to success page after a delay
          setTimeout(() => {
            navigate('/buyer/my-bids');
          }, 2000);
        } else {
          toast.error(result.message || "Payment failed. Please try again.");
          setPaymentStatus('error');
        }
      } 
      else if (paymentMethod === 'cod') {
        // Process COD payment
        const result = await processCodPayment(product.id, bidAmount);
        if (result.success) {
          toast.success(result.message || "Cash on Delivery order placed successfully!");
          setPaymentStatus('success');
          
          // Redirect to success page after a delay
          setTimeout(() => {
            navigate('/buyer/my-bids');
          }, 2000);
        } else {
          toast.error(result.message || "Order failed. Please try again.");
          setPaymentStatus('error');
        }
      }
    } catch (error) {
      console.error("Payment error:", error);
      toast.error("Payment failed. Please try again.");
      setPaymentStatus('error');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-4" />
        <p className="text-gray-500">Loading payment details...</p>
      </div>
    );
  }

  if (paymentStatus === 'success') {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="border-green-500">
          <CardHeader>
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-center text-2xl">Payment Successful!</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4">
              Your order has been confirmed. You will receive the product details shortly.
            </p>
            <Button onClick={() => navigate('/buyer/my-bids')} className="mt-4">
              View My Orders
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Payment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h2 className="text-lg font-medium mb-4">Payment Method</h2>
                <RadioGroup value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Credit / Debit Card
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 mb-2">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi">UPI Payment</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Cash on Delivery</Label>
                  </div>
                </RadioGroup>
              </div>
              
              <Separator />
              
              {paymentMethod === 'upi' && (
                <div>
                  <h2 className="text-lg font-medium mb-4">UPI Details</h2>
                  <div>
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                      id="upiId" 
                      value={upiId} 
                      onChange={(e) => setUpiId(e.target.value)}
                      placeholder="example@upi"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">Enter your UPI ID (e.g. name@bank)</p>
                  </div>
                </div>
              )}
              
              <div>
                <h2 className="text-lg font-medium mb-4">Delivery Address</h2>
                <div>
                  <Textarea 
                    value={deliveryAddress} 
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="Enter your full delivery address"
                    className="min-h-[100px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Order summary */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              {product && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <div className="h-16 w-16 rounded-md overflow-hidden bg-gray-100">
                      <img 
                        src={product.image_url || '/placeholder.svg'} 
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-gray-500">Quantity: {product.quantity} {product.unit}</p>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>Winning Bid Amount</span>
                      <span className="font-medium flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        {bidAmount}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Delivery Fee</span>
                      <span className="font-medium flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        0
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Taxes</span>
                      <span className="font-medium flex items-center">
                        <IndianRupee className="h-3 w-3 mr-0.5" />
                        0
                      </span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total</span>
                    <span className="flex items-center">
                      <IndianRupee className="h-4 w-4 mr-0.5" />
                      {bidAmount}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={handlePayNow}
                disabled={paymentStatus === 'processing'}
              >
                {paymentStatus === 'processing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Processing...
                  </>
                ) : (
                  'Pay Now'
                )}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
