
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from "sonner";

interface LocationContextType {
  currentLocation: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  requestLocationPermission: () => Promise<void>;
  calculateDistance: (lat1: number, lon1: number, lat2: number, lon2: number) => number;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const LocationProvider = ({ children }: { children: ReactNode }) => {
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate distance between two points using Haversine formula (in kilometers)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c; // Distance in km
    return distance;
  };

  const deg2rad = (deg: number): number => {
    return deg * (Math.PI / 180);
  };

  // Function to request location permission and get current location
  const requestLocationPermission = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      setCurrentLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
      toast.success("Location successfully detected!");
    } catch (err: any) {
      setError(err.message || 'Failed to get location');
      toast.error("Failed to get your location. Please check your permissions.");
      console.error('Error getting location:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Request location when the component mounts
  useEffect(() => {
    requestLocationPermission();
  }, []);

  return (
    <LocationContext.Provider value={{
      currentLocation,
      isLoading,
      error,
      requestLocationPermission,
      calculateDistance,
    }}>
      {children}
    </LocationContext.Provider>
  );
};

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};
