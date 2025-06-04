import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { IndianRupee, Eye, Package, User, Calendar, Download } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { generateInvoice } from '@/services/paymentService';
import FarmerInvoice from '@/components/farmer/FarmerInvoice';

interface Order {
  id: string;
  product_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  payment_date: string | null;
  transaction_id: string | null;
  created_at: string | null;
  product: {
    name: string;
    quantity: number;
    unit: string;
    description: string;
  } | null;
  buyer: {
    name: string;
    email: string;
  };
  delivery_address?: {
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
  } | null;
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
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);

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

      // Get orders for farmer's products with better data - include ALL payment statuses
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id(
            name,
            quantity,
            unit,
            description
          )
        `)
        .in('product_id', productIds)
        .order('created_at', { ascending: false });

      if (ordersError) throw ordersError;

      // Get buyer details for each order and properly type the data
      const ordersWithBuyers = await Promise.all(
        (ordersData || []).map(async (order) => {
          const { data: buyer } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', order.buyer_id)
            .single();

          // Properly handle delivery_address type casting
          let deliveryAddress = null;
          if (order.delivery_address && typeof order.delivery_address === 'object') {
            deliveryAddress = order.delivery_address as {
              addressLine1: string;
              addressLine2?: string;
              city: string;
              state: string;
              postalCode: string;
            };
          }

          return {
            id: order.id,
            product_id: order.product_id,
            amount: order.amount,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            payment_date: order.payment_date,
            transaction_id: order.transaction_id,
            created_at: order.created_at,
            product: order.product,
            buyer: buyer || { name: 'Unknown Buyer', email: '' },
            delivery_address: deliveryAddress
          } as Order;
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
    
    // Set up real-time listener for new payments with improved handling
    const channel = supabase
      .channel('farmer-payments-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'orders'
        }, 
        async (payload) => {
          console.log('Payment info received order update:', payload);
          // Refresh payments when changes occur
          await fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleViewInvoice = async (orderId: string) => {
    try {
      setInvoiceLoading(orderId);
      const { success, data, error } = await generateInvoice(orderId);
      
      if (success && data) {
        setSelectedInvoice(data);
      } else {
        toast({
          title: "Error",
          description: error || "Failed to generate invoice",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast({
        title: "Error",
        description: "Failed to generate invoice",
        variant: "destructive"
      });
    } finally {
      setInvoiceLoading(null);
    }
  };

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

      <Card className="hover:shadow-lg transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="flex items-center">
            <IndianRupee className="h-5 w-5 mr-2" />
            Payment History
          </CardTitle>
          <CardDescription>All payments received from buyers with detailed information</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No payments received yet</p>
              <p className="text-gray-400 text-sm">Start selling to see your payment history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order) => (
                <Card key={order.id} className={`border-l-4 ${
                  order.payment_status === 'completed' ? 'border-l-green-500' : 
                  order.payment_status === 'pending' ? 'border-l-yellow-500' : 
                  'border-l-red-500'
                } hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{order.product?.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{order.buyer?.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(order.payment_date || order.created_at || '').toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            <span>{order.product?.quantity} {order.product?.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end font-bold text-2xl text-green-600 mb-2">
                          <IndianRupee className="h-6 w-6 mr-1" />
                          <span>{order.amount?.toLocaleString()}</span>
                        </div>
                        <Badge className={getStatusColor(order.payment_status)}>
                          {order.payment_status === 'completed' ? 'Payment Received' : 
                           order.payment_status === 'pending' ? 'Payment Pending' : 
                           order.payment_status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Payment Method:</span>
                        <p className="mt-1">{order.payment_method.toUpperCase()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Transaction ID:</span>
                        <p className="mt-1 font-mono text-xs">{order.transaction_id}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Buyer Email:</span>
                        <p className="mt-1">{order.buyer?.email}</p>
                      </div>
                    </div>

                    {order.delivery_address && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium text-sm">Delivery Address:</span>
                        <p className="mt-1 text-sm">
                          {order.delivery_address.addressLine1}
                          {order.delivery_address.addressLine2 && `, ${order.delivery_address.addressLine2}`}
                          <br />
                          {order.delivery_address.city}, {order.delivery_address.state} - {order.delivery_address.postalCode}
                        </p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      {order.payment_status === 'completed' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewInvoice(order.id)}
                              disabled={invoiceLoading === order.id}
                              className="hover:shadow-md transition-all duration-300"
                            >
                              {invoiceLoading === order.id ? (
                                <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                              ) : (
                                <Eye className="h-4 w-4 mr-2" />
                              )}
                              View Receipt
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Payment Receipt</DialogTitle>
                            </DialogHeader>
                            {selectedInvoice && (
                              <FarmerInvoice invoice={selectedInvoice} />
                            )}
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentInfo;
