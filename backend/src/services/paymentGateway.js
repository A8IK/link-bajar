const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Payment gateway interface. Real Payoneer / SSLCommerz integrations
 * plug into the same shape — swap the body of each function.
 *
 * For now: returns a fake gateway transaction id and resolves immediately.
 * Webhooks would call `confirmDeposit(...)` from the controller.
 */

const sim = (label) =>
  logger.info(`[payment-stub:${label}] simulated successful gateway call`);

const fakeId = (prefix) =>
  `${prefix}_${crypto.randomBytes(8).toString('hex')}`;

const createDepositIntent = async ({ userId, amount, method, returnUrl }) => {
  sim(`deposit:${method}`);
  return {
    success: true,
    gatewayTransactionId: fakeId(method),
    redirectUrl: `${returnUrl}?status=success&txn=${fakeId('mock')}`,
    raw: { userId, amount, method },
  };
};

const processWithdrawal = async ({ userId, amount, method, paymentAddress }) => {
  sim(`withdrawal:${method}`);
  return {
    success: true,
    gatewayTransactionId: fakeId(method),
    raw: { userId, amount, method, paymentAddress },
  };
};

const issueRefund = async ({ originalGatewayTxnId, amount, reason }) => {
  sim(`refund`);
  return {
    success: true,
    gatewayTransactionId: fakeId('refund'),
    raw: { originalGatewayTxnId, amount, reason },
  };
};

module.exports = { createDepositIntent, processWithdrawal, issueRefund };
