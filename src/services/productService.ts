
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
    // Since we don't have a bids table yet, return an empty array
    // In a real app, you would have a bids table to query
    
    return [];
    
    // When you have a bids table, you can uncomment this:
    /*
    const { data, error } = await supabase
      .from('bids')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching bids:', error);
      return [];
    }
    
    return data as Bid[];
    */
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
  bidAmount: number,
  setBidAmount: (value: number) => void,
  setIsSubmitting: (value: boolean) => void
)=>{
  try {
    const { data, error } = await supabase.from("bids").insert([
      {
        product_id: product.id,
        bidder_id: user.id,
        bidder_name: user.name,
        amount: bidAmount,
      },
    ]);

    if (error) {
      console.error(error);
      return { success: false, error: error.message};
    } else {
      setBidAmount(bidAmount + 5);
      return { success: true, message: 'Your bid has been placed successfully!'};
    }
  } catch (error) {
    console.error(error);
    return { success: false, error: error.message};
  } finally {
    setIsSubmitting(false);
  }
}