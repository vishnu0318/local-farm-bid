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

interface Sale {
  id: string;
  product_id: string;
  total_amount: number;
  payment_status: string;
  payment_id: string | null;
  created_at: string | null;
  delivery_address: string | null;
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

  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [invoiceLoading, setInvoiceLoading] = useState<string | null>(null);

  const fetchSales = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      
      // Get sales for farmer's products
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          product_id,
          total_amount,
          payment_status,
          payment_id,
          created_at,
          delivery_address,
          buyer_id
        `)
        .eq('farmer_id', user.id)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Get product and buyer details for each sale
      const salesWithDetails = await Promise.all(
        (salesData || []).map(async (sale) => {
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
            product_id: sale.product_id,
            total_amount: sale.total_amount,
            payment_status: sale.payment_status,
            payment_id: sale.payment_id,
            created_at: sale.created_at,
            delivery_address: sale.delivery_address,
            product: product || null,
            buyer: buyer || { name: 'Unknown Buyer', email: '' }
          } as Sale;
        })
      );

      setSales(salesWithDetails);
    } catch (error) {
      console.error('Error fetching sales:', error);
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
    fetchSales();
    
    // Set up real-time listener for new payments with improved handling
    const channel = supabase
      .channel('farmer-payments-updates')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'sales'
        }, 
        async (payload) => {
          console.log('Payment info received sales update:', payload);
          // Refresh payments when changes occur
          await fetchSales();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleViewInvoice = async (saleId: string) => {
    try {
      setInvoiceLoading(saleId);
      const { success, data, error } = await generateInvoice(saleId);
      
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
          ) : sales.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">No payments received yet</p>
              <p className="text-gray-400 text-sm">Start selling to see your payment history here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <Card key={sale.id} className={`border-l-4 ${
                  sale.payment_status === 'completed' ? 'border-l-green-500' : 
                  sale.payment_status === 'pending' ? 'border-l-yellow-500' : 
                  'border-l-red-500'
                } hover:shadow-md hover:-translate-y-1 transition-all duration-300`}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">{sale.product?.name}</h3>
                        <div className="flex items-center text-sm text-gray-600 space-x-4">
                          <div className="flex items-center">
                            <User className="h-4 w-4 mr-1" />
                            <span>{sale.buyer?.name}</span>
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            <span>{new Date(sale.created_at || '').toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center">
                            <Package className="h-4 w-4 mr-1" />
                            <span>{sale.product?.quantity} {sale.product?.unit}</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="flex items-center justify-end font-bold text-2xl text-green-600 mb-2">
                          <IndianRupee className="h-6 w-6 mr-1" />
                          <span>{sale.total_amount?.toLocaleString()}</span>
                        </div>
                        <Badge className={getStatusColor(sale.payment_status)}>
                          {sale.payment_status === 'completed' ? 'Payment Received' : 
                           sale.payment_status === 'pending' ? 'Payment Pending' : 
                           sale.payment_status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                      <div>
                        <span className="text-gray-600 font-medium">Transaction ID:</span>
                        <p className="mt-1 font-mono text-xs">{sale.payment_id || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-600 font-medium">Buyer Email:</span>
                        <p className="mt-1">{sale.buyer?.email}</p>
                      </div>
                    </div>

                    {sale.delivery_address && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <span className="text-gray-600 font-medium text-sm">Delivery Address:</span>
                        <p className="mt-1 text-sm">{sale.delivery_address}</p>
                      </div>
                    )}
                    
                    <div className="flex justify-end">
                      {sale.payment_status === 'completed' && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleViewInvoice(sale.id)}
                              disabled={invoiceLoading === sale.id}
                              className="hover:shadow-md transition-all duration-300"
                            >
                              {invoiceLoading === sale.id ? (
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