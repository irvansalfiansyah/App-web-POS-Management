import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import Toast from '../../components/Toast';
import { jsPDF } from 'jspdf';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
};

const exportTransactionsPDF = (filteredOrders, startDate, endDate, statusFilter) => {
  const doc = new jsPDF();
  
  // Set fonts, colors
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(16, 124, 65); // Emerald Green color
  doc.text("Emerald POS - Transaction Report", 14, 20);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(100);
  
  const dateStr = `Date Range: ${startDate || 'All'} to ${endDate || 'All'}`;
  const statusStr = `Status Filter: ${statusFilter.toUpperCase()}`;
  const generatedStr = `Generated on: ${new Date().toLocaleString('id-ID')}`;
  doc.text(dateStr, 14, 28);
  doc.text(statusStr, 14, 34);
  doc.text(generatedStr, 14, 40);
  
  // Table header background
  doc.setFillColor(240, 240, 240);
  doc.rect(14, 46, 182, 8, "F");
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(50);
  doc.text("Invoice #", 16, 51);
  doc.text("Date & Time", 55, 51);
  doc.text("Payment", 105, 51);
  doc.text("Tax", 135, 51);
  doc.text("Grand Total", 160, 51);
  
  doc.setFont("helvetica", "normal");
  let y = 60;
  let totalRevenue = 0;
  
  filteredOrders.forEach((order) => {
    // Check page boundaries
    if (y > 280) {
      doc.addPage();
      y = 20;
      // Repeat Header on new page
      doc.setFillColor(240, 240, 240);
      doc.rect(14, y - 6, 182, 8, "F");
      doc.setFont("helvetica", "bold");
      doc.text("Invoice #", 16, y - 1);
      doc.text("Date & Time", 55, y - 1);
      doc.text("Payment", 105, y - 1);
      doc.text("Tax", 135, y - 1);
      doc.text("Grand Total", 160, y - 1);
      doc.setFont("helvetica", "normal");
      y += 8;
    }
    
    doc.text(order.order_number, 16, y);
    doc.text(formatDate(order.created_at), 55, y);
    doc.text(order.payment_method.toUpperCase(), 105, y);
    doc.text(formatPrice(parseFloat(order.tax_total)), 135, y);
    doc.text(formatPrice(parseFloat(order.grand_total)), 160, y);
    
    // Draw a subtle line between rows
    doc.setDrawColor(230, 230, 230);
    doc.line(14, y + 2, 196, y + 2);
    
    totalRevenue += parseFloat(order.grand_total);
    y += 10;
  });
  
  // Total Revenue Summary at the end
  if (y > 270) {
    doc.addPage();
    y = 20;
  }
  y += 5;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Total Filtered Transactions: ${filteredOrders.length}`, 14, y);
  doc.text(`Total Revenue: ${formatPrice(totalRevenue)}`, 140, y);
  
  doc.save(`transaction_report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const exportReceiptPDF = (order) => {
  const doc = new jsPDF({
    unit: 'mm',
    format: [80, 150] // Receipt roll size (80mm width, 150mm height)
  });
  
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(16, 124, 65); // Emerald Green
  doc.text("EMERALD RETAIL OS", pageWidth / 2, 10, { align: 'center' });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100);
  doc.text("Emerald POS & Inventory System", pageWidth / 2, 14, { align: 'center' });
  doc.text("-----------------------------------------", pageWidth / 2, 18, { align: 'center' });
  
  doc.setFont("helvetica", "bold");
  doc.setTextColor(50);
  doc.text(`INVOICE: ${order.order_number}`, 10, 23);
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`Date: ${formatDate(order.created_at)}`, 10, 27);
  doc.text(`Payment Method: ${order.payment_method.toUpperCase()}`, 10, 31);
  doc.text(`Cashier: ID ${order.cashier_id}`, 10, 35);
  doc.text(`Status: ${order.status.toUpperCase()}`, 10, 39);
  doc.text("----------------------------------------------------------------", pageWidth / 2, 43, { align: 'center' });
  
  // Table headers for items
  doc.setFont("helvetica", "bold");
  doc.text("Item", 10, 47);
  doc.text("Qty", 48, 47);
  doc.text("Total", 70, 47, { align: 'right' });
  doc.text("----------------------------------------------------------------", pageWidth / 2, 50, { align: 'center' });
  
  doc.setFont("helvetica", "normal");
  let y = 54;
  
  order.items?.forEach((item) => {
    if (y > 130) {
      doc.addPage();
      y = 10;
    }
    
    doc.setFont("helvetica", "bold");
    doc.text(item.product_name, 10, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.text(`${item.quantity} x ${formatPrice(parseFloat(item.unit_price))}`, 10, y);
    doc.text(formatPrice(parseFloat(item.line_total)), 70, y, { align: 'right' });
    y += 5;
  });
  
  if (y > 120) {
    doc.addPage();
    y = 10;
  }
  
  doc.setFontSize(8);
  doc.text("-----------------------------------------", pageWidth / 2, y, { align: 'center' });
  y += 4;
  
  doc.text("Subtotal:", 10, y);
  doc.text(formatPrice(parseFloat(order.subtotal)), 70, y, { align: 'right' });
  y += 4;
  
  doc.text("Tax (10%):", 10, y);
  doc.text(formatPrice(parseFloat(order.tax_total)), 70, y, { align: 'right' });
  y += 4;
  
  doc.setFont("helvetica", "bold");
  doc.text("Grand Total:", 10, y);
  doc.text(formatPrice(parseFloat(order.grand_total)), 70, y, { align: 'right' });
  y += 6;
  
  doc.setFont("helvetica", "italic");
  doc.setFontSize(7);
  doc.text("Thank you for shopping with us!", pageWidth / 2, y, { align: 'center' });
  y += 4;
  doc.text("Emerald POS - Powered by RetailOS", pageWidth / 2, y, { align: 'center' });
  
  doc.save(`receipt_${order.order_number}.pdf`);
};

const formatReceiptDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  return `${String(date.getDate()).padStart(2, '0')} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

const TransactionsPage = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [isRefundProcessing, setIsRefundProcessing] = useState(false);

  // Date and Month Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/sales');
      setOrders(response.data.orders || []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load transaction history', 'error');
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

  const handleViewDetails = async (orderId) => {
    setIsDetailLoading(true);
    try {
      const response = await api.get(`/sales/${orderId}`);
      setSelectedOrder(response.data.order);
    } catch (err) {
      console.error(err);
      showToast('Failed to retrieve receipt details', 'error');
    } finally {
      setIsDetailLoading(false);
    }
  };

  const handleRefund = async (orderId) => {
    if (!window.confirm('Are you sure you want to refund this transaction? This will restore stock levels.')) {
      return;
    }
    
    setIsRefundProcessing(true);
    try {
      const response = await api.post(`/sales/${orderId}/refund`);
      showToast('Transaction successfully refunded!', 'success');
      
      // If the currently open receipt was refunded, refresh its details
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'refunded' }));
      }
      
      fetchOrders();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Refund failed. Please verify admin privileges.';
      showToast(errMsg, 'error');
    } finally {
      setIsRefundProcessing(false);
    }
  };

  const handleDownloadReceipt = async (orderId) => {
    try {
      showToast('Fetching invoice details...', 'info');
      const response = await api.get(`/sales/${orderId}`);
      if (response.data && response.data.order) {
        exportReceiptPDF(response.data.order);
        showToast('Receipt PDF downloaded successfully!', 'success');
      } else {
        showToast('Could not find order details', 'error');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to download receipt PDF', 'error');
    }
  };

  const handleMonthChange = (monthStr) => {
    setSelectedMonth(monthStr);
    if (!monthStr) {
      setStartDate('');
      setEndDate('');
      return;
    }
    const [year, month] = monthStr.split('-');
    const firstDay = `${year}-${month}-01`;
    const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
    const formattedLastDay = `${year}-${month}-${String(lastDay).padStart(2, '0')}`;
    setStartDate(firstDay);
    setEndDate(formattedLastDay);
  };

  const handleClearDates = () => {
    setStartDate('');
    setEndDate('');
    setSelectedMonth('');
  };

  const filteredOrders = orders.filter(order => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    const matchesSearch = !searchQuery || 
      order.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.payment_method.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesDate = true;
    if (order.created_at) {
      const orderDateStr = order.created_at.split('T')[0]; // YYYY-MM-DD
      if (startDate) {
        matchesDate = matchesDate && (orderDateStr >= startDate);
      }
      if (endDate) {
        matchesDate = matchesDate && (orderDateStr <= endDate);
      }
    }

    return matchesStatus && matchesSearch && matchesDate;
  });

  return (
    <div className="bg-background font-sans text-foreground min-h-screen flex w-full transition-all duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <main className="ml-[260px] flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-md font-bold text-primary mb-1">
              Transaction History
            </h1>
            <p className="text-body-md text-muted-foreground">
              Browse sales invoices, inspect items purchased, and handle customer refunds
            </p>
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-container text-on-primary-container hover:bg-opacity-90 transition-all rounded-lg font-bold shadow-sm"
          >
            <span className="material-symbols-outlined text-sm">refresh</span>
            Refresh
          </button>
        </header>

        {/* Filter controls container matching screenshot */}
        <div className="bg-card border border-border rounded-[2.5rem] p-6 mb-8 shadow-sm transition-all duration-200">
          {/* Header */}
          <div className="flex items-center gap-2.5 mb-6 border-b border-border pb-3.5">
            <span className="material-symbols-outlined text-primary text-xl font-bold">calendar_today</span>
            <h3 className="text-body-lg font-bold text-foreground">Filter Transactions</h3>
          </div>

          {/* Grid Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
            {/* Month */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-muted-foreground tracking-wide ml-1">Month</span>
              <div className="relative">
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => handleMonthChange(e.target.value)}
                  className="w-full pl-4 pr-10 py-3 rounded-full bg-transparent border border-border text-body-md text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors duration-200"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-muted-foreground pointer-events-none text-lg">calendar_month</span>
              </div>
            </div>

            {/* From */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-muted-foreground tracking-wide ml-1">From</span>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setSelectedMonth('');
                  }}
                  className="w-full pl-4 pr-10 py-3 rounded-full bg-transparent border border-border text-body-md text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors duration-200"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-muted-foreground pointer-events-none text-lg">calendar_today</span>
              </div>
            </div>

            {/* To */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-muted-foreground tracking-wide ml-1">To</span>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setSelectedMonth('');
                  }}
                  className="w-full pl-4 pr-10 py-3 rounded-full bg-transparent border border-border text-body-md text-foreground focus:outline-none focus:border-primary cursor-pointer transition-colors duration-200"
                />
                <span className="material-symbols-outlined absolute right-3 top-3.5 text-muted-foreground pointer-events-none text-lg">calendar_today</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-bold text-muted-foreground tracking-wide ml-1">Search</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search invoice..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-full bg-transparent border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground/60 transition-colors duration-200"
                />
                <span className="material-symbols-outlined absolute left-4 top-3.5 text-muted-foreground text-lg">search</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <div className="flex items-center gap-3">
              <button
                onClick={handleClearDates}
                className="px-6 py-2.5 rounded-full bg-card border border-border text-muted-foreground hover:bg-accent/40 font-bold transition-all text-body-md"
              >
                Clear
              </button>
              
              <button
                onClick={() => exportTransactionsPDF(filteredOrders, startDate, endDate, statusFilter)}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white transition-all rounded-full font-bold shadow-md shadow-emerald-600/10 text-body-md hover:-translate-y-0.5 duration-200"
              >
                <span className="material-symbols-outlined text-lg">description</span>
                Export PDF
              </button>
            </div>

            {/* Status filters kept to retain functionality */}
            <div className="flex gap-2 bg-secondary/50 p-1 rounded-full border border-border">
              {['all', 'completed', 'refunded'].map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
                    statusFilter === status
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-foreground hover:bg-accent/40'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
              <p className="text-body-md mt-2">Loading transactions...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-2">receipt_long</span>
              <p className="text-body-lg font-semibold">No transactions found</p>
              <p className="text-body-md">Checkout orders at the POS first to populate history.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left font-sans">
                <thead>
                  <tr className="bg-secondary border-b border-border text-label-md font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Invoice #</th>
                    <th className="px-6 py-4">Date & Time</th>
                    <th className="px-6 py-4 text-center">Payment Method</th>
                    <th className="px-6 py-4 text-right">Tax (10%)</th>
                    <th className="px-6 py-4 text-right">Grand Total</th>
                    <th className="px-6 py-4 text-center">Status</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-body-md text-foreground">
                  {filteredOrders.map((order) => {
                    const isRefunded = order.status === 'refunded';
                    return (
                      <tr 
                        key={order.id} 
                        className="hover:bg-accent/10 hover:-translate-y-0.5 transition-all duration-150"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-primary">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4 text-muted-foreground">
                          {formatDate(order.created_at)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-secondary text-foreground uppercase tracking-wider border border-border">
                            {order.payment_method}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-muted-foreground">
                          {formatPrice(parseFloat(order.tax_total))}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-foreground">
                          {formatPrice(parseFloat(order.grand_total))}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide inline-block border ${
                            isRefunded
                              ? 'bg-destructive/10 text-destructive border-destructive/20'
                              : 'bg-success/10 text-success border-success/20'
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => handleViewDetails(order.id)}
                              className="p-2 rounded-xl hover:bg-accent/30 text-primary transition-all flex items-center justify-center"
                              title="View Invoice"
                            >
                              <span className="material-symbols-outlined text-lg">visibility</span>
                            </button>
                            <button
                              onClick={() => handleDownloadReceipt(order.id)}
                              className="p-2 rounded-xl hover:bg-accent/30 text-muted-foreground hover:text-foreground transition-all flex items-center justify-center"
                              title="Download Receipt (PDF)"
                            >
                              <span className="material-symbols-outlined text-lg">download</span>
                            </button>
                            {!isRefunded && (
                              <button
                                onClick={() => handleRefund(order.id)}
                                disabled={isRefundProcessing}
                                className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-all flex items-center justify-center"
                                title="Process Refund"
                              >
                                <span className="material-symbols-outlined text-lg">assignment_return</span>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Invoice Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl relative">
            
            {/* Modal Close Button */}
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute right-6 top-6 p-1.5 text-muted-foreground hover:text-foreground transition-colors rounded-xl hover:bg-accent/40"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            {/* Modal Header */}
            <div className="mb-4">
              <h3 className="text-xl font-bold text-foreground">Receipt</h3>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                {selectedOrder.order_number}
              </p>
            </div>

            {/* Inner Paper Receipt Container */}
            <div className="bg-slate-50 dark:bg-zinc-900/50 p-5 rounded-2xl border border-dashed border-border font-mono text-xs text-zinc-800 dark:text-zinc-200 space-y-4 max-h-[350px] overflow-y-auto shadow-inner relative">
              {selectedOrder.status === 'refunded' && (
                <div className="absolute inset-0 bg-destructive/5 backdrop-blur-[0.5px] pointer-events-none flex items-center justify-center rotate-12 border-4 border-dashed border-destructive text-destructive text-sm font-black px-4 py-2 tracking-widest uppercase opacity-30 select-none">
                  REFUNDED
                </div>
              )}
              {/* Header */}
              <div className="text-center space-y-1">
                <h4 className="text-sm font-extrabold text-foreground tracking-wider uppercase">EMERALD POS</h4>
                <p className="text-[10px] text-muted-foreground">Jl. Merdeka No. 24, Jakarta</p>
                <p className="text-[10px] text-muted-foreground">0812-3456-7890</p>
              </div>

              <div className="border-t border-dashed border-border" />

              {/* Meta details */}
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Invoice</span>
                  <span className="font-bold text-foreground">{selectedOrder.order_number}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span className="font-bold text-foreground">{formatReceiptDate(selectedOrder.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cashier</span>
                  <span className="font-bold text-foreground">{selectedOrder.cashier_name || 'Dewi Lestari'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment</span>
                  <span className="font-bold text-foreground uppercase">{selectedOrder.payment_method}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border" />

              {/* Items List */}
              <div className="space-y-3">
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} className="space-y-0.5">
                    <div className="flex justify-between font-bold text-foreground">
                      <span>{item.product_name}</span>
                      <span>{formatPrice(parseFloat(item.line_total))}</span>
                    </div>
                    <div className="flex justify-between text-muted-foreground text-[10px]">
                      <span>{item.quantity} x {formatPrice(parseFloat(item.unit_price))}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-border" />

              {/* Totals */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-bold text-foreground">{formatPrice(parseFloat(selectedOrder.subtotal))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax (10%)</span>
                  <span className="font-bold text-foreground">{formatPrice(parseFloat(selectedOrder.tax_total))}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold border-t border-dashed border-border pt-1.5 text-foreground">
                  <span>TOTAL</span>
                  <span>{formatPrice(parseFloat(selectedOrder.grand_total))}</span>
                </div>
              </div>

              <div className="border-t border-dashed border-border" />

              {/* Footer messages */}
              <div className="text-center text-[10px] text-muted-foreground space-y-0.5">
                <p>Thank you for your purchase!</p>
                <p>Powered by Emerald RetailOS</p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => exportReceiptPDF(selectedOrder)}
                className="w-full py-3 rounded-full bg-primary text-primary-foreground hover:opacity-95 font-bold transition-all text-body-md flex items-center justify-center gap-2 shadow-md shadow-primary/20 hover:-translate-y-0.5 duration-200"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Download Receipt PDF
              </button>
              
              <div className="flex gap-3">
                {selectedOrder.status !== 'refunded' && (
                  <button
                    onClick={() => handleRefund(selectedOrder.id)}
                    disabled={isRefundProcessing}
                    className="flex-1 py-3 rounded-full bg-transparent border border-primary text-primary hover:bg-primary/5 font-bold transition-all text-body-md flex items-center justify-center gap-2 hover:-translate-y-0.5 duration-200"
                  >
                    <span className="material-symbols-outlined text-lg">history</span>
                    Issue Refund
                  </button>
                )}
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="flex-1 py-3 rounded-full bg-transparent border border-border text-muted-foreground hover:bg-accent/40 font-bold transition-all text-body-md flex items-center justify-center hover:-translate-y-0.5 duration-200"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Toast Feedbacks */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

    </div>
  );
};

export default TransactionsPage;
