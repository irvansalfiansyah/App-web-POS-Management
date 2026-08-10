import React from 'react';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5050/api';
  const serverRoot = apiBase.replace(/\/api$/, '');
  return `${serverRoot}${path}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0
  }).format(price);
};

const getCategoryIcon = (categoryName) => {
  if (!categoryName) return 'inventory_2';
  const name = categoryName.toLowerCase();
  if (name.includes('beverage') || name.includes('drink') || name.includes('coffee') || name.includes('tea')) {
    return 'local_drink';
  }
  if (name.includes('snack') || name.includes('food') || name.includes('burrito')) {
    return 'restaurant';
  }
  if (name.includes('grocery') || name.includes('groceries') || name.includes('rice')) {
    return 'shopping_basket';
  }
  if (name.includes('apparel') || name.includes('shirt') || name.includes('jacket') || name.includes('scarf')) {
    return 'checkroom';
  }
  return 'inventory_2';
};

const ProductGrid = ({ products, onAddToCart, selectedCategory, setSelectedCategory, searchQuery }) => {
  // Extract unique categories dynamically from products
  const categories = ['All', ...new Set(products.map((p) => p.category_name).filter(Boolean))];

  // Filter products based on search and category
  const filteredProducts = products.filter((product) => {
    const matchesCategory = selectedCategory === 'All' || product.category_name === selectedCategory;
    const matchesSearch = 
      !searchQuery ||
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode && product.barcode.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Categories Bar */}
      <div className="mb-6 overflow-x-auto pb-2 scrollbar-hide shrink-0">
        <div className="flex gap-3">
          {categories.map((category) => {
            const isActive = selectedCategory === category;
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:-translate-y-0.5 duration-200 ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-card border border-border text-foreground hover:bg-accent/40 hover:text-accent-foreground'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid Container */}
      <div className="flex-1 overflow-y-auto pr-2 pb-6">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <span className="material-symbols-outlined text-5xl mb-2" data-icon="search_off">search_off</span>
            <p className="text-body-lg">No products found matching your criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredProducts.map((product) => {
              const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
              const isOutOfStock = product.stock_quantity <= 0;

              return (
                <button
                  key={product.id}
                  disabled={isOutOfStock}
                  onClick={() => onAddToCart(product)}
                  className={`bg-card rounded-2xl border border-border p-3 flex flex-col gap-3 text-left hover:shadow-lg hover:border-primary hover:-translate-y-0.5 transition-all duration-200 group relative ${
                    isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {/* Image/Icon Container */}
                  <div className="w-full aspect-square rounded-xl bg-secondary overflow-hidden relative flex items-center justify-center text-muted-foreground shrink-0 border border-border">
                    {product.image_url ? (
                      <img
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        src={getFullImageUrl(product.image_url)}
                        alt={product.name}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="material-symbols-outlined text-4xl" data-icon={getCategoryIcon(product.category_name)}>
                        {getCategoryIcon(product.category_name)}
                      </span>
                    )}
                  </div>

                  {/* Info details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <h3 className="text-body-md font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="text-body-lg font-extrabold text-primary">
                        {formatPrice(product.sell_price)}
                      </span>
                      {isOutOfStock ? (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20 shrink-0 uppercase">
                          Out
                        </span>
                      ) : isLowStock ? (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive border border-destructive/20 shrink-0 uppercase animate-pulse">
                          {product.stock_quantity} Left
                        </span>
                      ) : (
                        <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20 shrink-0 uppercase">
                          {product.stock_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductGrid;
