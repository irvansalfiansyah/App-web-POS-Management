function generateOrderNumber() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = Math.floor(1000 + Math.random() * 9000);
  return `INV-${dateStr}-${randomStr}`;
}

module.exports = generateOrderNumber;
