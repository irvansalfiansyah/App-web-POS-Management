import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { Link, useLocation } from 'react-router-dom';
import api from '../../services/api';
import BarcodeScanner from './BarcodeScanner';
import ProductGrid from './ProductGrid';
import CartSidebar from './CartSidebar';
import Toast from '../../components/Toast';
import Modal from '../../components/Modal';
import Sidebar from '../../components/Sidebar';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

const PosPage = () => {
  const { user, logout } = useAuth();
  const { cart, addToCart, removeFromCart, updateQuantity, clearCart, cartSubtotal } = useCart();

  // State definitions
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCheckoutProcessing, setIsCheckoutProcessing] = useState(false);
  const [toast, setToast] = useState({ message: '', type: 'info' });
  const [checkoutSuccessOrder, setCheckoutSuccessOrder] = useState(null);

  // Load active products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      if (response.data && response.data.products) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load products from API', 'error');
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      setToast({ message: '', type: 'info' });
    }, 4000);
    return () => clearTimeout(timer);
  };

  const handleProductFound = (product) => {
    // Check if product is out of stock
    if (product.stock_quantity <= 0) {
      showToast(`Product "${product.name}" is out of stock!`, 'error');
      return;
    }

    // Check if adding exceeds available stock
    const existing = cart.find(item => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + 1 > product.stock_quantity) {
      showToast(`Cannot add more "${product.name}". Only ${product.stock_quantity} available.`, 'error');
      return;
    }

    addToCart(product, 1);
    showToast(`Added "${product.name}" to cart`, 'success');
  };

  const handleAddToCartWithStockCheck = (product) => {
    const existing = cart.find(item => item.product.id === product.id);
    const currentQty = existing ? existing.quantity : 0;
    if (currentQty + 1 > product.stock_quantity) {
      showToast(`Cannot add more "${product.name}". Only ${product.stock_quantity} available.`, 'error');
      return;
    }
    addToCart(product, 1);
    showToast(`Added "${product.name}" to cart`, 'success');
  };

  const handleUpdateQuantityWithStockCheck = (productId, newQty) => {
    if (newQty <= 0) {
      updateQuantity(productId, 0);
      return;
    }

    const product = products.find(p => p.id === productId);
    if (product && newQty > product.stock_quantity) {
      showToast(`Cannot update quantity to ${newQty}. Only ${product.stock_quantity} available.`, 'error');
      return;
    }

    updateQuantity(productId, newQty);
  };

  const handleCheckout = async (paymentMethod) => {
    if (cart.length === 0) return;
    setIsCheckoutProcessing(true);

    try {
      const checkoutItems = cart.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      }));

      const response = await api.post('/sales/checkout', {
        cartItems: checkoutItems,
        paymentMethod
      });

      if (response.data && response.data.order) {
        setCheckoutSuccessOrder(response.data.order);
        showToast('Checkout processed successfully!', 'success');
        clearCart();
        fetchProducts(); // Refresh stocks
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Checkout failed. Please try again.';
      showToast(errMsg, 'error');
    } finally {
      setIsCheckoutProcessing(false);
    }
  };

  return (
    <div className="bg-background font-sans text-foreground h-screen overflow-hidden flex w-full transition-all duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace */}
      <main className="ml-[260px] flex-1 flex h-full">
        {/* Left Section: Catalog (70%) */}
        <section className="flex-1 flex flex-col border-r border-border bg-background p-6 h-full overflow-hidden transition-all">
          
          {/* Top Bar: Search & Actions */}
          <BarcodeScanner 
            onProductFound={handleProductFound} 
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onError={(msg) => showToast(msg, 'error')}
          />

          {/* Category List & Product Grid */}
          <ProductGrid 
            products={products}
            onAddToCart={handleAddToCartWithStockCheck}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            searchQuery={searchQuery}
          />
        </section>

        {/* Right Section: Cart (30%) */}
        <CartSidebar 
          cart={cart}
          updateQuantity={handleUpdateQuantityWithStockCheck}
          removeFromCart={removeFromCart}
          clearCart={clearCart}
          cartSubtotal={cartSubtotal}
          onCheckout={handleCheckout}
          isCheckoutProcessing={isCheckoutProcessing}
        />
      </main>

      {/* Alert Toast Notification */}
      <Toast 
        message={toast.message} 
        type={toast.type} 
        onClose={() => setToast({ message: '', type: 'info' })} 
      />

      {/* Checkout Receipt Modal */}
      <Modal 
        isOpen={!!checkoutSuccessOrder} 
        onClose={() => setCheckoutSuccessOrder(null)} 
        title="Transaction Receipt"
      >
        {checkoutSuccessOrder && (
          <div className="flex flex-col gap-4 text-foreground font-sans">
            <div className="flex flex-col items-center justify-center py-4 border-b border-border">
              <span className="material-symbols-outlined text-success text-5xl mb-2">
                check_circle
              </span>
              <h3 className="text-xl font-bold">Payment Successful</h3>
              <p className="text-body-md text-muted-foreground mt-1">
                Order #{checkoutSuccessOrder.order_number}
              </p>
            </div>
            
            <div className="flex flex-col gap-2 py-2 border-b border-border text-body-md">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time</span>
                <span className="font-medium">{new Date(checkoutSuccessOrder.created_at).toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-semibold uppercase">{checkoutSuccessOrder.payment_method}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cashier</span>
                <span className="font-medium">{user?.fullName}</span>
              </div>
            </div>
 
            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto py-2 border-b border-border">
              <span className="text-[10px] uppercase tracking-wider font-extrabold text-muted-foreground">
                Items Purchased
              </span>
              {checkoutSuccessOrder.items?.map((item) => (
                <div key={item.productId} className="flex justify-between text-body-md">
                  <span>
                    {item.name} <span className="text-muted-foreground">x{item.quantity}</span>
                  </span>
                  <span className="font-medium">
                    {formatPrice(Number(item.unitPrice) * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
 
            <div className="flex flex-col gap-2 pt-4">
              <div className="flex justify-between text-body-md text-muted-foreground">
                <span>Subtotal</span>
                <span>{formatPrice(Number(checkoutSuccessOrder.subtotal))}</span>
              </div>
              <div className="flex justify-between text-body-md text-muted-foreground">
                <span>Tax (10%)</span>
                <span>{formatPrice(Number(checkoutSuccessOrder.tax_total || 0))}</span>
              </div>
              <div className="flex justify-between text-headline-md font-bold mt-1">
                <span>Grand Total</span>
                <span className="text-primary">{formatPrice(Number(checkoutSuccessOrder.grand_total))}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setCheckoutSuccessOrder(null)}
              className="mt-4 w-full py-3 bg-primary hover:opacity-95 text-primary-foreground font-bold rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 active:scale-[0.98] duration-200"
            >
              New Transaction
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PosPage;
