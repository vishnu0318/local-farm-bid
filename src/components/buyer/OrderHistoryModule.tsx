
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Package, Calendar, FileText, Search, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { generateInvoice } from '@/services/paymentService';
import Invoice from '@/components/buyer/Invoice';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface OrderHistoryItem {
  id: string;
  product_id: string;
  amount: number;
  payment_method: string;
  payment_status: string;
  delivery_address: any;
  transaction_id: string;
  payment_date: string;
  created_at: string;
  product: {
    name: string;
    quantity: number;
    unit: string;
    description: string;
    farmer: {
      name: string;
      id: string;
    };
  };
}

const OrderHistoryModule = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<OrderHistoryItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<OrderHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<{ [key: string]: boolean }>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user) return;
    fetchOrderHistory();
  }, [user]);

  useEffect(() => {
    filterOrders();
  }, [orders, searchTerm, statusFilter]);

  const fetchOrderHistory = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:product_id(
            name,
            quantity,
            unit,
            description,
            farmer:farmer_id(name, id)
          )
        `)
        .eq('buyer_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast.error('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const filterOrders = () => {
    let filtered = [...orders];

    if (searchTerm) {
      filtered = filtered.filter(order =>
        order.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.transaction_id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    setFilteredOrders(filtered);
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      setInvoiceLoading(prev => ({ ...prev, [orderId]: true }));
      const result = await generateInvoice(orderId);
      
      if (result.success) {
        setSelectedInvoice(result.data);
      } else {
        toast.error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error('Failed to generate invoice');
    } finally {
      setInvoiceLoading(prev => ({ ...prev, [orderId]: false }));
    }
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

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card':
        return '💳';
      case 'upi':
        return '📱';
      case 'razorpay':
        return '💳';
      case 'cod':
        return '💵';
      default:
        return '💰';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Package className="h-8 w-8 mr-3 text-primary" />
          <h2 className="text-2xl font-bold">Order History</h2>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Orders</p>
          <p className="text-xl font-bold text-primary">{filteredOrders.length}</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product or transaction ID"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center">
              <Filter className="h-4 w-4 mr-2 text-gray-600" />
              <span className="text-sm text-gray-600">{filteredOrders.length} results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Orders Found</h3>
            <p className="text-gray-600">
              {orders.length === 0 
                ? "Your order history will appear here once you make a purchase."
                : "Try adjusting your filters to see more results."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl mb-2">{order.product?.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(order.payment_date || order.created_at).toLocaleDateString()}
                      </span>
                      <span>Order #{order.id.slice(0, 8)}</span>
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.payment_status)}>
                    {order.payment_status === 'completed' ? 'Payment Completed' : 
                     order.payment_status.charAt(0).toUpperCase() + order.payment_status.slice(1)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="font-semibold">{order.product?.farmer?.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-semibold">{order.product?.quantity} {order.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {order.amount}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Payment Method</p>
                    <p className="font-semibold">
                      {getPaymentMethodIcon(order.payment_method)} {order.payment_method.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-600">Delivery Address</p>
                  <p className="text-sm">
                    {order.delivery_address?.addressLine1}, {order.delivery_address?.city}, {order.delivery_address?.state} - {order.delivery_address?.postalCode}
                  </p>
                </div>

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    Transaction ID: <span className="font-mono">{order.transaction_id}</span>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleViewInvoice(order.id)}
                        disabled={invoiceLoading[order.id]}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {invoiceLoading[order.id] ? 'Loading...' : 'View Invoice'}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>Invoice Details</DialogTitle>
                      </DialogHeader>
                      {selectedInvoice && <Invoice invoiceData={selectedInvoice} />}
                    </DialogContent>
                  </Dialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryModule;
