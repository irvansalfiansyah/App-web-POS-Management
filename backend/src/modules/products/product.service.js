const productRepository = require('./product.repository');
const ApiError = require('../../utils/ApiError');
const db = require('../../config/db');

class ProductService {
  async resolveCategoryId(categoryName) {
    if (!categoryName || typeof categoryName !== 'string' || !categoryName.trim()) {
      return null;
    }
    const trimmedName = categoryName.trim();
    
    // Find category case-insensitive
    const findRes = await db.query(
      'SELECT id FROM categories WHERE LOWER(name) = LOWER($1)',
      [trimmedName]
    );
    
    if (findRes.rows.length > 0) {
      return findRes.rows[0].id;
    }
    
    // Insert new category if it doesn't exist
    const insertRes = await db.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING id',
      [trimmedName]
    );
    return insertRes.rows[0].id;
  }

  async getProducts() {
    return productRepository.findAll();
  }

  async getActiveProducts() {
    return productRepository.findAll({ is_active: true });
  }

  async getProductById(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    return product;
  }

  async getProductByBarcode(barcode) {
    const product = await productRepository.findByBarcode(barcode);
    if (!product) {
      throw new ApiError(404, 'Product with this barcode not found');
    }
    return product;
  }

  async createProduct(data) {
    const { categoryName, ...rest } = data;
    if (categoryName) {
      rest.categoryId = await this.resolveCategoryId(categoryName);
    }
    return productRepository.create(rest);
  }

  async updateProduct(id, data) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    const { categoryName, ...rest } = data;
    
    // Map snake_case database object to camelCase
    const camelCasedProduct = {
      sku: product.sku,
      barcode: product.barcode,
      name: product.name,
      categoryId: product.category_id,
      costPrice: product.cost_price ? parseFloat(product.cost_price) : 0,
      sellPrice: product.sell_price ? parseFloat(product.sell_price) : 0,
      stockQuantity: product.stock_quantity,
      lowStockThreshold: product.low_stock_threshold,
      imageUrl: product.image_url,
      isActive: product.is_active
    };

    if (categoryName) {
      rest.categoryId = await this.resolveCategoryId(categoryName);
    } else if (categoryName === null) {
      rest.categoryId = null;
    }
    
    const merged = { ...camelCasedProduct, ...rest };
    return productRepository.update(id, merged);
  }

  async deleteProduct(id) {
    const product = await productRepository.findById(id);
    if (!product) {
      throw new ApiError(404, 'Product not found');
    }
    return productRepository.softDelete(id);
  }

  async getCategories() {
    const res = await db.query('SELECT id, name FROM categories ORDER BY name ASC');
    return res.rows;
  }

  async createCategory(name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Category name is required');
    }
    const trimmed = name.trim();
    const check = await db.query('SELECT id, name FROM categories WHERE LOWER(name) = LOWER($1)', [trimmed]);
    if (check.rows.length > 0) {
      return check.rows[0];
    }
    const res = await db.query('INSERT INTO categories (name) VALUES ($1) RETURNING id, name', [trimmed]);
    return res.rows[0];
  }

  async updateCategory(id, name) {
    if (!name || typeof name !== 'string' || !name.trim()) {
      throw new ApiError(400, 'Category name is required');
    }
    const trimmed = name.trim();
    const checkExist = await db.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (checkExist.rows.length === 0) {
      throw new ApiError(404, 'Category not found');
    }
    const checkDup = await db.query('SELECT id FROM categories WHERE LOWER(name) = LOWER($1) AND id <> $2', [trimmed, id]);
    if (checkDup.rows.length > 0) {
      throw new ApiError(400, 'Category name already exists');
    }
    const res = await db.query('UPDATE categories SET name = $1 WHERE id = $2 RETURNING id, name', [trimmed, id]);
    return res.rows[0];
  }

  async deleteCategory(id) {
    const checkExist = await db.query('SELECT id FROM categories WHERE id = $1', [id]);
    if (checkExist.rows.length === 0) {
      throw new ApiError(404, 'Category not found');
    }
    await db.query('DELETE FROM categories WHERE id = $1', [id]);
    return true;
  }
}

module.exports = new ProductService();
