import React, { useEffect, useRef, useState } from 'react';
import api from '../../services/api';

const BarcodeScanner = ({ onProductFound, searchQuery, setSearchQuery, onError }) => {
  const inputRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);

  // Key shortcut to focus input (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleScanSubmit = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    // Check if it looks like a barcode (mainly numbers, length >= 3)
    const isBarcode = /^\d+$/.test(searchQuery.trim());

    if (isBarcode) {
      setIsScanning(true);
      try {
        const response = await api.get(`/products/barcode/${searchQuery.trim()}`);
        if (response.data && response.data.product) {
          onProductFound(response.data.product);
          setSearchQuery(''); // clear input on success
        } else {
          onError('Product not found for this barcode');
        }
      } catch (err) {
        console.error(err);
        const errMsg = err.response?.data?.message || 'Product with this barcode not found';
        onError(errMsg);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleManualScan = () => {
    if (!searchQuery.trim()) {
      onError('Please enter a barcode number first');
      return;
    }
    // Trigger submit handler
    const event = { preventDefault: () => {} };
    handleScanSubmit(event);
  };

  return (
    <div className="flex items-center justify-between mb-6 gap-4">
      <form onSubmit={handleScanSubmit} className="relative flex-1 max-w-2xl group">
        <span 
          className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant dark:text-zinc-400 pointer-events-none group-focus-within:text-primary transition-colors" 
          data-icon="search"
        >
          search
        </span>
        <input 
          ref={inputRef}
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-12 pl-12 pr-16 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-zinc-800 rounded-xl text-body-lg font-body-lg text-on-surface dark:text-white focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary shadow-sm transition-all placeholder:text-on-surface-variant dark:placeholder:text-zinc-400" 
          placeholder="Scan barcode (press Enter) or search product..." 
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 bg-surface-container-low dark:bg-zinc-800 px-2 py-1 rounded text-label-md font-label-md text-on-surface-variant dark:text-zinc-400 border border-outline-variant dark:border-zinc-700 select-none">
          Ctrl K
        </div>
      </form>
      
      <button 
        type="button"
        onClick={handleManualScan}
        disabled={isScanning}
        className="h-12 px-4 bg-surface-container-lowest dark:bg-inverse-surface border border-outline-variant dark:border-zinc-800 rounded-xl flex items-center gap-2 hover:bg-surface-container dark:hover:bg-zinc-800 transition-colors shadow-sm text-on-surface-variant dark:text-zinc-300 group disabled:opacity-50"
      >
        <span className="material-symbols-outlined group-hover:text-primary transition-colors" data-icon="barcode_scanner">
          {isScanning ? 'sync' : 'barcode_scanner'}
        </span>
        <span className="text-body-md font-body-md font-medium">
          {isScanning ? 'Scanning...' : 'Scan'}
        </span>
      </button>
    </div>
  );
};

export default BarcodeScanner;
