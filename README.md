# Emerald POS & Inventory - Full Stack RetailOS

A modern, high-performance, and feature-rich **Point of Sale (POS) & Inventory Management System** built with **Node.js (Express)**, **React 19 (Vite + Tailwind CSS)**, and **PostgreSQL**. Designed with a premium dark/light mode user experience, strict database transaction integrity, and role-based access control (RBAC).

---

## 🚀 Key Features

### 1. Centralized Navigation Sidebar
- **Dynamic Access Control (RBAC)**: Automatically locks and badges admin-only routes when logged in as a Cashier.
- **Active Shift Indicator**: Displays current user session information (avatar, name, role).
- **Persistent Theme Switcher**: Instantly toggles between light and dark mode, persisting user preference to `localStorage`.

### 2. Analytics Dashboard
- **Key Performance Indicators (KPIs)**: Instantly tracks Total Revenue, Transaction Volume, Average Basket Value, and Low Stock Alerts.
- **Interactive Sales Graph**: Rendered via a custom-designed, lightweight SVG chart mapping the last 7 days of sales.
- **Real-time Alert Drawers**: Displays immediate warning badges for products falling below their stock threshold.

### 3. Cashier Terminal (POS)
- **Fast Cart Checkout**: Drag-and-drop or tap-to-add product selection, barcode support, and robust search filters.
- **Real-Time Stock Checks**: Concurrency-aware validation prevents overselling items even under high load.
- **Interactive Invoice Printer**: Generates a standard receipt preview detailing VAT (10%), subtotals, and cashier session data.

### 4. Inventory Catalog Control
- **Dynamic Stock Level Indicators**: Colored progress bars tracking stock levels (Green: fully stocked, Amber: warning, Red: out of stock).
- **Stock Movement Ledger**: Logs every manual adjustment, restock, or sale to maintain a clear audit trail.
- **Full Catalog CRUD**: Features clean modal forms for adding, updating, and removing products with unique SKU/Barcode validations.

### 5. Transactions History & Refunds
- Logs detailed records of past sales orders.
- Allows admins to issue **full refunds** with a single click, automatically rolling back item stocks in the database and logging the audit ledger entry.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19 · Vite · Tailwind CSS · React Router DOM |
| **Backend** | Node.js · Express · PostgreSQL (`pg` pool client) |
| **Icons & Fonts** | Material Symbols · Google Fonts (Geist/Outfit) |
| **API Testing** | Axios · REST Client |

---

## 📂 Project Structure

```
├── backend/
│   ├── src/
│   │   ├── controllers/      # Route request handlers
│   │   ├── database/         # Schema migrations, pool setup, and seeds
│   │   ├── middleware/       # Authentication, logging, and RBAC guards
│   │   ├── routes/           # Express API endpoints
│   │   ├── services/         # Database queries & business logic transactions
│   │   └── server.js         # Entrypoint
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/       # Reusable layout UI components
    │   ├── context/          # Auth context state providers
    │   ├── features/         # Page-specific feature modules (pos, inventory, auth)
    │   ├── services/         # Axios API clients
    │   └── App.jsx           # Router setup
```

---

## ⚙️ Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [PostgreSQL](https://www.postgresql.org/) (v14+)

### Step 1: Clone & Configure
1. Create a PostgreSQL database named `emerald_pos`.
2. Configure `.env` in the `backend/` directory:
   ```env
   PORT=5050
   DATABASE_URL=postgres://<username>:<password>@localhost:5432/emerald_pos
   JWT_SECRET=your_jwt_secret_here
   ```

### Step 2: Seed the Database
Navigate to the `backend` folder and run the seed script to populate products, categories, and sample transactions:
```bash
cd backend
npm install
node src/database/seed.js
```

### Step 3: Run the Services

**Start the Backend Server (Port 5050):**
```bash
cd backend
npm run dev
```

**Start the Frontend Client (Port 5173):**
```bash
cd frontend
npm install
npm run dev
```

### Step 4: Login Credentials

Use the following pre-seeded credentials to log in:

- **Manager / Admin Account:**
  - Email: `admin@store.com`
  - Password: `admin123`
- **Cashier Account:**
  - Email: `cashier1@store.com`
  - Password: `cashier123`

---

## 🔒 Transactional Integrity (Anti-Overselling)

The application uses PostgreSQL's transactional isolation to prevent concurrency issues during peak sale hours:
```sql
-- Used during cashier checkout to lock stock level checks
SELECT id, stock_quantity 
FROM products 
WHERE id = $1 
FOR UPDATE;
```
This guarantees that two cashiers checking out the last remaining item simultaneously will be queued sequentially, with the second receiving a clean "Out of Stock" notification instead of causing a negative inventory balance.

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
