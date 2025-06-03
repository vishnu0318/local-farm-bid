
import { supabase } from "@/integrations/supabase/client";
import { DeliveryAddress } from "@/types/marketplace";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: any) => void;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

/**
 * Load Razorpay script dynamically
 */
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

/**
 * Create Razorpay order
 */
export const createRazorpayOrder = async (amount: number, productId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
      body: { amount: amount * 100, productId } // Razorpay expects amount in paise
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error creating Razorpay order:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Process Razorpay payment
 */
export const processRazorpayPayment = async (
  amount: number,
  productId: string,
  productName: string,
  deliveryAddress: DeliveryAddress,
  userDetails: { name: string; email: string; phone?: string }
): Promise<{ success: boolean; message?: string; data?: any }> => {
  try {
    // Load Razorpay script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      throw new Error('Failed to load Razorpay script');
    }

    // Create Razorpay order
    const orderResult = await createRazorpayOrder(amount, productId);
    if (!orderResult.success) {
      throw new Error(orderResult.error);
    }

    return new Promise((resolve) => {
      const options: RazorpayOptions = {
        key: 'rzp_test_9999999999', // Replace with your Razorpay key
        amount: amount * 100, // Amount in paise
        currency: 'INR',
        name: 'Go Fresh',
        description: `Payment for ${productName}`,
        order_id: orderResult.data.id,
        handler: async (response: any) => {
          try {
            // Verify payment with backend
            const verifyResult = await verifyRazorpayPayment(
              response.razorpay_payment_id,
              response.razorpay_order_id,
              response.razorpay_signature,
              productId,
              amount,
              deliveryAddress
            );

            if (verifyResult.success) {
              resolve({
                success: true,
                message: 'Payment successful',
                data: verifyResult.data
              });
            } else {
              resolve({
                success: false,
                message: 'Payment verification failed'
              });
            }
          } catch (error: any) {
            resolve({
              success: false,
              message: error.message
            });
          }
        },
        prefill: {
          name: userDetails.name,
          email: userDetails.email,
          contact: userDetails.phone || ''
        },
        theme: {
          color: '#22c55e'
        }
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();

      razorpay.on('payment.failed', () => {
        resolve({
          success: false,
          message: 'Payment failed'
        });
      });
    });
  } catch (error: any) {
    console.error('Error processing Razorpay payment:', error);
    return { success: false, message: error.message };
  }
};

/**
 * Verify Razorpay payment
 */
export const verifyRazorpayPayment = async (
  paymentId: string,
  orderId: string,
  signature: string,
  productId: string,
  amount: number,
  deliveryAddress: DeliveryAddress
) => {
  try {
    const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
      body: {
        paymentId,
        orderId,
        signature,
        productId,
        amount,
        deliveryAddress
      }
    });

    if (error) throw error;
    return { success: true, data };
  } catch (error: any) {
    console.error('Error verifying Razorpay payment:', error);
    return { success: false, error: error.message };
  }
};
