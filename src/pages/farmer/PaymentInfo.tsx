import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const PaymentInfo = () => {
  const { toast } = useToast();
  const { profile } = useAuth();

  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchOrders = async () => {
    if (!profile?.id) return;

    try {
      const { data, error } = await supabase
        .from('notifications') // your table name
        .select('*')
        .eq('farmer_id', "269edd37-1f7e-477e-97d4-305176600e06")
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  console.log(orders)

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
          <CardDescription>Recent orders received</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading order history...</p>
          ) : orders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No orders to display</p>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{order.product_name || order.product_id}</p>
                    <p className="text-sm text-gray-500">Buyer: {order.buyer_name}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end font-semibold text-lg">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {order.amount?.toLocaleString()}
                    </div>
                    <Badge
                      variant={order.status === 'completed' ? 'default' : 'outline'}
                      className={order.status === 'completed' ? 'bg-green-600' : ''}>
                      {order.status}
                    </Badge>
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
