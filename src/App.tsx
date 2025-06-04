
import React from "react";
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
import FarmerProfile from "./pages/farmer/Profile";
import BuyerDashboard from "./pages/buyer/Dashboard";
import BrowseProducts from "./pages/buyer/BrowseProducts";
import MyBids from "./pages/buyer/MyBids";
import PaymentDetails from "./pages/buyer/PaymentDetails";
import BuyerProfile from "./pages/buyer/Profile";
import CropDetail from "./pages/CropDetail";
import MainLayout from "./layouts/MainLayout";
import OrderHistory from '@/pages/buyer/OrderHistory';
import SalesHistory from '@/pages/farmer/SalesHistory';

// Initialize QueryClient outside of component
const queryClient = new QueryClient();

const App: React.FC = () => {
  return (
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
                  <Route path="/farmer" element={<MainLayout />}>
                    <Route index element={<FarmerDashboard />} />
                    <Route path="dashboard" element={<FarmerDashboard />} />
                    <Route path="add-product" element={<AddProduct />} />
                    <Route path="my-products" element={<MyProducts />} />
                    <Route path="payment-info" element={<PaymentInfo />} />
                    <Route path="profile" element={<FarmerProfile />} />
                    <Route path="product/:id" element={<CropDetail />} />
                    <Route path="edit-product/:id" element={<AddProduct />} />
                    <Route path="sales-history" element={<SalesHistory />} />
                  </Route>

                  {/* Buyer Routes */}
                  <Route path="/buyer" element={<MainLayout />}>
                    <Route index element={<BuyerDashboard />} />
                    <Route path="dashboard" element={<BuyerDashboard />} />
                    <Route path="browse-products" element={<BrowseProducts />} />
                    <Route path="my-bids" element={<MyBids />} />
                    <Route path="payment-details" element={<PaymentDetails />} />
                    <Route path="profile" element={<BuyerProfile />} />
                    <Route path="product/:id" element={<CropDetail />} />
                    <Route path="order-history" element={<OrderHistory />} />
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
};

export default App;
