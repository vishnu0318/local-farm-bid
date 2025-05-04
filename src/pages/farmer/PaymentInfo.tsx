
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { IndianRupee } from 'lucide-react';

// Mock payment history data
const MOCK_PAYMENTS = [
  {
    id: 'pay1',
    date: '2025-04-20',
    amount: 15000,
    product: 'Organic Tomatoes',
    buyerName: 'Farm Fresh Market',
    status: 'completed',
  },
  {
    id: 'pay2',
    date: '2025-04-15',
    amount: 8500,
    product: 'Fresh Apples',
    buyerName: 'Organic Foods Co.',
    status: 'completed',
  },
  {
    id: 'pay3',
    date: '2025-04-10',
    amount: 12000,
    product: 'Premium Potatoes',
    buyerName: 'Green Grocers Ltd',
    status: 'pending',
  },
];

const PaymentInfo = () => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    routingNumber: '',
    accountHolderName: '',
  });

  const [payments] = useState(MOCK_PAYMENTS);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Here we would typically send the data to an API
    console.log('Payment info submitted:', formData);
    
    // Show success message
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bankName">Bank Name</Label>
                <Input 
                  id="bankName" 
                  name="bankName" 
                  placeholder="Enter bank name" 
                  value={formData.bankName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountType">Account Type</Label>
                <Select 
                  value={formData.accountType} 
                  onValueChange={(value) => handleSelectChange('accountType', value)}
                >
                  <SelectTrigger id="accountType">
                    <SelectValue placeholder="Select account type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="checking">Checking</SelectItem>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="business">Business</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="accountNumber">Account Number</Label>
                <Input 
                  id="accountNumber" 
                  name="accountNumber" 
                  placeholder="Enter account number" 
                  value={formData.accountNumber} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="routingNumber">IFSC Code</Label>
                <Input 
                  id="routingNumber" 
                  name="routingNumber" 
                  placeholder="Enter IFSC code" 
                  value={formData.routingNumber} 
                  onChange={handleChange} 
                  required 
                />
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="accountHolderName">Account Holder Name</Label>
                <Input 
                  id="accountHolderName" 
                  name="accountHolderName" 
                  placeholder="Enter account holder name" 
                  value={formData.accountHolderName} 
                  onChange={handleChange} 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" className="w-full sm:w-auto">Save Payment Information</Button>
          </CardFooter>
        </form>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments received</CardDescription>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No payment history to display</p>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{payment.product}</p>
                    <p className="text-sm text-gray-500">From: {payment.buyerName}</p>
                    <p className="text-sm text-gray-500">Date: {new Date(payment.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center justify-end font-semibold text-lg">
                      <IndianRupee className="h-4 w-4 mr-1" />
                      {payment.amount.toLocaleString()}
                    </div>
                    <Badge 
                      variant={payment.status === 'completed' ? 'default' : 'outline'}
                      className={payment.status === 'completed' ? 'bg-green-600' : ''}
                    >
                      {payment.status === 'completed' ? 'Completed' : 'Pending'}
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
