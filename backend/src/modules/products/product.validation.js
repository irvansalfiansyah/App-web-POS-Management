const { z } = require('zod');

const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3, 'SKU must be at least 3 characters'),
    barcode: z.string().optional().nullable(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    categoryId: z.number().int().positive().optional().nullable(),
    categoryName: z.string().optional().nullable(),
    costPrice: z.number().nonnegative('Cost price must be non-negative').default(0),
    sellPrice: z.number().nonnegative('Sell price must be non-negative'),
    stockQuantity: z.number().int().nonnegative('Stock must be non-negative').default(0),
    lowStockThreshold: z.number().int().nonnegative('Threshold must be non-negative').default(5),
    imageUrl: z.string().optional().nullable(),
  }),
});

const updateProductSchema = z.object({
  body: z.object({
    sku: z.string().min(3).optional(),
    barcode: z.string().optional().nullable(),
    name: z.string().min(2).optional(),
    categoryId: z.number().int().positive().optional().nullable(),
    categoryName: z.string().optional().nullable(),
    costPrice: z.number().nonnegative().optional(),
    sellPrice: z.number().nonnegative().optional(),
    stockQuantity: z.number().int().nonnegative().optional(),
    lowStockThreshold: z.number().int().nonnegative().optional(),
    imageUrl: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
});

const getBarcodeSchema = z.object({
  params: z.object({
    code: z.string().min(1, 'Barcode code is required'),
  }),
});

module.exports = {
  createProductSchema,
  updateProductSchema,
  getBarcodeSchema,
};
