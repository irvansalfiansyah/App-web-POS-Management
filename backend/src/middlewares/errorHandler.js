const ApiError = require('../utils/ApiError');

const errorHandler = (err, req, res, next) => {
  let { statusCode, message } = err;

  if (err.code === '23514') { // Check constraint (e.g. stock_quantity >= 0)
    statusCode = 409;
    message = 'Database constraint violation: Insufficient stock or invalid data';
  } else if (err.code === '23505') { // Unique constraint
    statusCode = 409;
    if (err.detail && err.detail.includes('sku')) {
      message = 'Product with this SKU already exists';
    } else if (err.detail && err.detail.includes('barcode')) {
      message = 'Product with this Barcode already exists';
    } else if (err.detail && err.detail.includes('name') && err.table === 'categories') {
      message = 'Category name already exists';
    } else {
      message = 'Database constraint violation: Duplicate key entry';
    }
  }

  if (!statusCode) {
    statusCode = 500;
  }

  const response = {
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  };

  if (process.env.NODE_ENV === 'development') {
    console.error(err);
  }

  res.status(statusCode).send(response);
};

module.exports = errorHandler;
