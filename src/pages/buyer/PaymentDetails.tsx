
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
import { IndianRupee, CheckCircle2, ArrowRight, CreditCard, Truck, Coins } from 'lucide-react';
import { mockProducts } from '@/services/mockData';
import { processPayment } from '@/services/paymentService';

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
    upiId: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'upi' | 'card'>('cod');
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'shipping' | 'payment' | 'review'>('shipping');

  // Fetch product and bid data
  useEffect(() => {
    const fetchProductData = async () => {
      if (!productId) return;
      
      try {
        // For demonstration, we'll use the mock data
        const mockProduct = mockProducts.find(p => p.id === productId);
        
        if (!mockProduct) {
          toast({
            title: "Error",
            description: "Product not found",
            variant: "destructive"
          });
          navigate('/buyer/browse-products');
          return;
        }
        
        setProduct(mockProduct);
        
        // Create a mock winning bid
        const mockBid = {
          id: `mock-bid-${mockProduct.id}`,
          product_id: mockProduct.id,
          bidder_id: 'current-user',
          bidder_name: 'Current User',
          amount: mockProduct.highest_bid || mockProduct.price,
          created_at: new Date().toISOString()
        };
        
        setBid(mockBid);
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
  }, [productId, navigate]);

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
  
  const validateShippingForm = () => {
    if (!formData.addressLine1) {
      toast.error("Please enter your address");
      return false;
    }
    if (!formData.city) {
      toast.error("Please enter your city");
      return false;
    }
    if (!formData.state) {
      toast.error("Please enter your state");
      return false;
    }
    if (!formData.postalCode) {
      toast.error("Please enter your postal code");
      return false;
    }
    return true;
  };
  
  const validatePaymentForm = () => {
    if (paymentMethod === 'card') {
      if (!formData.cardName) {
        toast.error("Please enter the name on your card");
        return false;
      }
      if (!formData.cardNumber) {
        toast.error("Please enter your card number");
        return false;
      }
      if (!formData.expiryMonth || !formData.expiryYear) {
        toast.error("Please enter your card expiry date");
        return false;
      }
      if (!formData.cvv) {
        toast.error("Please enter your card CVV");
        return false;
      }
    } else if (paymentMethod === 'upi') {
      if (!formData.upiId) {
        toast.error("Please enter your UPI ID");
        return false;
      }
    }
    return true;
  };
  
  const handleNextStep = () => {
    if (paymentStep === 'shipping') {
      if (validateShippingForm()) {
        setPaymentStep('payment');
      }
    } else if (paymentStep === 'payment') {
      if (validatePaymentForm()) {
        setPaymentStep('review');
      }
    }
  };
  
  const handlePrevStep = () => {
    if (paymentStep === 'payment') {
      setPaymentStep('shipping');
    } else if (paymentStep === 'review') {
      setPaymentStep('payment');
    }
  };
  
  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!product || !bid) {
      toast.error("Product information missing");
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // For demo, we'll use our mock payment service
      const result = await processPayment(
        bid.amount,
        product.id,
        paymentMethod,
        {
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          city: formData.city,
          state: formData.state,
          postalCode: formData.postalCode
        }
      );
      
      if (!result.success) {
        throw new Error(result.message || "Payment failed");
      }
      
      // In a real implementation, we would also mark the product as paid in the database
      // await markProductAsPaid(product.id);
      
      // For demo, simulate a delay
      setTimeout(() => {
        setIsProcessing(false);
        setOrderComplete(true);
        toast({
          title: "Payment Successful",
          description: "Your order has been placed successfully",
        });
      }, 2000);
    } catch (error: any) {
      console.error("Payment error:", error);
      setIsProcessing(false);
      toast({
        title: "Payment Failed",
        description: error.message || "An error occurred while processing your payment",
        variant: "destructive"
      });
    }
  };
  
  const navigateToBids = () => {
    navigate('/buyer/my-bids');
  };

  // Render Order Complete Screen
  if (orderComplete) {
    return (
      <div>
        <h1 className="text-3xl font-bold mb-6">Payment Complete</h1>
        
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
                <div className="flex justify-between mb-1">
                  <span>Payment Method:</span>
                  <span>{paymentMethod === 'cod' ? 'Cash on Delivery' : 
                        paymentMethod === 'upi' ? 'UPI' : 'Credit/Debit Card'}</span>
                </div>
                <div className="flex justify-between mb-1">
                  <span>Shipping Address:</span>
                  <span className="text-right">
                    {formData.addressLine1}<br />
                    {formData.addressLine2 && <>{formData.addressLine2}<br /></>}
                    {formData.city}, {formData.state} {formData.postalCode}
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
      </div>
    );
  }

  // Main payment flow
  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Complete Your Purchase</h1>
      
      {!product || !bid ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-center text-gray-500 mb-4">Loading product information...</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Main checkout form */}
          <div className="md:col-span-8">
            <Card>
              {/* Checkout Steps */}
              <CardHeader>
                <div className="flex justify-between items-center mb-4">
                  <div className={`flex items-center ${paymentStep === 'shipping' ? 'text-primary font-medium' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${paymentStep === 'shipping' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
                      1
                    </div>
                    <span>Shipping</span>
                  </div>
                  <div className="h-px bg-gray-300 flex-grow mx-2"></div>
                  <div className={`flex items-center ${paymentStep === 'payment' ? 'text-primary font-medium' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${paymentStep === 'payment' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
                      2
                    </div>
                    <span>Payment</span>
                  </div>
                  <div className="h-px bg-gray-300 flex-grow mx-2"></div>
                  <div className={`flex items-center ${paymentStep === 'review' ? 'text-primary font-medium' : 'text-gray-500'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 ${paymentStep === 'review' ? 'bg-primary text-white' : 'bg-gray-200 text-gray-700'}`}>
                      3
                    </div>
                    <span>Review</span>
                  </div>
                </div>
                <CardTitle>
                  {paymentStep === 'shipping' && 'Shipping Address'}
                  {paymentStep === 'payment' && 'Payment Method'}
                  {paymentStep === 'review' && 'Review Your Order'}
                </CardTitle>
                <CardDescription>
                  {paymentStep === 'shipping' && 'Where should we deliver your products?'}
                  {paymentStep === 'payment' && 'Select your preferred payment method'}
                  {paymentStep === 'review' && 'Please verify your order details'}
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {/* Shipping Address Form */}
                {paymentStep === 'shipping' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="addressLine1">Address Line 1</Label>
                      <Input 
                        id="addressLine1" 
                        name="addressLine1" 
                        placeholder="Street address" 
                        value={formData.addressLine1} 
                        onChange={handleChange} 
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
                        />
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Payment Method Form */}
                {paymentStep === 'payment' && (
                  <div className="space-y-6">
                    <div className="space-y-4">
                      <Label>Select Payment Method</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodChange('cod')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                id="cod" 
                                checked={paymentMethod === 'cod'} 
                                onChange={() => handlePaymentMethodChange('cod')} 
                                className="mr-2"
                              />
                              <Label htmlFor="cod" className="cursor-pointer font-medium">Cash on Delivery</Label>
                            </div>
                            <Truck className="h-5 w-5 text-gray-600" />
                          </div>
                          <p className="text-xs text-gray-500 ml-5">Pay when your order is delivered</p>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'upi' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodChange('upi')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                id="upi" 
                                checked={paymentMethod === 'upi'} 
                                onChange={() => handlePaymentMethodChange('upi')} 
                                className="mr-2"
                              />
                              <Label htmlFor="upi" className="cursor-pointer font-medium">UPI Payment</Label>
                            </div>
                            <Coins className="h-5 w-5 text-gray-600" />
                          </div>
                          <p className="text-xs text-gray-500 ml-5">Pay using UPI apps like Google Pay, PhonePe</p>
                        </div>
                        
                        <div 
                          className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'card' ? 'border-primary bg-primary/5' : 'border-gray-200'}`}
                          onClick={() => handlePaymentMethodChange('card')}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                name="paymentMethod" 
                                id="card" 
                                checked={paymentMethod === 'card'} 
                                onChange={() => handlePaymentMethodChange('card')} 
                                className="mr-2"
                              />
                              <Label htmlFor="card" className="cursor-pointer font-medium">Credit/Debit Card</Label>
                            </div>
                            <CreditCard className="h-5 w-5 text-gray-600" />
                          </div>
                          <p className="text-xs text-gray-500 ml-5">Secure card payment</p>
                        </div>
                      </div>
                    </div>
                    
                    {paymentMethod === 'card' && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="cardName">Name on Card</Label>
                          <Input 
                            id="cardName" 
                            name="cardName" 
                            placeholder="Enter name as it appears on card" 
                            value={formData.cardName} 
                            onChange={handleChange} 
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
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {paymentMethod === 'upi' && (
                      <div className="space-y-4 border-t pt-4">
                        <div className="space-y-2">
                          <Label htmlFor="upiId">UPI ID</Label>
                          <Input 
                            id="upiId" 
                            name="upiId"
                            placeholder="yourname@upi" 
                            value={formData.upiId}
                            onChange={handleChange}
                          />
                          <p className="text-xs text-gray-500">Enter your UPI ID (e.g. yourname@okicici)</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                {/* Order Review */}
                {paymentStep === 'review' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-medium mb-2">Shipping Address</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">
                          {formData.addressLine1}<br />
                          {formData.addressLine2 && <>{formData.addressLine2}<br /></>}
                          {formData.city}, {formData.state} {formData.postalCode}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Payment Method</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <p className="text-sm">
                          {paymentMethod === 'cod' && 'Cash on Delivery'}
                          {paymentMethod === 'upi' && 'UPI Payment'}
                          {paymentMethod === 'card' && 'Credit/Debit Card'}
                          {paymentMethod === 'card' && (
                            <span className="block mt-1">
                              Card ending with {formData.cardNumber.slice(-4)}
                            </span>
                          )}
                          {paymentMethod === 'upi' && formData.upiId && (
                            <span className="block mt-1">
                              UPI ID: {formData.upiId}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-medium mb-2">Order Summary</h3>
                      <div className="bg-gray-50 p-3 rounded-md">
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Product:</span>
                          <span className="text-sm font-medium">{product.name}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Quantity:</span>
                          <span className="text-sm">{product.quantity} {product.unit}</span>
                        </div>
                        <div className="flex justify-between mb-1">
                          <span className="text-sm">Seller:</span>
                          <span className="text-sm">{product.farmer_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="flex justify-between">
                {paymentStep !== 'shipping' && (
                  <Button 
                    variant="outline" 
                    onClick={handlePrevStep}
                  >
                    Back
                  </Button>
                )}
                
                {paymentStep !== 'review' ? (
                  <Button
                    onClick={handleNextStep}
                    className="ml-auto"
                  >
                    Next Step
                  </Button>
                ) : (
                  <Button 
                    onClick={handleSubmitPayment} 
                    disabled={isProcessing}
                    className="ml-auto"
                  >
                    {isProcessing ? 'Processing...' : 'Complete Order'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          </div>
          
          {/* Order Summary Sidebar */}
          <div className="md:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
              </CardHeader>
              <CardContent>
                {product && bid && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-16 h-16 overflow-hidden rounded mr-4">
                          <img 
                            src={product.image_url || '/placeholder.svg'} 
                            alt={product.name} 
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500">
                            {product.quantity} {product.unit}
                          </p>
                        </div>
                      </div>
                      <div className="font-medium">
                        <span className="flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {bid.amount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-4 space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Subtotal:</span>
                        <span className="text-sm font-medium flex items-center">
                          <IndianRupee className="h-3 w-3 mr-0.5" />
                          {bid.amount}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Delivery Fee:</span>
                        <span className="text-sm">Free</span>
                      </div>
                      <div className="flex justify-between font-medium text-lg pt-2 border-t mt-2">
                        <span>Total:</span>
                        <span className="flex items-center">
                          <IndianRupee className="h-4 w-4 mr-0.5" />
                          {bid.amount}
                        </span>
                      </div>
                    </div>
                    
                    <div className="pt-2 text-xs text-gray-500">
                      <p>By completing this purchase, you agree to the terms of service and privacy policy.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentDetails;
