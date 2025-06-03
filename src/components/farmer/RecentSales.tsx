
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Package, User, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

interface RecentSale {
  id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  transaction_id: string;
  product: {
    name: string;
    quantity: number;
    unit: string;
  };
  buyer: {
    name: string;
    email: string;
  };
}

const RecentSales = () => {
  const { user } = useAuth();
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchRecentSales();
  }, [user]);

  const fetchRecentSales = async () => {
    try {
      setLoading(true);
      
      // First get farmer's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user?.id);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setRecentSales([]);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get orders for farmer's products
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id(
            name,
            quantity,
            unit
          )
        `)
        .in('product_id', productIds)
        .eq('payment_status', 'completed')
        .order('payment_date', { ascending: false })
        .limit(5);

      if (ordersError) throw ordersError;

      // Get buyer details for each order
      const salesWithBuyers = await Promise.all(
        (orders || []).map(async (order) => {
          const { data: buyer } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', order.buyer_id)
            .single();

          return {
            ...order,
            buyer: buyer || { name: 'Unknown Buyer', email: '' }
          };
        })
      );

      setRecentSales(salesWithBuyers);
    } catch (error) {
      console.error('Error fetching recent sales:', error);
      toast.error('Failed to load recent sales');
    } finally {
      setLoading(false);
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'cod':
        return '💵';
      default:
        return '💰';
    }
  };

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
                      <span>{sale.buyer?.name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center font-bold text-lg text-green-600">
                      <IndianRupee className="h-5 w-5 mr-1" />
                      <span>{sale.amount}</span>
                    </div>
                    <Badge variant="secondary" className="mt-1">
                      {getPaymentMethodIcon(sale.payment_method)} {sale.payment_method.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Quantity:</span>
                    <span className="ml-2 font-medium">{sale.product?.quantity} {sale.product?.unit}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Date:</span>
                    <span className="ml-2 font-medium">{new Date(sale.payment_date).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="mt-2 text-xs text-gray-500">
                  Transaction ID: {sale.transaction_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default RecentSales;
