
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Package, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RecentSale {
  id: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  payment_id: string | null;
  quantity: number;
  product?: {
    name: string;
    unit: string;
  };
  buyer?: {
    name: string | null;
    email: string;
  };
}

const RecentSales = () => {
  const { user } = useAuth();
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecentSales = async () => {
    if (!user?.id) return;
    
    try {
      setLoading(true);
      
      // Get sales for farmer's products
      const { data: sales, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          product:products(name, unit),
          buyer:profiles!sales_buyer_id_fkey(name, email)
        `)
        .eq('farmer_id', user.id)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false })
        .limit(5);

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        return;
      }

      setRecentSales(sales || []);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      toast.error('Failed to load recent sales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentSales();
    
    // Set up real-time listener for new sales
    const channel = supabase
      .channel('recent-sales-realtime')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales',
          filter: `farmer_id=eq.${user?.id}`
        }, 
        async (payload) => {
          console.log('Sale change detected:', payload);
          await fetchRecentSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Package className="h-5 w-5 mr-2" />
          Recent Sales
        </CardTitle>
      </CardHeader>
      <CardContent>
        {recentSales.length === 0 ? (
          <div className="text-center py-8">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">No recent sales</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentSales.map((sale) => (
              <div key={sale.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{sale.product?.name}</h4>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <User className="h-4 w-4 mr-1" />
                      <span>{sale.buyer?.name || 'Unknown Buyer'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center font-bold text-lg text-green-600">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      <span>{sale.total_amount}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {sale.payment_status}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{sale.quantity} {sale.product?.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">{new Date(sale.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
                
                {sale.payment_id && (
                  <div className="mt-2 text-xs text-gray-500">
                    Payment ID: {sale.payment_id}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
