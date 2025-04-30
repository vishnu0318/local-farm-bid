
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

const HowItWorks = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      <main className="flex-1 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">How FarmBid Local Works</h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              FarmBid Local connects local farmers with buyers through a transparent bidding process,
              ensuring fair prices and fresh produce.
            </p>
          </div>
          
          {/* Steps */}
          <div className="space-y-12 mb-16">
            {/* Step 1 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="bg-farmgreen-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-farmgreen-600 font-bold text-lg">1</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Farmers List Their Produce</h2>
                <p className="text-gray-600 mb-4">
                  Local farmers create listings for their fresh crops, including photos, descriptions, 
                  quantity available, and a base starting price. Farmers can set auction durations 
                  from 2 to 48 hours.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Upload photos and descriptions of crops</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Set base prices and auction durations</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Provide farm location for nearby buyers</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1592878849122-5c6e2c28c31a?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Farmer listing produce" 
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
            
            {/* Step 2 */}
            <div className="grid md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
              <div className="md:order-2">
                <div className="bg-earthbrown-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-earthbrown-400 font-bold text-lg">2</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Buyers Browse Local Listings</h2>
                <p className="text-gray-600 mb-4">
                  Buyers can browse crop listings within their local area (10-50 km radius). 
                  Our location-based system shows you only what's available nearby, ensuring freshness.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>Browse crops from local farms</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>Filter by distance, crop type, and more</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>See detailed information about each listing</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm md:order-1">
                <img 
                  src="https://images.unsplash.com/photo-1488459716781-31db52582fe9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Buyer browsing crops" 
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
            
            {/* Step 3 */}
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <div className="bg-farmgreen-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-farmgreen-600 font-bold text-lg">3</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Place Competitive Bids</h2>
                <p className="text-gray-600 mb-4">
                  Buyers place bids on crops they want to purchase. The system automatically notifies 
                  you when you're outbid, allowing you to place a counter-bid if desired.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Place bids on your favorite crops</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Receive outbid notifications</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-farmgreen-600 font-bold mr-2">✓</span>
                    <span>Track active auctions in real-time</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm">
                <img 
                  src="https://images.unsplash.com/photo-1556155092-490a1ba16284?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Person bidding on crops" 
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
            
            {/* Step 4 */}
            <div className="grid md:grid-cols-2 gap-8 items-center md:flex-row-reverse">
              <div className="md:order-2">
                <div className="bg-earthbrown-100 rounded-full w-12 h-12 flex items-center justify-center mb-4">
                  <span className="text-earthbrown-400 font-bold text-lg">4</span>
                </div>
                <h2 className="text-2xl font-bold mb-2">Pickup or Delivery</h2>
                <p className="text-gray-600 mb-4">
                  When the auction ends, the highest bidder wins. Winners can arrange pickup or delivery 
                  with the farmer. Our platform facilitates communication and provides navigation to the farm.
                </p>
                <ul className="space-y-2 mb-4">
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>Arrange pickup or delivery with farmers</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>Get directions to the farm location</span>
                  </li>
                  <li className="flex items-start">
                    <span className="text-earthbrown-400 font-bold mr-2">✓</span>
                    <span>Secure in-app payment options</span>
                  </li>
                </ul>
              </div>
              <div className="bg-gray-100 rounded-lg overflow-hidden shadow-sm md:order-1">
                <img 
                  src="https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                  alt="Pickup at farm" 
                  className="w-full h-64 object-cover"
                />
              </div>
            </div>
          </div>
          
          {/* Call to action */}
          <div className="text-center bg-farmgreen-50 rounded-lg p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-lg text-gray-600 mb-6">
              Join FarmBid Local today and start connecting with local farmers and fresh produce!
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/register">
                <Button size="lg">
                  Create an Account
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link to="/marketplace">
                <Button variant="outline" size="lg">
                  Browse Marketplace
                </Button>
              </Link>
            </div>
          </div>
          
          {/* FAQ Section */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">How do I know the produce is fresh?</h3>
                <p className="text-gray-600">
                  All produce on FarmBid Local is recently harvested by farmers in your local area. 
                  Most listings include harvest dates, and our location-based system ensures you're 
                  only seeing nearby farms.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">What if I win an auction but can't pick up the produce?</h3>
                <p className="text-gray-600">
                  We recommend contacting the farmer immediately to arrange alternative pickup times 
                  or delivery options. Most farmers are flexible and willing to work with you.
                </p>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm">
                <h3 className="font-semibold text-lg mb-2">Is there a fee for using FarmBid Local?</h3>
                <p className="text-gray-600">
                  FarmBid Local is currently free for buyers to use. Farmers pay a small commission 
                  on successful sales to help maintain the platform.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default HowItWorks;
