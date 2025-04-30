
import { Link } from 'react-router-dom';
import { ArrowRight, Leaf, MapPin, Clock, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Navigation from '@/components/Navigation';

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-farmgreen-50 to-farmgreen-100 py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
              <h1 className="text-4xl md:text-5xl font-bold text-farmgreen-800 tracking-tight">
                Fresh Local Produce, <br />
                <span className="text-farmgreen-500">Direct from Farmers</span>
              </h1>
              <p className="text-lg text-gray-600 max-w-lg">
                Connect with farmers in your area, bid on fresh crops, and enjoy farm-to-table 
                produce while supporting local agriculture.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to="/marketplace">
                  <Button size="lg" className="font-medium">
                    Browse Marketplace
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/register">
                  <Button size="lg" variant="outline" className="font-medium">
                    Join FarmBid Local
                  </Button>
                </Link>
              </div>
            </div>
            <div className="hidden md:block">
              <img 
                src="https://images.unsplash.com/photo-1592321675774-3de57f3ee0dc?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                alt="Fresh vegetables" 
                className="rounded-lg shadow-xl object-cover h-96 w-full"
              />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How It Works</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              FarmBid Local connects farmers directly with buyers through a simple bidding process.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Step 1 */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="bg-farmgreen-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Leaf className="h-8 w-8 text-farmgreen-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Farmers List Produce</h3>
              <p className="text-gray-600">
                Local farmers list their fresh crops with photos, descriptions, and a base price.
              </p>
            </div>
            
            {/* Step 2 */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="bg-earthbrown-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="h-8 w-8 text-earthbrown-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Buyers Place Bids</h3>
              <p className="text-gray-600">
                Buyers browse local offerings and place competitive bids on items they want.
              </p>
            </div>
            
            {/* Step 3 */}
            <div className="bg-gray-50 rounded-lg p-6 text-center">
              <div className="bg-farmgreen-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-farmgreen-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Local Pickup/Delivery</h3>
              <p className="text-gray-600">
                Winners coordinate with farmers for convenient pickup or delivery of their items.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-farmgreen-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <img 
                src="https://images.unsplash.com/photo-1595855759920-86582cd16015?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=600&q=80" 
                alt="Local farmers" 
                className="rounded-lg shadow-lg object-cover w-full h-80"
              />
            </div>
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">Why Choose FarmBid Local?</h2>
              <ul className="space-y-4">
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-farmgreen-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium">Support Local Agriculture</h4>
                    <p className="mt-1 text-gray-600">
                      Help local farmers thrive by purchasing directly from them.
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-farmgreen-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium">Fresher Produce</h4>
                    <p className="mt-1 text-gray-600">
                      Get the freshest seasonal produce directly from local farms.
                    </p>
                  </div>
                </li>
                <li className="flex">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-farmgreen-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                  <div className="ml-3">
                    <h4 className="text-lg font-medium">Transparent Pricing</h4>
                    <p className="mt-1 text-gray-600">
                      Competitive bidding ensures fair prices for both farmers and buyers.
                    </p>
                  </div>
                </li>
              </ul>
              <Link to="/how-it-works">
                <Button variant="outline" className="mt-4">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="bg-earthbrown-400 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">Ready to join the local food revolution?</h2>
          <p className="text-lg mb-6 max-w-2xl mx-auto">
            Create your account today and start connecting with local farmers and fresh produce.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/register">
              <Button size="lg" variant="secondary" className="font-medium">
                Create Account
              </Button>
            </Link>
            <Link to="/marketplace">
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white/10 font-medium">
                Browse Marketplace
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between">
            <div className="flex justify-center md:justify-start">
              <Link to="/" className="flex items-center">
                <Leaf className="h-6 w-6 text-farmgreen-600" />
                <span className="ml-2 text-lg font-semibold text-gray-900">FarmBid Local</span>
              </Link>
            </div>
            <div className="mt-8 md:mt-0">
              <p className="text-center md:text-left text-sm text-gray-500">
                &copy; 2025 FarmBid Local. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
