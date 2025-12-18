
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

interface SaleItem {
  id: string;
  product_id: string;
  total_amount: number;
  payment_status: string;
  delivery_address: string | null;
  payment_id: string | null;
  created_at: string;
  quantity: number;
  price_per_unit: number;
  product?: {
    name: string;
    quantity: number;
    unit: string;
    description: string | null;
  };
  farmer?: {
    name: string | null;
    id: string;
  };
}

const OrderHistoryModule = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<SaleItem[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<SaleItem[]>([]);
  const [loading, setLoading] = useState(true);
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
        .from('sales')
        .select(`
          *,
          product:products(name, quantity, unit, description),
          farmer:profiles!sales_farmer_id_fkey(name, id)
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
        order.product?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.payment_status === statusFilter);
    }

    setFilteredOrders(filtered);
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
                placeholder="Search by product or payment ID"
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
                        {new Date(order.created_at).toLocaleDateString()}
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
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Farmer</p>
                    <p className="font-semibold">{order.farmer?.name || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Quantity</p>
                    <p className="font-semibold">{order.quantity} {order.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Amount Paid</p>
                    <p className="font-semibold flex items-center">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {order.total_amount}
                    </p>
                  </div>
                </div>

                {order.delivery_address && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="text-sm">{order.delivery_address}</p>
                  </div>
                )}

                {order.payment_id && (
                  <div className="text-sm text-gray-600">
                    Payment ID: <span className="font-mono">{order.payment_id}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryModule;
