const { z } = require('zod');

const checkoutSchema = z.object({
  body: z.object({
    cartItems: z.array(
      z.object({
        productId: z.number().int().positive(),
        quantity: z.number().int().positive(),
      })
    ).min(1, 'Cart cannot be empty'),
    paymentMethod: z.enum(['cash', 'card', 'qris', 'other']),
  }),
});

module.exports = {
  checkoutSchema,
};
