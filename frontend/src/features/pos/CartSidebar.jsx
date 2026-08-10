import React, { useState } from 'react';

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

const CartSidebar = ({ 
  cart, 
  updateQuantity, 
  removeFromCart, 
  clearCart, 
  cartSubtotal, 
  onCheckout, 
  isCheckoutProcessing 
}) => {
  const [paymentMethod, setPaymentMethod] = useState('cash');

  const taxRate = 0.1; // 10%
  const taxTotal = cartSubtotal * taxRate;
  const grandTotal = cartSubtotal + taxTotal;

  const totalItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckoutSubmit = () => {
    if (cart.length === 0) return;
    onCheckout(paymentMethod);
  };

  const paymentMethods = [
    { id: 'cash', label: 'Cash', icon: 'payments' },
    { id: 'card', label: 'Card', icon: 'credit_card' },
    { id: 'qris', label: 'QRIS', icon: 'qr_code_2' },
    { id: 'other', label: 'Other', icon: 'more_horiz' },
  ];

  return (
    <aside className="w-[380px] bg-card h-full flex flex-col border-l border-border shadow-sm z-10 shrink-0">
      {/* Cart Header */}
      <div className="p-6 border-b border-border flex items-center justify-between bg-card shrink-0">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-muted-foreground" data-icon="shopping_cart">
            shopping_cart
          </span>
          <h2 className="text-headline-md font-bold text-foreground">Current Order</h2>
          {totalItemsCount > 0 && (
            <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full ml-1 animate-pulse">
              {totalItemsCount}
            </span>
          )}
        </div>
        {cart.length > 0 && (
          <button 
            type="button"
            onClick={clearCart}
            aria-label="Clear Cart" 
            className="text-destructive hover:bg-destructive/10 p-2 rounded-xl transition-colors flex items-center justify-center group"
          >
            <span className="material-symbols-outlined group-hover:scale-110 transition-transform" data-icon="delete">
              delete
            </span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 bg-card">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground p-6 text-center">
            <span className="material-symbols-outlined text-5xl mb-3 text-muted-foreground/40" data-icon="shopping_basket">
              shopping_basket
            </span>
            <p className="text-body-md font-semibold">Your shopping cart is empty.</p>
            <p className="text-xs text-muted-foreground/60 mt-1">Scan barcodes or click products in the grid to add items.</p>
          </div>
        ) : (
          cart.map((item) => {
            const itemSubtotal = Number(item.product.sell_price || 0) * item.quantity;
            return (
              <div 
                key={item.product.id}
                className="flex items-start justify-between p-3 rounded-2xl border border-border hover:bg-accent/20 transition-all group"
              >
                <div className="flex-1 min-w-0 pr-2">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-body-md font-bold text-foreground truncate">
                      {item.product.name}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.product.id)}
                      className="text-destructive hover:bg-destructive/10 p-1 rounded-xl transition-all opacity-0 group-hover:opacity-100 flex items-center justify-center shrink-0"
                      title="Remove item"
                    >
                      <span className="material-symbols-outlined text-[14px]">close</span>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatPrice(item.product.sell_price)} / ea
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <p className="text-body-md font-extrabold text-foreground">
                    {formatPrice(itemSubtotal)}
                  </p>
                  <div className="flex items-center bg-secondary border border-border rounded-xl overflow-hidden h-8">
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-8 h-full flex items-center justify-center text-foreground hover:bg-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm" data-icon="remove">
                        remove
                      </span>
                    </button>
                    <div className="w-8 h-full flex items-center justify-center bg-card text-body-md font-bold border-x border-border text-foreground">
                      {item.quantity}
                    </div>
                    <button 
                      type="button"
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-8 h-full flex items-center justify-center text-foreground hover:bg-accent/40 transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm" data-icon="add">
                        add
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cart Summary, Payment Method & Action */}
      <div className="p-6 border-t border-border bg-card flex flex-col gap-4 shrink-0">
        
        {/* Payment Method Section */}
        {cart.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Payment Method
            </span>
            <div className="grid grid-cols-4 gap-2">
              {paymentMethods.map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex flex-col items-center justify-center py-2 rounded-xl border text-[10px] font-bold tracking-wide uppercase transition-all hover:-translate-y-0.5 duration-150 ${
                      isSelected
                        ? 'bg-accent border-primary text-accent-foreground shadow-sm scale-[0.98]'
                        : 'border-border hover:bg-accent/20 text-muted-foreground'
                    }`}
                  >
                    <span className="material-symbols-outlined text-lg mb-1" data-icon={method.icon}>
                      {method.icon}
                    </span>
                    {method.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Breakdown pricing */}
        <div className="flex flex-col gap-2 mt-2">
          <div className="flex justify-between items-center text-body-md text-muted-foreground">
            <span>Subtotal</span>
            <span>{formatPrice(cartSubtotal)}</span>
          </div>
          <div className="flex justify-between items-center text-body-md text-muted-foreground">
            <span>Tax (10%)</span>
            <span>{formatPrice(taxTotal)}</span>
          </div>
          <div className="w-full h-px bg-border my-1"></div>
          <div className="flex justify-between items-center text-headline-md font-bold text-foreground">
            <span>Total</span>
            <span>{formatPrice(grandTotal)}</span>
          </div>
        </div>

        {/* Action Checkout Button */}
        <button 
          type="button"
          onClick={handleCheckoutSubmit}
          disabled={cart.length === 0 || isCheckoutProcessing}
          className="w-full py-4 rounded-2xl bg-primary hover:bg-primary/95 text-primary-foreground font-bold text-body-lg flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 duration-200"
        >
          <span className="material-symbols-outlined" data-icon="payments">
            {isCheckoutProcessing ? 'sync' : 'payments'}
          </span>
          {isCheckoutProcessing ? 'Processing...' : 'Process Payment'}
        </button>
      </div>
    </aside>
  );
};

export default CartSidebar;
