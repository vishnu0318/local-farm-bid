
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { IndianRupee, CreditCard, Wallet, Banknote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/types/marketplace';

// Define a type that extends Product to include winningBid property
interface ProductWithWinningBid extends Product {
  winningBid?: number;
  bids?: { amount: number; bidder_id: string }[];
}

// Initialize Stripe
const stripePromise = loadStripe("pk_test_51OLPCESIYS9RARqbGN1mSEVAD4Dc2njuu5riGLFQPxV1qVjJ9SeBBAAzwkZLEjtEr3HpivbvLfWLQFtibQyMvTWq00ZC7FZu82");

const PaymentDetails = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('product');

  const [product, setProduct] = useState<ProductWithWinningBid | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [processing, setProcessing] = useState(false);

  // Load product details
  useEffect(() => {
    if (!productId) {
      toast.error("No product selected for payment");
      navigate('/buyer/my-bids');
      return;
    }

    const fetchProduct = async () => {
      try {
        // Get the product
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select(`
            *,
            bids(amount, bidder_id)
          `)
          .eq('id', productId)
          .single();

        if (productError) throw productError;

        // Check if current user is the highest bidder
        if (productData?.bids && productData.bids.length > 0) {
          // Sort bids by amount (descending)
          const sortedBids = [...productData.bids].sort((a, b) => b.amount - a.amount);
          const highestBid = sortedBids[0];
          
          if (highestBid.bidder_id !== user?.id) {
            toast.error("You are not the highest bidder for this product");
            navigate('/buyer/my-bids');
            return;
          }
          
          // Set the product with winning bid amount using spread operator
          setProduct({
            ...productData,
            winningBid: highestBid.amount
          });
        } else {
          toast.error("No bids found for this product");
          navigate('/buyer/my-bids');
          return;
        }
      } catch (error) {
        console.error("Error fetching product:", error);
        toast.error("Failed to load product details");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [productId, user?.id, navigate]);

  const handlePayment = async () => {
    if (!product || !user) return;
    
    setProcessing(true);
    
    try {
      // Get the payment amount from the winning bid
      const amount = product.winningBid;
      
      if (!amount) {
        throw new Error('Invalid bid amount');
      }
      
      if (paymentMethod === 'card') {
        // Create a Stripe payment intent
        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${await supabase.auth.getSession().then(res => res.data.session?.access_token)}`
          },
          body: JSON.stringify({
            amount,
            productId: product.id,
            productName: product.name,
            paymentMethod
          })
        });
        
        const { clientSecret, error } = await response.json();
        
        if (error) {
          throw new Error(error);
        }
        
        // Load Stripe
        const stripe = await stripePromise;
        
        if (!stripe) {
          throw new Error('Failed to load Stripe');
        }
        
        // Redirect to Stripe checkout
        const result = await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: {
              token: 'tok_visa' // Use a test token for development
            },
            billing_details: {
              name: user.user_metadata?.name || user.email,
              email: user.email
            }
          }
        });
        
        if (result.error) {
          throw new Error(result.error.message);
        }
        
        // Update product as paid
        await supabase
          .from('products')
          .update({ paid: true })
          .eq('id', product.id);
          
        toast.success("Payment successful!");
        navigate(`/buyer/product/${product.id}`);
      } else if (paymentMethod === 'upi') {
        // Simulate UPI payment
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Update product as paid
        await supabase
          .from('products')
          .update({ paid: true })
          .eq('id', product.id);
          
        toast.success("UPI payment successful!");
        navigate(`/buyer/product/${product.id}`);
      } else if (paymentMethod === 'cod') {
        // Cash on delivery
        await supabase
          .from('products')
          .update({ paid: true })
          .eq('id', product.id);
          
        toast.success("Cash on delivery order placed successfully!");
        navigate(`/buyer/product/${product.id}`);
      }
    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-8">
        <h2 className="text-2xl font-bold">Product not found</h2>
      </div>
    );
  }

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Complete Your Purchase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Order summary */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-lg">{product.name}</h3>
                    <p className="text-sm text-gray-500">
                      {product.quantity} {product.unit}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-0.5" />
                    <span>{product.winningBid}</span>
                  </div>
                </div>
                
                <Separator />
                
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-0.5" />
                    <span>{product.winningBid}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Payment methods */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Payment Method</CardTitle>
            </CardHeader>
            <CardContent>
              <RadioGroup 
                value={paymentMethod} 
                onValueChange={setPaymentMethod}
                className="space-y-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="card" id="card" />
                  <Label htmlFor="card" className="flex items-center">
                    <CreditCard className="h-4 w-4 mr-2" />
                    Credit/Debit Card
                  </Label>
                </div>
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="upi" id="upi" />
                  <Label htmlFor="upi" className="flex items-center">
                    <Wallet className="h-4 w-4 mr-2" />
                    UPI
                  </Label>
                </div>
                
                {paymentMethod === 'upi' && (
                  <div className="pl-6 mt-2">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input id="upiId" placeholder="username@upi" className="mt-1" />
                  </div>
                )}
                
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="cod" id="cod" />
                  <Label htmlFor="cod" className="flex items-center">
                    <Banknote className="h-4 w-4 mr-2" />
                    Cash on Delivery
                  </Label>
                </div>
              </RadioGroup>
              
              <Button 
                className="w-full mt-6" 
                onClick={handlePayment}
                disabled={processing}
              >
                {processing ? (
                  <span className="flex items-center">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full mr-2"></div>
                    Processing...
                  </span>
                ) : (
                  <span>Complete Payment</span>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
