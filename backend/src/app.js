const express = require('express');
const cors = require('cors');
const path = require('path');
const authRoutes = require('./modules/auth/auth.routes');
const userRoutes = require('./modules/users/user.routes');
const productRoutes = require('./modules/products/product.routes');
const salesRoutes = require('./modules/sales/sales.routes');
const inventoryRoutes = require('./modules/inventory/inventory.routes');
const errorHandler = require('./middlewares/errorHandler');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded product images statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/inventory', inventoryRoutes);

app.use((req, res, next) => {
  next(new ApiError(404, 'Endpoint not found'));
});

app.use(errorHandler);

module.exports = app;
