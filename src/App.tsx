
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import { DataProvider } from "./context/DataContext";

import SplashScreen from "./pages/SplashScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import NotFoundCustom from "./pages/NotFoundCustom";
import FarmerDashboard from "./pages/farmer/Dashboard";
import AddProduct from "./pages/farmer/AddProduct";
import MyProducts from "./pages/farmer/MyProducts";
import PaymentInfo from "./pages/farmer/PaymentInfo";
import BuyerDashboard from "./pages/buyer/Dashboard";
import BrowseProducts from "./pages/buyer/BrowseProducts";
import MyBids from "./pages/buyer/MyBids";
import PaymentDetails from "./pages/buyer/PaymentDetails";
import CropDetail from "./pages/CropDetail";
import MainLayout from "./layouts/MainLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LocationProvider>
        <DataProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<SplashScreen />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Farmer Routes */}
                <Route path="/farmer" element={<MainLayout userRole="farmer" />}>
                  <Route index element={<FarmerDashboard />} />
                  <Route path="add-product" element={<AddProduct />} />
                  <Route path="my-products" element={<MyProducts />} />
                  <Route path="payment-info" element={<PaymentInfo />} />
                  <Route path="product/:id" element={<CropDetail />} />
                </Route>

                {/* Buyer Routes */}
                <Route path="/buyer" element={<MainLayout userRole="buyer" />}>
                  <Route index element={<BuyerDashboard />} />
                  <Route path="browse-products" element={<BrowseProducts />} />
                  <Route path="my-bids" element={<MyBids />} />
                  <Route path="payment-details" element={<PaymentDetails />} />
                  <Route path="product/:id" element={<CropDetail />} />
                </Route>

                {/* Redirect old marketplace route to appropriate dashboard based on role */}
                <Route path="/marketplace" element={<Navigate to="/" />} />
                
                {/* Catch-all route */}
                <Route path="*" element={<NotFoundCustom />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </DataProvider>
      </LocationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
