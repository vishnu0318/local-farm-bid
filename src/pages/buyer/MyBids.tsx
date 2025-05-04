
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Eye } from 'lucide-react';

const MOCK_BIDS = [
  {
    id: 'b1',
    productId: 'p1',
    productName: 'Organic Tomatoes',
    farmer: 'Green Valley Farm',
    yourBid: '3.25',
    highestBid: '3.25',
    unit: 'kg',
    timeLeft: '2 days',
    status: 'winning',
    imageUrl: 'https://images.unsplash.com/photo-1518977956812-cd3dbadaaf31',
  },
  {
    id: 'b2',
    productId: 'p2',
    productName: 'Fresh Apples',
    farmer: 'Orchard Hills',
    yourBid: '2.10',
    highestBid: '2.35',
    unit: 'kg',
    timeLeft: '1 day',
    status: 'outbid',
    imageUrl: 'https://images.unsplash.com/photo-1570913149827-d2ac84ab3f9a',
  },
  {
    id: 'b3',
    productId: 'p3',
    productName: 'Organic Carrots',
    farmer: 'Sunny Fields',
    yourBid: '1.50',
    highestBid: '1.75',
    unit: 'kg',
    timeLeft: '0',
    status: 'lost',
    imageUrl: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37',
  },
  {
    id: 'b4',
    productId: 'p4',
    productName: 'Fresh Strawberries',
    farmer: 'Berry Farm',
    yourBid: '5.00',
    highestBid: '5.00',
    unit: 'kg',
    timeLeft: '0',
    status: 'won',
    imageUrl: 'https://images.unsplash.com/photo-1601004890684-d8cbf643f5f2',
  },
];

const MyBids = () => {
  const [activeTab, setActiveTab] = useState('active');
  
  const activeBids = MOCK_BIDS.filter(bid => bid.timeLeft !== '0');
  const completedBids = MOCK_BIDS.filter(bid => bid.timeLeft === '0');
  const wonBids = completedBids.filter(bid => bid.status === 'won');
  const lostBids = completedBids.filter(bid => bid.status === 'lost');

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">My Bids</h1>
      
      <Tabs defaultValue="active" onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-3 mb-6">
          <TabsTrigger value="active">Active Bids</TabsTrigger>
          <TabsTrigger value="won">Won Auctions</TabsTrigger>
          <TabsTrigger value="lost">Lost Auctions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {activeBids.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-center text-gray-500 mb-4">You don't have any active bids</p>
                <Link to="/buyer/browse-products">
                  <Button>Browse Products</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {activeBids.map((bid) => (
                <Card key={bid.id}>
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img 
                      src={bid.imageUrl} 
                      alt={bid.productName} 
                      className="object-cover w-full h-48 rounded-t-lg"
                    />
                    <Badge className="absolute top-2 right-2" variant={bid.status === 'winning' ? 'default' : 'destructive'}>
                      {bid.status === 'winning' ? 'Winning' : 'Outbid'}
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{bid.productName}</CardTitle>
                    <CardDescription>
                      By {bid.farmer} · {bid.timeLeft} left
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Your Bid</p>
                        <p className="text-lg font-medium">${bid.yourBid}/{bid.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Highest Bid</p>
                        <p className={`text-lg font-medium ${bid.status === 'winning' ? 'text-green-600' : 'text-red-500'}`}>
                          ${bid.highestBid}/{bid.unit}
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Link to={`/buyer/product/${bid.productId}`}>
                        <Button className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>View Product</span>
                        </Button>
                      </Link>
                      {bid.status === 'outbid' && (
                        <Link to={`/buyer/product/${bid.productId}`}>
                          <Button variant="outline">
                            Increase Bid
                          </Button>
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="won">
          {wonBids.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-center text-gray-500">You haven't won any auctions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {wonBids.map((bid) => (
                <Card key={bid.id}>
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img 
                      src={bid.imageUrl} 
                      alt={bid.productName} 
                      className="object-cover w-full h-48 rounded-t-lg"
                    />
                    <Badge className="absolute top-2 right-2" variant="default">
                      Won
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{bid.productName}</CardTitle>
                    <CardDescription>
                      By {bid.farmer}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Your Winning Bid</p>
                        <p className="text-lg font-medium text-green-600">${bid.yourBid}/{bid.unit}</p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <Link to={`/buyer/product/${bid.productId}`}>
                        <Button variant="outline" className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          <span>View Details</span>
                        </Button>
                      </Link>
                      <Button>
                        Complete Purchase
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="lost">
          {lostBids.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <p className="text-center text-gray-500">You haven't lost any auctions yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {lostBids.map((bid) => (
                <Card key={bid.id}>
                  <div className="aspect-w-16 aspect-h-9 relative">
                    <img 
                      src={bid.imageUrl} 
                      alt={bid.productName} 
                      className="object-cover w-full h-48 rounded-t-lg"
                    />
                    <Badge className="absolute top-2 right-2" variant="destructive">
                      Lost
                    </Badge>
                  </div>
                  <CardHeader>
                    <CardTitle>{bid.productName}</CardTitle>
                    <CardDescription>
                      By {bid.farmer}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm text-gray-500">Your Bid</p>
                        <p className="text-lg font-medium">${bid.yourBid}/{bid.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Winning Bid</p>
                        <p className="text-lg font-medium text-red-500">${bid.highestBid}/{bid.unit}</p>
                      </div>
                    </div>
                    <Link to="/buyer/browse-products">
                      <Button className="w-full">
                        Browse Similar Products
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MyBids;
