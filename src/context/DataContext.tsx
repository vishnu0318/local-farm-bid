
import { createContext, useContext, useState, ReactNode } from 'react';

export interface Crop {
  id: string;
  title: string;
  farmerId: string;
  farmerName: string;
  description: string;
  basePrice: number;
  currentBid: number;
  highestBidderId: string | null;
  highestBidderName: string | null;
  image: string;
  quantity: number;
  unit: string;
  location: {
    latitude: number;
    longitude: number;
  };
  endTime: Date;
  createdAt: Date;
  status: 'active' | 'completed' | 'cancelled';
}

export interface Bid {
  id: string;
  cropId: string;
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: Date;
}

interface DataContextType {
  crops: Crop[];
  bids: Bid[];
  addCrop: (crop: Omit<Crop, 'id' | 'createdAt' | 'status' | 'currentBid' | 'highestBidderId' | 'highestBidderName'>) => void;
  placeBid: (cropId: string, bidderId: string, bidderName: string, amount: number) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial mock data for crops
const initialCrops: Crop[] = [
  {
    id: '1',
    title: 'Organic Tomatoes',
    farmerId: 'farm1',
    farmerName: 'Green Valley Farm',
    description: 'Fresh organic tomatoes grown without any pesticides. Perfect for salads and cooking.',
    basePrice: 40,
    currentBid: 45,
    highestBidderId: 'buyer2',
    highestBidderName: 'John Buyer',
    image: '/placeholder.svg',
    quantity: 5,
    unit: 'kg',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
    },
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 8), // 8 hours from now
    createdAt: new Date(),
    status: 'active',
  },
  {
    id: '2',
    title: 'Fresh Spinach',
    farmerId: 'farm2',
    farmerName: 'Sunshine Farms',
    description: 'Dark green, leafy spinach freshly harvested this morning. Locally grown and chemical-free.',
    basePrice: 30,
    currentBid: 35,
    highestBidderId: 'buyer1',
    highestBidderName: 'Alice Buyer',
    image: '/placeholder.svg',
    quantity: 3,
    unit: 'kg',
    location: {
      latitude: 28.6329,
      longitude: 77.2195,
    },
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 4), // 4 hours from now
    createdAt: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
    status: 'active',
  },
  {
    id: '3',
    title: 'Organic Potatoes',
    farmerId: 'farm1',
    farmerName: 'Green Valley Farm',
    description: 'Freshly dug organic potatoes. Perfect for roasting, mashing, or making crispy fries.',
    basePrice: 25,
    currentBid: 25,
    highestBidderId: null,
    highestBidderName: null,
    image: '/placeholder.svg',
    quantity: 10,
    unit: 'kg',
    location: {
      latitude: 28.6139,
      longitude: 77.2090,
    },
    endTime: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24 hours from now
    createdAt: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    status: 'active',
  },
];

const initialBids: Bid[] = [
  {
    id: 'bid1',
    cropId: '1',
    bidderId: 'buyer2',
    bidderName: 'John Buyer',
    amount: 45,
    timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
  },
  {
    id: 'bid2',
    cropId: '2',
    bidderId: 'buyer1',
    bidderName: 'Alice Buyer',
    amount: 35,
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
  },
];

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [crops, setCrops] = useState<Crop[]>(initialCrops);
  const [bids, setBids] = useState<Bid[]>(initialBids);

  const addCrop = (cropData: Omit<Crop, 'id' | 'createdAt' | 'status' | 'currentBid' | 'highestBidderId' | 'highestBidderName'>) => {
    const newCrop: Crop = {
      ...cropData,
      id: `crop-${Date.now()}`,
      currentBid: cropData.basePrice,
      highestBidderId: null,
      highestBidderName: null,
      createdAt: new Date(),
      status: 'active',
    };
    
    setCrops(prevCrops => [...prevCrops, newCrop]);
  };
  console.log(crops)
  

  const placeBid = (cropId: string, bidderId: string, bidderName: string, amount: number) => {
    // Create new bid
    const newBid: Bid = {
      id: `bid-${Date.now()}`,
      cropId,
      bidderId,
      bidderName,
      amount,
      timestamp: new Date(),
    };
    
    setBids(prevBids => [...prevBids, newBid]);
    
    // Update the crop with the new highest bid
    setCrops(prevCrops => 
      prevCrops.map(crop => 
        crop.id === cropId 
          ? { 
              ...crop, 
              currentBid: amount, 
              highestBidderId: bidderId,
              highestBidderName: bidderName
            }
          : crop
      )
    );
  };

 

  return (
    <DataContext.Provider value={{
      crops,
      bids,
      addCrop,
      placeBid,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
