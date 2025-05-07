
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle, Loader2, IndianRupee, CreditCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { processPayment, markProductAsPaid } from '@/services/paymentService';
import { mockProducts } from '@/services/mockData';
import { Product } from '@/types/marketplace';
import { toast } from "sonner";

const PaymentDetails = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const productId = searchParams.get('product');
  
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  
  // Form state for delivery address
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [postalCode, setPostalCode] = useState('');
  
  // For card payment
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  
  // For UPI
  const [upiId, setUpiId] = useState('');
  
  useEffect(() => {
    // Fetch product details
    const fetchProductDetails = async () => {
      setLoading(true);
      
      if (!productId) {
        toast.error("Product ID is missing");
        navigate('/buyer/my-bids');
        return;
      }
      
      // Find the product from mock data (in a real app, we'd fetch from the API)
      const foundProduct = mockProducts.find(p => p.id === productId);
      
      if (!foundProduct) {
        toast.error("Product not found");
        navigate('/buyer/my-bids');
        return;
      }
      
      // Check if the user is the highest bidder
      if (foundProduct.highest_bidder_id !== user?.id) {
        toast.error("You are not the winning bidder for this auction");
        navigate('/buyer/my-bids');
        return;
      }
      
      // Check if the auction has ended
      const now = new Date();
      const bidEnd = foundProduct.bid_end ? new Date(foundProduct.bid_end) : null;
      if (!bidEnd || now <= bidEnd) {
        toast.error("This auction is still active");
        navigate(`/buyer/product/${productId}`);
        return;
      }
      
      // Check if payment has already been made
      if (foundProduct.paid) {
        toast.error("Payment has already been processed for this product");
        navigate('/buyer/my-bids');
        return;
      }
      
      setProduct(foundProduct);
      setLoading(false);
    };
    
    fetchProductDetails();
  }, [productId, navigate, user?.id]);
  
  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'cod' | 'upi' | 'card');
  };
  
  const validatePaymentDetails = (): boolean => {
    // Validate delivery address
    if (!addressLine1.trim()) {
      toast.error("Please enter your street address");
      return false;
    }
    
    if (!city.trim()) {
      toast.error("Please enter your city");
      return false;
    }
    
    if (!state.trim()) {
      toast.error("Please enter your state");
      return false;
    }
    
    if (!postalCode.trim() || !/^\d{6}$/.test(postalCode)) {
      toast.error("Please enter a valid 6-digit postal code");
      return false;
    }
    
    // Validate payment method specific fields
    if (paymentMethod === 'card') {
      if (!cardNumber.trim() || !/^\d{16}$/.test(cardNumber.replace(/\s/g, ''))) {
        toast.error("Please enter a valid 16-digit card number");
        return false;
      }
      
      if (!cardExpiry.trim() || !/^\d{2}\/\d{2}$/.test(cardExpiry)) {
        toast.error("Please enter a valid card expiry date (MM/YY)");
        return false;
      }
      
      if (!cardCvv.trim() || !/^\d{3}$/.test(cardCvv)) {
        toast.error("Please enter a valid 3-digit CVV");
        return false;
      }
      
      if (!cardName.trim()) {
        toast.error("Please enter the name on the card");
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!upiId.trim() || !upiId.includes('@')) {
        toast.error("Please enter a valid UPI ID");
        return false;
      }
    }
    
    return true;
  };
  
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product) return;
    
    if (!validatePaymentDetails()) {
      return;
    }
    
    setProcessingPayment(true);
    
    try {
      // Process payment through the payment service
      const deliveryAddress = {
        addressLine1,
        addressLine2,
        city,
        state,
        postalCode,
      };
      
      const amount = product.highest_bid || product.price;
      const result = await processPayment(amount, product.id, paymentMethod, deliveryAddress);
      
      if (!result.success) {
        throw new Error(result.message || "Payment failed");
      }
      
      // Mark product as paid
      const updateResult = await markProductAsPaid(product.id);
      
      if (!updateResult.success) {
        throw new Error("Failed to update payment status");
      }
      
      // Update product locally
      setProduct(prev => prev ? { ...prev, paid: true } : null);
      setPaymentSuccess(true);
      
      // Show success message
      toast.success("Payment successful! Your order has been placed.");
    } catch (error: any) {
      toast.error(error.message || "Payment processing failed");
    } finally {
      setProcessingPayment(false);
    }
  };
  
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-48 mb-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-2/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
  
  if (!product) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <h1 className="text-3xl font-bold mb-6">Product Not Found</h1>
        <p className="mb-6">The product you're looking for doesn't exist or you don't have permission to access it.</p>
        <Button onClick={() => navigate('/buyer/my-bids')}>
          Go to My Bids
        </Button>
      </div>
    );
  }
  
  if (paymentSuccess) {
    return (
      <div className="max-w-4xl mx-auto text-center py-12">
        <div className="flex justify-center mb-6">
          <CheckCircle className="h-16 w-16 text-green-600" />
        </div>
        <h1 className="text-3xl font-bold mb-4">Payment Successful!</h1>
        <p className="text-xl mb-8">Your order has been placed successfully.</p>
        
        <Card className="mb-8 mx-auto max-w-md">
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Product:</span>
                <span className="font-medium">{product.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Amount Paid:</span>
                <span className="font-medium flex items-center">
                  <IndianRupee className="h-4 w-4 mr-0.5" />
                  {product.highest_bid || product.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Payment Method:</span>
                <span className="font-medium capitalize">{paymentMethod}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button className="w-full" onClick={() => navigate('/buyer/my-bids')}>
              View My Bids
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <form onSubmit={handlePaymentSubmit}>
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1">Street Address</Label>
                    <Input 
                      id="addressLine1" 
                      value={addressLine1} 
                      onChange={(e) => setAddressLine1(e.target.value)} 
                      required 
                    />
                  </div>
                  <div>
                    <Label htmlFor="addressLine2">Apartment, suite, etc. (optional)</Label>
                    <Input 
                      id="addressLine2" 
                      value={addressLine2} 
                      onChange={(e) => setAddressLine2(e.target.value)} 
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input 
                        id="city" 
                        value={city} 
                        onChange={(e) => setCity(e.target.value)} 
                        required 
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input 
                        id="state" 
                        value={state} 
                        onChange={(e) => setState(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode" 
                      value={postalCode} 
                      onChange={(e) => setPostalCode(e.target.value)} 
                      required 
                      maxLength={6}
                      pattern="\d{6}"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={handlePaymentMethodChange}>
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="cod" id="cod" />
                    <Label htmlFor="cod">Cash on Delivery (COD)</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2 mb-4">
                    <RadioGroupItem value="upi" id="upi" />
                    <Label htmlFor="upi">UPI</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card">Credit / Debit Card</Label>
                  </div>
                </RadioGroup>
                
                {paymentMethod === 'card' && (
                  <div className="mt-6 space-y-4">
                    <div>
                      <Label htmlFor="cardName">Name on Card</Label>
                      <Input 
                        id="cardName" 
                        value={cardName} 
                        onChange={(e) => setCardName(e.target.value)} 
                      />
                    </div>
                    <div>
                      <Label htmlFor="cardNumber">Card Number</Label>
                      <Input 
                        id="cardNumber" 
                        value={cardNumber} 
                        onChange={(e) => setCardNumber(e.target.value)} 
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="cardExpiry">Expiry Date</Label>
                        <Input 
                          id="cardExpiry" 
                          value={cardExpiry} 
                          onChange={(e) => setCardExpiry(e.target.value)} 
                          placeholder="MM/YY"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <Label htmlFor="cardCvv">CVV</Label>
                        <Input 
                          id="cardCvv" 
                          value={cardCvv} 
                          onChange={(e) => setCardCvv(e.target.value)} 
                          type="password"
                          maxLength={3}
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {paymentMethod === 'upi' && (
                  <div className="mt-6">
                    <Label htmlFor="upiId">UPI ID</Label>
                    <Input 
                      id="upiId" 
                      value={upiId} 
                      onChange={(e) => setUpiId(e.target.value)} 
                      placeholder="yourname@upi"
                    />
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={processingPayment}
                >
                  {processingPayment ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <CreditCard className="mr-2 h-4 w-4" />
                      Place Order & Pay
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </div>
        
        <div>
          <Card className="sticky top-8">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Product:</span>
                  <span className="font-medium">{product.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Quantity:</span>
                  <span>{product.quantity} {product.unit}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Seller:</span>
                  <span>{product.farmer_name}</span>
                </div>
                
                <div className="border-t border-gray-200 pt-4 flex justify-between items-center">
                  <span className="font-medium">Total:</span>
                  <span className="font-bold text-xl flex items-center">
                    <IndianRupee className="h-5 w-5 mr-0.5" />
                    {product.highest_bid || product.price}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
