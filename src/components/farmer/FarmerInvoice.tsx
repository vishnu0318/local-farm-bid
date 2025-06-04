
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { IndianRupee, Download, Package, User, Calendar, MapPin, Receipt } from 'lucide-react';
import jsPDF from 'jspdf';

interface FarmerInvoiceProps {
  invoice: {
    invoiceNumber: string;
    orderId: string;
    transactionId: string;
    date: string;
    buyerDetails: {
      name: string;
      id: string;
    };
    sellerDetails: {
      name: string;
      id: string;
    };
    productDetails: {
      name: string;
      quantity: number;
      unit: string;
      description: string;
    };
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    deliveryAddress: any;
  };
}

const FarmerInvoice: React.FC<FarmerInvoiceProps> = ({ invoice }) => {
  const downloadInvoice = () => {
    const pdf = new jsPDF();
    
    // Header with farmer branding
    pdf.setFillColor(34, 197, 94); // Green color
    pdf.rect(0, 0, 210, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.text('PAYMENT RECEIPT', 20, 25);
    
    pdf.setFontSize(12);
    pdf.text('Go Fresh Marketplace - Farmer Portal', 20, 33);
    
    // Reset text color
    pdf.setTextColor(0, 0, 0);
    
    // Invoice details section
    pdf.setFontSize(16);
    pdf.text('Payment Details', 20, 60);
    
    pdf.setFontSize(11);
    pdf.text(`Receipt No: ${invoice.invoiceNumber}`, 20, 75);
    pdf.text(`Transaction ID: ${invoice.transactionId}`, 20, 85);
    pdf.text(`Date: ${invoice.date}`, 20, 95);
    pdf.text(`Status: Payment Received`, 20, 105);
    
    // Farmer and buyer details
    pdf.setFontSize(14);
    pdf.text('Farmer Details', 20, 125);
    pdf.setFontSize(11);
    pdf.text(`Name: ${invoice.sellerDetails.name}`, 20, 135);
    pdf.text(`Farmer ID: ${invoice.sellerDetails.id.slice(0, 8)}...`, 20, 145);
    
    pdf.setFontSize(14);
    pdf.text('Buyer Details', 110, 125);
    pdf.setFontSize(11);
    pdf.text(`Name: ${invoice.buyerDetails.name}`, 110, 135);
    pdf.text(`Buyer ID: ${invoice.buyerDetails.id.slice(0, 8)}...`, 110, 145);
    
    // Product details section
    pdf.setFontSize(14);
    pdf.text('Product Sold', 20, 165);
    pdf.setFontSize(11);
    pdf.text(`Product: ${invoice.productDetails.name}`, 20, 175);
    pdf.text(`Quantity: ${invoice.productDetails.quantity} ${invoice.productDetails.unit}`, 20, 185);
    if (invoice.productDetails.description) {
      pdf.text(`Description: ${invoice.productDetails.description.slice(0, 50)}...`, 20, 195);
    }
    
    // Delivery address
    if (invoice.deliveryAddress) {
      pdf.setFontSize(14);
      pdf.text('Delivery Address', 20, 215);
      pdf.setFontSize(11);
      const address = `${invoice.deliveryAddress.addressLine1}, ${invoice.deliveryAddress.city}, ${invoice.deliveryAddress.state} - ${invoice.deliveryAddress.postalCode}`;
      pdf.text(address, 20, 225);
    }
    
    // Payment amount section with highlight
    pdf.setFillColor(240, 253, 244); // Light green background
    pdf.rect(15, 240, 180, 25, 'F');
    
    pdf.setFontSize(16);
    pdf.text('Amount Received', 20, 255);
    pdf.setFontSize(20);
    pdf.text(`₹ ${invoice.amount.toLocaleString()}`, 130, 255);
    
    pdf.setFontSize(11);
    pdf.text(`Payment Method: ${invoice.paymentMethod.toUpperCase()}`, 20, 265);
    
    // Footer
    pdf.setFontSize(10);
    pdf.text('Thank you for using Go Fresh Marketplace!', 20, 280);
    pdf.text('This is a computer generated receipt.', 20, 290);
    
    pdf.save(`farmer-receipt-${invoice.invoiceNumber}.pdf`);
  };

  return (
    <Card className="max-w-4xl mx-auto shadow-xl hover:shadow-2xl transition-shadow duration-300">
      <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-lg">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-2xl flex items-center">
              <Receipt className="h-6 w-6 mr-2" />
              Payment Receipt
            </CardTitle>
            <p className="text-green-100 mt-1">Go Fresh Marketplace - Farmer Portal</p>
          </div>
          <Button 
            onClick={downloadInvoice}
            variant="secondary"
            className="bg-white text-green-600 hover:bg-green-50 hover:shadow-lg transition-all duration-300"
          >
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-8 space-y-6">
        {/* Receipt Details */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Receipt Details</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Receipt No:</span> {invoice.invoiceNumber}</p>
              <p><span className="font-medium">Transaction ID:</span> {invoice.transactionId}</p>
              <p><span className="font-medium">Date:</span> {invoice.date}</p>
              <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                Payment Received
              </Badge>
            </div>
          </div>
          
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-800">Order Information</h3>
            <div className="space-y-1 text-sm">
              <p><span className="font-medium">Order ID:</span> {invoice.orderId.slice(0, 8)}...</p>
              <p><span className="font-medium">Payment Method:</span> {invoice.paymentMethod.toUpperCase()}</p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Farmer and Buyer Details */}
        <div className="grid grid-cols-2 gap-6">
          <Card className="border-2 border-green-200 hover:border-green-300 transition-colors">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-green-800 flex items-center mb-3">
                <Package className="h-5 w-5 mr-2" />
                Farmer Details (You)
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {invoice.sellerDetails.name}</p>
                <p><span className="font-medium">Farmer ID:</span> {invoice.sellerDetails.id.slice(0, 8)}...</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-2 border-blue-200 hover:border-blue-300 transition-colors">
            <CardContent className="p-4">
              <h3 className="text-lg font-semibold text-blue-800 flex items-center mb-3">
                <User className="h-5 w-5 mr-2" />
                Buyer Details
              </h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Name:</span> {invoice.buyerDetails.name}</p>
                <p><span className="font-medium">Buyer ID:</span> {invoice.buyerDetails.id.slice(0, 8)}...</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Product Details */}
        <Card className="border-2 border-orange-200 hover:border-orange-300 transition-colors">
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold text-orange-800 flex items-center mb-3">
              <Package className="h-5 w-5 mr-2" />
              Product Sold
            </h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Product Name:</span> {invoice.productDetails.name}</p>
                <p><span className="font-medium">Quantity:</span> {invoice.productDetails.quantity} {invoice.productDetails.unit}</p>
              </div>
              {invoice.productDetails.description && (
                <div>
                  <p><span className="font-medium">Description:</span></p>
                  <p className="text-gray-600 text-xs mt-1">{invoice.productDetails.description}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Delivery Address */}
        {invoice.deliveryAddress && (
          <>
            <Separator />
            <Card className="border-2 border-purple-200 hover:border-purple-300 transition-colors">
              <CardContent className="p-4">
                <h3 className="text-lg font-semibold text-purple-800 flex items-center mb-3">
                  <MapPin className="h-5 w-5 mr-2" />
                  Delivery Address
                </h3>
                <p className="text-sm text-gray-700">
                  {invoice.deliveryAddress.addressLine1}
                  {invoice.deliveryAddress.addressLine2 && `, ${invoice.deliveryAddress.addressLine2}`}
                  <br />
                  {invoice.deliveryAddress.city}, {invoice.deliveryAddress.state} - {invoice.deliveryAddress.postalCode}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        <Separator />

        {/* Payment Amount */}
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <h3 className="text-2xl font-bold text-green-800 mb-2">Amount Received</h3>
            <div className="flex items-center justify-center text-4xl font-bold text-green-600 mb-2">
              <IndianRupee className="h-8 w-8 mr-2" />
              <span>{invoice.amount.toLocaleString()}</span>
            </div>
            <p className="text-green-700 text-sm">Payment successfully received via {invoice.paymentMethod.toUpperCase()}</p>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500 pt-4 border-t">
          <p>Thank you for using Go Fresh Marketplace!</p>
          <p>This receipt is generated automatically upon successful payment.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default FarmerInvoice;
