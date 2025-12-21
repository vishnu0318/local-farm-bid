import { supabase } from "@/integrations/supabase/client";
import { mockProducts } from "./mockData";

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  price: number;
  description?: string;
  status?: 'active' | 'pending';
  image_url?: string;
  farmer_id: string;
  created_at?: string;
  updated_at?: string;
  available?: boolean;
  bid_start?: string;
  bid_end?: string;
  currentBid?: number;
  highestBidderName?: string;
  winningBid?: number;
}

export interface Bid {
  id: string;
  product_id: string;
  buyer_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
}

export const getProductById = async (productId: string): Promise<Product | null> => {
  try {
    // Check database first
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .single();
    
    if (error) {
      console.error('Error fetching product from DB:', error);
      
      // Fall back to mock data if not found in database
      const mockProduct = mockProducts.find(p => p.id === productId);
      if (mockProduct) {
        console.log('Found product in mock data:', mockProduct);
        return mockProduct;
      }
      
      return null;
    }
    
    // Fetch the current highest bid for this product
    try {
      const { data: bidData } = await supabase
        .from('bids')
        .select('bid_price, bidder_name')
        .eq('product_id', productId)
        .order('bid_price', { ascending: false })
        .limit(1)
        .maybeSingle();
        
      if (bidData) {
        // Add highest bid information to the product
        return {
          ...data as Product,
          currentBid: bidData.bid_price,
          highestBidderName: bidData.bidder_name
        };
      }
    } catch (bidError) {
      console.log('No bids found for product');
    }
    
    return data as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    
    // Last resort fallback to mock data
    const mockProduct = mockProducts.find(p => p.id === productId);
    if (mockProduct) {
      console.log('Found product in mock data after error:', mockProduct);
      return mockProduct;
    }
    
    return null;
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
    }));
  } catch (error) {
    console.error('Error fetching bids:', error);
    return [];
  }
};

export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product as any])
      .select();
    
    if (error) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, id: data[0].id };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error adding product:', error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id);
    
    if (error) {
      console.error('Error updating product:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('Error updating product:', error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
};

export const deleteProduct = async (id: string): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting product:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting product:', error);
    return { success: false, error: error.message || "An unexpected error occurred" };
  }
};

export const placeBid = async(
  product: Product,
  user: { id: string; name: string },
  bidAmount: number
): Promise<{ success: boolean; error?: string; bid?: Bid }> => {
  try {
    // Make sure the bid is higher than the current highest bid or the base price
    const minBidAmount = product.currentBid || product.price;
    
    if (bidAmount <= minBidAmount) {
      return { 
        success: false, 
        error: `Your bid must be higher than the current bid of ₹${minBidAmount}`
      };
    }
    
    // Check if the auction has ended
    if (product.bid_end && new Date() > new Date(product.bid_end)) {
      return { 
        success: false, 
        error: 'This auction has already ended'
      };
    }

    // Get farmer_id from product
    const farmerId = product.farmer_id;

    // Insert the bid with correct column names
    const { data, error } = await supabase.from("bids").insert([
      {
        product_id: product.id,
        buyer_id: user.id,
        farmer_id: farmerId,
        bidder_name: user.name,
        bid_price: bidAmount,
        quantity: 1,
        total_amount: bidAmount
      },
    ]).select();

    if (error) {
      console.error('Error placing bid:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Bid placed successfully:', data);
    
    // Return success with the created bid
    return { 
      success: true, 
      bid: {
        id: data[0].id,
        product_id: data[0].product_id,
        buyer_id: data[0].buyer_id,
        bidder_name: data[0].bidder_name,
        amount: data[0].bid_price,
        created_at: data[0].created_at
      }
    };
  } catch (error: any) {
    console.error('Error placing bid:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred'
    };
  }
}