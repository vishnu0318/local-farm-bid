
import { Product } from "@/types/marketplace";

// Generate dates for auctions (some active, some ended)
const now = new Date();
const getRandomFutureDate = (minHours: number, maxHours: number) => {
  const futureDate = new Date(now);
  const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
  futureDate.setHours(futureDate.getHours() + randomHours);
  return futureDate.toISOString();
};

const getRandomPastDate = (minHours: number, maxHours: number) => {
  const pastDate = new Date(now);
  const randomHours = Math.floor(Math.random() * (maxHours - minHours + 1)) + minHours;
  pastDate.setHours(pastDate.getHours() - randomHours);
  return pastDate.toISOString();
};

// Sample farmer IDs
const farmerIds = [
  "b69c5af8-6c7a-41a0-b0f2-a282c5e6d28f",
  "7c3d5a9e-2f18-4b6d-9d3b-6e2a8c1f5d4e",
  "5a2d9e7c-4f1b-6d3a-8c5e-2f9d7b3e1a6c"
];

// Sample farmer names
const farmerNames = ["Raj Kumar", "Sita Patel", "Arjun Singh", "Priya Sharma", "Vikram Verma"];

// Mock product data
export const mockProducts: Product[] = [
  {
    id: "a1b2c3d4-e5f6-4a5b-8c7d-9e8f7a6b5c4d",
    name: "Premium Organic Rice",
    category: "Grains",
    farmer_id: farmerIds[0],
    farmer_name: farmerNames[0],
    quantity: 50,
    unit: "kg",
    price: 2500,
    description: "Premium quality organic rice grown without pesticides",
    image_url: "https://images.unsplash.com/photo-1586201375761-83865001e31c?q=80&w=2070&auto=format&fit=crop",
    bid_start: getRandomPastDate(24, 48),
    bid_end: getRandomFutureDate(24, 72),
    highest_bid: 2800,
    highest_bidder_id: null,
    bids_count: 5,
    available: true,
    distance: 12
  },
  {
    id: "b2c3d4e5-f6a7-5b6c-9d8e-0f1g2h3i4j5",
    name: "Fresh Tomatoes",
    category: "Vegetables",
    farmer_id: farmerIds[1],
    farmer_name: farmerNames[1],
    quantity: 20,
    unit: "kg",
    price: 800,
    description: "Fresh red tomatoes harvested this morning",
    image_url: "https://images.unsplash.com/photo-1592924357229-339152ecb42e?q=80&w=2070&auto=format&fit=crop",
    bid_start: getRandomPastDate(48, 72),
    bid_end: getRandomFutureDate(2, 8),
    highest_bid: 950,
    highest_bidder_id: null,
    bids_count: 7,
    available: true,
    distance: 5
  },
  {
    id: "c3d4e5f6-g7h8-6c7d-0e1f-2g3h4i5j6k7",
    name: "Wheat Flour",
    category: "Grains",
    farmer_id: farmerIds[2],
    farmer_name: farmerNames[2],
    quantity: 100,
    unit: "kg",
    price: 4500,
    description: "Fine wheat flour perfect for baking",
    image_url: "https://images.unsplash.com/photo-1509440159596-0249088772ff?q=80&w=2072&auto=format&fit=crop",
    bid_start: getRandomPastDate(72, 96),
    bid_end: getRandomPastDate(2, 5),  // Ended auction
    highest_bid: 5000,
    highest_bidder_id: "current_user_id", // This will make it appear as a won auction for testing
    bids_count: 12,
    available: true,
    distance: 18
  },
  {
    id: "d4e5f6g7-h8i9-7d8e-1f2g-3h4i5j6k7l8",
    name: "Fresh Onions",
    category: "Vegetables",
    farmer_id: farmerIds[0],
    farmer_name: farmerNames[0],
    quantity: 30,
    unit: "kg",
    price: 1200,
    description: "Premium quality red onions",
    image_url: "https://images.unsplash.com/photo-1620574387735-3921fa6db75a?q=80&w=2070&auto=format&fit=crop",
    bid_start: getRandomPastDate(48, 72),
    bid_end: getRandomFutureDate(12, 36),
    highest_bid: 1350,
    highest_bidder_id: null,
    bids_count: 4,
    available: true,
    distance: 8
  },
  {
    id: "e5f6g7h8-i9j0-8e9f-2g3h-4i5j6k7l8m9",
    name: "Organic Potatoes",
    category: "Vegetables",
    farmer_id: farmerIds[1],
    farmer_name: farmerNames[1],
    quantity: 40,
    unit: "kg",
    price: 1600,
    description: "Organically grown potatoes, perfect for all dishes",
    image_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?q=80&w=2070&auto=format&fit=crop",
    bid_start: getRandomPastDate(24, 48),
    bid_end: getRandomPastDate(1, 3),  // Ended auction
    highest_bid: 1800,
    highest_bidder_id: "current_user_id", // This will make it appear as a won auction for testing
    bids_count: 8,
    available: true,
    distance: 15
  },
  {
    id: "f6g7h8i9-j0k1-9f0g-3h4i-5j6k7l8m9n0",
    name: "Fresh Corn",
    category: "Vegetables",
    farmer_id: farmerIds[2],
    farmer_name: farmerNames[2],
    quantity: 25,
    unit: "kg",
    price: 1000,
    description: "Sweet corn freshly harvested",
    image_url: "https://images.unsplash.com/photo-1551754655-cd27e38d2076?q=80&w=2070&auto=format&fit=crop",
    bid_start: getRandomPastDate(72, 96),
    bid_end: getRandomFutureDate(48, 72),
    highest_bid: 1100,
    highest_bidder_id: null,
    bids_count: 3,
    available: true,
    distance: 20
  }
];
