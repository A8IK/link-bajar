const { Order, Listing, User, sequelize } = require('../models');
const ApiError = require('../utils/ApiError');
const ids = require('../utils/ids');
const wallet = require('./walletService');
const couponSvc = require('./couponService');
const invoiceSvc = require('./invoiceService');
const mailer = require('./mailer');
const referralSvc = require('./referralService');
const { getIO } = require('../sockets');

const calcPrice = (listing, { orderType, sensitiveNiche }) => {
  const baseField = orderType === 'guest_post' ? listing.guestPostPrice : listing.linkInsertPrice;
  let price = Number(baseField || 0);
  if (sensitiveNiche && listing.premiumEnabled) price += Number(listing.premiumExtraPrice || 0);
  return price;
};

const createForBuyer = async ({ buyerId, items, paymentMethod, couponCode }) => {
  if (!items?.length) throw ApiError.badRequest('Cart is empty');

  return sequelize.transaction(async (t) => {
    const buyer = await User.findByPk(buyerId, { transaction: t });
    const created = [];
    let total = 0;
    const orderDrafts = [];

    for (const it of items) {
      const listing = await Listing.findByPk(it.listingId, { transaction: t });
      if (!listing || listing.status !== 'approved') {
        throw ApiError.badRequest(`Listing unavailable: ${it.listingId}`);
      }
      const orderType = it.orderType || (listing.placementType === 'link_insert' ? 'link_insert' : 'guest_post');
      const amount = calcPrice(listing, { orderType, sensitiveNiche: it.sensitiveNiche });
      if (!amount) throw ApiError.badRequest(`Price not set for listing ${listing.siteUrl}`);
      total += amount;
      orderDrafts.push({ listing, orderType, amount, it });
    }

    let discount = 0;
    let coupon = null;
    if (couponCode) {
      const r = await couponSvc.validate({ code: couponCode, userId: buyerId, orderAmount: total });
      coupon = r.coupon;
      discount = r.discount;
    }
    const finalTotal = total - discount;

    if (paymentMethod === 'wallet') {
      await wallet.debit(
        {
          userId: buyerId,
          amount: finalTotal,
          type: 'order_payment',
          notes: 'Order checkout',
          fromBonus: true,
        },
        t,
      );
    }

    for (const d of orderDrafts) {
      const perOrderDiscount = total > 0 ? (discount * d.amount) / total : 0;
      const order = await Order.create(
        {
          orderNumber: ids.orderNumber(),
          buyerId,
          listingId: d.listing.id,
          orderType: d.orderType,
          targetSite: d.it.targetSite,
          orderedSite: d.listing.siteUrl,
          anchorText: d.it.anchorText,
          landingPage: d.it.landingPage,
          articleDocLink: d.it.articleDocLink,
          contentRequirements: d.it.contentRequirements,
          additionalDetails: d.it.additionalDetails || {},
          amount: Number((d.amount - perOrderDiscount).toFixed(2)),
          sensitiveNiche: !!d.it.sensitiveNiche,
          paymentMethod,
          paymentStatus: paymentMethod === 'wallet' ? 'paid' : 'pending',
          status: paymentMethod === 'wallet' ? 'approved' : 'pending',
          couponCode: couponCode || null,
          discountAmount: Number(perOrderDiscount.toFixed(2)),
        },
        { transaction: t },
      );

      await invoiceSvc.createForOrder({
        order,
        user: buyer,
        lineItems: [
          {
            description: `${d.orderType.replace('_', ' ')} — ${d.listing.siteUrl}`,
            quantity: 1,
            unitPrice: d.amount,
            total: Number((d.amount - perOrderDiscount).toFixed(2)),
          },
        ],
      });

      created.push(order);
    }

    if (coupon) {
      await couponSvc.redeem(
        { coupon, userId: buyerId, orderId: created[0].id, discountApplied: discount },
        t,
      );
    }

    // Referral bonus on first paid order
    if (paymentMethod === 'wallet') {
      try {
        await referralSvc.grantBonusForOrder({ buyerId, orderAmount: finalTotal });
      } catch (_) { /* don't fail checkout on referral bonus */ }
    }

    try {
      getIO().to('role:admin').emit('admin:new-orders', { count: created.length });
    } catch (_) { /* socket not ready */ }

    return created;
  });
};

const updateStatus = async ({ orderId, status, liveLink, rejectionReason }) => {
  return sequelize.transaction(async (t) => {
    const order = await Order.findByPk(orderId, { transaction: t });
    if (!order) throw ApiError.notFound('Order not found');

    order.status = status;
    if (status === 'delivered') {
      order.deliveredAt = new Date();
      if (liveLink) order.liveLink = liveLink;
    }
    if (status === 'cancelled' || status === 'rejected') {
      order.cancelledAt = new Date();
      if (rejectionReason) order.additionalDetails = { ...order.additionalDetails, rejectionReason };
      if (order.paymentStatus === 'paid') {
        await wallet.credit(
          {
            userId: order.buyerId,
            amount: order.amount,
            type: 'refund',
            orderId: order.id,
            notes: 'Order cancelled/rejected — auto-refund to wallet',
          },
          t,
        );
        order.paymentStatus = 'refunded';
      }
    }
    await order.save({ transaction: t });

    try {
      const io = getIO();
      io.to(`user:${order.buyerId}`).emit('order:status', {
        orderId: order.id,
        status: order.status,
        liveLink: order.liveLink,
      });
      io.to(`order:${order.id}`).emit('order:status', {
        orderId: order.id,
        status: order.status,
        liveLink: order.liveLink,
      });
    } catch (_) { /* */ }

    if (status === 'delivered' && liveLink) {
      const buyer = await User.findByPk(order.buyerId, { transaction: t });
      const tpl = mailer.templates.orderDelivered({ orderNumber: order.orderNumber, liveLink });
      mailer.send({ to: buyer.email, ...tpl }).catch(() => {});
    }

    return order;
  });
};

module.exports = { createForBuyer, updateStatus, calcPrice };
