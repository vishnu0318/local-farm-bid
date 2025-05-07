
// Follow this setup guide to integrate the Deno runtime and Stripe:
// https://stripe.com/docs/payments/quickstart

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Ensure STRIPE_SECRET_KEY is set in environment variables
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) {
      console.log("Missing STRIPE_SECRET_KEY");
      throw new Error("STRIPE_SECRET_KEY is not set in environment variables");
    }
    
    // Initialize Stripe
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2023-10-16",
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Get request body
    const { amount, productId, productName, paymentMethod } = await req.json();
    
    if (!amount || amount < 1) {
      throw new Error("Invalid amount provided");
    }
    
    console.log(`Creating payment intent: ${amount} INR for product ${productId}, method: ${paymentMethod}`);
    
    // Create Supabase client using anon key (for read operations)
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      console.log("User not authenticated", userError);
      throw new Error("User not authenticated");
    }

    // Create a PaymentIntent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "inr",
      payment_method_types: ["card"],
      metadata: {
        product_id: productId,
        user_id: user.id,
        product_name: productName || "Unknown product"
      },
      receipt_email: user.email,
    });

    console.log(`Payment intent created: ${paymentIntent.id}`);

    return new Response(JSON.stringify({ 
      clientSecret: paymentIntent.client_secret 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error creating payment intent:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
