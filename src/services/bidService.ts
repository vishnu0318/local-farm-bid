
import { supabase } from "@/integrations/supabase/client";
import { Bid, Product } from "@/types/marketplace";

export const placeBid = async (
  productId: string, 
  bidderId: string, 
  bidderName: string, 
  amount: number
): Promise<{ success: boolean; error?: string }> => {
  try {
    // Check if product exists and auction is still active
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (productError) {
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
    const { data: highestBid, error: bidError } = await supabase
      .from('bids')
      .select('amount')
      .eq('product_id', productId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();
    
    // Determine minimum bid
    const minBid = highestBid ? highestBid.amount + 1 : product.price + 1;
    
    // Check if bid is high enough
    if (amount < minBid) {
      return { 
        success: false, 
        error: `Bid must be at least ₹${minBid}` 
      };
    }
    
    // Insert bid
    const { error } = await supabase
      .from('bids')
      .insert({
        product_id: productId,
        bidder_id: bidderId,
        bidder_name: bidderName,
        amount
      });
    
    if (error) {
      console.error('Error placing bid:', error);
      return { success: false, error: error.message };
    }
    
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
      .select('*')
      .eq('product_id', productId)
      .order('amount', { ascending: false });
    
    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    }
    
    return data as Bid[];
  } catch (error) {
    console.error('Error fetching bids:', error);
    return [];
  }
};

export const getUserBids = async (userId: string): Promise<Bid[]> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select(`
        *,
        product:product_id (*)
      `)
      .eq('bidder_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user bids:', error);
      return [];
    }
    
    // Process the bids to match our expected format
    const processedBids = data.map((bid: any) => ({
      ...bid,
      product: bid.product
    }));
    
    return processedBids as Bid[];
  } catch (error) {
    console.error('Error fetching user bids:', error);
    return [];
  }
};

export const getHighestBid = async (productId: string): Promise<number> => {
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('amount')
      .eq('product_id', productId)
      .order('amount', { ascending: false })
      .limit(1)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') { // Code for "no rows returned"
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
        
        return product.price;
      }
      
      console.error('Error fetching highest bid:', error);
      return 0;
    }
    
    return data.amount;
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
  try {
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('bidder_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching user bids:', error);
      return [];
    }
    
    // Get product details for each bid
    const enrichedBids = await Promise.all(data.map(async (bid) => {
      const { data: productData, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', bid.product_id)
        .single();
      
      if (productError) {
        console.error('Error fetching product details:', productError);
        return null;
      }
      
      return {
        ...bid,
        product: productData
      };
    }));
    
    // Filter out null values
    return enrichedBids.filter(Boolean) as Bid[];
  } catch (error) {
    console.error('Error fetching user bids with products:', error);
    return [];
  }
};
