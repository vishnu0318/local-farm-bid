import { supabase } from "@/integrations/supabase/client";
import { DeliveryAddress } from "@/types/marketplace";
import { processRazorpayPayment } from "./razorpayService";

interface PaymentIntentRequest {
  amount: number;
  productId: string;
  productName?: string;
  paymentMethod?: 'card' | 'cod' | 'upi' | 'razorpay';
}

interface PaymentIntentResponse {
  clientSecret?: string;
  error?: string;
}

/**
 * Creates a payment intent using the Stripe API through our Supabase Edge Function
 */
export const createPaymentIntent = async (
  data: PaymentIntentRequest
): Promise<PaymentIntentResponse> => {
  try {
    // Call Supabase Edge Function to create a payment intent
    const { data: responseData, error } = await supabase.functions.invoke(
      'create-payment-intent',
      {
        body: data,
      }
    );

    if (error) {
      console.error('Error creating payment intent:', error);
      return { error: error.message || 'Failed to create payment' };
    }

    if (!responseData || !responseData.clientSecret) {
      return { error: 'No client secret returned from the server' };
    }

    return { clientSecret: responseData.clientSecret };
  } catch (error: any) {
    console.error('Error in createPaymentIntent:', error);
    return { error: error.message || 'An unexpected error occurred' };
  }
};

/**
 * Records a completed payment in the database using the sales table
 */
