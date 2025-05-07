
import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { Product, Bid } from '@/types/marketplace';
import { IndianRupee, CheckCircle2, ArrowRight } from 'lucide-react';

const PaymentDetails = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const productId = queryParams.get('product');
  
  const [activeTab, setActiveTab] = useState('payment-methods');
  const [product, setProduct] = useState<Product | null>(null);
  const [bid, setBid] = useState<Bid | null>(null);
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    country: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);

  // Fetch product and bid data if productId exists
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      
      try {
        // Fetch product details
        const { data: productData, error: productError } = await supabase
          .from('products')
          .select('*')
          .eq('id', productId)
          .single();
        
        if (productError) throw productError;
        
        setProduct(productData);
        
        // Fetch highest bid for this product
        const { data: bidData, error: bidError } = await supabase
          .from('bids')
          .select('*')
          .eq('product_id', productId)
          .order('amount', { ascending: false })
          .limit(1)
          .single();
        
        if (bidError) throw bidError;
        
        setBid(bidData);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Error",
          description: "Failed to load product information",
          variant: "destructive"
        });
      }
    };
    
    fetchProductData();
  }, [productId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePaymentMethodChange = (value: string) => {
    setPaymentMethod(value as 'cod' | 'upi' | 'card');
  };
  
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      setIsProcessing(false);
      setOrderComplete(true);
      toast({
        title: "Payment Successful",
        description: "Your order has been placed successfully",
      });
    }, 2000);
  };
  
  const navigateToBids = () => {
    navigate('/buyer/my-bids');
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payment Details</h1>
      
      {orderComplete ? (
        <Card className="mb-6">
          <CardContent className="pt-6 pb-6 flex flex-col items-center justify-center">
            <CheckCircle2 className="h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Payment Successful!</h2>
            <p className="text-center text-gray-600 mb-6">Your order has been placed successfully.</p>
            
            {product && (
              <div className="w-full max-w-md bg-gray-50 p-4 rounded-lg mb-6">
                <h3 className="font-medium mb-2">Order Summary</h3>
                <div className="flex justify-between mb-1">
                  <span>Product:</span>
                  <span>{product.name}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Quantity:</span>
                  <span>{product.quantity} {product.unit}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Amount Paid:</span>
                  <span className="font-bold flex items-center">
                    <IndianRupee className="h-3 w-3 mr-0.5" /> 
                    {bid ? bid.amount : product.price}
                  </span>
                </div>
              </div>
            )}
            
            <p className="text-sm text-gray-500 mb-6">
              You will receive an email confirmation shortly.
            </p>
            
            <Button onClick={navigateToBids} className="flex items-center gap-2">
              View My Orders <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="w-full grid grid-cols-2 mb-6">
            <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
            <TabsTrigger value="transactions">Transaction History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="payment-methods">
            <Card>
              <CardHeader>
                <CardTitle>Complete Your Purchase</CardTitle>
                <CardDescription>Select your payment method for this order</CardDescription>
              </CardHeader>
              <form onSubmit={handleSubmitPayment}>
                <CardContent className="space-y-6">
                  {product && bid && (
                    <Card className="bg-gray-50 border-gray-200">
                      <CardContent className="pt-4 pb-4">
                        <h3 className="font-medium mb-2">Order Summary</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span>Product:</span>
                            <span>{product.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Quantity:</span>
                            <span>{product.quantity} {product.unit}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Final Bid Amount:</span>
                            <span className="font-bold flex items-center">
                              <IndianRupee className="h-3 w-3 mr-0.5" /> 
                              {bid.amount}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  
                  <div className="space-y-2">
                    <Label>Select Payment Method</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div 
                        className={`border rounded-md p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                        onClick={() => handlePaymentMethodChange('cod')}
                      >
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            id="cod" 
                            checked={paymentMethod === 'cod'} 
                            onChange={() => handlePaymentMethodChange('cod')} 
                            className="mr-2"
                          />
                          <Label htmlFor="cod" className="cursor-pointer">Cash on Delivery</Label>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-md p-4 cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                        onClick={() => handlePaymentMethodChange('upi')}
                      >
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            id="upi" 
                            checked={paymentMethod === 'upi'} 
                            onChange={() => handlePaymentMethodChange('upi')} 
                            className="mr-2"
                          />
                          <Label htmlFor="upi" className="cursor-pointer">UPI Payment</Label>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-md p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                        onClick={() => handlePaymentMethodChange('card')}
                      >
                        <div className="flex items-center">
                          <input 
                            type="radio" 
                            name="paymentMethod" 
                            id="card" 
                            checked={paymentMethod === 'card'} 
                            onChange={() => handlePaymentMethodChange('card')} 
                            className="mr-2"
                          />
                          <Label htmlFor="card" className="cursor-pointer">Credit/Debit Card</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {paymentMethod === 'card' && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="font-medium">Card Details</h3>
                      <div className="space-y-2">
                        <Label htmlFor="cardName">Name on Card</Label>
                        <Input 
                          id="cardName" 
                          name="cardName" 
                          placeholder="Enter name as it appears on card" 
                          value={formData.cardName} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber">Card Number</Label>
                        <Input 
                          id="cardNumber" 
                          name="cardNumber" 
                          placeholder="XXXX XXXX XXXX XXXX" 
                          value={formData.cardNumber} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiryMonth">Expiry Month</Label>
                          <Select 
                            value={formData.expiryMonth} 
                            onValueChange={(value) => handleSelectChange('expiryMonth', value)}
                          >
                            <SelectTrigger id="expiryMonth">
                              <SelectValue placeholder="MM" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                                <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                                  {month.toString().padStart(2, '0')}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="expiryYear">Expiry Year</Label>
                          <Select 
                            value={formData.expiryYear} 
                            onValueChange={(value) => handleSelectChange('expiryYear', value)}
                          >
                            <SelectTrigger id="expiryYear">
                              <SelectValue placeholder="YY" />
                            </SelectTrigger>
                            <SelectContent>
                              {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                                <SelectItem key={year} value={year.toString().slice(-2)}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="cvv">CVV</Label>
                          <Input 
                            id="cvv" 
                            name="cvv" 
                            placeholder="123" 
                            value={formData.cvv} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'upi' && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="font-medium">UPI Details</h3>
                      <div className="space-y-2">
                        <Label htmlFor="upiId">UPI ID</Label>
                        <Input 
                          id="upiId" 
                          placeholder="yourname@upi" 
                          required={paymentMethod === 'upi'} 
                        />
                        <p className="text-xs text-gray-500">Enter your UPI ID (e.g. yourname@okicici)</p>
                      </div>
                    </div>
                  )}
                  
                  {paymentMethod === 'cod' && (
                    <div className="space-y-4 border-t pt-4">
                      <h3 className="font-medium">Delivery Address</h3>
                      <div className="space-y-2">
                        <Label htmlFor="addressLine1">Address Line 1</Label>
                        <Input 
                          id="addressLine1" 
                          name="addressLine1" 
                          placeholder="Street address" 
                          value={formData.addressLine1} 
                          onChange={handleChange} 
                          required 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                        <Input 
                          id="addressLine2" 
                          name="addressLine2" 
                          placeholder="Apartment, suite, unit, etc." 
                          value={formData.addressLine2} 
                          onChange={handleChange} 
                        />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input 
                            id="city" 
                            name="city" 
                            placeholder="City" 
                            value={formData.city} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="state">State / Province</Label>
                          <Input 
                            id="state" 
                            name="state" 
                            placeholder="State" 
                            value={formData.state} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="postalCode">Postal Code</Label>
                          <Input 
                            id="postalCode" 
                            name="postalCode" 
                            placeholder="Postal code" 
                            value={formData.postalCode} 
                            onChange={handleChange} 
                            required 
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Processing...' : 'Complete Payment'}
                  </Button>
                </CardFooter>
              </form>
            </Card>
          </TabsContent>
          
          <TabsContent value="transactions">
            <Card>
              <CardHeader>
                <CardTitle>Transaction History</CardTitle>
                <CardDescription>Your recent payment activity</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-8 text-gray-500">No transaction history to display</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default PaymentDetails;
