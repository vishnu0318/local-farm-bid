import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { loadStripe } from '@stripe/stripe-js';
import { IndianRupee, CreditCard, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Product, DeliveryAddress } from '@/types/marketplace';
import { processPayment } from '@/services/paymentService';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import jsPDF from "jspdf";

// Define a type that extends Product to include winningBid property
interface ProductWithWinningBid extends Product {
  winningBid?: number;
  bids?: { amount: number; bidder_id: string }[];
}

// Form validation schemas
const cardFormSchema = z.object({
  cardNumber: z.string().min(16).max(19).regex(/^\d+$/, "Card number must contain only digits"),
  cardName: z.string().min(2, "Name on card is required"),
  expiryDate: z.string().regex(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, "Expiry date must be MM/YY format"),
  cvv: z.string().length(3, "CVV must be 3 digits").regex(/^\d+$/, "CVV must contain only digits"),
});


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
  const [paymentStep, setPaymentStep] = useState<'method' | 'details' | 'processing' | 'success'>('method');
  const [deliveryAddress, setDeliveryAddress] = useState<DeliveryAddress>({
    addressLine1: '',
    city: '',
    state: '',
    postalCode: ''
  });

  const [farmerId, setFarmerId] = useState("");
  const [farmerName, setFarmerName] = useState('');
  const [transactionId,setTransactionId] = useState("");

  // Forms for different payment methods
  const cardForm = useForm({
    resolver: zodResolver(cardFormSchema),
    defaultValues: {
      cardNumber: '',
      cardName: '',
      expiryDate: '',
      cvv: '',
    }
  });


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

          setFarmerId(productData?.farmer_id);

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



  useEffect(() => {
    const fetchFarmerName = async () => {
      console.log("Looking for farmer with ID:", farmerId);

    const { data, error } = await supabase
      .from('profiles')
      .select('name')
      .eq('id', farmerId.trim()); // just in case there's whitespace

    if (error) {
      console.error("Supabase fetch error:", error.message);
      return;
    }

    if (data.length === 1) {
      setFarmerName(data[0].name);
    } else if (data.length === 0) {
      console.warn("❌ No farmer found for ID:", farmerId);
    } else {
      console.warn("⚠️ Multiple farmers found (unexpected):", data);
    }
  };

  if (farmerId) fetchFarmerName();
  }, [farmerId]);




  // Handle payment method selection
  const handlePaymentMethodSelect = (method: string) => {
    setPaymentMethod(method);
    setPaymentStep('details');
  };

  // Handle address input change
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDeliveryAddress(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Process card payment
  const handleCardSubmit = cardForm.handleSubmit(async (data) => {
    if (!product || !user || !deliveryAddress.addressLine1 || !deliveryAddress.city || !deliveryAddress.state || !deliveryAddress.postalCode) {
      toast.error("Please complete all delivery address fields");
      return;
    }

    setProcessing(true);

    try {
      // Get the payment amount from the winning bid
      const amount = product.winningBid;

      if (!amount) {
        throw new Error('Invalid bid amount');
      }

      setPaymentStep('processing');

      // Process the payment after a brief delay to show the processing state
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Process the payment
      const result = await processPayment(
        amount,
        productId as string,
        'card',
        deliveryAddress,
        // cardDetails:cardForm
      );

      if (!result.success) {
        throw new Error(result.message || 'Payment failed');
      }

      setPaymentStep('success');
      toast.success("Payment successful!");


    } catch (error: any) {
      console.error("Payment error:", error);
      toast.error(error.message || "Payment failed. Please try again.");
      setPaymentStep('details');
    } finally {
      setProcessing(false);
    }
  });



  // Go back to payment method selection
  const handleGoBackToMethods = () => {
    setPaymentStep('method');
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

  // function to download pdf 
  const handleDownloadPDF = () => {
    const doc = new jsPDF();

    doc.setFontSize(16);
    doc.text("Payment Receipt", 20, 20);

    doc.setFontSize(12);
    doc.text(`Buyer Name: ${user.name}`, 20, 40);
    doc.text(`Product: ${product.name}`, 20, 60);
    doc.text(`Price: ₹${product.winningBid}`, 20, 70);
    doc.text(`Payment Method: Card`, 20, 80);
    doc.text(`Payment Status: Successful`, 20, 90);

    doc.save("order-receipt.pdf");
  };

  // Render success state
  if (paymentStep === 'success') {
    return (
      <div className="container max-w-md mx-auto py-16 text-center">
        <div className="bg-green-50 rounded-full h-24 w-24 flex items-center justify-center mx-auto mb-6">
          <Check className="h-12 w-12 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Payment Successful!</h2>
        <p className="text-gray-600 mb-8">
          Your payment of ₹{product.winningBid} has been processed successfully.
        </p>
        <div className="flex justify-center">
          <Button onClick={handleDownloadPDF}>
            View Order Details
          </Button>
        </div>
      </div>
    );
  }

  // Render processing state
  if (paymentStep === 'processing') {
    return (
      <div className="container max-w-md mx-auto py-16 text-center">
        <div className="mb-6 flex justify-center">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
        <p className="text-gray-600">
          Please wait while we process your payment...
        </p>
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

          {/* Delivery address */}
          {paymentStep === 'details' && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Delivery Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="addressLine1">Address Line</Label>
                    <Input
                      id="addressLine1"
                      name="addressLine1"
                      value={deliveryAddress.addressLine1}
                      onChange={handleAddressChange}
                      placeholder="Enter your street address"
                      className="mt-1"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        name="city"
                        value={deliveryAddress.city}
                        onChange={handleAddressChange}
                        placeholder="Enter city"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="state">State</Label>
                      <Input
                        id="state"
                        name="state"
                        value={deliveryAddress.state}
                        onChange={handleAddressChange}
                        placeholder="Enter state"
                        className="mt-1"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input
                      id="postalCode"
                      name="postalCode"
                      value={deliveryAddress.postalCode}
                      onChange={handleAddressChange}
                      placeholder="Enter postal code"
                      className="mt-1"
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Payment methods */}
        <div>
          {paymentStep === 'method' && (
            <Card>
              <CardHeader>
                <CardTitle>Payment Method</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button
                    onClick={() => handlePaymentMethodSelect('card')}
                    variant="outline"
                    className="w-full flex justify-between items-center h-auto py-3"
                  >
                    <div className="flex items-center">
                      <CreditCard className="h-5 w-5 mr-3" />
                      <span>Credit/Debit Card</span>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {paymentStep === 'details' && paymentMethod === 'card' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  <span>Card Details</span>
                  <Button variant="ghost" size="sm" onClick={handleGoBackToMethods}>
                    Change
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...cardForm}>
                  <form onSubmit={handleCardSubmit} className="space-y-4">
                    <FormField
                      control={cardForm.control}
                      name="cardName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name on Card</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="John Smith" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={cardForm.control}
                      name="cardNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Card Number</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="1234 5678 9012 3456" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={cardForm.control}
                        name="expiryDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Expiry Date (MM/YY)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="05/25" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={cardForm.control}
                        name="cvv"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>CVV</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123" type="password" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="w-full mt-6"
                      disabled={processing}
                    >
                      Pay ₹{product.winningBid}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentDetails;
