
export interface Product {
  id: string;
  name: string;
  category: string;
  farmer_id: string;
  quantity: number;
  unit: string;
  price: number;
  description?: string;
  image_url?: string | null;
  bid_start?: string | null;
  bid_end?: string | null;
  farmer_name?: string;
  distance?: number;
  highest_bid?: number;
  highest_bidder_id?: string;
  bids_count?: number;
}

export interface Bid {
  id: string;
  product_id: string;
  bidder_id: string;
  bidder_name: string;
  amount: number;
  created_at: string;
  product?: Product;
}

export interface FarmerProfile {
  id: string;
  name: string;
  role: string;
  phone?: string;
  address?: string;
  land_size?: string;
  email?: string;
}
