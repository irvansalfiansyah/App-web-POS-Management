const productService = require('./product.service');
const asyncHandler = require('../../utils/asyncHandler');

class ProductController {
  getAllProducts = asyncHandler(async (req, res) => {
    const products = await productService.getActiveProducts();
    res.status(200).json({ error: false, products });
  });

  getProductById = asyncHandler(async (req, res) => {
    const product = await productService.getProductById(req.params.id);
    res.status(200).json({ error: false, product });
  });

  getProductByBarcode = asyncHandler(async (req, res) => {
    const product = await productService.getProductByBarcode(req.params.code);
    res.status(200).json({ error: false, product });
  });

  createProduct = asyncHandler(async (req, res) => {
    const product = await productService.createProduct(req.body);
    res.status(201).json({ error: false, product });
  });

  updateProduct = asyncHandler(async (req, res) => {
    const product = await productService.updateProduct(req.params.id, req.body);
    res.status(200).json({ error: false, product });
  });

  deleteProduct = asyncHandler(async (req, res) => {
    await productService.deleteProduct(req.params.id);
    res.status(200).json({ error: false, message: 'Product deleted successfully' });
  });

  getAllCategories = asyncHandler(async (req, res) => {
    const categories = await productService.getCategories();
    res.status(200).json({ error: false, categories });
  });

  createCategory = asyncHandler(async (req, res) => {
    const category = await productService.createCategory(req.body.name);
    res.status(201).json({ error: false, category });
  });

  updateCategory = asyncHandler(async (req, res) => {
    const category = await productService.updateCategory(req.params.id, req.body.name);
    res.status(200).json({ error: false, category });
  });

  deleteCategory = asyncHandler(async (req, res) => {
    await productService.deleteCategory(req.params.id);
    res.status(200).json({ error: false, message: 'Category deleted successfully' });
  });
}

module.exports = new ProductController();
