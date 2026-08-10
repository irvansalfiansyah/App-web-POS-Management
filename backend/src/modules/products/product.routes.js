const express = require('express');
const productController = require('./product.controller');
const authenticate = require('../../middlewares/authenticate');
const authorize = require('../../middlewares/authorize');
const validateRequest = require('../../middlewares/validateRequest');
const { createProductSchema, updateProductSchema, getBarcodeSchema } = require('./product.validation');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);
    if (ext && mime) {
      cb(null, true);
    } else {
      cb(new Error('Only images (jpg, png, gif, webp) are allowed!'));
    }
  }
});

const router = express.Router();

router.get('/', authenticate, productController.getAllProducts);
router.get('/barcode/:code', authenticate, validateRequest(getBarcodeSchema), productController.getProductByBarcode);
router.get('/categories/list', authenticate, productController.getAllCategories);
router.post('/categories', authenticate, authorize('admin'), productController.createCategory);
router.put('/categories/:id', authenticate, authorize('admin'), productController.updateCategory);
router.delete('/categories/:id', authenticate, authorize('admin'), productController.deleteCategory);
router.get('/:id', authenticate, productController.getProductById);

router.post('/', authenticate, authorize('admin'), validateRequest(createProductSchema), productController.createProduct);
router.post('/upload', authenticate, authorize('admin'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: true, message: 'No file uploaded' });
  }
  const imageUrl = `/uploads/${req.file.filename}`;
  res.status(200).json({ error: false, imageUrl });
});
router.put('/:id', authenticate, authorize('admin'), validateRequest(updateProductSchema), productController.updateProduct);
router.delete('/:id', authenticate, authorize('admin'), productController.deleteProduct);

module.exports = router;
