import React, { useState, useEffect } from 'react';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import Toast from '../../components/Toast';

const getFullImageUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
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

const InventoryPage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [toast, setToast] = useState({ message: '', type: 'info' });

  // Modal states
  const [isAddEditOpen, setIsAddEditOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null); // null means adding
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [adjustingProduct, setAdjustingProduct] = useState(null);

  // New delete confirm states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);

  // Form states
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categoryName, setCategoryName] = useState(''); // New custom category state
  const [costPrice, setCostPrice] = useState('');
  const [sellPrice, setSellPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');

  // Image Upload states
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Category states
  const [categoriesList, setCategoriesList] = useState([]);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState(null);

  // Adjustment states
  const [adjustType, setAdjustType] = useState('restock');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustNotes, setAdjustNotes] = useState('');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories/list');
      if (response.data && response.data.categories) {
        setCategoriesList(response.data.categories);
      }
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  };

  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      const response = await api.get('/products');
      if (response.data && response.data.products) {
        setProducts(response.data.products);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to load product catalog', 'error');
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

  // Categories filter derived from categories state
  const categoriesFilter = ['All', ...categoriesList.map(cat => cat.name)];

  // Form opens
  const openAddModal = () => {
    setEditingProduct(null);
    setSku('');
    setBarcode('');
    setName('');
    setCategoryId('');
    setCategoryName('');
    setImageUrl('');
    setIsUploading(false);
    setCostPrice('');
    setSellPrice('');
    setStockQuantity('');
    setLowStockThreshold('5');
    setIsAddEditOpen(true);
  };

  const openEditModal = (product) => {
    setEditingProduct(product);
    setSku(product.sku);
    setBarcode(product.barcode || '');
    setName(product.name);
    setCategoryId(product.category_id || '');
    setCategoryName(product.category_name || '');
    setImageUrl(product.image_url || '');
    setIsUploading(false);
    setCostPrice(product.cost_price.toString());
    setSellPrice(product.sell_price.toString());
    setStockQuantity(''); // Not editable directly
    setLowStockThreshold(product.low_stock_threshold.toString());
    setIsAddEditOpen(true);
  };

  const openAdjustModal = (product) => {
    setAdjustingProduct(product);
    setAdjustType('restock');
    setAdjustQty('');
    setAdjustNotes('');
    setIsAdjustOpen(true);
  };

  // Handlers
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Image size exceeds the 5MB limit', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('image', file);

    setIsUploading(true);
    try {
      const response = await api.post('/products/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      if (response.data && response.data.imageUrl) {
        setImageUrl(response.data.imageUrl);
        showToast('Image uploaded successfully', 'success');
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to upload image.';
      showToast(errMsg, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!sku || !name || !costPrice || !sellPrice) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    const payload = {
      sku,
      barcode: barcode || null,
      name,
      categoryName: categoryName || null,
      costPrice: parseFloat(costPrice),
      sellPrice: parseFloat(sellPrice),
      lowStockThreshold: parseInt(lowStockThreshold || '5'),
      imageUrl: imageUrl || null
    };

    try {
      if (editingProduct) {
        // Edit product
        await api.put(`/products/${editingProduct.id}`, payload);
        showToast(`Product "${name}" successfully updated!`, 'success');
      } else {
        // Add product
        const addPayload = {
          ...payload,
          stockQuantity: parseInt(stockQuantity || '0')
        };
        await api.post('/products', addPayload);
        showToast(`Product "${name}" successfully created!`, 'success');
      }
      setIsAddEditOpen(false);
      fetchProducts();
      fetchCategories();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to save product details.';
      showToast(errMsg, 'error');
    }
  };

  const handleAdjustStock = async (e) => {
    e.preventDefault();
    if (!adjustQty || parseInt(adjustQty) <= 0) {
      showToast('Adjustment quantity must be greater than 0', 'error');
      return;
    }

    const qtyVal = parseInt(adjustQty);
    // If write-off, pass negative value, else positive
    const adjustedQuantity = adjustType === 'write-off' ? -qtyVal : qtyVal;

    try {
      await api.post('/inventory/adjust', {
        productId: adjustingProduct.id,
        quantityChange: adjustedQuantity,
        movementType: adjustType,
        note: adjustNotes || `${adjustType === 'restock' ? 'Restocked' : 'Written off'} via inventory UI`
      });

      showToast(`Stock level adjusted for "${adjustingProduct.name}"`, 'success');
      setIsAdjustOpen(false);
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Stock adjustment failed.';
      showToast(errMsg, 'error');
    }
  };

  const initiateDelete = (product) => {
    setProductToDelete(product);
    setIsDeleteConfirmOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      showToast(`Product "${productToDelete.name}" successfully deleted`, 'success');
      fetchProducts();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete product', 'error');
    } finally {
      setIsDeleteConfirmOpen(false);
      setProductToDelete(null);
    }
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Please enter a category name', 'error');
      return;
    }
    const trimmedName = newCategoryName.trim();
    try {
      if (editingCategory) {
        // Edit/Update mode
        const response = await api.put(`/products/categories/${editingCategory.id}`, { name: trimmedName });
        if (response.data && !response.data.error) {
          showToast(`Category updated to "${trimmedName}"`, 'success');
          setNewCategoryName('');
          setEditingCategory(null);
          await fetchCategories();
          fetchProducts();
        }
      } else {
        // Create mode
        const response = await api.post('/products/categories', { name: trimmedName });
        if (response.data && !response.data.error) {
          showToast(`Category "${trimmedName}" created successfully!`, 'success');
          setNewCategoryName('');
          await fetchCategories();
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to save category';
      showToast(errMsg, 'error');
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete the category "${category.name}"? Products under this category will be uncategorized.`)) {
      return;
    }
    try {
      await api.delete(`/products/categories/${category.id}`);
      showToast(`Category "${category.name}" deleted successfully`, 'success');
      if (editingCategory && editingCategory.id === category.id) {
        setEditingCategory(null);
        setNewCategoryName('');
      }
      await fetchCategories();
      fetchProducts();
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.message || 'Failed to delete category';
      showToast(errMsg, 'error');
    }
  };

  // Filtering
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
    <div className="bg-background font-sans text-foreground min-h-screen flex w-full transition-all duration-200">
      
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Catalog Workspace */}
      <main className="ml-[260px] flex-1 p-8 overflow-y-auto">
        <header className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-headline-md font-extrabold text-foreground mb-1">
              Inventory Catalog
            </h1>
            <p className="text-body-md text-muted-foreground">
              Manage product listings, SKU codes, prices, and adjust real-time stock levels
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setNewCategoryName('');
                setIsCategoryModalOpen(true);
              }}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-secondary text-foreground hover:opacity-95 hover:-translate-y-0.5 transition-all rounded-2xl font-bold shadow-sm border border-border duration-200"
            >
              <span className="material-symbols-outlined text-md">category</span>
              Add Category
            </button>
            <button
              onClick={openAddModal}
              className="flex items-center justify-center gap-2 px-5 py-3 bg-primary text-primary-foreground hover:opacity-95 hover:-translate-y-0.5 transition-all rounded-2xl font-bold shadow-md duration-200"
            >
              <span className="material-symbols-outlined text-md">add</span>
              Add Product
            </button>
          </div>
        </header>

        {/* Search and Category bar */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-6 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-80">
            <span className="material-symbols-outlined absolute left-3 top-2.5 text-muted-foreground text-lg">search</span>
            <input
              type="text"
              placeholder="Search by SKU, name, or barcode..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
            />
          </div>

          <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {categoriesFilter.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all hover:-translate-y-0.5 duration-200 ${
                  selectedCategory === category
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-secondary border border-border text-foreground hover:bg-accent/40 hover:text-accent-foreground'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Product Catalog Grid/Table */}
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <span className="material-symbols-outlined text-4xl animate-spin">progress_activity</span>
              <p className="text-body-md mt-2">Loading catalog items...</p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <span className="material-symbols-outlined text-5xl mb-2">box</span>
              <p className="text-body-lg font-semibold">No products found</p>
              <p className="text-body-md">Create a new product to list it in the inventory database.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-secondary/40 border-b border-border text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    <th className="px-6 py-4">Image & Product Details</th>
                    <th className="px-6 py-4">SKU / Barcode</th>
                    <th className="px-6 py-4 text-right">Cost Price</th>
                    <th className="px-6 py-4 text-right">Sell Price</th>
                    <th className="px-6 py-4 text-right">Markup %</th>
                    <th className="px-6 py-4 text-center">Stock Level</th>
                    <th className="px-6 py-4 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-body-md">
                  {filteredProducts.map((product) => {
                    const isLowStock = product.stock_quantity <= product.low_stock_threshold && product.stock_quantity > 0;
                    const isOutOfStock = product.stock_quantity <= 0;
                    
                    const costVal = parseFloat(product.cost_price);
                    const sellVal = parseFloat(product.sell_price);
                    const markup = costVal > 0 ? ((sellVal - costVal) / costVal) * 100 : 0;

                    return (
                      <tr 
                        key={product.id} 
                        className="hover:bg-accent/25 transition-colors"
                      >
                        {/* Image & Details */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                             <div className="w-12 h-12 rounded-xl bg-secondary border border-border flex items-center justify-center text-muted-foreground shrink-0 overflow-hidden">
                              {product.image_url ? (
                                <img src={getFullImageUrl(product.image_url)} alt={product.name} className="w-full h-full object-cover" />
                              ) : (
                                <span className="material-symbols-outlined text-2xl">
                                  {getCategoryIcon(product.category_name)}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-foreground leading-snug">{product.name}</p>
                              <span className="inline-block text-[9px] uppercase font-extrabold tracking-wider text-muted-foreground px-2 py-0.5 rounded-full bg-secondary border border-border mt-0.5">
                                {product.category_name}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* SKU */}
                        <td className="px-6 py-4">
                          <p className="font-mono font-bold text-primary">{product.sku}</p>
                          <p className="text-[11px] text-muted-foreground font-medium mt-0.5">
                            Barcode: {product.barcode || 'N/A'}
                          </p>
                        </td>

                        {/* Cost Price */}
                        <td className="px-6 py-4 text-right font-medium text-muted-foreground">
                          {formatPrice(costVal)}
                        </td>

                        {/* Sell Price */}
                        <td className="px-6 py-4 text-right font-bold text-foreground">
                          {formatPrice(sellVal)}
                        </td>

                        {/* Markup */}
                        <td className="px-6 py-4 text-right font-medium text-success">
                          {markup.toFixed(0)}%
                        </td>

                        {/* Stock Level Bar */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col items-center gap-1.5 w-32 mx-auto">
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden border border-border">
                              <div 
                                className={`h-full rounded-full ${
                                  isOutOfStock 
                                    ? 'bg-destructive' 
                                    : isLowStock 
                                    ? 'bg-amber-500' 
                                    : 'bg-success'
                                }`}
                                style={{ width: `${Math.min(100, (product.stock_quantity / (product.low_stock_threshold * 3)) * 100)}%` }}
                              ></div>
                            </div>
                            <span className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full inline-block ${
                              isOutOfStock
                                ? 'bg-destructive/15 text-destructive border border-destructive/20 font-black'
                                : isLowStock
                                ? 'bg-amber-500/15 text-amber-600 border border-amber-500/20'
                                : 'bg-success/15 text-success border border-success/20'
                            }`}>
                              {product.stock_quantity} units {isOutOfStock ? '(Out)' : isLowStock ? '(Low)' : ''}
                            </span>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => openAdjustModal(product)}
                              className="p-2 rounded-xl hover:bg-accent/40 text-primary transition-colors flex items-center justify-center"
                              title="Adjust Stock"
                            >
                              <span className="material-symbols-outlined text-lg">tune</span>
                            </button>
                            <button
                              onClick={() => openEditModal(product)}
                              className="p-2 rounded-xl hover:bg-accent/40 text-foreground transition-colors flex items-center justify-center"
                              title="Edit Details"
                            >
                              <span className="material-symbols-outlined text-lg">edit</span>
                            </button>
                            <button
                              onClick={() => initiateDelete(product)}
                              className="p-2 rounded-xl hover:bg-destructive/10 text-destructive transition-colors flex items-center justify-center"
                              title="Delete Product"
                            >
                              <span className="material-symbols-outlined text-lg">delete</span>
                            </button>
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

      {/* Add / Edit Product Modal */}
      {isAddEditOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative max-h-[90vh] flex flex-col">
            <button
              onClick={() => setIsAddEditOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-foreground rounded-xl z-10 hover:bg-accent/40 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="text-lg font-bold mb-4 flex items-center gap-2 border-b border-border pb-2 shrink-0 text-foreground">
              <span className="material-symbols-outlined text-primary">
                {editingProduct ? 'edit_note' : 'add_box'}
              </span>
              {editingProduct ? 'Edit Product Details' : 'Create New Product'}
            </h3>

            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 py-1">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">SKU Code *</label>
                    <input
                      type="text"
                      required
                      value={sku}
                      onChange={(e) => setSku(e.target.value)}
                      placeholder="e.g. SKU-009"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Barcode</label>
                    <input
                      type="text"
                      value={barcode}
                      onChange={(e) => setBarcode(e.target.value)}
                      placeholder="Barcode string"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {/* Product Photo Cover Upload */}
                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Product Cover Image</label>
                  <div className="flex items-center gap-4">
                    {imageUrl ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden border border-border relative group shrink-0 bg-secondary">
                        <img
                          src={getFullImageUrl(imageUrl)}
                          alt="Uploaded cover"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => setImageUrl('')}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity duration-200"
                          title="Remove image"
                        >
                          <span className="material-symbols-outlined text-lg">delete</span>
                        </button>
                      </div>
                    ) : (
                      <label className="w-20 h-20 rounded-xl border border-dashed border-border hover:border-primary flex flex-col items-center justify-center cursor-pointer text-muted-foreground bg-secondary hover:bg-accent/20 transition-all shrink-0 duration-200">
                        {isUploading ? (
                          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-xl">add_a_photo</span>
                            <span className="text-[10px] mt-1 font-bold">Upload</span>
                          </>
                        )}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          disabled={isUploading}
                          onChange={handleImageUpload}
                        />
                      </label>
                    )}
                    <div className="text-xs text-muted-foreground">
                      {imageUrl ? (
                        <span className="text-success flex items-center gap-1 font-semibold">
                          <span className="material-symbols-outlined text-sm">check_circle</span> Cover Uploaded
                        </span>
                      ) : (
                        <span>JPEG, PNG, WEBP (Max 5MB)</span>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Product Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Premium Cotton T-Shirt"
                    className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Category *</label>
                    <input
                      type="text"
                      required
                      list="categories-datalist"
                      value={categoryName}
                      onChange={(e) => setCategoryName(e.target.value)}
                      placeholder="Enter or select category"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                    <datalist id="categories-datalist">
                      {categoriesList.map(cat => (
                        <option key={cat.id} value={cat.name} />
                      ))}
                      {categoriesList.length === 0 && (
                        <>
                          <option value="Food" />
                          <option value="Beverages" />
                          <option value="Apparel" />
                          <option value="Electronics" />
                          <option value="Home" />
                        </>
                      )}
                    </datalist>
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Low-Stock Alert *</label>
                    <input
                      type="number"
                      required
                      value={lowStockThreshold}
                      onChange={(e) => setLowStockThreshold(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Cost Price (Rp) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={costPrice}
                      onChange={(e) => setCostPrice(e.target.value)}
                      placeholder="5000"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Sell Price (Rp) *</label>
                    <input
                      type="number"
                      step="1"
                      required
                      value={sellPrice}
                      onChange={(e) => setSellPrice(e.target.value)}
                      placeholder="10000"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                </div>

                {!editingProduct && (
                  <div>
                    <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Initial Stock Level</label>
                    <input
                      type="number"
                      value={stockQuantity}
                      onChange={(e) => setStockQuantity(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                    />
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-border flex gap-3 shrink-0 mt-4">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Save Product
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddEditOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-secondary border border-border text-foreground hover:bg-accent/40 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Stock Ledger Modal */}
      {isAdjustOpen && adjustingProduct && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <button
              onClick={() => setIsAdjustOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/40 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 border-b border-border pb-2 text-foreground">
              <span className="material-symbols-outlined text-primary">tune</span>
              Adjust Stock Level
            </h3>
            <p className="text-xs text-muted-foreground mb-4">
              Manage stock quantity for: <strong className="text-foreground">{adjustingProduct.name}</strong>
              <br />Current stock level: <strong className="text-primary">{adjustingProduct.stock_quantity} units</strong>
            </p>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Adjustment Action *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="restock">Restock (Add Stock +)</option>
                  <option value="write-off">Write-off (Subtract Stock -)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Quantity *</label>
                <input
                  type="number"
                  required
                  min="1"
                  value={adjustQty}
                  onChange={(e) => setAdjustQty(e.target.value)}
                  placeholder="e.g. 10"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">Notes / Rationale</label>
                <textarea
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  placeholder="Reason for stock adjustments (e.g. monthly inventory refill)"
                  className="w-full px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary h-20 placeholder:text-muted-foreground"
                />
              </div>

              <div className="pt-4 border-t border-border flex gap-3">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Adjust Stock
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdjustOpen(false)}
                  className="flex-1 py-3 rounded-2xl bg-secondary border border-border text-foreground hover:bg-accent/40 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteConfirmOpen && productToDelete && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-sm shadow-2xl relative">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 bg-destructive/15 rounded-full flex items-center justify-center text-destructive mb-4">
                <span className="material-symbols-outlined text-3xl">warning</span>
              </div>
              <h3 className="text-lg font-bold mb-2 text-foreground">Delete Product?</h3>
              <p className="text-xs text-muted-foreground mb-6">
                Are you sure you want to delete <strong className="text-foreground">"{productToDelete.name}"</strong>? This will soft-delete the product from the catalog.
              </p>
              
              <div className="w-full flex gap-3">
                <button
                  onClick={confirmDeleteProduct}
                  className="flex-1 py-3 rounded-2xl bg-destructive text-destructive-foreground hover:opacity-95 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Yes, Delete
                </button>
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setProductToDelete(null);
                  }}
                  className="flex-1 py-3 rounded-2xl bg-secondary border border-border text-foreground hover:bg-accent/40 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Add/Manage Category Modal */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-card border border-border rounded-2xl p-6 w-full max-w-md shadow-2xl relative animate-scale-up">
            <button
              onClick={() => {
                setIsCategoryModalOpen(false);
                setEditingCategory(null);
                setNewCategoryName('');
              }}
              className="absolute right-4 top-4 p-1.5 text-muted-foreground hover:text-foreground rounded-xl hover:bg-accent/40 transition-colors"
            >
              <span className="material-symbols-outlined text-xl">close</span>
            </button>

            <h3 className="text-lg font-bold mb-2 flex items-center gap-2 border-b border-border pb-2 text-foreground">
              <span className="material-symbols-outlined text-primary">category</span>
              {editingCategory ? 'Edit Category' : 'Manage Categories'}
            </h3>
            
            {/* Input Form */}
            <form onSubmit={handleSaveCategory} className="space-y-4 mb-6">
              <div>
                <label className="block text-xs font-bold mb-1 text-muted-foreground uppercase tracking-wide">
                  {editingCategory ? 'Rename Category *' : 'Category Name *'}
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    placeholder="e.g. Beverages, Snacks, Dessert"
                    className="flex-1 px-3 py-2 rounded-xl bg-secondary border border-border text-body-md text-foreground focus:outline-none focus:border-primary placeholder:text-muted-foreground"
                  />
                  {editingCategory && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCategory(null);
                        setNewCategoryName('');
                      }}
                      className="px-3 py-2 rounded-xl bg-secondary border border-border text-foreground hover:bg-accent/40 font-bold transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-2xl bg-primary text-primary-foreground hover:opacity-95 font-bold transition-all hover:-translate-y-0.5 duration-200 text-body-md shadow-md"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>

            {/* List of Existing Categories */}
            <div className="border-t border-border pt-4">
              <h4 className="text-xs font-bold text-muted-foreground mb-3 flex items-center justify-between uppercase tracking-wide">
                <span>Existing Categories</span>
                <span className="px-2.5 py-0.5 text-[10px] rounded-full bg-secondary border border-border text-muted-foreground font-extrabold">
                  {categoriesList.length} total
                </span>
              </h4>

              <div className="max-h-48 overflow-y-auto pr-1 space-y-2">
                {categoriesList.length === 0 ? (
                  <p className="text-xs text-muted-foreground py-4 text-center">
                    No categories created yet.
                  </p>
                ) : (
                  categoriesList.map((cat) => (
                    <div
                      key={cat.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-secondary border border-border hover:bg-accent/20 transition-all duration-200"
                    >
                      <span className="text-body-md font-bold text-foreground">
                        {cat.name}
                      </span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setNewCategoryName(cat.name);
                          }}
                          title="Rename Category"
                          className="p-1.5 hover:bg-accent/40 text-primary rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCategory(cat)}
                          title="Delete Category"
                          className="p-1.5 hover:bg-destructive/10 text-destructive rounded-lg transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">delete</span>
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert Feedbacks */}
      <Toast
        message={toast.message}
        type={toast.type}
        onClose={() => setToast({ message: '', type: 'info' })}
      />

    </div>
  );
};

export default InventoryPage;
