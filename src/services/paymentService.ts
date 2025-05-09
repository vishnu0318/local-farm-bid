
import { supabase } from "@/integrations/supabase/client";

interface PaymentIntentRequest {
  amount: number;
  productId: string;
  productName?: string;
  paymentMethod?: 'card' | 'cod' | 'upi';
}

interface PaymentIntentResponse {
  clientSecret?: string;
  error?: string;
}

interface DeliveryAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
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
      
    if (productError) throw productError;
    
    // Get buyer details
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    
    if (!user) throw new Error("User not authenticated");
    
    try {
      // Create payment record in orders table
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .insert({
          product_id: productId,
          buyer_id: user.id,
          amount,
          payment_method: paymentMethod,
          payment_status: status,
          delivery_address: deliveryAddress,
          transaction_id: transactionId,
          payment_date: new Date().toISOString()
        })
        .select();
        
      if (orderError) throw orderError;
    } catch (orderError) {
      console.error("Error creating order record:", orderError);
      // Continue with the payment process even if order creation fails
    }
    
    // Update the product status
    const { error: updateError } = await supabase
      .from('products')
      .update({
        paid: status === 'completed',
        available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (updateError) throw updateError;
    
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

/**
 * Process Cash on Delivery payment
 */
export const processCodPayment = async (
  productId: string,
  amount: number,
  deliveryAddress: DeliveryAddress
) => {
  try {
    // For COD, we record the payment as pending
    const result = await recordPayment(
      productId,
      amount,
      'cod',
      deliveryAddress,
      'pending'
    );
    
    return { 
      success: result.success, 
      message: result.success ? 
        'Cash on Delivery payment scheduled successfully' : 
        'Failed to schedule Cash on Delivery payment',
      data: result.data
    };
  } catch (error: any) {
    console.error('Error processing COD payment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process UPI payment
 */
export const processUpiPayment = async (
  productId: string,
  amount: number,
  deliveryAddress: DeliveryAddress,
  upiId: string
) => {
  try {
    // Verify UPI ID
    const isValidUpi = upiId.includes('@');
    if (!isValidUpi) {
      return { success: false, message: 'Invalid UPI ID format' };
    }
    
    // Record the payment
    const result = await recordPayment(
      productId,
      amount,
      'upi',
      deliveryAddress,
      'completed'
    );
    
    return { 
      success: result.success, 
      message: result.success ? 
        'UPI payment processed successfully' : 
        'Failed to process UPI payment',
      data: result.data
    };
  } catch (error: any) {
    console.error('Error processing UPI payment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Process card payment
 */
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
  paymentMethod: 'cod' | 'upi' | 'card',
  deliveryAddress: DeliveryAddress,
  upiId?: string
) => {
  try {
    let result;
    
    switch (paymentMethod) {
      case 'cod':
        result = await processCodPayment(productId, amount, deliveryAddress);
        break;
      case 'upi':
        if (!upiId) {
          return { success: false, message: 'UPI ID is required for UPI payments' };
        }
        result = await processUpiPayment(productId, amount, deliveryAddress, upiId);
        break;
      case 'card':
        result = await processCardPayment(productId, amount, deliveryAddress, {});
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

/**
 * Generate an invoice for a completed payment
 */
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
        ),
        buyer:buyer_id(name, id)
      `)
      .eq('id', orderId)
      .single();
      
    if (error) throw error;
    
    if (!data) {
      return { success: false, error: 'Order not found' };
    }
    
    // Format the invoice data
    const invoiceData = {
      invoiceNumber: `INV-${orderId.slice(0, 8)}`,
      orderId: orderId,
      transactionId: data.transaction_id,
      date: new Date(data.payment_date).toLocaleDateString(),
      buyerDetails: {
        name: data.buyer?.name || 'Unknown Buyer',
        id: data.buyer?.id
      },
      sellerDetails: {
        name: data.product?.farmer?.name || 'Unknown Seller',
        id: data.product?.farmer?.id
      },
      productDetails: {
        name: data.product?.name || 'Unknown Product',
        quantity: data.product?.quantity || 0,
        unit: data.product?.unit || '',
        description: data.product?.description || ''
      },
      amount: data.amount,
      paymentMethod: data.payment_method,
      paymentStatus: data.payment_status,
      deliveryAddress: data.delivery_address
    };
    
    return { success: true, data: invoiceData };
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return { success: false, error: error.message };
  }
};