export const recordPayment = async (
  productId: string,
  amount: number,
  paymentMethod: string,
  deliveryAddress: DeliveryAddress,
  status: 'completed' | 'pending' | 'failed' = 'completed'
) => {
  try {
    // Ensure valid parameters
    if (!productId || amount <= 0 || !deliveryAddress) {
      throw new Error("Missing or invalid parameters for payment processing");
    }

    // Create a transaction ID
    const transactionId = `TXN-${Math.floor(Math.random() * 1000000)}-${Date.now()}`;
    
    // Get product details for the receipt
    const { data: productData, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
      
    if (productError) throw new Error(`Error fetching product: ${productError.message}`);
    
    // Get farmer details
    const { data: farmerData } = await supabase
      .from('profiles')
      .select('name, id')
      .eq('id', productData.farmer_id)
      .single();
    
    // Get buyer details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Error fetching user: ${userError.message}`);
    
    if (!user) throw new Error("User not authenticated");
    
    // Get the winning bid to find bid_id
    const { data: winningBid } = await supabase
      .from('bids')
      .select('id, quantity, bid_price')
      .eq('product_id', productId)
      .eq('buyer_id', user.id)
      .order('bid_price', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Convert DeliveryAddress to a string for storage
    const addressString = `${deliveryAddress.addressLine1}${deliveryAddress.addressLine2 ? ', ' + deliveryAddress.addressLine2 : ''}, ${deliveryAddress.city}, ${deliveryAddress.state || ''} - ${deliveryAddress.postalCode}`;

    // Create payment record in sales table
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        farmer_id: productData.farmer_id,
        bid_id: winningBid?.id || productId, // Use bid_id if available
        quantity: winningBid?.quantity || 1,
        price_per_unit: winningBid?.bid_price || productData.price || amount,
        total_amount: amount,
        payment_status: status,
        payment_id: transactionId,
        delivery_address: addressString
      })
      .select();
        
    if (saleError) throw new Error(`Error creating sale record: ${saleError.message}`);

    // Update the product status - mark as unavailable
    const { error: updateError } = await supabase
      .from('products')
      .update({
        available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw new Error(`Error updating product status: ${updateError.message}`);

    // Create notification for the farmer about payment received
    if (productData.farmer_id) {
      try {
        await supabase.from('notifications').insert({
          type: 'payment_received',
          title: 'Payment Received',
          message: `Payment of ₹${amount} received for ${productData.name}`,
          user_id: productData.farmer_id,
          related_id: productId
        });
      } catch (notificationError) {
        console.error("Error creating farmer notification:", notificationError);
      }
    }
    
    return { 
      success: true, 
      data: {
        transactionId,
        product: {
          ...productData,
          farmer: farmerData
        }
      } 
    };
  } catch (error: any) {
    console.error('Error recording payment:', error);
    return { success: false, error: error.message };
  }
};

export const processCardPayment = async (
  productId: string,
  amount: number,
  deliveryAddress: DeliveryAddress,
  cardDetails: any
) => {
  try {
    // In a real app, this would use Stripe to process the card
    // For this demo, we'll simulate a successful card payment
    
    // Record the payment
    const result = await recordPayment(
      productId,
      amount,
      'card',
      deliveryAddress,
      'completed'
    );
    
    return { 
      success: result.success, 
      message: result.success ? 
        'Card payment processed successfully' : 
        'Failed to process card payment',
      data: result.data
    };
  } catch (error: any) {
    console.error('Error processing card payment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process payment using the appropriate method
 */
export const processPayment = async (
  amount: number,
  productId: string,
  paymentMethod: 'cod' | 'upi' | 'card' | 'razorpay',
  deliveryAddress: DeliveryAddress,
  productName?: string,
  userDetails?: { name: string; email: string; phone?: string }
) => {
  try {
    let result;
    
    switch (paymentMethod) {
      case 'card':
        result = await processCardPayment(productId, amount, deliveryAddress, {});
        break;
      case 'razorpay':
        if (!productName || !userDetails) {
          return { success: false, message: 'Missing required details for Razorpay payment' };
        }
        result = await processRazorpayPayment(amount, productId, productName, deliveryAddress, userDetails);
        break;
      default:
        return { success: false, message: 'Invalid payment method' };
    }
    
    // Generate and return invoice data
    if (result.success && result.data) {
      const invoiceData = {
        transactionId: result.data.transactionId,
        productName: result.data.product.name,
        amount: amount,
        paymentMethod: paymentMethod,
        paymentDate: new Date().toISOString(),
        farmerName: result.data.product.farmer?.name || 'Unknown Farmer',
        buyerAddress: deliveryAddress
      };
      
      return {
        ...result,
        invoice: invoiceData
      };
    }
    
    return result;
  } catch (error: any) {
    console.error('Error processing payment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Mark a product as unavailable in the database
 */
export const markProductAsPaid = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ available: false })
      .eq('id', productId);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error marking product as paid:', error);
    return { success: false, error: error.message };
  }
};

export const generateInvoice = async (saleId: string) => {
  try {
    // Fetch sale data
    const { data: saleData, error: saleError } = await supabase
      .from('sales')
      .select('*')
      .eq('id', saleId)
      .single();
      
    if (saleError) throw saleError;
    
    if (!saleData) {
      return { success: false, error: 'Sale not found' };
    }
    
    // Fetch product details
    const { data: productData } = await supabase
      .from('products')
      .select('name, quantity, unit, description')
      .eq('id', saleData.product_id)
      .single();
    
    // Fetch farmer details
    const { data: farmerData } = await supabase
      .from('profiles')
      .select('name, id')
      .eq('id', saleData.farmer_id)
      .single();
    
    // Fetch buyer details
    const { data: buyerData } = await supabase
      .from('profiles')
      .select('name, id')
      .eq('id', saleData.buyer_id)
      .single();
    
    // Format the invoice data
    const invoiceData = {
      invoiceNumber: `INV-${saleId.slice(0, 8)}`,
      orderId: saleId,
      transactionId: saleData.payment_id,
      date: new Date(saleData.created_at).toLocaleDateString(),
      buyerDetails: buyerData || { name: 'Unknown Buyer', id: null },
      sellerDetails: farmerData || { name: 'Unknown Seller', id: null },
      productDetails: {
        name: productData?.name || 'Unknown Product',
        quantity: saleData.quantity || 0,
        unit: productData?.unit || '',
        description: productData?.description || ''
      },
      amount: saleData.total_amount,
      paymentMethod: 'online',
      paymentStatus: saleData.payment_status,
      deliveryAddress: saleData.delivery_address
    };
    
    return { success: true, data: invoiceData };
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return { success: false, error: error.message };
  }
};