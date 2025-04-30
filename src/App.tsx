
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { AuthProvider } from "./context/AuthContext";
import { LocationProvider } from "./context/LocationContext";
import { DataProvider } from "./context/DataContext";

import Index from "./pages/Index";
import Marketplace from "./pages/Marketplace";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CropDetail from "./pages/CropDetail";
import HowItWorks from "./pages/HowItWorks";
import NotFoundCustom from "./pages/NotFoundCustom";

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
                <Route path="/" element={<Index />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/crop/:id" element={<CropDetail />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
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
