
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, FileText, Calendar, CreditCard, Package, MapPin, User, Printer } from 'lucide-react';

interface InvoiceProps {
  invoiceData: {
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
    deliveryAddress: {
      addressLine1: string;
      city: string;
      state: string;
      postalCode: string;
    };
  };
}

const Invoice: React.FC<InvoiceProps> = ({ invoiceData }) => {
  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Create a simple PDF-like content for download
    const invoiceContent = `
FARMCONNECT INVOICE
==================

Invoice Number: ${invoiceData.invoiceNumber}
Order ID: ${invoiceData.orderId}
Transaction ID: ${invoiceData.transactionId}
Date: ${invoiceData.date}

BUYER DETAILS:
Name: ${invoiceData.buyerDetails.name}

SELLER DETAILS:
Name: ${invoiceData.sellerDetails.name}

PRODUCT DETAILS:
${invoiceData.productDetails.name}
Quantity: ${invoiceData.productDetails.quantity} ${invoiceData.productDetails.unit}
Description: ${invoiceData.productDetails.description}

PAYMENT DETAILS:
Amount: ₹${invoiceData.amount}
Payment Method: ${invoiceData.paymentMethod.toUpperCase()}
Status: ${invoiceData.paymentStatus.toUpperCase()}

DELIVERY ADDRESS:
${invoiceData.deliveryAddress.addressLine1}
${invoiceData.deliveryAddress.city}, ${invoiceData.deliveryAddress.state} - ${invoiceData.deliveryAddress.postalCode}

Thank you for your business with FarmConnect!
    `;
    
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FarmConnect-Invoice-${invoiceData.invoiceNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      case 'upi':
        return <span className="text-sm">📱</span>;
      case 'cod':
        return <span className="text-sm">💵</span>;
      default:
        return <span className="text-sm">💰</span>;
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden print:shadow-none print:rounded-none">
      {/* Header actions - visible only in screen mode */}
      <div className="flex justify-end p-4 bg-gray-50 print:hidden">
        <Button variant="outline" className="mr-2" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button variant="default" onClick={handleDownload}>
          <FileText className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      {/* Invoice Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold mb-2">INVOICE</h1>
            <p className="text-green-100 text-lg">{invoiceData.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">FarmConnect</h2>
            <p className="text-green-100">Connecting Farmers & Buyers</p>
            <p className="text-green-100">Karnataka, India</p>
          </div>
        </div>
      </div>

      <CardContent className="p-8">
        {/* Invoice Details Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {/* Buyer Information */}
          <Card className="border-2 border-blue-100">
            <CardHeader className="bg-blue-50">
              <CardTitle className="flex items-center text-blue-800">
                <User className="h-5 w-5 mr-2" />
                BILL TO
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <p className="font-bold text-lg mb-2">{invoiceData.buyerDetails.name}</p>
              <div className="flex items-start text-gray-600">
                <MapPin className="h-4 w-4 mr-2 mt-1 flex-shrink-0" />
                <div>
                  <p>{invoiceData.deliveryAddress.addressLine1}</p>
                  <p>{invoiceData.deliveryAddress.city}, {invoiceData.deliveryAddress.state}</p>
                  <p>{invoiceData.deliveryAddress.postalCode}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Meta Information */}
          <Card className="border-2 border-green-100">
            <CardHeader className="bg-green-50">
              <CardTitle className="flex items-center text-green-800">
                <FileText className="h-5 w-5 mr-2" />
                INVOICE DETAILS
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600 flex items-center">
                    <Calendar className="h-4 w-4 mr-2" />
                    Date:
                  </span>
                  <span className="font-semibold">{invoiceData.date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order ID:</span>
                  <span className="font-semibold font-mono text-sm">{invoiceData.orderId.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction ID:</span>
                  <span className="font-semibold font-mono text-sm">{invoiceData.transactionId}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 flex items-center">
                    Payment:
                  </span>
                  <div className="flex items-center font-semibold">
                    {getPaymentMethodIcon(invoiceData.paymentMethod)}
                    <span className="ml-2">{invoiceData.paymentMethod.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                    {invoiceData.paymentStatus.toUpperCase()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Product Details */}
        <Card className="mb-8 border-2 border-orange-100">
          <CardHeader className="bg-orange-50">
            <CardTitle className="flex items-center text-orange-800">
              <Package className="h-5 w-5 mr-2" />
              PRODUCT DETAILS
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="bg-gray-50 p-4 rounded-lg grid grid-cols-12 font-semibold mb-4">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-center">Unit</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            <div className="grid grid-cols-12 p-4 border-b">
              <div className="col-span-6">
                <p className="font-bold text-lg">{invoiceData.productDetails.name}</p>
                <p className="text-sm text-gray-600 mt-1">{invoiceData.productDetails.description}</p>
              </div>
              <div className="col-span-2 text-center font-semibold">{invoiceData.productDetails.quantity}</div>
              <div className="col-span-2 text-center font-semibold">{invoiceData.productDetails.unit}</div>
              <div className="col-span-2 text-right font-bold text-lg flex justify-end items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                <span>{invoiceData.amount.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Summary */}
        <div className="flex justify-end mb-8">
          <Card className="w-96 border-2 border-green-200">
            <CardHeader className="bg-green-50">
              <CardTitle className="text-green-800">PAYMENT SUMMARY</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="flex items-center font-semibold">
                    <IndianRupee className="h-4 w-4 mr-1" />
                    <span>{invoiceData.amount.toLocaleString()}</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Charges:</span>
                  <span className="font-semibold text-green-600">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (GST):</span>
                  <span className="font-semibold">Inclusive</span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Total Amount:</span>
                  <div className="flex items-center text-green-600">
                    <IndianRupee className="h-6 w-6 mr-1" />
                    <span>{invoiceData.amount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Seller Information */}
        <Card className="mb-8 border-2 border-purple-100">
          <CardHeader className="bg-purple-50">
            <CardTitle className="flex items-center text-purple-800">
              <User className="h-5 w-5 mr-2" />
              SELLER INFORMATION
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <p><strong>Farmer Name:</strong> {invoiceData.sellerDetails.name}</p>
            <p className="text-sm text-gray-600 mt-2">
              This product was sourced directly from the farmer, ensuring fresh quality and fair pricing.
            </p>
          </CardContent>
        </Card>
      </CardContent>

      {/* Footer */}
      <CardFooter className="bg-gray-50 border-t p-8">
        <div className="w-full text-center">
          <p className="text-lg font-semibold text-gray-800 mb-2">
            Thank you for choosing FarmConnect! 🌱
          </p>
          <p className="text-sm text-gray-600 mb-2">
            Supporting local farmers and promoting sustainable agriculture.
          </p>
          <p className="text-sm text-gray-600">
            For any queries regarding this invoice, please contact us at support@farmconnect.com
          </p>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              This is a digitally generated invoice and does not require a physical signature.
            </p>
          </div>
        </div>
      </CardFooter>
    </div>
  );
};

export default Invoice;
