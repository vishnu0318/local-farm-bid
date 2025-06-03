
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
 * Records a completed payment in the database by updating the product
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
      .select(`
        *,
        farmer:farmer_id(name, id)
      `)
      .eq('id', productId)
      .single();
      
    if (productError) throw new Error(`Error fetching product: ${productError.message}`);
    
    // Get buyer details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw new Error(`Error fetching user: ${userError.message}`);
    
    if (!user) throw new Error("User not authenticated");
    
    // Convert DeliveryAddress to a JSON object for storage
    const addressObject = {
      addressLine1: deliveryAddress.addressLine1,
      addressLine2: deliveryAddress.addressLine2 || null,
      city: deliveryAddress.city,
      state: deliveryAddress.state || '',
      postalCode: deliveryAddress.postalCode
    };

    // Create payment record in orders table
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        product_id: productId,
        buyer_id: user.id,
        amount,
        payment_method: paymentMethod,
        payment_status: status,
        delivery_address: addressObject,
        transaction_id: transactionId,
        payment_date: new Date().toISOString()
      })
      .select();
        
    if (orderError) throw new Error(`Error creating order record: ${orderError.message}`);

    // Update the product status - mark as paid and unavailable
    const { error: updateError } = await supabase
      .from('products')
      .update({
        paid: true,
        available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw new Error(`Error updating product status: ${updateError.message}`);
    
    return { 
      success: true, 
      data: {
        transactionId,
        product: productData
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
    
    // After successful payment, try to create notification
    if (result.success && result.data) {
      try {
        // Get the farmer ID from the product
        const farmerId = result.data.product?.farmer_id;
        const { data: { user } } = await supabase.auth.getUser();
        
        if (farmerId && user) {
          // Create notification for the farmer
          await supabase.from('notifications').insert([{
            type: 'payment_received',
            message: `Payment of ₹${amount} received for ${result.data.product.name}`,
            product_id: productId,
            farmer_id: farmerId,
            read: false,
            bidder_name: user.user_metadata?.name || user.email,
            bid_amount: amount
          }]);
        }
      } catch (notificationError) {
        console.error("Error creating notification:", notificationError);
        // Continue even if notification fails
      }

      // Generate and return invoice data
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
 * Mark a product as paid in the database
 */
export const markProductAsPaid = async (productId: string) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update({ paid: true })
      .eq('id', productId);
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error: any) {
    console.error('Error marking product as paid:', error);
    return { success: false, error: error.message };
  }
};

export const generateInvoice = async (orderId: string) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        product:product_id(
          name, 
          quantity, 
          unit, 
          description,
          farmer:farmer_id(name, id)
        )
      `)
      .eq('id', orderId)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'Order not found' };
    }
    
    // Try to get buyer details, handle case if relation doesn't exist
    let buyerDetails = { name: 'Unknown Buyer', id: null };
    
    try {
      const { data: userData } = await supabase
        .from('profiles')
        .select('name, id')
        .eq('id', data.buyer_id)
        .single();
        
      if (userData) {
        buyerDetails = { 
          name: userData.name || 'Unknown Buyer', 
          id: userData.id 
        };
      }
    } catch (error) {
      console.log('Could not fetch buyer details, using default');
      // Keep the default buyerDetails
    }
    
    // Try to get farmer details if not available in the join
    let sellerDetails = { name: 'Unknown Seller', id: null };
    if (data.product?.farmer) {
      sellerDetails = data.product.farmer;
    }
    
    // Format the invoice data
    const invoiceData = {
      invoiceNumber: `INV-${orderId.slice(0, 8)}`,
      orderId: orderId,
      transactionId: data.transaction_id,
      date: new Date(data.payment_date || data.created_at).toLocaleDateString(),
      buyerDetails: buyerDetails,
      sellerDetails: sellerDetails,
      productDetails: {
        name: data.product?.name || 'Unknown Product',
        quantity: data.product?.quantity || 0,
        unit: data.product?.unit || '',
        description: data.product?.description || ''
      },
      amount: data.amount,
      paymentMethod: data.payment_method,
      paymentStatus: 'completed', // Always show as completed for invoices
      deliveryAddress: data.delivery_address
    };
    
    return { success: true, data: invoiceData };
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return { success: false, error: error.message };
  }
};
