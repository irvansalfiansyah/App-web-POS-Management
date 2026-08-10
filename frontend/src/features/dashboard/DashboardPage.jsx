import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import Toast from '../../components/Toast';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

const DashboardPage = () => {
  const [salesOrders, setSalesOrders] = useState([]);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [productsCount, setProductsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ message: '', type: 'info' });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      // Parallel requests
      const [salesRes, lowStockRes, productsRes] = await Promise.all([
        api.get('/sales'),
        api.get('/inventory/low-stock'),
        api.get('/products')
      ]);

      setSalesOrders(salesRes.data.orders || []);
      setLowStockAlerts(lowStockRes.data.alerts || []);
      if (productsRes.data && productsRes.data.products) {
        setProductsCount(productsRes.data.products.length);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load dashboard metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 4000);
    return () => clearTimeout(timer);
  };

  // 1. Calculations from real database sales
  const completedSales = salesOrders.filter(o => o.status !== 'refunded');
  
  const totalRevenue = completedSales.reduce((acc, order) => {
    return acc + parseFloat(order.grand_total || '0');
  }, 0);

  const totalTransactions = salesOrders.length;
  const avgOrderValue = totalTransactions > 0 ? (totalRevenue / completedSales.length) || 0 : 0;
  const lowStockCount = lowStockAlerts.length;

  // 2. Format Sales Trend Chart (group by last 7 calendar days)
  const getSalesChartData = () => {
    const dailyData = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const label = date.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      dailyData[label] = 0;
    }

    // Populate actual sales
    completedSales.forEach(order => {
      const orderDate = new Date(order.created_at);
      const label = orderDate.toLocaleDateString('en-US', { month: 'short', day: '2-digit' });
      if (dailyData[label] !== undefined) {
        dailyData[label] += parseFloat(order.grand_total);
      }
    });

    const entries = Object.entries(dailyData);
    const maxVal = Math.max(...entries.map(([_, val]) => val), 10); // scale factor

    return { entries, maxVal };
  };

  const { entries: chartEntries, maxVal: chartMaxVal } = getSalesChartData();

  // SVG Chart Dimensions
  const chartWidth = 500;
  const chartHeight = 150;
  const paddingX = 40;
  const paddingY = 20;

  // Calculate points
  const points = chartEntries.map(([_, val], index) => {
    const x = paddingX + (index * (chartWidth - paddingX * 2)) / (chartEntries.length - 1);
    const y = chartHeight - paddingY - (val * (chartHeight - paddingY * 2)) / chartMaxVal;
    return { x, y, value: val };
  });

  const pathD = points.reduce((acc, p, index) => {
    return acc + `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`;
  }, '');

  // Fill path for area color
  const fillPathD = pathD
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${chartHeight - paddingY} Z`
    : '';

  return (
    <div className="bg-background font-sans text-foreground min-h-screen flex w-full transition-all duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Dashboard Space */}
      <main className="ml-[260px] flex-1 p-8 overflow-y-auto">
        <header className="mb-8">
          <h1 className="text-headline-md font-bold text-primary mb-1">
            Business Dashboard
          </h1>
          <p className="text-body-md text-muted-foreground">
            Real-time shop performance metrics, sales graphs, and inventory status warnings
          </p>
        </header>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-40 text-muted-foreground">
            <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
            <p className="text-body-md mt-2">Loading data widgets...</p>
          </div>
        ) : (
          <div className="space-y-8">
            
            {/* KPI Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              
              {/* Card 1: Revenue */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-200 flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">payments</span>
                </div>
                <div>
                  <p className="text-label-md text-muted-foreground font-bold">TOTAL REVENUE</p>
                  <p className="text-headline-sm font-extrabold text-foreground mt-1">
                    {formatPrice(totalRevenue)}
                  </p>
                </div>
              </div>

              {/* Card 2: Transactions */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary-container text-on-primary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">receipt_long</span>
                </div>
                <div>
                  <p className="text-label-md text-muted-foreground font-bold">TRANSACTIONS</p>
                  <p className="text-headline-sm font-extrabold text-foreground mt-1">
                    {totalTransactions} invoices
                  </p>
                </div>
              </div>

              {/* Card 3: Avg Order */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary-container text-on-secondary-container flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-2xl">shopping_bag</span>
                </div>
                <div>
                  <p className="text-label-md text-muted-foreground font-bold">AVG BASKET</p>
                  <p className="text-headline-sm font-extrabold text-foreground mt-1">
                    {formatPrice(avgOrderValue)}
                  </p>
                </div>
              </div>

              {/* Card 4: Low Stock Alert */}
              <div className="bg-card border border-border rounded-2xl p-5 shadow-sm flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                  lowStockCount > 0 
                    ? 'bg-error-container text-on-error-container animate-pulse'
                    : 'bg-secondary text-muted-foreground'
                }`}>
                  <span className="material-symbols-outlined text-2xl">warning</span>
                </div>
                <div>
                  <p className="text-label-md text-muted-foreground font-bold">LOW STOCK ITEMS</p>
                  <p className="text-headline-sm font-extrabold mt-1">
                    {lowStockCount} items
                  </p>
                </div>
              </div>

            </div>

            {/* Middle Section: Chart and Low Stock alerts list */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Sales Graph Chart */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm lg:col-span-2 flex flex-col justify-between">
                <div>
                  <h2 className="text-title-lg font-bold mb-1 flex items-center gap-2">
                    <span className="material-symbols-outlined text-primary">show_chart</span>
                    Revenue Trend (Last 7 Days)
                  </h2>
                  <p className="text-body-md text-muted-foreground mb-6">
                    Sales revenue aggregated daily from checkouts
                  </p>
                </div>

                {/* SVG Line/Area graph rendering */}
                <div className="w-full h-44 bg-secondary rounded-xl p-2 flex items-center justify-center border border-border relative overflow-hidden">
                  <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`}>
                    {/* Grid lines */}
                    <line x1={paddingX} y1={paddingY} x2={chartWidth - paddingX} y2={paddingY} stroke="currentColor" className="text-border" strokeDasharray="3,3" />
                    <line x1={paddingX} y1={chartHeight - paddingY} x2={chartWidth - paddingX} y2={chartHeight - paddingY} stroke="currentColor" className="text-muted-foreground/30" strokeWidth="1.5" />

                    {/* Gradient Area under line */}
                    {fillPathD && (
                      <path d={fillPathD} fill="url(#chartGrad)" opacity="0.15" />
                    )}

                    {/* Path line */}
                    {pathD && (
                      <path d={pathD} fill="none" stroke="var(--primary)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                    )}

                    {/* Interactive dots and text */}
                    {points.map((p, i) => (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r="5" fill="#ffffff" stroke="var(--primary)" strokeWidth="2" />
                        <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="bold" fill="var(--primary)">
                          {p.value > 0 ? `$${p.value.toFixed(0)}` : ''}
                        </text>
                      </g>
                    ))}

                    {/* X Axis Labels */}
                    {chartEntries.map(([label, _], i) => {
                      const x = paddingX + (i * (chartWidth - paddingX * 2)) / (chartEntries.length - 1);
                      return (
                        <text key={i} x={x} y={chartHeight - 4} textAnchor="middle" fontSize="9" fontWeight="500" fill="currentColor" className="text-muted-foreground">
                          {label}
                        </text>
                      );
                    })}

                    <defs>
                      <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--primary)" stopOpacity="1" />
                        <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                  </svg>
                </div>
              </div>

              {/* Low Stock Alerts Widget */}
              <div className="bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                <h2 className="text-title-lg font-bold mb-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-error">warning</span>
                  Low Stock Warnings
                </h2>
                <p className="text-body-md text-muted-foreground mb-4">
                  Adjust these stock levels in Inventory page immediately
                </p>

                <div className="flex-1 overflow-y-auto max-h-56 pr-1 space-y-3">
                  {lowStockAlerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-outline py-8">
                      <span className="material-symbols-outlined text-3xl text-green-600 mb-1">check_circle</span>
                      <p className="text-label-md font-bold">All products fully stocked!</p>
                    </div>
                  ) : (
                    lowStockAlerts.map(alert => (
                      <div 
                        key={alert.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-destructive/10 text-destructive border border-destructive/20 text-body-md"
                      >
                        <div>
                          <p className="font-bold">{alert.name}</p>
                          <p className="text-[10px] opacity-75 font-mono">SKU: {alert.sku}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded bg-card text-destructive border border-destructive/20 font-extrabold text-label-md">
                          {alert.stock_quantity} left
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

            {/* Bottom Section: Recent transactions list */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <h2 className="text-title-lg font-bold mb-1 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">history</span>
                Recent Transactions
              </h2>
              <p className="text-body-md text-muted-foreground mb-6">
                Latest sales order tickets issued from the cashier terminal
              </p>

              {salesOrders.length === 0 ? (
                <p className="text-body-md text-muted-foreground italic text-center py-6">No transaction history records in database.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-body-md">
                    <thead>
                      <tr className="border-b border-border text-label-md font-bold text-muted-foreground uppercase tracking-wider pb-2">
                        <th className="py-2">Invoice #</th>
                        <th className="py-2">Date & Time</th>
                        <th className="py-2 text-center">Payment</th>
                        <th className="py-2 text-right">Tax (10%)</th>
                        <th className="py-2 text-right">Total Price</th>
                        <th className="py-2 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {salesOrders.slice(0, 5).map(order => (
                        <tr key={order.id} className="hover:bg-secondary/40 transition-colors">
                          <td className="py-3 font-mono font-bold text-primary">{order.order_number}</td>
                          <td className="py-3 text-muted-foreground">
                            {new Date(order.created_at).toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' })}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2.5 py-0.5 rounded text-label-md font-bold bg-secondary text-muted-foreground border border-border uppercase">
                              {order.payment_method}
                            </span>
                          </td>
                          <td className="py-3 text-right text-muted-foreground font-medium">
                            {formatPrice(parseFloat(order.tax_total))}
                          </td>
                          <td className="py-3 text-right font-extrabold text-foreground">
                            {formatPrice(parseFloat(order.grand_total))}
                          </td>
                          <td className="py-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-label-md font-bold uppercase inline-block border ${
                              order.status === 'refunded'
                                ? 'bg-destructive/10 text-destructive border-destructive/20'
                                : 'bg-success/10 text-success border-success/20'
                            }`}>
                              {order.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      {/* Toast Feedbacks */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

    </div>
  );
};

export default DashboardPage;
