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
  bidder_id: string;
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
        .select('amount, bidder_name')
        .eq('product_id', productId)
        .order('amount', { ascending: false })
        .limit(1)
        .single();
        
      if (bidData) {
        // Add highest bid information to the product
        return {
          ...data as Product,
          currentBid: bidData.amount,
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

export const addProduct = async (product: Omit<Product, 'id' | 'created_at' | 'updated_at'>): Promise<{ success: boolean; id?: string; error?: string }> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select();
    
    if (error) {
      console.error('Error adding product:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, id: data[0].id };
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
  } catch (error) {
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

    // Insert the bid
    const { data, error } = await supabase.from("bids").insert([
      {
        product_id: product.id,
        bidder_id: user.id,
        bidder_name: user.name,
        amount: bidAmount,
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
      message: 'Your bid has been placed successfully!',
      bid: data[0] as Bid
    };
  } catch (error) {
    console.error('Error placing bid:', error);
    return { 
      success: false, 
      error: error.message || 'An unexpected error occurred'
    };
  }
}
