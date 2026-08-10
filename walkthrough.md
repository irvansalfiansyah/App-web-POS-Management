# Emerald POS & Inventory - Full Stack Walkthrough

The "Emerald POS & Inventory" system has been fully implemented with a premium visual theme, robust database-backed logic, role-based access control (RBAC), and persistent user preferences.

---

## 🛠️ Complete Feature Walkthrough

### 1. Centralized Navigation Sidebar (`Sidebar.jsx`)
- Implements a modern **Material Design 3 (M3)** sidebar layout.
- **Role-Based Access Control (RBAC)**: Automatically renders lock badges for admin-only pages (`Dashboard`, `Inventory`, `Transactions`) when logged in as a Cashier, preventing unauthorized clicks and enforcing state validation.
- **Active Shift Indicator**: Displays user profiles with avatars, names, and active roles.
- **Persistent Dark/Light Mode**: Uses a toggle switch that updates Tailwind’s `dark` class on the root HTML document and persists user preferences in `localStorage` across page reloads.

### 2. Live Analytics Dashboard (`DashboardPage.jsx`)
- Computes real-time KPI metrics from database invoices:
  - **Total Revenue**: Sum of non-refunded grand totals.
  - **Transaction Volume**: Total checkout invoice count.
  - **Average Basket**: Average order value per checkout.
  - **Low Stock Count**: Number of catalog items below their warning threshold.
- **SVG Sales Trend Chart**: Draws a dynamic sales area chart over the last 7 calendar days, dynamically scaled and populated from database sales order datetimes.
- **Low Stock Warning Drawer**: Shows alert pills warning admins of items needing replenishment.

### 3. Inventory Control Catalog (`InventoryPage.jsx`)
- Lists products with thumbnail badges, SKU codes, categories, markup margins, and stock bars.
- **Visual Stock Bars**: Colored indicator bars based on stock levels:
  - Green: Fully stocked.
  - Amber: Low stock (below threshold).
  - Red: Out of stock.
- **Management Tools (Modals)**:
  - **Add Product Form**: Creates new product entries with barcode keys, prices, and initial stock.
  - **Edit Product Form**: Safe edits for prices, SKU metadata, and alert thresholds.
  - **Manual Stock Adjustments (Ledger)**: Supports Audit restocks (adding) and write-offs (subtracting due to damage) that post directly to the backend database ledger (`POST /api/inventory/adjust`).
  - **Delete Action**: Clean soft-deletions of items from the retail catalog.

### 4. POS Cashier Terminal (`PosPage.jsx`)
- Full integration with the unified sidebar.
- Features search fields, category selectors, stock-aware checkouts (preventing overselling), tax computations (10%), and a payment checkout receipt printer modal.
- **Refined Product Grid UI**:
  - **No Red Accent Borders**: Left-edge colored warning accent borders on cards have been removed for a clean, minimalist layout.
  - **Compact Stock Numbers**: Stock quantity is displayed as a clean, numeric-only badge next to the price (e.g., green container for $\ge 10$, red container for $< 10$, grey container for out of stock), resolving any text overlap or layout collisions.
  - **Comprehensive Dark Mode Support**: The product grid cards, search input box, category filters, and receipt modals dynamically transition colors and contrast for optimal readability in dark mode.

### 5. Sales Transactions & Customer Refunds (`TransactionsPage.jsx`)
- Logs all completed and refunded sales order invoices.
- Allows admins to click **"View Details"** to inspect a detailed itemized receipt.
- **Issue Refund Button**: Triggers `POST /api/sales/:id/refund` at the backend, which:
  - Switches the order status to `refunded`.
  - Reverts stock quantities for all purchased items back into the inventory warehouse.
  - Adds an audit trail log in the stock movements history database.

### 6. System Configurations & Health Check (`SettingsPage.jsx`)
- Displays account details, default currency configurations, VAT parameters, and active server status checkers (React frontend port, Express backend server, and PostgreSQL database).

---

## 🚀 How to Run the Application

Follow these steps to spin up the database seed, backend server, and frontend development client.

### Step 1: Pre-requisites & Setup
Ensure you have Node.js and a PostgreSQL instance running. Update the backend `.env` variables (e.g. `DB_PASSWORD`, `PORT=5050`) if needed.

### Step 2: Seed the Database
Populate the database tables with premium products and past transactions data.
```bash
# Navigate to the backend directory and run the seeder
cd backend
node src/database/seed.js
```

### Step 3: Run the Backend Server
Run the Express backend API on port `5050` (or the port defined in your env).
```bash
# From the backend directory
npm run dev   # Runs: node src/server.js
```

### Step 4: Run the Frontend Client
Open a second terminal window to start the Vite hot-reloading dev server.
```bash
# Navigate to the frontend directory and start the Vite dev server
cd frontend
npm run dev   # Launches dev server at http://localhost:5173/
```

### Step 5: Log in to the System
Open your browser and navigate to `http://localhost:5173`.
- **Admin Access**:
  - Email: `admin@store.com`
  - Password: `admin123`
- **Cashier Access**:
  - Email: `cashier1@store.com`
  - Password: `cashier123`

---

## 🛠️ Modernization Category CRUD & DB Constraint Bug Fixes
- **Interactive Category Management Modal**: Replaced the simple text entry with a comprehensive category manager list featuring inline edit (rename) and delete (remove) operations, sync'd live to the database.
- **Improved PostgreSQL Unique Constraint Handler**: Catches database error code `23505` and maps it to user-friendly messages identifying exactly which field caused the issue (e.g., "Product with this SKU already exists" or "Product with this Barcode already exists").
- **Fixed Stock Quantity Not Null Constraint**: Mapped snake-case database fields (e.g., `stock_quantity`, `cost_price`) to camelCase in `updateProduct` in `product.service.js` to ensure they are merged correctly and never sent as `undefined` to the repository update query.

