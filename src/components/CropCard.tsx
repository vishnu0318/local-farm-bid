
import { Clock, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Crop } from '@/context/DataContext';
import { useLocation } from '@/context/LocationContext';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface CropCardProps {
  crop: Crop;
}

const CropCard = ({ crop }: CropCardProps) => {
  const navigate = useNavigate();
  const { currentLocation, calculateDistance } = useLocation();
  
  // Calculate time remaining until auction ends
  const calculateTimeRemaining = () => {
    const now = new Date();
    const endTime = new Date(crop.endTime);
    const timeDiff = endTime.getTime() - now.getTime();
    
    if (timeDiff <= 0) return 'Ended';
    
    const hours = Math.floor(timeDiff / (1000 * 60 * 60));
    const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };
  
  // Calculate distance if we have user's location
  const distance = currentLocation ? 
    calculateDistance(
      currentLocation.latitude, 
      currentLocation.longitude, 
      crop.location.latitude, 
      crop.location.longitude
    ).toFixed(1) : 
    null;

  return (
    <Card className="overflow-hidden transition-all hover:shadow-md">
      <div className="h-48 overflow-hidden bg-gray-100">
        <img 
          src={crop.image} 
          alt={crop.title} 
          className="w-full h-full object-cover"
        />
      </div>
      <CardHeader className="pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-lg font-semibold text-farmgreen-600">{crop.title}</CardTitle>
          <Badge variant={crop.currentBid > crop.basePrice ? "secondary" : "outline"}>
            {crop.currentBid > crop.basePrice ? 'Bidding' : 'No bids yet'}
          </Badge>
        </div>
        <CardDescription>by {crop.farmerName}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 pb-2">
        <p className="text-sm line-clamp-2">{crop.description}</p>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <MapPin size={14} className="mr-1" />
          <span>{distance ? `${distance} km away` : 'Distance unknown'}</span>
        </div>
        
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock size={14} className="mr-1" />
          <span>Ends in {calculateTimeRemaining()}</span>
        </div>
        
        <div className="mt-4 flex justify-between items-end">
          <div>
            <p className="text-xs text-gray-500">Current bid</p>
            <p className="text-lg font-bold text-farmgreen-600">₹{crop.currentBid}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Quantity</p>
            <p className="text-sm">{crop.quantity} {crop.unit}</p>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="w-full" 
          onClick={() => navigate(`/crop/${crop.id}`)}
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
};

export default CropCard;
