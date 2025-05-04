
import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts';
import { IndianRupee } from 'lucide-react';

const mockMarketPrices = {
  vegetables: [
    { name: 'Tomatoes', today: 40, yesterday: 42, weekAgo: 35, monthAgo: 30 },
    { name: 'Potatoes', today: 25, yesterday: 24, weekAgo: 22, monthAgo: 20 },
    { name: 'Onions', today: 35, yesterday: 34, weekAgo: 40, monthAgo: 28 },
    { name: 'Cauliflower', today: 55, yesterday: 50, weekAgo: 48, monthAgo: 45 },
    { name: 'Carrots', today: 38, yesterday: 40, weekAgo: 37, monthAgo: 35 },
    { name: 'Spinach', today: 45, yesterday: 44, weekAgo: 40, monthAgo: 42 },
  ],
  fruits: [
    { name: 'Apples', today: 120, yesterday: 118, weekAgo: 115, monthAgo: 110 },
    { name: 'Bananas', today: 60, yesterday: 58, weekAgo: 55, monthAgo: 50 },
    { name: 'Oranges', today: 85, yesterday: 82, weekAgo: 80, monthAgo: 75 },
    { name: 'Grapes', today: 140, yesterday: 138, weekAgo: 130, monthAgo: 125 },
    { name: 'Mangoes', today: 200, yesterday: 190, weekAgo: 180, monthAgo: 165 },
  ],
  grains: [
    { name: 'Rice', today: 55, yesterday: 55, weekAgo: 52, monthAgo: 50 },
    { name: 'Wheat', today: 32, yesterday: 32, weekAgo: 30, monthAgo: 28 },
    { name: 'Corn', today: 28, yesterday: 27, weekAgo: 25, monthAgo: 24 },
    { name: 'Barley', today: 35, yesterday: 35, weekAgo: 34, monthAgo: 32 },
  ]
};

const trends = [
  { name: 'Last 7 Days', data: [
    { day: 'Mon', price: 40 },
    { day: 'Tue', price: 42 },
    { day: 'Wed', price: 38 },
    { day: 'Thu', price: 45 },
    { day: 'Fri', price: 48 },
    { day: 'Sat', price: 52 },
    { day: 'Sun', price: 50 },
  ]},
  { name: 'Last 30 Days', data: [
    { day: 'Week 1', price: 38 },
    { day: 'Week 2', price: 42 },
    { day: 'Week 3', price: 45 },
    { day: 'Week 4', price: 50 },
  ]},
  { name: 'Last 3 Months', data: [
    { day: 'Jan', price: 35 },
    { day: 'Feb', price: 40 },
    { day: 'Mar', price: 50 },
  ]},
];

interface MarketPriceAnalyticsProps {
  className?: string;
}

const MarketPriceAnalytics = ({ className }: MarketPriceAnalyticsProps) => {
  const [category, setCategory] = useState('vegetables');
  const [period, setPeriod] = useState('Last 7 Days');
  const [pricesData, setPricesData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  useEffect(() => {
    // Set price data based on selected category
    const categoryData = mockMarketPrices[category as keyof typeof mockMarketPrices] || [];
    setPricesData(categoryData);
    
    // Set trend data based on selected period
    const selectedTrend = trends.find(t => t.name === period);
    setTrendData(selectedTrend?.data || []);
  }, [category, period]);

  // Generate data for chart based on current prices
  const prepareChartData = () => {
    return pricesData.map(item => ({
      name: item.name,
      today: item.today,
      yesterday: item.yesterday,
      weekAgo: item.weekAgo,
      change: ((item.today - item.yesterday) / item.yesterday * 100).toFixed(1)
    }));
  };

  const chartData = prepareChartData();

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl font-bold">Live Market Prices</CardTitle>
        <CardDescription>
          Current market prices and trends for agricultural products
        </CardDescription>
        <div className="flex flex-col sm:flex-row gap-3 mt-2">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="vegetables">Vegetables</SelectItem>
              <SelectItem value="fruits">Fruits</SelectItem>
              <SelectItem value="grains">Grains</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="prices" className="space-y-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="prices">Current Prices</TabsTrigger>
            <TabsTrigger value="trends">Price Trends</TabsTrigger>
          </TabsList>
          
          <TabsContent value="prices" className="space-y-4">
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 30,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis 
                    label={{ 
                      value: 'Price (₹/kg)', 
                      angle: -90, 
                      position: 'insideLeft',
                      style: { textAnchor: 'middle' } 
                    }} 
                  />
                  <Tooltip 
                    formatter={(value: number) => [`₹${value}`, 'Price']}
                  />
                  <Legend />
                  <Bar dataKey="today" name="Today's Price" fill="#22c55e" />
                  <Bar dataKey="yesterday" name="Yesterday's Price" fill="#64748b" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Today's Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Yesterday
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Change
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {chartData.map((item, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                        <IndianRupee className="h-3 w-3 mr-1" /> {item.today}/kg
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 flex items-center">
                        <IndianRupee className="h-3 w-3 mr-1" /> {item.yesterday}/kg
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${parseFloat(item.change) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(item.change) >= 0 ? '+' : ''}{item.change}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
          
          <TabsContent value="trends">
            <div className="space-y-4">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Time Period" />
                </SelectTrigger>
                <SelectContent>
                  {trends.map((trend) => (
                    <SelectItem key={trend.name} value={trend.name}>{trend.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={trendData}
                    margin={{
                      top: 5,
                      right: 30,
                      left: 20,
                      bottom: 5,
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis 
                      label={{ 
                        value: 'Average Price (₹/kg)', 
                        angle: -90, 
                        position: 'insideLeft',
                        style: { textAnchor: 'middle' } 
                      }}
                    />
                    <Tooltip formatter={(value: number) => [`₹${value}`, 'Average Price']} />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#10b981"
                      activeDot={{ r: 8 }}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default MarketPriceAnalytics;
