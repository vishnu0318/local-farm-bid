
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const PaymentDetails = () => {
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    country: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
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
    console.log('Payment details submitted:', formData);
    
    // Show success message
    toast({
      title: "Payment Details Updated",
      description: "Your payment details have been successfully updated.",
    });
  };

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Payment Details</h1>
      
      <Tabs defaultValue="payment-methods">
        <TabsList className="w-full grid grid-cols-2 mb-6">
          <TabsTrigger value="payment-methods">Payment Methods</TabsTrigger>
          <TabsTrigger value="transactions">Transaction History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="payment-methods">
          <Card>
            <CardHeader>
              <CardTitle>Add Payment Method</CardTitle>
              <CardDescription>Enter your payment details for making purchases</CardDescription>
            </CardHeader>
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cardName">Name on Card</Label>
                  <Input 
                    id="cardName" 
                    name="cardName" 
                    placeholder="Enter name as it appears on card" 
                    value={formData.cardName} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input 
                    id="cardNumber" 
                    name="cardNumber" 
                    placeholder="XXXX XXXX XXXX XXXX" 
                    value={formData.cardNumber} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="expiryMonth">Expiry Month</Label>
                    <Select 
                      value={formData.expiryMonth} 
                      onValueChange={(value) => handleSelectChange('expiryMonth', value)}
                    >
                      <SelectTrigger id="expiryMonth">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                          <SelectItem key={month} value={month.toString().padStart(2, '0')}>
                            {month.toString().padStart(2, '0')}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="expiryYear">Expiry Year</Label>
                    <Select 
                      value={formData.expiryYear} 
                      onValueChange={(value) => handleSelectChange('expiryYear', value)}
                    >
                      <SelectTrigger id="expiryYear">
                        <SelectValue placeholder="YY" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map((year) => (
                          <SelectItem key={year} value={year.toString().slice(-2)}>
                            {year}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cvv">CVV</Label>
                    <Input 
                      id="cvv" 
                      name="cvv" 
                      placeholder="123" 
                      value={formData.cvv} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Select 
                    value={formData.country} 
                    onValueChange={(value) => handleSelectChange('country', value)}
                  >
                    <SelectTrigger id="country">
                      <SelectValue placeholder="Select country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="us">United States</SelectItem>
                      <SelectItem value="ca">Canada</SelectItem>
                      <SelectItem value="uk">United Kingdom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="addressLine1">Address Line 1</Label>
                  <Input 
                    id="addressLine1" 
                    name="addressLine1" 
                    placeholder="Street address" 
                    value={formData.addressLine1} 
                    onChange={handleChange} 
                    required 
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="addressLine2">Address Line 2 (Optional)</Label>
                  <Input 
                    id="addressLine2" 
                    name="addressLine2" 
                    placeholder="Apartment, suite, unit, etc." 
                    value={formData.addressLine2} 
                    onChange={handleChange} 
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input 
                      id="city" 
                      name="city" 
                      placeholder="City" 
                      value={formData.city} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="state">State / Province</Label>
                    <Input 
                      id="state" 
                      name="state" 
                      placeholder="State" 
                      value={formData.state} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="postalCode">Postal Code</Label>
                    <Input 
                      id="postalCode" 
                      name="postalCode" 
                      placeholder="Postal code" 
                      value={formData.postalCode} 
                      onChange={handleChange} 
                      required 
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full sm:w-auto">Save Payment Details</Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
        
        <TabsContent value="transactions">
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>Your recent payment activity</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center py-8 text-gray-500">No transaction history to display</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PaymentDetails;
