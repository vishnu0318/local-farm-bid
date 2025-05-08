
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
  status: 'completed' | 'pending' | 'failed' = 'completed'
) => {
  try {
    // Update the product status
    const { data, error } = await supabase
      .from('products')
      .update({
        paid: status === 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('id', productId);

    if (error) throw error;
    
    return { success: true, data };
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
  amount: number
) => {
  try {
    // For COD, we just record the payment as pending
    const result = await recordPayment(
      productId,
      amount,
      'cod',
      'pending'
    );
    
    return { 
      success: result.success, 
      message: result.success ? 
        'Cash on Delivery payment scheduled successfully' : 
        'Failed to schedule Cash on Delivery payment' 
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
  upiId: string
) => {
  // In a real app, this would initiate a UPI payment flow
  // For this demo, we'll just simulate success
  try {
    // Record the payment
    const result = await recordPayment(
      productId,
      amount,
      'upi',
      'completed'
    );
    
    return { 
      success: result.success, 
      message: result.success ? 
        'UPI payment processed successfully' : 
        'Failed to process UPI payment' 
    };
  } catch (error: any) {
    console.error('Error processing UPI payment:', error);
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
  deliveryAddress: any,
  upiId?: string
) => {
  try {
    let result;
    
    switch (paymentMethod) {
      case 'cod':
        result = await processCodPayment(productId, amount);
        break;
      case 'upi':
        if (!upiId) {
          return { success: false, message: 'UPI ID is required for UPI payments' };
        }
        result = await processUpiPayment(productId, amount, upiId);
        break;
      case 'card':
        // For demo purposes, we'll simulate a successful card payment
        result = await recordPayment(productId, amount, 'card', 'completed');
        return { 
          success: result.success, 
          message: result.success ? 
            'Card payment processed successfully' : 
            'Failed to process card payment' 
        };
      default:
        return { success: false, message: 'Invalid payment method' };
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
