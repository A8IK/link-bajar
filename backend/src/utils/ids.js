const crypto = require('crypto');

const ts36 = () => Date.now().toString(36).toUpperCase();
const rand = (n) => crypto.randomBytes(n).toString('hex').toUpperCase();

module.exports = {
  orderNumber: () => `LB-ORD-${ts36()}-${rand(2)}`,
  invoiceNumber: () => `LB-INV-${ts36()}-${rand(2)}`,
  transactionRef: () => `LB-TXN-${ts36()}-${rand(3)}`,
  inviteToken: () => crypto.randomBytes(24).toString('hex'),
  publicUserId: () => 'LB' + crypto.randomBytes(5).toString('hex').toUpperCase(),
  referralCode: () => crypto.randomBytes(4).toString('hex').toUpperCase(),
  shortCode: (n = 8) => crypto.randomBytes(n).toString('hex').toUpperCase().slice(0, n),
};
