
import { formatISO, addDays, subDays } from 'date-fns';

// Generate dates for active auctions
const today = new Date();
const auctionStart = formatISO(subDays(today, 2));
const auctionEnd = formatISO(addDays(today, 5));

// Generate dates for ended auctions
const endedAuctionStart = formatISO(subDays(today, 10));
const endedAuctionEnd = formatISO(subDays(today, 1));

// Mock product data
export const mockProducts = [
  {
    id: '1',
    name: 'Premium White Rice',
    category: 'grains',
    farmer_id: 'farmer-1',
    farmer_name: 'Raman Singh',
    quantity: 100,
    unit: 'kg',
    price: 50,
    highest_bid: 60,
    highest_bidder_id: 'other-user',
    image_url: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    bid_start: auctionStart,
    bid_end: auctionEnd,
    description: 'Premium quality white rice grown organically in the fertile lands of Punjab.',
    available: true
  },
  {
    id: '2',
    name: 'Organic Wheat',
    category: 'grains',
    farmer_id: 'farmer-2',
    farmer_name: 'Harpreet Kaur',
    quantity: 200,
    unit: 'kg',
    price: 35,
    highest_bid: 42,
    highest_bidder_id: 'current_user_id',
    image_url: 'https://images.unsplash.com/photo-1565530995968-2ea021eb71a9?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    bid_start: auctionStart,
    bid_end: auctionEnd,
    description: 'Pesticide-free wheat grown using traditional farming methods.',
    available: true
  },
  {
    id: '3',
    name: 'Fresh Red Tomatoes',
    category: 'vegetables',
    farmer_id: 'farmer-3',
    farmer_name: 'Rajesh Kumar',
    quantity: 50,
    unit: 'kg',
    price: 30,
    highest_bid: 35,
    highest_bidder_id: 'other-user',
    image_url: 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    bid_start: endedAuctionStart,
    bid_end: endedAuctionEnd,
    description: 'Vine-ripened, juicy red tomatoes harvested at peak freshness.',
    available: false
  },
  {
    id: '4',
    name: 'Farm Fresh Potatoes',
    category: 'vegetables',
    farmer_id: 'farmer-4',
    farmer_name: 'Anita Sharma',
    quantity: 150,
    unit: 'kg',
    price: 25,
    highest_bid: 32,
    highest_bidder_id: 'current_user_id',
    image_url: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    bid_start: endedAuctionStart,
    bid_end: endedAuctionEnd,
    description: 'High-quality potatoes perfect for making delicious curries and fries.',
    available: false
  },
  {
    id: '5',
    name: 'Alphonso Mangoes',
    category: 'fruits',
    farmer_id: 'farmer-5',
    farmer_name: 'Prakash Patel',
    quantity: 75,
    unit: 'kg',
    price: 120,
    highest_bid: 140,
    highest_bidder_id: 'other-user',
    image_url: 'https://images.unsplash.com/photo-1553279768-865429fa0078?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    bid_start: auctionStart,
    bid_end: auctionEnd,
    description: 'Premium Alphonso mangoes, known for their sweetness and rich flavor. Limited seasonal availability.',
    available: true
  },
  {
    id: '6',
    name: 'Organic Green Beans',
    category: 'vegetables',
    farmer_id: 'farmer-1',
    farmer_name: 'Raman Singh',
    quantity: 40,
    unit: 'kg',
    price: 45,
    highest_bid: 52,
    highest_bidder_id: 'current_user_id',
    image_url: 'https://images.unsplash.com/photo-1567375698348-5d9d5ae99de0?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    bid_start: auctionStart,
    bid_end: auctionEnd,
    description: 'Crisp and fresh green beans grown without pesticides.',
    available: true
  },
  {
    id: '7',
    name: 'Premium Basmati Rice',
    category: 'grains',
    farmer_id: 'farmer-2',
    farmer_name: 'Harpreet Kaur',
    quantity: 85,
    unit: 'kg',
    price: 90,
    highest_bid: 102,
    highest_bidder_id: 'other-user',
    image_url: 'https://images.unsplash.com/photo-1613758235402-745466bb7efe?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    bid_start: endedAuctionStart,
    bid_end: endedAuctionEnd,
    description: 'Aromatic long-grain basmati rice, perfect for biryanis and pulao.',
    available: false
  },
  {
    id: '8',
    name: 'Organic Cotton',
    category: 'fibers',
    farmer_id: 'farmer-3',
    farmer_name: 'Rajesh Kumar',
    quantity: 300,
    unit: 'kg',
    price: 70,
    highest_bid: 85,
    highest_bidder_id: 'current_user_id',
    image_url: 'https://images.unsplash.com/photo-1605001011156-cbf0b0f67a51?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1074&q=80',
    bid_start: auctionStart,
    bid_end: auctionEnd,
    description: 'High-quality organic cotton grown without harmful chemicals.',
    available: true
  }
];
