
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { IndianRupee, FileDown, Printer } from 'lucide-react';

interface InvoiceProps {
  invoiceData: {
    invoiceNumber: string;
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
    // In a real app, this would generate a PDF or similar document
    alert('Download functionality would be implemented here');
  };

  return (
    <div className="max-w-4xl mx-auto p-8 bg-white shadow-md rounded-lg print:shadow-none print:p-0">
      {/* Header actions - visible only in screen mode, not when printing */}
      <div className="flex justify-end mb-6 print:hidden">
        <Button variant="outline" className="mr-2" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Invoice
        </Button>
        <Button variant="default" onClick={handleDownload}>
          <FileDown className="h-4 w-4 mr-2" />
          Download
        </Button>
      </div>

      <Card className="border-none print:shadow-none">
        <CardHeader className="pb-4">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold">INVOICE</h1>
              <p className="text-gray-500">{invoiceData.invoiceNumber}</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-bold">FarmConnect</h2>
              <p className="text-gray-500">Karnataka, India</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-sm text-gray-500">BILLED TO</h3>
              <p className="font-semibold">{invoiceData.buyerDetails.name}</p>
              <p>{invoiceData.deliveryAddress.addressLine1}</p>
              <p>
                {invoiceData.deliveryAddress.city}, {invoiceData.deliveryAddress.state}{' '}
                {invoiceData.deliveryAddress.postalCode}
              </p>
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <div className="flex justify-end">
                  <span className="text-sm text-gray-500 w-28">Invoice Date:</span>
                  <span className="font-semibold">{invoiceData.date}</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-sm text-gray-500 w-28">Transaction ID:</span>
                  <span className="font-semibold">{invoiceData.transactionId}</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-sm text-gray-500 w-28">Payment Method:</span>
                  <span className="font-semibold capitalize">{invoiceData.paymentMethod}</span>
                </div>
                <div className="flex justify-end">
                  <span className="text-sm text-gray-500 w-28">Status:</span>
                  <span className="font-semibold capitalize">{invoiceData.paymentStatus}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <div className="bg-gray-100 p-4 rounded-md grid grid-cols-12 font-semibold">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-right">Quantity</div>
              <div className="col-span-2 text-right">Unit</div>
              <div className="col-span-2 text-right">Amount</div>
            </div>
            
            <div className="p-4 grid grid-cols-12 border-b">
              <div className="col-span-6">
                <p className="font-semibold">{invoiceData.productDetails.name}</p>
                <p className="text-sm text-gray-600">{invoiceData.productDetails.description}</p>
              </div>
              <div className="col-span-2 text-right">{invoiceData.productDetails.quantity}</div>
              <div className="col-span-2 text-right">{invoiceData.productDetails.unit}</div>
              <div className="col-span-2 text-right flex justify-end">
                <IndianRupee className="h-4 w-4 mr-0.5 mt-0.5" />
                <span>{invoiceData.amount}</span>
              </div>
            </div>
            
            <div className="flex justify-end pt-6">
              <div className="w-48">
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Subtotal:</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-3 w-3 mr-0.5" />
                    <span>{invoiceData.amount}</span>
                  </div>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Delivery:</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-gray-600">Tax:</span>
                  <span>N/A</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold py-1">
                  <span>Total:</span>
                  <div className="flex items-center">
                    <IndianRupee className="h-4 w-4 mr-0.5" />
                    <span>{invoiceData.amount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div className="pt-4">
            <h3 className="font-semibold mb-2">Seller Information</h3>
            <p>Name: {invoiceData.sellerDetails.name}</p>
          </div>
        </CardContent>

        <CardFooter className="flex-col items-start pt-6">
          <p className="text-sm text-gray-600 mb-1">
            Thank you for your purchase from FarmConnect.
          </p>
          <p className="text-sm text-gray-600">
            For any queries related to this invoice, please contact support@farmconnect.com
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Invoice;
