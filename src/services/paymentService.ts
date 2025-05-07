
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
 * Records a completed payment in the database
 */
export const recordPayment = async (
  productId: string,
  bidId: string,
  amount: number,
  paymentMethod: string,
  status: 'completed' | 'pending' | 'failed' = 'completed'
) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .insert({
        product_id: productId,
        bid_id: bidId,
        amount: amount,
        payment_method: paymentMethod,
        status: status
      });

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
  bidId: string,
  amount: number
) => {
  try {
    // For COD, we just record the payment as pending
    const result = await recordPayment(
      productId,
      bidId,
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
  bidId: string,
  amount: number,
  upiId: string
) => {
  // In a real app, this would initiate a UPI payment flow
  // For this demo, we'll just simulate success
  try {
    // Record the payment
    const result = await recordPayment(
      productId,
      bidId,
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
