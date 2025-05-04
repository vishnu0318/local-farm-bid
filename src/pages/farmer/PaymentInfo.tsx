
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

const PaymentInfo = () => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    bankName: '',
    accountNumber: '',
    accountType: '',
    routingNumber: '',
    accountHolderName: '',
  });

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
      
      <Card>
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
                <Label htmlFor="routingNumber">Routing Number</Label>
                <Input 
                  id="routingNumber" 
                  name="routingNumber" 
                  placeholder="Enter routing number" 
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
      
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
          <CardDescription>Recent payments received</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">No payment history to display</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentInfo;
