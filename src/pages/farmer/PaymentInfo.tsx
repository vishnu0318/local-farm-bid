
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface Order {
  id: string;
  product_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string;
  transaction_id: string;
  created_at: string;
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

const PaymentInfo = () => {
  const { toast } = useToast();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get farmer's products
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('farmer_id', user.id);

      if (productsError) throw productsError;

      if (!products || products.length === 0) {
        setOrders([]);
        return;
      }

      const productIds = products.map(p => p.id);

      // Get orders for farmer's products
      const { data: ordersData, error: ordersError } = await supabase
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
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get buyer details for each order
      const ordersWithBuyers = await Promise.all(
        (ordersData || []).map(async (order) => {
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

      setOrders(ordersWithBuyers);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to load payment history",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Submit formData to your database or API
    toast({
      title: "Payment Information Updated",
      description: "Your payment information has been successfully updated.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payment Information</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Bank Account Details</CardTitle>
          <CardDescription>Enter your bank account details for receiving payments</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <input
              type="text"
              name="bankName"
              value={formData.bankName}
              onChange={handleChange}
              placeholder="Bank Name"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="accountNumber"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Account Number"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="accountType"
              value={formData.accountType}
              onChange={handleChange}
              placeholder="Account Type"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="routingNumber"
              value={formData.routingNumber}
              onChange={handleChange}
              placeholder="Routing Number"
              className="w-full border p-2 rounded"
            />
            <input
              type="text"
              name="accountHolderName"
              value={formData.accountHolderName}
              onChange={handleChange}
              placeholder="Account Holder Name"
              className="w-full border p-2 rounded"
            />
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">Save Payment Information</Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments received from buyers</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading payment history...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No payments received yet</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.product?.name}</p>
                    <p className="text-sm text-gray-500">Buyer: {order.buyer?.name}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(order.payment_date || order.created_at).toLocaleDateString()}</p>
                    <p className="text-sm text-gray-500">Transaction: {order.transaction_id}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end font-semibold text-lg">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {order.amount?.toLocaleString()}
                    </div>
                    <Badge className={getStatusColor(order.payment_status)}>
                      {order.payment_status === 'completed' ? 'Payment Received' : order.payment_status}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{order.payment_method.toUpperCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentInfo;
