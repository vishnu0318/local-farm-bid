import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { IndianRupee, Package, User, Calendar, Search, Filter, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import FarmerInvoice from '@/components/farmer/FarmerInvoice';
import { generateInvoice } from '@/services/paymentService';

interface Sale {
  id: string;
  total_amount: number;
  payment_status: string;
  payment_id: string | null;
  delivery_address: string | null;
  created_at: string;
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
}

const SalesHistory = () => {
  const { user } = useAuth();
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);

  const fetchSalesHistory = async () => {
    try {
      setLoading(true);
      console.log('Fetching sales history for farmer:', user?.id);
      
      // Get sales for farmer
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          payment_status,
          payment_id,
          delivery_address,
          created_at,
          product_id,
          buyer_id
        `)
        .eq('farmer_id', user?.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      if (!salesData || salesData.length === 0) {
        console.log('No sales found for farmer');
        setSales([]);
        setFilteredSales([]);
        return;
      }

      console.log('Found sales:', salesData);

      // Get product and buyer details for each sale
      const salesWithDetails = await Promise.all(
        salesData.map(async (sale) => {
          // Fetch product details
          const { data: product } = await supabase
            .from('products')
            .select('name, quantity, unit, description')
            .eq('id', sale.product_id)
            .single();

          // Fetch buyer details
          const { data: buyer } = await supabase
            .from('profiles')
            .select('name, email')
            .eq('id', sale.buyer_id)
            .single();

          return {
            id: sale.id,
            total_amount: sale.total_amount,
            payment_status: sale.payment_status,
            payment_id: sale.payment_id,
            delivery_address: sale.delivery_address,
            created_at: sale.created_at,
            product: product || null,
            buyer: buyer || { name: 'Unknown Buyer', email: '' }
          } as Sale;
        })
      );

      console.log('Sales with details:', salesWithDetails);
      setSales(salesWithDetails);
    } catch (error) {
      console.error('Error fetching sales history:', error);
      toast.error('Failed to load sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchSalesHistory();

    // Set up real-time listener for sales
    const channel = supabase
      .channel('sales-history-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales'
        }, 
        async (payload) => {
          console.log('Sales change detected in SalesHistory:', payload);
          // Refresh sales history when any sale changes
          await fetchSalesHistory();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    filterSales();
  }, [sales, searchTerm, statusFilter]);

  const filterSales = () => {
    let filtered = [...sales];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(sale =>
        sale.product?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.buyer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.payment_id?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(sale => sale.payment_status === statusFilter);
    }

    setFilteredSales(filtered);
  };

  const handleViewInvoice = async (saleId: string) => {
    try {
      setInvoiceLoading(saleId);
      const { success, data, error } = await generateInvoice(saleId);
      
      if (success && data) {
        setSelectedInvoice(data);
      } else {
        toast.error(error || "Failed to generate invoice");
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      toast.error("Failed to generate invoice");
    } finally {
      setInvoiceLoading(null);
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

  const totalEarnings = filteredSales
    .filter(sale => sale.payment_status === 'completed')
    .reduce((sum, sale) => sum + sale.total_amount, 0);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center">
          <IndianRupee className="h-8 w-8 mr-3 text-primary" />
          <h1 className="text-3xl font-bold">Sales History</h1>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600">Total Earnings</p>
          <p className="text-2xl font-bold text-green-600 flex items-center">
            <IndianRupee className="h-6 w-6 mr-1" />
            {totalEarnings.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by product, buyer, or transaction ID"
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
              <span className="text-sm text-gray-600">{filteredSales.length} results</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sales List */}
      {filteredSales.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Sales Found</h3>
            <p className="text-gray-600">
              {sales.length === 0 
                ? "Your sales history will appear here once you make your first sale."
                : "Try adjusting your filters to see more results."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredSales.map((sale) => (
            <Card key={sale.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-semibold">{sale.product?.name}</h3>
                    <div className="flex items-center text-gray-600 mt-1">
                      <User className="h-4 w-4 mr-1" />
                      <span>{sale.buyer?.name}</span>
                      <span className="mx-2">•</span>
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(sale.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center text-2xl font-bold text-green-600 mb-2">
                      <IndianRupee className="h-6 w-6 mr-1" />
                      <span>{sale.total_amount}</span>
                    </div>
                    <Badge className={getStatusColor(sale.payment_status)}>
                      {sale.payment_status.charAt(0).toUpperCase() + sale.payment_status.slice(1)}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-gray-600">Quantity Sold</p>
                    <p className="font-semibold">{sale.product?.quantity} {sale.product?.unit}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Transaction ID</p>
                    <p className="font-mono text-sm">{sale.payment_id || 'N/A'}</p>
                  </div>
                </div>

                {sale.delivery_address && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Delivery Address</p>
                    <p className="text-sm">{sale.delivery_address}</p>
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-600">
                    <p><strong>Buyer Email:</strong> {sale.buyer?.email}</p>
                  </div>
                  
                  {sale.payment_status === 'completed' && (
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewInvoice(sale.id)}
                          disabled={invoiceLoading === sale.id}
                        >
                          {invoiceLoading === sale.id ? (
                            <div className="animate-spin h-4 w-4 mr-2 border-2 border-current border-t-transparent rounded-full" />
                          ) : (
                            <Download className="h-4 w-4 mr-2" />
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
    </div>
  );
};

export default SalesHistory;