
import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, MapPin, ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useData, Bid } from '@/context/DataContext';
import { useLocation } from '@/context/LocationContext';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import Navigation from '@/components/Navigation';
import BidForm from '@/components/BidForm';

const CropDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { crops, bids } = useData();
  const { toast } = useToast();
  const { currentLocation, calculateDistance } = useLocation();
  const { user } = useAuth();
  
  const [cropBids, setCropBids] = useState<Bid[]>([]);
  const crop = crops.find(c => c.id === id);
  
  // Calculate time remaining until auction ends
  const calculateTimeRemaining = () => {
    if (!crop) return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
    
    const now = new Date();
    const endTime = new Date(crop.endTime);
    const timeDiff = endTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return { hours: 0, minutes: 0, seconds: 0, isEnded: true };
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDiff % (1000 * 60)) / 1000);
    
    return { hours, minutes, seconds, isEnded: false };
  };
  
  const [timeRemaining, setTimeRemaining] = useState(calculateTimeRemaining());
  
  // Update time remaining every second
  useEffect(() => {
    if (!crop) return;
    
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining());
    }, 1000);
    
    return () => clearInterval(interval);
  }, [crop]);
  
  // Get crop bids
  useEffect(() => {
    if (!id) return;
    
    const filteredBids = bids.filter(bid => bid.cropId === id);
    
    // Sort by timestamp (most recent first)
    setCropBids(filteredBids.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ));
  }, [id, bids]);
  
  if (!crop) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navigation />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Crop Not Found</h2>
            <p className="text-gray-600 mb-4">The crop you're looking for doesn't exist or has been removed.</p>
            <Link to="/marketplace">
              <Button>Back to Marketplace</Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }
  
  const distance = currentLocation ? 
    calculateDistance(
      currentLocation.latitude, 
      currentLocation.longitude, 
      crop.location.latitude, 
      crop.location.longitude
    ).toFixed(1) : 
    null;
    
  const formattedTime = `${timeRemaining.hours}h ${timeRemaining.minutes}m ${timeRemaining.seconds}s`;
  
  // Check if current user is the farmer who posted this crop
  const isOwner = user?.id === crop.farmerId;
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-6">
            <Link to="/marketplace" className="flex items-center text-farmgreen-600 hover:text-farmgreen-700">
              <ArrowLeft size={16} className="mr-1" />
              Back to Marketplace
            </Link>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left column - Crop details */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg overflow-hidden shadow-sm">
                {/* Crop image */}
                <div className="h-64 bg-gray-100 relative">
                  <img 
                    src={crop.image} 
                    alt={crop.title} 
                    className="w-full h-full object-cover"
                  />
                  {timeRemaining.isEnded ? (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Auction Ended
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-farmgreen-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Active Auction
                    </div>
                  )}
                  
                  {isOwner && (
                    <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Your Listing
                    </div>
                  )}
                </div>
                
                {/* Crop info */}
                <div className="p-6">
                  <div className="flex justify-between items-start">
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{crop.title}</h1>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Base Price</p>
                      <p className="text-xl font-semibold">₹{crop.basePrice}</p>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-500 mb-4">by {crop.farmerName}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <MapPin size={16} className="mr-1" />
                      <span>{distance ? `${distance} km away` : 'Distance unknown'}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock size={16} className="mr-1" />
                      <span>
                        {timeRemaining.isEnded 
                          ? 'Auction has ended' 
                          : `Ends in ${formattedTime}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Description</h3>
                    <p className="text-gray-700">{crop.description}</p>
                  </div>
                  
                  <div className="flex justify-between items-center p-4 bg-gray-50 rounded-lg">
                    <div>
                      <p className="text-sm text-gray-500">Quantity Available</p>
                      <p className="text-lg font-semibold">{crop.quantity} {crop.unit}</p>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm text-gray-500">Current Bid</p>
                      <p className="text-xl font-bold text-farmgreen-600">₹{crop.currentBid}</p>
                      {crop.highestBidderName && (
                        <p className="text-sm text-gray-500">by {crop.highestBidderName}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Tabs for bids history */}
              <div className="mt-8">
                <Tabs defaultValue="bids">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="bids">Bid History ({cropBids.length})</TabsTrigger>
                    <TabsTrigger value="details">Crop Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="bids">
                    <Card className="p-6">
                      {isOwner && !timeRemaining.isEnded && cropBids.length > 0 && (
                        <div className="mb-6">
                          <h3 className="text-lg font-semibold mb-4">Current Auction Status</h3>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Bidder</TableHead>
                                <TableHead>Bid Amount</TableHead>
                                <TableHead>Time</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {cropBids.slice(0, 5).map((bid) => (
                                <TableRow key={bid.id}>
                                  <TableCell className="font-medium">{bid.bidderName}</TableCell>
                                  <TableCell className="text-farmgreen-600 font-bold">₹{bid.amount}</TableCell>
                                  <TableCell>{new Date(bid.timestamp).toLocaleTimeString()}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                          {cropBids.length > 5 && (
                            <p className="text-sm text-gray-500 mt-2 text-center">
                              + {cropBids.length - 5} more bids
                            </p>
                          )}
                        </div>
                      )}
                      
                      {cropBids.length > 0 ? (
                        <div className="space-y-4">
                          {cropBids.map((bid) => (
                            <div 
                              key={bid.id} 
                              className="flex justify-between items-center p-3 border-b last:border-0"
                            >
                              <div className="flex items-center">
                                <User size={16} className="text-gray-400 mr-2" />
                                <div>
                                  <p className="font-medium">{bid.bidderName}</p>
                                  <p className="text-xs text-gray-500">
                                    {new Date(bid.timestamp).toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-bold text-farmgreen-600">₹{bid.amount}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          No bids have been placed yet.
                        </div>
                      )}
                    </Card>
                  </TabsContent>
                  
                  <TabsContent value="details">
                    <Card className="p-6">
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Harvest Date</h3>
                          <p>Within last 24 hours</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Growing Method</h3>
                          <p>Organic, No Pesticides</p>
                        </div>
                        <div>
                          <h3 className="text-sm font-medium text-gray-500">Pickup/Delivery</h3>
                          <p>Farm pickup available, Local delivery within 10km</p>
                        </div>
                      </div>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
            
            {/* Right column - Bid form or farmer view */}
            <div className="lg:col-span-1">
              {isOwner ? (
                <Card className="p-6">
                  <h3 className="font-semibold text-lg mb-4">Your Auction Status</h3>
                  
                  <div className="space-y-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Auction Status</p>
                      <p className="font-semibold">
                        {timeRemaining.isEnded ? 'Ended' : 'Active'}
                      </p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Total Bids</p>
                      <p className="font-semibold">{cropBids.length}</p>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Current Highest Bid</p>
                      <p className="text-xl font-bold text-farmgreen-600">
                        {crop.currentBid > crop.basePrice ? `₹${crop.currentBid}` : 'No bids yet'}
                      </p>
                      {crop.highestBidderName && (
                        <p className="text-sm">by {crop.highestBidderName}</p>
                      )}
                    </div>
                    
                    {!timeRemaining.isEnded ? (
                      <Button variant="outline" className="w-full">
                        Edit Listing
                      </Button>
                    ) : crop.highestBidderName ? (
                      <div className="space-y-4">
                        <p className="font-medium">Auction Completed</p>
                        <Button className="w-full">
                          Contact Buyer
                        </Button>
                      </div>
                    ) : (
                      <p className="text-center text-amber-600">
                        Auction ended without bids
                      </p>
                    )}
                  </div>
                </Card>
              ) : !timeRemaining.isEnded ? (
                <BidForm crop={crop} />
              ) : (
                <Card className="p-6 text-center">
                  <h3 className="font-semibold text-lg mb-2">Auction Has Ended</h3>
                  <p className="text-gray-600 mb-4">
                    This auction has concluded and is no longer accepting bids.
                  </p>
                  {crop.highestBidderName ? (
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-500">Winning Bid</p>
                      <p className="text-xl font-bold text-farmgreen-600">₹{crop.currentBid}</p>
                      <p className="text-sm">by {crop.highestBidderName}</p>
                    </div>
                  ) : (
                    <p className="text-amber-600">
                      No bids were placed for this item.
                    </p>
                  )}
                  <div className="mt-4">
                    <Link to="/marketplace">
                      <Button variant="outline" className="w-full">
                        Browse More Crops
                      </Button>
                    </Link>
                  </div>
                </Card>
              )}
              
              {/* Contact farmer card - only show for buyers */}
              {!isOwner && (
                <Card className="p-6 mt-6">
                  <h3 className="font-semibold text-lg mb-2">About the Farmer</h3>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                      <User size={20} />
                    </div>
                    <div className="ml-3">
                      <p className="font-medium">{crop.farmerName}</p>
                      <p className="text-sm text-gray-500">Joined 2023</p>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full">
                    Contact Farmer
                  </Button>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CropDetail;
