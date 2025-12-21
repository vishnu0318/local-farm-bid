import { supabase } from "@/integrations/supabase/client";
import { Bid, Product } from "@/types/marketplace";
import { toast } from "sonner";

export const placeBid = async (
  productId: string, 
  bidderId: string, 
  bidderName: string, 
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    console.log(`Placing bid: ${amount} on product ${productId} by ${bidderName}`);
    
    // Check if product exists and auction is still active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
      console.log('Product not found in DB');
      return { success: false, error: 'Product not found' };
    }
    
    // Check if bid end date has passed
    if (product.bid_end && new Date() > new Date(product.bid_end)) {
      return { success: false, error: 'This auction has already ended' };
    }
    
    // Check if bid start date is in the future
    if (product.bid_start && new Date() < new Date(product.bid_start)) {
      return { success: false, error: 'This auction has not started yet' };
    }
    
    // Get current highest bid
    const { data: highestBidData, error: bidError } = await supabase
      .from('bids')
      .select('bid_price')
      .eq('product_id', productId)
      .order('bid_price', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    // Determine minimum bid based on highest bid or product price
    let minBid = 0;
    
    if (!highestBidData) {
      console.log('No existing bids found for this product');
      minBid = (product.price || 0) + 1;
    } else {
      minBid = highestBidData.bid_price + 1;
    }
    
    // Check if bid is high enough
    if (amount < minBid) {
      return { 
        success: false, 
        error: `Bid must be at least ₹${minBid}` 
      };
    }
    
    // Insert bid - using correct column names from bids table
    const { data, error } = await supabase
      .from('bids')
      .insert({
        product_id: productId,
        buyer_id: bidderId,
        farmer_id: product.farmer_id,
        bidder_name: bidderName,
        bid_price: amount,
        quantity: 1,
        total_amount: amount
      })
      .select();
    
    if (error) {
      console.error('Error placing bid:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Bid placed successfully:', data);
    return { success: true };
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred' 
    };
  }
};

export const getProductBids = async (productId: string): Promise<Bid[]> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('id, product_id, buyer_id, bidder_name, bid_price, created_at')
      .eq('product_id', productId)
      .order('bid_price', { ascending: false });
    
    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    }
    
    // Map to expected Bid interface
    return (data || []).map(bid => ({
      id: bid.id,
      product_id: bid.product_id,
      buyer_id: bid.buyer_id,
      bidder_name: bid.bidder_name || 'Unknown',
      amount: bid.bid_price,
      created_at: bid.created_at
    })) as Bid[];
  } catch (error) {
    console.error('Error fetching bids:', error);
    return [];
  }
};

export const getUserBids = async (userId: string): Promise<Bid[]> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('id, product_id, buyer_id, bidder_name, bid_price, created_at')
      .eq('buyer_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user bids:', error);
      return [];
    }
    
    // Fetch product details for each bid
    const bidsWithProducts = await Promise.all(
      (data || []).map(async (bid) => {
        const { data: product } = await supabase
          .from('products')
          .select('*')
          .eq('id', bid.product_id)
          .single();
        
        return {
          id: bid.id,
          product_id: bid.product_id,
          buyer_id: bid.buyer_id,
          bidder_name: bid.bidder_name || 'Unknown',
          amount: bid.bid_price,
          created_at: bid.created_at,
          product: product || undefined
        };
      })
    );
    
    return bidsWithProducts as Bid[];
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return [];
  }
};

export const getHighestBid = async (productId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('bid_price')
      .eq('product_id', productId)
      .order('bid_price', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (error || !data) {
      // No bids yet, get the product base price
      const { data: product, error: productError } = await supabase
        .from('products')
        .select('price')
        .eq('id', productId)
        .single();
        
      if (productError) {
        console.error('Error fetching product base price:', productError);
        return 0;
      }
      
      return product.price || 0;
    }
    
    return data.bid_price;
  } catch (error) {
    console.error('Error fetching highest bid:', error);
    return 0;
  }
};

// Subscribe to bid changes for a specific product
export const subscribeToBidChanges = (
  productId: string, 
  callback: () => void
) => {
  const channel = supabase
    .channel(`product-${productId}`)
    .on('postgres_changes', 
      { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'bids',
        filter: `product_id=eq.${productId}`
      }, 
      callback
    )
    .subscribe();
    
  return channel;
};

// Get all bids for a user with product details
export const getUserBidsWithProducts = async (userId: string): Promise<Bid[]> => {
  return getUserBids(userId);
};

// Count total bids for a product
export const countProductBids = async (productId: string): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('bids')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId);
    
    if (error) {
      console.error('Error counting bids:', error);
      return 0;
    }
    
    return count || 0;
  } catch (error) {
    console.error('Error counting bids:', error);
    return 0;
  }
};

// Get bid history for a product with bidder details
export const getBidHistoryForFarmer = async (productId: string): Promise<Bid[]> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('id, bidder_name, bid_price, created_at, product_id, buyer_id')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bid history:', error);
      return [];
    }
    
    return (data || []).map(bid => ({
      id: bid.id,
      product_id: bid.product_id,
      buyer_id: bid.buyer_id,
      bidder_name: bid.bidder_name || 'Unknown',
      amount: bid.bid_price,
      created_at: bid.created_at
    })) as Bid[];
  } catch (error) {
    console.error('Error fetching bid history:', error);
    return [];
  }
};